import type { Platform } from "@/types";

export interface NormalizedPost {
  platform: Platform;
  accountId: string;
  externalPostId: string;
  postUrl: string | null;
  textContent: string | null;
  publishedAt: string | null;
  mediaType: string | null;
  rawData?: Record<string, unknown>;
}

export interface NormalizedComment {
  platform: Platform;
  accountId: string;
  externalPostId: string;
  externalCommentId: string;
  parentExternalCommentId?: string | null;
  commentText: string;
  authorName: string | null;
  authorProfileUrl: string | null;
  commentUrl: string | null;
  publishedAt: string | null;
  likeCount: number;
  replyCount: number;
  rawData?: Record<string, unknown>;
}

export function normalizeInstagramItem(
  raw: Record<string, unknown>,
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const posts: NormalizedPost[] = [];
  const comments: NormalizedComment[] = [];

  const externalPostId = String(raw.id || raw.shortCode || raw.code || raw.post_id || `ig_post_${Date.now()}`);
  const postUrl = typeof raw.url === "string" ? raw.url : (raw.shortCode ? `https://www.instagram.com/p/${raw.shortCode}/` : null);
  const textContent = typeof raw.caption === "string" ? raw.caption : (typeof raw.text === "string" ? raw.text : null);
  const publishedAt = raw.timestamp ? new Date(String(raw.timestamp)).toISOString() : null;
  const mediaType = typeof raw.type === "string" ? raw.type : (raw.isVideo ? "video" : "image");

  posts.push({
    platform: "instagram",
    accountId,
    externalPostId,
    postUrl,
    textContent,
    publishedAt,
    mediaType,
    rawData: raw,
  });

  // Extract comments if present in raw item (apify/instagram-scraper returns latestComments or comments array)
  const rawComments = Array.isArray(raw.latestComments)
    ? raw.latestComments
    : Array.isArray(raw.comments)
    ? raw.comments
    : [];

  for (const c of rawComments) {
    if (typeof c !== "object" || !c) continue;
    const commentObj = c as Record<string, unknown>;
    const commentId = String(commentObj.id || commentObj.comment_id || `ig_comm_${externalPostId}_${Math.random().toString(36).substring(7)}`);
    const commentText = String(commentObj.text || commentObj.caption || "");

    if (!commentText.trim()) continue;

    comments.push({
      platform: "instagram",
      accountId,
      externalPostId,
      externalCommentId: commentId,
      parentExternalCommentId: commentObj.parentId ? String(commentObj.parentId) : null,
      commentText,
      authorName: typeof commentObj.ownerUsername === "string" ? commentObj.ownerUsername : (typeof commentObj.username === "string" ? commentObj.username : null),
      authorProfileUrl: commentObj.ownerUsername ? `https://www.instagram.com/${commentObj.ownerUsername}/` : null,
      commentUrl: postUrl ? `${postUrl}c/${commentId}/` : null,
      publishedAt: commentObj.timestamp ? new Date(String(commentObj.timestamp)).toISOString() : null,
      likeCount: typeof commentObj.likesCount === "number" ? commentObj.likesCount : (typeof commentObj.likeCount === "number" ? commentObj.likeCount : 0),
      replyCount: typeof commentObj.childCommentsCount === "number" ? commentObj.childCommentsCount : 0,
      rawData: commentObj,
    });
  }

  return { posts, comments };
}
