import Feed from "../home/Feed";
import { Post} from "../home/Feed";
import FeedProfile2 from "@/assets/images/Feed_Profile2.svg";
import FeedImage2 from "@/assets/images/Feed_image2.svg";

const Saved = () => {
  const posts: Post[] = [
      {
        id: 1,
        user: {
          headshot: FeedProfile2,
          name: "User_Name",
        },
        time: "@User_Name • 24-10-18",
        description: "New album in 2040. Listen to Blonde in the meantime.",
        pictures: [
          FeedImage2,
          FeedImage2,
          FeedImage2,
        ],
        likes: 420,
        liked: true,
        comments: 999,
        saved: false,
      },
      {
        id: 2,
        user: {
          headshot: FeedProfile2,
          name: "User_Name",
        },
        time: "@User_Name • 24-10-18",
        description: "New album in 2040. Listen to Blonde in the meantime.",
        likes: 420,
        liked: false,
        comments: 999,
        saved: true,
      },
      {
        id: 3,
        user: {
          headshot: FeedProfile2,
          name: "User_Name",
        },
        time: "@User_Name • 24-10-18",
        description: "New album in 2040. Listen to Blonde in the meantime.",
        likes: 420,
        liked: false,
        comments: 999,
        saved: false,
      },
      {
        id: 4,
        user: {
          headshot: FeedProfile2,
          name: "User_Name",
        },
        time: "@User_Name • 24-10-18",
        description: "New album in 2040. Listen to Blonde in the meantime.",
        pictures: [
          FeedImage2,
          FeedImage2,
          FeedImage2,
        ],
        likes: 420,
        liked: false,
        comments: 999,
        saved: true,
      },
    ];
    
    
  return (
      <Feed posts={posts} />
  );
};

export default Saved;