import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class SearchProductDto {
  @ApiPropertyOptional({
    description: 'Campo de busca de produtos por nome ou descrição',
    example: 'Caderno capa dura',
    default: '',
  })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({
    description:
      'Filtro de busca por produtos por valor ascendente (price_asc) ou descendente (price_desc)',
    example: 'price_asc',
    default: '',
  })
  @IsOptional()
  @IsIn(['price_asc', 'price_desc'])
  sort?: 'price_asc' | 'price_desc';

  @ApiPropertyOptional({
    description:
      'Filtro de busca de produtos em estoque (in_stock) ou faltantes (out_of_stock)',
    example: 'in_stock',
    default: '',
  })
  @IsOptional()
  @IsIn(['in_stock', 'out_of_stock'])
  stock?: 'in_stock' | 'out_of_stock';
}
