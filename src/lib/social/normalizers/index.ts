import type { Platform } from "@/types";
import { normalizeInstagramItem, type NormalizedPost, type NormalizedComment } from "./instagram";
import { normalizeFacebookItem } from "./facebook";
import { normalizeYouTubeItem } from "./youtube";
import { normalizeLinkedInItem } from "./linkedin";

export * from "./instagram";

export function normalizePlatformItems(
  platform: Platform,
  items: Record<string, unknown>[],
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const allPosts: NormalizedPost[] = [];
  const allComments: NormalizedComment[] = [];

  for (const item of items) {
    let result: { posts: NormalizedPost[]; comments: NormalizedComment[] };

    switch (platform) {
      case "instagram":
        result = normalizeInstagramItem(item, accountId);
        break;
      case "facebook":
        result = normalizeFacebookItem(item, accountId);
        break;
      case "youtube":
        result = normalizeYouTubeItem(item, accountId);
        break;
      case "linkedin":
        result = normalizeLinkedInItem(item, accountId);
        break;
      default:
        result = { posts: [], comments: [] };
    }

    allPosts.push(...result.posts);
    allComments.push(...result.comments);
  }

  // Deduplicate posts within this batch by externalPostId
  const uniquePostsMap = new Map<string, NormalizedPost>();
  for (const post of allPosts) {
    if (!uniquePostsMap.has(post.externalPostId)) {
      uniquePostsMap.set(post.externalPostId, post);
    }
  }

  // Deduplicate comments within this batch by externalCommentId
  const uniqueCommentsMap = new Map<string, NormalizedComment>();
  for (const comm of allComments) {
    if (!uniqueCommentsMap.has(comm.externalCommentId)) {
      uniqueCommentsMap.set(comm.externalCommentId, comm);
    }
  }

  return {
    posts: Array.from(uniquePostsMap.values()),
    comments: Array.from(uniqueCommentsMap.values()),
  };
}
