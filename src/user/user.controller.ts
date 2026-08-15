import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
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

const userNotFound = {
  status: 404,
  description: 'User not found.',
};

const emailAlreadyRegistered = {
  status: 409,
  description: 'Email already registered.',
};

const paramId = {
  name: 'id',
  description: 'User ID',
  example: 'cmst9y9q900000uocaori37wh3',
};

@ApiTags('user')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(userNotFound)
  @ApiResponse(emailAlreadyRegistered)  
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(userNotFound)
  @ApiParam(paramId)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(userNotFound)
  @ApiResponse(emailAlreadyRegistered)
  @ApiParam(paramId)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse(successfully)
  @ApiResponse(invalidToken)
  @ApiResponse(userNotFound)
  @ApiParam(paramId)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
