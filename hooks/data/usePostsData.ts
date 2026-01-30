import { Post } from "@/interfaces/post";
import { getPosts } from "@/services/postService";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export function usePostsData(): UseQueryResult<Post[], Error> {
  return useQuery({
    queryKey: ["posts"],
    queryFn: () => getPosts()
  });
}