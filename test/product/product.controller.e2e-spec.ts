import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('ProductController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // Limpa o banco antes dos testes
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    // Cria usuário de teste
    const createResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'David Admin',
        email: 'admin@test.com',
        password: '123456',
      });

    // Faz login uma única vez
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: '123456',
      });

    token = loginResponse.body.access_token;

    const createProductResponse = await request(app.getHttpServer())
      .post('/product')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Caderno c dura verde 80f',
        description: 'Caderno capa dura verde 80 folhas',
        price: 12,
        stock: 10,
      });

    productId = createProductResponse.body.id;
  });

  afterAll(async () => {
    // Limpa o banco depois dos testes
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    await app.close();
  });

  describe('POST /product', () => {
    it('deve criar um produto', async () => {
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno c dura verde 60f',
          description: 'Caderno capa dura verde 60 folhas',
          price: 10,
          stock: 7,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Caderno c dura verde 60f');
      expect(response.body.description).toBe('Caderno capa dura verde 60 folhas');
      expect(response.body.price).toBe("10");
      expect(response.body.stock).toBe(7);
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', 'Bearer token-invalido')
        .send({
          name: 'Caderno c dura verde 60f',
          description: 'Caderno capa dura verde 60 folhas',
          price: 10,
          stock: 7,
        })
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 400 quando o name não for informado', async () => {
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          description: 'Caderno capa dura verde 60 folhas',
          price: 10,
          stock: 7,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'name must be longer than or equal to 3 characters',
      );
    });

    it('deve retornar 400 quando o atributo name não for declarado', async () => {
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          description: 'Caderno capa dura verde 60 folhas',
          price: 10,
          stock: 7,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'name must be longer than or equal to 3 characters',
      );
      expect(response.body.message).toContain('name must be a string');
    });

    it('deve retornar 400 quando o price possuir valor menor que zero', async () => {
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno',
          description: 'Caderno capa dura verde 60 folhas',
          price: -1,
          stock: 0,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('price must not be less than 0');
    });

    it('deve retornar 400 quando o stock possuir valor menor que zero', async () => {
      const response = await request(app.getHttpServer())
        .post('/product')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno',
          description: 'Caderno capa dura verde 60 folhas',
          price: 0,
          stock: -1,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('stock must not be less than 0');
    });
  });

  describe('GET /product/:id', () => {
    it('deve retornar um produto pelo id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', productId);
      expect(response.body).toHaveProperty('name', 'Caderno c dura verde 80f');
      expect(response.body).toHaveProperty(
        'description',
        'Caderno capa dura verde 80 folhas',
      );
      expect(response.body).toHaveProperty('price', '12');
      expect(response.body).toHaveProperty('stock', 10);
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .get(`/product/${productId}`)
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 404 quando o usuário não for encontrado', async () => {
      const response = await request(app.getHttpServer())
        .get(`/product/123`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: 'Product not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('GET /product', () => {
    it('deve retornar todos os produtos', async () => {
      const response = await request(app.getHttpServer())
        .get('/product')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('description');
      expect(response.body[0]).toHaveProperty('price');
      expect(response.body[0]).toHaveProperty('stock');
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .get('/product')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 401 quando o token não for informado', async () => {
      const response = await request(app.getHttpServer())
        .get('/product')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('PATCH /product/:id', () => {
    it('deve atualizar um produto', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno c dura azul 120f',
          description: 'Caderno capa dura azul 120 folhas',
          price: 18,
          stock: 12,
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', productId);
      expect(response.body.name).toBe('Caderno c dura azul 120f');
      expect(response.body.description).toBe('Caderno capa dura azul 120 folhas');
      expect(response.body.price).toBe('18');
      expect(response.body.stock).toBe(12);
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/product/${productId}`)
        .set('Authorization', 'Bearer token-invalido')
        .send({
          name: 'Caderno c dura azul 120f',
          description: 'Caderno capa dura azul 120 folhas',
          price: 18,
          stock: 12,
        })
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 404 quando o produto não for encontrado', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/product/123`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno c dura azul 120f',
          description: 'Caderno capa dura azul 120 folhas',
          price: 18,
          stock: 12,
        })
        .expect(404);

      expect(response.body).toEqual({
        message: 'Product not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('deve retornar 400 quando o name não for informado', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '',
          description: 'Caderno capa dura azul 120 folhas',
          price: 18,
          stock: 12,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'name must be longer than or equal to 3 characters',
      );
    });

    it('deve retornar 400 quando o price possuir valor menor que zero', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno c dura azul 120f',
          description: 'Caderno capa dura azul 120 folhas',
          price: -1,
          stock: 0,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('price must not be less than 0');
    });

    it('deve retornar 400 quando o stock possuir valor menor que zero', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Caderno c dura azul 120f',
          description: 'Caderno capa dura azul 120 folhas',
          price: 0,
          stock: -1,
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('stock must not be less than 0');
    });
  });

  describe('DELETE /user/:id', () => {
    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/product/${productId}`)
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 404 quando o produto não for encontrado', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/product/123`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: 'Product not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('deve remover um produto', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/product/${productId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', productId);
      expect(response.body.deletedAt).not.toBeNull();
    });
  });
});
