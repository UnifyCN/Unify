import React, { useState } from "react";
import Feed from "./Feed";
import { Post, User } from "./Feed";

import FeedImage3 from "@/assets/images/Feed_image3.svg";
import FeedProfile3 from "@/assets/images/Feed_profile3.svg";

const GroupsFeed = () => {
    const posts: Post[] = [
        {
          id: 1,
          user: {
            headshot: FeedProfile3,
            name: "ColdPlay Fan Club",
          },
          time: "24-10-18",
          description: "New ColdPlay tour announced for 2025",
          pictures: [
            FeedImage3,
            FeedImage3,
          ],
          likes: 25,
          liked: true,
          comments: 10,
          saved: false,
        },
        {
          id: 2,
          user: {
            headshot: FeedProfile3,
            name: "Will Smith Fan Club",
          },
          time: "4h ago",
          description: "Another sample post with multiple images.",
          pictures: [
            FeedImage3,
            FeedImage3,
            FeedImage3,
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

export default GroupsFeed;