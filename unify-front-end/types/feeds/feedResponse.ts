import { PostData } from "./post"

export interface FeedResponse {
  posts: PostData[]
  next_cursor?: string
}