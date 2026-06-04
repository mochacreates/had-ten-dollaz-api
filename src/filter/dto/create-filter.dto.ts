import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateFilterDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  brand: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0)
  minPrice: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Min(0)
  maxPrice: number;
}
