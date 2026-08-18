import { IsIn, IsOptional, IsString } from 'class-validator';

export class SearchProductDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(['price_asc', 'price_desc'])
  sort?: 'price_asc' | 'price_desc';

  @IsOptional()
  @IsIn(['in_stock', 'out_of_stock'])
  stock?: 'in_stock' | 'out_of_stock';
}
