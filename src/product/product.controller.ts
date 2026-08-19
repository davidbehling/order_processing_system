import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

const successfully = {
  status: 200,
  description: 'Successfully',
};

const invalidToken = {
  status: 401,
  description: 'Invalid token.',
};

const productNotFound = {
  status: 404,
  description: 'Product not found.',
};

const paramId = {
  name: 'id',
  description: 'Product ID',
  example: 'cmst9y9q900000uocaori37wh3',
};

@ApiExtraModels(SearchProductDto)
@ApiTags('product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  findAll() {
    return this.productService.findAll();
  }

  @Get('search')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search with filters all products' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiQuery({
    name: 'q',
    required: false,
    type: [String],
    description: 'Parametro de busca de produtos por nome ou descrição',
    example: ['Caderno capa dura'],
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: [String],
    description:
      'Filtro de busca por produtos por valor ascendente (price_asc) ou descendente (price_desc)',
    example: ['price_asc'],
  })
  @ApiQuery({
    name: 'stock',
    required: false,
    type: [String],
    description:
      'Filtro de busca de produtos em estoque (in_stock) ou faltantes (out_of_stock))',
    example: ['in_stock'],
  })
  search(@Query() searchProductDto: SearchProductDto) {
    return this.productService.search(searchProductDto);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(productNotFound)
  @ApiParam(paramId)
  findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(productNotFound)
  @ApiParam(paramId)
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a product' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(productNotFound)
  @ApiParam(paramId)
  remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }
}
