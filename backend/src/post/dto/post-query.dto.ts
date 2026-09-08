import { Transform, TransformFnParams, Type } from "class-transformer";
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class PostQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  page: number = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize: number = 10;

  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(30)
  tag?: string;
}
