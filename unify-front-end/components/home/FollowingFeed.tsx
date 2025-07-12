import React from "react";
import Feed from "./Feed";
import { useFollowingFeed } from "@/hooks/feeds/useFollowingFeed";

const FollowingFeed = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useFollowingFeed();

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

export default FollowingFeed;
