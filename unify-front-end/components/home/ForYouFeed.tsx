import React, { useState } from "react";
import Feed from "./Feed";
import { Post, User } from "./Feed";

import FeedImage2 from "@/assets/images/Feed_image2.svg";
import FeedProfile2 from "@/assets/images/Feed_Profile2.svg";

const ForYouFeed = () => {
    const posts: Post[] = [
        {
          id: 1,
          user: {
            headshot: FeedProfile2,
            name: "Dave",
          },
          time: "6h",
          description: "Thank you for your support, my album Psychodrama has won Brit Award for British Album of the Year.",
          pictures: [
            FeedImage2,
            FeedImage2,
          ],
          likes: 25,
          liked: true,
          comments: 10,
          saved: false,
        },
        {
          id: 2,
          user: {
            headshot: FeedProfile2,
            name: "Drake",
          },
          time: "4h ago",
          description: "Another sample post with multiple images.",
          pictures: [
            FeedImage2,
            FeedImage2,
            FeedImage2,
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

export default ForYouFeed;