import React from "react";
import Feed from "./Feed";
import { useForYouFeed } from "@/hooks/feeds/useForYouFeed";

const ForYouFeed = () => {
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading, 
    isRefetching, 
    refetch 
  } = useForYouFeed();

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

export default ForYouFeed;
