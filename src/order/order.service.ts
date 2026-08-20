import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
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

  findAll() {
    return `This action returns  all order`;
  }

  findOne(id: string) {
    return `This action returns a #${id} order`;
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  remove(id: string) {
    return `This action removes a #${id} order`;
  }
}
