import { Post } from "./post"

export interface FeedResponse {
  posts: Post[]
  next_cursor?: string
}