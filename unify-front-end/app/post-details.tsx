import PostDetails from '@/components/home/PostDetails';

// This is a wrapper file to help keep PostDetails.tsx in /components/home
// for the sake of keeping the directories organized
export default function PostDetailsScreen() {
  return <PostDetails />;
}

export const options = {
  headerShown: false,
};
