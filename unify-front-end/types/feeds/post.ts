import { User } from "@/types/user";

// TODO: I feel like this is not right, update after speaking with team
export type Post = {
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
};