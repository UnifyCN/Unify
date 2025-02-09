import React, { useState } from "react";
import Feed from "./Feed";
import { Post, User } from "./Feed";

import FeedImage from "@/assets/images/Feed_images.svg";
import FeedProfile from "@/assets/images/Feed_profile.svg";

const FollowingFeed = () => {
    const posts: Post[] = [
        {
          id: 1,
          user: {
            headshot: FeedProfile,
            name: "Frank Ocean",
          },
          time: "24-10-18",
          description: "New album in 2040. Listen to Blonde in the meantime.",
          pictures: [
            FeedImage,
            FeedImage,
          ],
          likes: 25,
          liked: true,
          comments: 10,
          saved: false,
        },
        {
          id: 2,
          user: {
            headshot: FeedProfile,
            name: "Will Smith",
          },
          time: "4h ago",
          description: "Another sample post with multiple images.",
          pictures: [
            FeedImage,
            FeedImage,
            FeedImage,
          ],
          likes: 50,
          liked: false,
          comments: 15,
          saved: true,
        },
      ];
      
      
    return (
        <Feed posts={posts} />
    );
};

export default FollowingFeed;