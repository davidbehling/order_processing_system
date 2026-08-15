import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, IsEmail } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'David',
  })
  @IsString()
  @MinLength(3)
  name!: string;

  @ApiProperty({
    example: 'david@gmail.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
  })
  @IsString()
  @MinLength(3)
  password!: string;
}
