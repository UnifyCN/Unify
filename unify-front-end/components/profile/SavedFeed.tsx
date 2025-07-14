import React from "react";
import Feed from "../home/Feed";
import { useGetSavedPosts } from "@/hooks/posts/useGetSavedPosts";

const SavedFeed = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useGetSavedPosts();

  return (
    <Feed
      data={data}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      isLoading={isLoading}
      isRefetching={isRefetching}
      refetch={refetch}
    />
  );
};

export default SavedFeed; 