import { Post } from "@/types/post";
import { User } from "@/types/user";

export interface FeedResponse {
  posts: Post[]
  next_cursor?: string
}

export const getFeedGroups = async (
  cursor?: string,
  limit = 20
): Promise<FeedResponse> => {
  // TODO: Implement actual API call to get groups feed
  // This would typically fetch posts from groups the user is a member of
  // const { data, error } = await supabase
  //   .from('posts')
  //   .select(`
  //     *,
  //     user:profiles(id, username, avatar_url),
  //     group:groups(id, name),
  //     likes:post_likes(count),
  //     comments:post_comments(count),
  //     user_like:post_likes!inner(user_id)
  //   `)
  //   .in('group_id', userGroupIds)
  //   .order('time', { ascending: false })
  //   .range(cursor ? parseInt(cursor) : 0, limit - 1)
  
  // if (error) {
  //   throw new Error(`Failed to fetch groups feed: ${error.message}`)
  // }
  
  // return {
  //   posts: data || [],
  //   next_cursor: data?.length === limit ? String(cursor ? parseInt(cursor) + limit : limit) : undefined
  // }

  const mockPosts: Post[] = [
    {
      id: 5,
      user: { id: 5, username: 'group_member', name: 'Group Member' } as User,
      time: '2024-01-15T12:30:00Z',
      description: 'Great discussion in our React Native group today! 💬',
      likes: 34,
      liked: false,
      comments: 12,
      saved: false
    },
    {
      id: 6,
      user: { id: 6, username: 'group_admin', name: 'Group Admin' } as User,
      time: '2024-01-15T12:15:00Z',
      description: 'New group event coming up! Join us for the meetup 🎉',
      likes: 67,
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