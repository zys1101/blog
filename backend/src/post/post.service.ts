import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DeleteResult, Repository, SelectQueryBuilder } from "typeorm";
import { PageResult } from "../types/page-result";
import { Post, PostListItem, PostStatus } from "./post.entity";
import { PostQueryDto } from "./dto/post-query.dto";
import { SavePostDto } from "./dto/save-post.dto";

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
  ) {}

  async list(
    query: PostQueryDto,
    publishedOnly: boolean,
  ): Promise<PageResult<PostListItem>> {
    const builder: SelectQueryBuilder<Post> = this.posts
      .createQueryBuilder("post")
      .select([
        "post.id",
        "post.title",
        "post.summary",
        "post.tags",
        "post.status",
        "post.createdAt",
        "post.updatedAt",
      ])
      .orderBy("post.createdAt", "DESC")
      .addOrderBy("post.id", "DESC")
      .skip((query.page - 1) * query.pageSize)
      .take(query.pageSize);
    if (publishedOnly)
      builder.andWhere("post.status = :status", {
        status: PostStatus.Published,
      });
    if (query.tag)
      builder.andWhere("JSON_CONTAINS(post.tags, :tag) = 1", {
        tag: JSON.stringify(query.tag),
      });
    const [items, total]: [Post[], number] = await builder.getManyAndCount();
    return { items, total, page: query.page, pageSize: query.pageSize };
  }

  async detail(id: number, publishedOnly: boolean): Promise<Post> {
    const builder: SelectQueryBuilder<Post> = this.posts
      .createQueryBuilder("post")
      .addSelect("post.content")
      .where("post.id = :id", { id });
    if (publishedOnly)
      builder.andWhere("post.status = :status", {
        status: PostStatus.Published,
      });
    const post: Post | null = await builder.getOne();
    if (!post) throw new NotFoundException("文章不存在或尚未发布");
    return post;
  }

  async create(dto: SavePostDto): Promise<Post> {
    const post: Post = this.posts.create(dto);
    return this.posts.save(post);
  }

  async update(id: number, dto: SavePostDto): Promise<Post> {
    const post: Post = await this.detail(id, false);
    post.title = dto.title;
    post.summary = dto.summary;
    post.content = dto.content;
    post.tags = dto.tags;
    post.status = dto.status;
    return this.posts.save(post);
  }

  async remove(id: number): Promise<{ id: number }> {
    const result: DeleteResult = await this.posts.delete(id);
    if (!result.affected) throw new NotFoundException("文章不存在");
    return { id };
  }
}
