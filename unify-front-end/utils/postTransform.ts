import { PostData } from '@/types/feeds/post';
import { PostDto } from '@/types/feeds/postDto';
import { User } from '@/types/user';

/**
 * Transforms a PostDto to PostData format
 * @param dto - The raw post data from database
 * @returns Transformed PostData object
 */
export const transformPostDto = (dto: PostDto): PostData => {
  return {
    id: dto.id,
    user: {
      id: dto.users.id,
      username: dto.users.username,
      name: dto.users.username,
      profilePictureUrl: dto.users.profile_picture_url,
    } as User,
    time: dto.created_at,
    title: dto.title,
    content: dto.content,
    group: dto.groups?.group_name?.trim() || undefined,
    isPinned: dto.is_pinned ?? false,
    post_image_urls: dto.post_image_urls || undefined,
    likeCount: dto.like_count ?? 0,
    commentCount: dto.comment_count ?? 0,
  };
};

/**
 * Transforms an array of PostDto to PostData format
 * @param dtos - Array of raw post data from database
 * @returns Array of transformed PostData objects
 */
export const transformPostDtos = (dtos: PostDto[]): PostData[] => {
  return dtos.map(transformPostDto);
};
