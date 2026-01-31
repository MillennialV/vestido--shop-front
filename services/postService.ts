import { Post, PostResponse } from "@/interfaces/post";
import { apiResponse } from "@/services/apiResponse";
import { BLOG_BASE_API } from "@/core/apiConfig";
import { Pagination } from "@/interfaces/pagination";
import { ApiParams } from "@/interfaces/apiParams";
class PostService {

  async createPost(post: Omit<Post,'id'| 'slug' | 'created_at'>): Promise<Post> {
    const url = `${BLOG_BASE_API}/api/blog/posts`;
    const res = await apiResponse<Post>(url, { method: "POST", body: JSON.stringify(post) });
    if (!res.success) throw new Error(res.error || 'Error al crear el post');
    return res.data;
  }

  async readPosts(params: ApiParams = {}): Promise<{ posts: Post[]; pagination: Pagination }> {
    const { page = 1, limit = 100, sort = 'title', order = 'desc' } = params;
    const queryParams = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort,
      order,
    });
    const url = `${BLOG_BASE_API}/api/blog/posts?${queryParams}`;
    const res = await apiResponse<PostResponse>(url, { method: "GET" });

    return {
      posts: res.data.posts,
      pagination: res.data.pagination
    }
  }

  async readPost(id: number | string): Promise<Post> {
    const url = `${BLOG_BASE_API}/api/blog/posts/${id}`;
    const res = await apiResponse<Post>(url, { method: "GET" });
    if (!res.success) throw new Error(res.error || 'Error al obtener el post');
    return res.data;
  }

  async updatePost(id: number | string, data: Partial<Post>): Promise<Post> {
    const url = `${BLOG_BASE_API}/api/blog/posts/${id}`;
    const res = await apiResponse<Post>(url, { method: "PUT", body: JSON.stringify(data) });
    if (!res.success) throw new Error(res.error || 'Error al actualizar el post');
    return res.data;
  }

  async deletePost(id: number | string): Promise<void> {
    const url = `${BLOG_BASE_API}/api/blog/posts/${id}`;
    await apiResponse(url, { method: "DELETE" });
  }
}

export const postService = new PostService();
export default postService;