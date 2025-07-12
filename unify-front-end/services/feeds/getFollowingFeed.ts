import { Post } from "@/types/post";
import { User } from "@/types/user";

export interface FeedResponse {
  posts: Post[]
  next_cursor?: string
}

export const getFeedFollowing = async (
  cursor?: string,
  limit = 20
): Promise<FeedResponse> => {
  // const { data, error } = await supabase
  //   .from('posts')
  //   .select(`
  //     *,
  //     user:profiles(id, username, avatar_url),
  //     likes:post_likes(count),
  //     comments:post_comments(count),
  //     user_like:post_likes!inner(user_id)
  //   `)
  //   .in('user_id', followingUserIds)
  //   .order('time', { ascending: false })
  //   .range(cursor ? parseInt(cursor) : 0, limit - 1)
  
  // if (error) {
  //   throw new Error(`Failed to fetch following feed: ${error.message}`)
  // }
  
  // return {
  //   posts: data || [],
  //   next_cursor: data?.length === limit ? String(cursor ? parseInt(cursor) + limit : limit) : undefined
  // }

  const mockPosts: Post[] = [
    {
      id: 1,
      user: { id: 1, username: 'john_doe', name: 'John Doe' } as User,
      time: '2024-01-15T10:30:00Z',
      description: 'Just had an amazing coffee! ☕',
      likes: 12,
      liked: false,
      comments: 3,
      saved: false
    },
    {
      id: 2,
      user: { id: 2, username: 'jane_smith', name: 'Jane Smith' } as User,
      time: '2024-01-15T09:15:00Z',
      description: 'Working on a new React Native app 🚀',
      likes: 24,
      liked: true,
      comments: 8,
      saved: true
    }
  ]

  return {
    posts: mockPosts,
    next_cursor: mockPosts.length === limit ? '20' : undefined
  }
}