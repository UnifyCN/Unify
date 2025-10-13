import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Like from '@/assets/images/Like.svg';
import Like_Fill from '@/assets/images/Like_filled.svg';
import Save from '@/assets/images/Save.svg';
import Save_Fill from '@/assets/images/Save_filled.svg';
import Comment from '@/assets/images/Comment.svg';
import { PostData } from '@/types/feeds/post';
import { useGetPostLikes } from '@/hooks/posts/useGetPostLikes';
import { useMutateLikePost } from '@/hooks/posts/useMutateLikePost';
import { useGetPostSaveStatus } from '@/hooks/posts/useGetPostSaveStatus';
import { useMutateSavePost } from '@/hooks/posts/useMutateSavePost';
import { formatSmartTime } from '@/utils/dateUtils';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { memo } from 'react';
import Icon from 'react-native-vector-icons/Feather';

interface PostCardProps {
  post: PostData;
  width?: number;
  onPress?: () => void;
}

const PostCard = memo(({ post, width = 248, onPress }: PostCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Get post likes data
  const { data: likeData } = useGetPostLikes(post.id);
  const likePostMutation = useMutateLikePost();

  // Get post save status
  const { data: saveData } = useGetPostSaveStatus(post.id);
  const savePostMutation = useMutateSavePost();

  const toggleLike = (postId: number, isLiked: boolean) => {
    likePostMutation.mutate({ postId, isLiked });
  };

  const toggleSave = (postId: number, isSaved: boolean) => {
    savePostMutation.mutate({ postId, isSaved });
  };

  // Use like data from the hook, fallback to 0 if loading
  const likeCount = likeData?.likeCount;
  const isLiked = likeData?.userLiked;

  // Use save data from the hook, fallback to post data if loading
  const isSaved = saveData?.saved;
  return (
    <TouchableOpacity style={[styles.postCard, { width }]} onPress={onPress}>
      <View style={styles.headshot}>
        {/* TODO: Have to add default headshot */}
        {post.user.headshot ? <post.user.headshot /> : <Text>No headshot</Text>}
      </View>
      <View style={styles.postCardContent}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
          <Text style={styles.postDetailText}>
            {post.user.username}
            <Icon name='chevron-right' size={12} color='#666' />
            <Text style={styles.postTitle}>{' /'}</Text>
            <Text style={styles.postTitle}>{post.group?.name}</Text>
          </Text>

          <Text style={[styles.postTimeText,]}>
            {formatSmartTime(post.time)}
          </Text>
        </View>
        <View style={styles.postDetail}>
          {/*<Feather size={14} color='#666' />*/}
          <Text
            style={[ styles.postTitle, { paddingTop: 5 }]}
            numberOfLines={2}
          >
            {post.title}
          </Text>
        </View>
        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerItem}>
            <TouchableOpacity onPress={() => toggleLike(post.id, isLiked!)}>
              {isLiked ? (
                <Like_Fill width={20} height={20} />
              ) : (
                <Like width={20} height={20} />
              )}
            </TouchableOpacity>
            <Text style={styles.footerText}>{likeCount}</Text>
          </View>
          <View style={styles.footerItem}>
            <Comment width={20} height={20} fill='gray' />
            <Text style={styles.footerText}>
              {/* TODO: make fetch to get comment_count from posts table */}0
            </Text>
          </View>
          <TouchableOpacity onPress={() => toggleSave(post.id, isSaved!)}>
            {isSaved ? (
              <Save_Fill width={20} height={20} />
            ) : (
              <Save width={20} height={20} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  postCard: {
    //backgroundColor: '#DCDCDC',
    borderRadius: 12,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  imageContainer: {
    height: 80,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    //paddingTop: 13,
    //marginLeft: 8,
    //marginRight: 8,
  },
  postImagePlaceholder: {
    height: 80,
    backgroundColor: '#A6A6A6',
    width: 80, 
    borderRadius: 40,
  },
  postImage: {
    height: 70,
    width: 70, 
    borderRadius: 35,
    resizeMode: 'cover',
  },
  postCardContent: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'column',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#000000ff',
    lineHeight: 20,
  },
  postDetail: {
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 6,
  },
  postDetailText: {
    fontSize: 14,
    color: '#000000ff',
  },
  postTimeText: {
    fontSize: 10,
    flex: 0, 
    marginLeft: 8, 
    color: '#666', 
    fontWeight: 'semibold',
    lineHeight: 14,
    alignSelf: 'center'
  },
  headshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    flex: 1,
    gap: 32,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    marginLeft: 4,
    fontSize: 14,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E5E5E5',
  },
});

export default PostCard;
