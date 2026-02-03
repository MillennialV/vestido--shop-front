import { postService } from '@/services/postService';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const result = await postService.readPosts();
        return NextResponse.json(result.posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { error: 'Error fetching posts' },
            { status: 500 }
        );
    }
}
