import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';

import { AppModule } from '../../src/app.module';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: string;

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
    await prisma.user.deleteMany();

    // Cria usuário de teste
    const createResponse = await request(app.getHttpServer())
      .post('/user')
      .send({
        name: 'David Admin',
        email: 'admin@test.com',
        password: '123456',
      });

    userId = createResponse.body.id;

    // Faz login uma única vez
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: '123456',
      });

    token = loginResponse.body.access_token;
  });

  afterAll(async () => {
    // Limpa o banco depois dos testes
    await prisma.user.deleteMany();

    await app.close();
  });

  describe('POST /user', () => {
    it('deve criar um usuário', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'David',
          email: 'david2@test.com',
          password: '123456',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('David');
      expect(response.body.email).toBe('david2@test.com');
    });

    it('deve retornar erro ao criar usuário com e-mail já cadastrado', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Outro David',
          email: 'david2@test.com',
          password: '123456',
        })
        .expect(409);

      expect(response.body).toHaveProperty('message');
    });

    it('deve retornar erro quando a senha não for informada', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Lucas',
          email: 'lucas@gmail.com',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'password must be longer than or equal to 3 characters',
      );
      expect(response.body.message).toContain('password must be a string');
    });

    it('deve retornar erro quando o e-mail não for informado', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Lucas',
          password: '123456',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain('email must be an email');
    });

    it('deve retornar erro quando o nome não for informado', async () => {
      const response = await request(app.getHttpServer())
        .post('/user')
        .send({
          email: 'lucas@gmail.com',
          password: '123456',
        })
        .expect(400);

      expect(response.body.statusCode).toBe(400);
      expect(response.body.error).toBe('Bad Request');
      expect(response.body.message).toContain(
        'name must be longer than or equal to 3 characters',
      );
      expect(response.body.message).toContain('name must be a string');
    });
  });

  describe('GET /user/:id', () => {
    it('deve retornar um usuário pelo id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body).toHaveProperty('name', 'David Admin');
      expect(response.body).toHaveProperty('email', 'admin@test.com');
    });

    it('deve retornar 404 quando o usuário não for encontrado', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/cmsj6naot00000unlik6sjpsj')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .get('/user/cmsj6naot00000unlik6sjpsj')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('GET /user', () => {
    it('deve retornar todos os usuários', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('email');
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 401 quando o token não for informado', async () => {
      const response = await request(app.getHttpServer())
        .get('/user')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });
  });

  describe('PATCH /user/:id', () => {
    it('deve atualizar um usuário', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'David Admin Edit',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id', userId);
      expect(response.body.name).toBe('David Admin Edit');
      expect(response.body.email).toBe('admin@test.com');
    });

    it('deve retornar 409 quando o e-mail já estiver cadastrado', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/user/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          email: 'david2@test.com',
        })
        .expect(409);

      expect(response.body).toEqual({
        message: 'email already registered',
        error: 'Conflict',
        statusCode: 409,
      });
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/user/${userId}`)
        .set('Authorization', 'Bearer token-invalido')
        .send({
          name: 'David Behling Edit',
        })
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve retornar 404 quando o usuário não for encontrado', async () => {
      const response = await request(app.getHttpServer())
        .patch('/user/cmst9ygo10000naoinexistente')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'David Behling Edit',
        })
        .expect(404);

      expect(response.body).toEqual({
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });
  });

  describe('DELETE /user/:id', () => {
    it('deve retornar 404 quando o usuário não for encontrado', async () => {
      const response = await request(app.getHttpServer())
        .delete('/user/cmst9y9q900000uocaori37wh3')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toEqual({
        message: 'User not found',
        error: 'Not Found',
        statusCode: 404,
      });
    });

    it('deve retornar 401 quando o token for inválido', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/user/${userId}`)
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);

      expect(response.body).toEqual({
        message: 'Unauthorized',
        statusCode: 401,
      });
    });

    it('deve remover um usuário', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/user')
        .send({
          name: 'Usuário Delete',
          email: 'delete-e2e@test.com',
          password: '123456',
        })
        .expect(201);

      const id = createResponse.body.id;

      const response = await request(app.getHttpServer())
        .delete(`/user/${id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', id);
      expect(response.body).toHaveProperty('name', 'Usuário Delete');
      expect(response.body).toHaveProperty('email', 'delete-e2e@test.com');
      expect(response.body.deletedAt).not.toBeNull();
    });
  });
});
