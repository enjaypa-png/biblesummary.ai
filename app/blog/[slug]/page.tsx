import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogPosts } from "@/lib/blogPosts";
import HowToUnderstandTheBible from "@/app/blog/posts/HowToUnderstandTheBible";

// Map slug → component
const postComponents: Record<string, React.ComponentType> = {
  "how-to-understand-the-bible": HowToUnderstandTheBible,
};

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const post = blogPosts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: `${post.title} | ClearBible.ai Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      images: [{ url: post.image }],
      type: "article",
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const PostComponent = postComponents[params.slug];
  if (!PostComponent) notFound();
  return <PostComponent />;
}
