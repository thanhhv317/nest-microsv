import {
  IsNumber,
  IsString,
} from 'class-validator';

export class CreateUserDto {
 
  @IsString()
  readonly username: string;
  
  @IsNumber()
  readonly age: number;

  @IsString()
  readonly phone: string;
}
