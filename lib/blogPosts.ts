export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  image: string;
  imageAlt: string;
}

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-understand-the-bible",
    title: "Why Most People Quit Reading the Bible (3 Things That Make It Stick)",
    description:
      "Learn how to understand the Bible, remember what you read, and apply it to your life. Discover the 3 missing ingredients that make Bible reading stick.",
    date: "March 12, 2026",
    image:
      "https://images.unsplash.com/photo-1553729784-e91953dec042?auto=format&fit=crop&q=80&w=800",
    imageAlt: "Woman reading the Bible in natural light",
  },
];
