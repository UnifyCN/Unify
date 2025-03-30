import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";

import Like from "@/assets/images/Like.svg";
import Like_Fill from "@/assets/images/Like_filled.svg";
import Save from "@/assets/images/Save.svg";
import Save_Fill from "@/assets/images/Save_filled.svg";
import Comment from "@/assets/images/Comment.svg";


const { width: screenWidth } = Dimensions.get("window");

export interface User {
  headshot: React.FC;
  name: string;
}

export interface Post {
  id: number;
  user: User;
  userReply?: string;
  time: string;
  description: string;
  pictures?: React.FC[];
  likes: number;
  liked: boolean;
  comments: number;
  saved: boolean;
}

// Props for the Feed component
interface FeedProps {
  posts: Post[];
}

const Feed: React.FC<FeedProps> = ({ posts }) => {

    const [updatedPosts, setUpdatedPosts] = React.useState(posts);

    const toggleLike = (postId: number) => {
        setUpdatedPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? {
                ...post,
                liked: !post.liked,
                likes: post.liked ? post.likes - 1 : post.likes + 1, // Increment or decrement the likes
              }
              : post
          )
        );
      };
    
      const toggleSave = (postId: number) => {
        setUpdatedPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, saved: !post.saved }
              : post
          )
        );
      };

  const renderPost = ({ item }: { item: Post }) => (
    <View>
        <View style={styles.postContainer}>
        {/* Head Shot */}
        <View style={styles.headshot}>
          <item.user.headshot />
        </View>
        {/* Post Content */}
        <View style={styles.postContent}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.name}>{item.user.name}</Text>
                <Text style={styles.time}>{item.time}</Text>
            </View>
            
            {item.userReply && (
              <View style={styles.replyContainer}>
                <Text style={styles.time}>Replying to </Text>
                <Text style={styles.replyUser}>{item.userReply}</Text>
              </View>
            )}

            {/* Description */}
            <Text style={styles.description}>{item.description}</Text>

            {/* Horizontal Scrolling Images */}
            {item.pictures && item.pictures.length > 0 && (
                <FlatList
                data={item.pictures}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(picture, index) => `${item.id}-picture-${index}`}
                renderItem={({ item: PictureComponent }: { item: React.FC }) => (
                    <View style={styles.postImage}>
                      <PictureComponent />
                    </View>
                )}
                contentContainerStyle={styles.imageScrollContainer}
                />
            )}

            {/* Footer */}
            <View style={styles.footer}>
                <View style={styles.footerItem}>
                    <TouchableOpacity onPress={() => toggleLike(item.id)}>
                    {item.liked ? (
                        <Like_Fill width={20} height={20} />
                    ) : (
                        <Like width={20} height={20} />
                    )}
                    </TouchableOpacity>
                    <Text style={styles.footerText}>{item.likes}</Text>
                </View>
                <View style={styles.footerItem}>
                    <Comment width={20} height={20} fill="gray" />
                    <Text style={styles.footerText}>{item.comments}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleSave(item.id)}>
                {item.saved ? (
                    <Save_Fill width={20} height={20} />
                ) : (
                    <Save width={20} height={20} />
                )}
                </TouchableOpacity>
            </View>
        </View>
        </View>
        <View style={styles.divider} />
    </View>
  );

  return (
    <FlatList
      data={updatedPosts}
      keyExtractor={(item) => item.id.toString()}
      renderItem={renderPost}
      contentContainerStyle={styles.feedContainer}
    />
  );
};

const styles = StyleSheet.create({
  feedContainer: {

  },
  postContainer: {
    backgroundColor: "#fff",
    elevation: 3,
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  postContent: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  headshot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f0f0",
  },
  name: {
    fontWeight: "600",
    textAlign: "left",
    fontSize: 16,
  },
  time: {
    fontSize: 16,
    textAlign: "left",
    color: "#999999",
  },
  replyUser: {
    fontSize: 16,
    textAlign: "left",
    color: "#FE0034",
  },
  description: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 4,
  },
  imageScrollContainer: {
    marginTop: 12,
    height: 301,
    gap: 10,
  },
  postImage: {
    width: 301,
    height: 301,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    flex: 1,
    gap: 32
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  footerText: {
    marginLeft: 4,
    fontSize: 14,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E5E5E5",
  },
  replyContainer: {
    flexDirection: "row",
  }
});

export default Feed;