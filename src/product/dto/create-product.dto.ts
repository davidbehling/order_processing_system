import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Caderno',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    example: 'Caderno capa dura 60 folhas',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: 10,
  })
  @IsNumber()
  @Min(0)
  price!: number;

  @ApiProperty({
    example: 10,
  })
  @IsInt()
  @Min(0)
  stock!: number;
}
