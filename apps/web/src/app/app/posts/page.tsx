import { Suspense } from "react";
import { PostsList } from "@/components/sections/app/posts";

export default function PostsPage() {
  return (
    <Suspense fallback={null}>
      <PostsList />
    </Suspense>
  );
}
