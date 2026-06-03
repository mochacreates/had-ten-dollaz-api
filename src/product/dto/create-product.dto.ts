import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsUrl,
  IsBoolean,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsUrl()
  image_url: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @IsUrl()
  product_url: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  seller: string;

  @IsOptional()
  @IsBoolean()
  notified?: boolean;
}
