export type PostStatus = "draft" | "published";

export interface Post {
  id: number;
  title: string;
  summary: string;
  content: string;
  tags: string[];
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
}
export type PostSummary = Omit<Post, "content">;
export type SavePostInput = Pick<
  Post,
  "title" | "summary" | "content" | "tags" | "status"
>;

export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export interface PostQuery {
  page?: number;
  pageSize?: number;
  tag?: string;
}
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
export interface LoginInput {
  username: string;
  password: string;
}
export interface LoginResult {
  token: string;
  expiresIn: number;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  description: string;
  highlights: [string, string, string];
  tags: string[];
  links: { source?: string; demo?: string };
  visual: "browser" | "flow" | "terminal";
  placeholder: boolean;
}
export interface Profile {
  name: string;
  role: string;
  positioning: string;
  email?: string;
  github?: string;
  resume?: string;
}
