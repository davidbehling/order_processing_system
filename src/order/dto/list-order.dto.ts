import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { OrderStatus } from 'generated/prisma/enums';

export class ListOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsDateString()
  startCreatedAt?: string;

  @IsOptional()
  @IsDateString()
  endCreatedAt?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalGt?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  totalLt?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(5)
  @Max(50)
  limit = 10;
}
