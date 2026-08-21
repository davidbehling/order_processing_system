import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ListOrderDto } from './dto/list-order.dto';
import type { AuthUser } from 'src/auth/interfaces/auth-user.interface';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.create(user.id, createOrderDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthUser, @Query() listOrderDto: ListOrderDto) {
    return this.orderService.findAll(user.id, listOrderDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.orderService.update(id, updateOrderDto);
  }
}
