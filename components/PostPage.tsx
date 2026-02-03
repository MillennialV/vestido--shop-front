import React from 'react';
import type { Post } from '@/types/post';
import { ArrowLeftIcon } from '../components/Icons';

interface PostPageProps {
    post: Post;
    navigate: (path: string) => void;
}

const PostPage: React.FC<PostPageProps> = ({ post, navigate }) => {
    const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
        e.preventDefault();
        navigate(path);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in-down px-4 md:px-0">
            <a
                href="/blog"
                onClick={(e) => handleLinkClick(e, '/blog')}
                className="inline-flex items-center gap-2 text-stone-400 hover:text-white transition-colors mb-8 font-semibold"
            >
                <ArrowLeftIcon className="w-5 h-5" />
                Volver al Blog
            </a>

            <article>
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">{post.title}</h1>

                {post.featured_image_url && (
                    <img
                        src={post.featured_image_url}
                        alt={post.title}
                        className="w-full h-auto max-h-[500px] object-cover rounded-xl mb-8 shadow-sm"
                    />
                )}

                {post.seo_description && (
                    <p className="text-lg text-stone-300 mb-8">{post.seo_description}</p>
                )}

                <div className="prose prose-lg prose-invert max-w-none text-stone-300 prose-headings:text-white prose-strong:text-white prose-a:text-indigo-400 hover:prose-a:text-indigo-300"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                />
            </article>
            <style>{`
        .prose ul { list-style-type: disc; padding-left: 1.5rem; }
        .prose li { margin-bottom: 0.5rem; }
        .prose img { border-radius: 0.5rem; margin-top: 2rem; margin-bottom: 2rem; }
      `}</style>
        </div>
    );
};

export default PostPage;
