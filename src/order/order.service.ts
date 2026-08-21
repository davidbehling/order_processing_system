import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ListOrderDto } from './dto/list-order.dto';
import { Prisma } from 'generated/prisma/client';

interface OrderItemData {
  productId: string;
  quantity: number;
  price: Prisma.Decimal;
}

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  private createOrderObj(orderItems: any[], userId: string, total: number) {
    return {
      data: {
        userId,
        total,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    };
  }

  private updateStockObj(productId: string, quantity: number) {
    return {
      where: {
        id: productId,
      },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    };
  }

  private includeUserAndItens() {
    return {
      user: {
        select: {
          name: true,
        },
      },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          price: true,
          product: {
            select: {
              name: true,
            },
          },
        },
      },
    };
  }

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const { items } = createOrderDto;

    if (items.length === 0) {
      throw new BadRequestException(
        'O pedido deve possuir pelo menos um produto',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          id: userId,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const productIds = items.map((item) => item.productId);

      const products = await tx.product.findMany({
        where: {
          id: {
            in: productIds,
          },
          deletedAt: null,
        },
      });

      const foundProductIds = products.map((product) => product.id);

      const missingProductIds = productIds.filter(
        (productId) => !foundProductIds.includes(productId),
      );

      if (missingProductIds.length > 0) {
        throw new NotFoundException(
          `Produto(s) ${missingProductIds.join(', ')} não encontrado(s)`,
        );
      }

      let total = 0;

      const orderItems: OrderItemData[] = [];

      for (const product of products) {
        const item = items.find((item) => (item.productId = product.id));

        if (!item) {
          throw new BadRequestException('item nulo');
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Estoque insuficiente para o produto ${product.name}`,
          );
        }

        const itemTotal = Number(product.price) * item.quantity;

        total += itemTotal;

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        });

        await tx.product.update(
          this.updateStockObj(item.productId, item.quantity),
        );
      }

      return tx.order.create(this.createOrderObj(orderItems, userId, total));
    });
  }

  async findAll(userId: string, listOrderDto: ListOrderDto) {
    const {
      status,
      productId,
      startCreatedAt,
      endCreatedAt,
      totalGt,
      totalLt,
      limit,
      page,
    } = listOrderDto;

    const skip = (page - 1) * limit;

    const createdAt = {
      ...(startCreatedAt && {
        gte: new Date(`${startCreatedAt}T00:00:00.000Z`),
      }),

      ...(endCreatedAt && {
        lte: new Date(`${endCreatedAt}T23:59:59.999Z`),
      }),
    };

    const where = {
      userId,
      ...(status && {
        status,
      }),

      ...(productId && {
        items: {
          some: {
            productId,
          },
        },
      }),

      ...((startCreatedAt || endCreatedAt) && {
        createdAt,
      }),

      ...(totalGt !== undefined || totalLt !== undefined
        ? {
            total: {
              ...(totalGt !== undefined && {
                gt: totalGt,
              }),

              ...(totalLt !== undefined && {
                lt: totalLt,
              }),
            },
          }
        : {}),
    };

    const [orders, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        include: this.includeUserAndItens(),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.order.count({
        where,
      }),
    ]);

    return {
      data: orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
      },
      include: this.includeUserAndItens(),
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);

    return await this.prisma.order.update({
      where: {
        id,
      },
      data: updateOrderDto,
    });
  }
}
