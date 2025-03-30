import Feed from "../home/Feed";
import { Post} from "../home/Feed";
import FeedProfile2 from "@/assets/images/Feed_Profile2.svg";

const Replies = () => {
  const posts: Post[] = [
      {
        id: 1,
        user: {
          headshot: FeedProfile2,
          name: "User_Name",
        },
        userReply: "@User_Name_#2 ",
        time: "@User_Name • 24-10-18",
        description: "Congratulations on getting their PR!! Super proud of you and can’t wait to see what you are going to do in the future! 🎉",
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
        userReply: "@User_Name_#2 ",
        time: "@User_Name • 24-10-18",
        description: "Congratulations on getting their PR!! Super proud of you and can’t wait to see what you are going to do in the future! 🎉",
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
        userReply: "@User_Name_#2 ",
        time: "@User_Name • 24-10-18",
        description: "Congratulations on getting their PR!! Super proud of you and can’t wait to see what you are going to do in the future! 🎉",
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
        description: "Congratulations on getting their PR!! Super proud of you and can’t wait to see what you are going to do in the future! 🎉",
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

export default Replies;