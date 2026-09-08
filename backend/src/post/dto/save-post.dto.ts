import { Transform, TransformFnParams } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { PostStatus } from "../post.entity";

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function trimTags({ value }: TransformFnParams): unknown {
  return Array.isArray(value)
    ? value.map((tag: unknown): unknown =>
        typeof tag === "string" ? tag.trim() : tag,
      )
    : value;
}

// PUT 为完整更新：创建/更新都必须传入所有字段，不允许任意实体字段赋值。
export class SavePostDto {
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(500)
  summary!: string;

  @IsString()
  @MaxLength(100000)
  @Matches(/\S/, { message: "content 不能仅包含空白字符" })
  content!: string;

  @Transform(trimTags)
  @IsArray()
  @ArrayMaxSize(8)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(1, { each: true })
  @MaxLength(30, { each: true })
  tags!: string[];

  @IsEnum(PostStatus)
  status!: PostStatus;
}
