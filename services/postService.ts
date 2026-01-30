import { Post } from "@/interfaces/post";
import { apiClient } from "@/services/apiClient";
import { BLOG_BASE_API } from "@/core/apiConfig";

export async function getPosts(
): Promise<Post[]> {
  const url = `${BLOG_BASE_API}/api/blog/posts`;
  const res = await apiClient(url, { method: "GET" });
  const result = await res.json();
  console.log('getPosts API Response:', result);
  if (!res.ok) throw new Error(result.errors?.[0]?.detail || "Error obteniendo posts");

  return result.data.posts;
};
