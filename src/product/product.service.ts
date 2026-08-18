import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  async search(searchProductDto: SearchProductDto) {
    const { q, sort, stock } = searchProductDto;

    const conditions: Prisma.Sql[] = [Prisma.sql`"deletedAt" IS NULL`];

    if (q) {
      conditions.push(
        Prisma.sql`
          to_tsvector(
            'portuguese',
            coalesce("name", '') || ' ' || coalesce("description", '')
          )
          @@ plainto_tsquery('portuguese', ${q})
        `,
      );
    }

    if (stock === 'in_stock') {
      conditions.push(Prisma.sql`"stock" > 0`);
    }

    if (stock === 'out_of_stock') {
      conditions.push(Prisma.sql`"stock" = 0`);
    }

    let orderBy = Prisma.sql`"createdAt" DESC`;

    if (sort === 'price_asc') {
      orderBy = Prisma.sql`"price" ASC`;
    }

    if (sort === 'price_desc') {
      orderBy = Prisma.sql`"price" DESC`;
    }

    return this.prisma.$queryRaw`
      SELECT
        "id",
        "name",
        "description",
        "price",
        "stock",
        "createdAt",
        "updatedAt"
      FROM "Product"
      WHERE ${Prisma.join(conditions, ' AND ')}
      ORDER BY ${orderBy}
    `;
  }

  async create(createProductDto: CreateProductDto) {
    return await this.prisma.product.create({
      data: createProductDto,
    });
  }

  async findAll() {
    return await this.prisma.product.findMany({
      where: {
        deletedAt: null,
      },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    await this.findOne(id);

    return await this.prisma.product.update({
      where: {
        id,
        deletedAt: null,
      },
      data: updateProductDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return await this.prisma.product.update({
      where: {
        id,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
