import type { NormalizedPost, NormalizedComment } from "./instagram";

export function normalizeLinkedInItem(
  raw: Record<string, unknown>,
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const posts: NormalizedPost[] = [];
  const comments: NormalizedComment[] = [];

  const externalPostId = String(raw.id || raw.urn || raw.postUrn || `li_post_${Date.now()}`);
  const postUrl = typeof raw.url === "string" ? raw.url : (raw.postUrl ? String(raw.postUrl) : null);
  const textContent = typeof raw.text === "string" ? raw.text : (typeof raw.commentary === "string" ? raw.commentary : null);
  const publishedAt = raw.postedAt ? new Date(String(raw.postedAt)).toISOString() : (raw.createdAt ? new Date(String(raw.createdAt)).toISOString() : null);

  posts.push({
    platform: "linkedin",
    accountId,
    externalPostId,
    postUrl,
    textContent,
    publishedAt,
    mediaType: typeof raw.mediaType === "string" ? raw.mediaType : null,
    rawData: raw,
  });

  const rawComments = Array.isArray(raw.comments)
    ? raw.comments
    : Array.isArray(raw.commentsData)
    ? raw.commentsData
    : [];

  for (const c of rawComments) {
    if (typeof c !== "object" || !c) continue;
    const commentObj = c as Record<string, unknown>;
    const commentId = String(commentObj.id || commentObj.urn || `li_comm_${externalPostId}_${Math.random().toString(36).substring(7)}`);
    const commentText = String(commentObj.text || commentObj.commentText || "");

    if (!commentText.trim()) continue;

    comments.push({
      platform: "linkedin",
      accountId,
      externalPostId,
      externalCommentId: commentId,
      parentExternalCommentId: commentObj.parentId ? String(commentObj.parentId) : null,
      commentText,
      authorName: typeof commentObj.authorName === "string" ? commentObj.authorName : (typeof commentObj.author === "string" ? commentObj.author : null),
      authorProfileUrl: typeof commentObj.authorProfileUrl === "string" ? commentObj.authorProfileUrl : null,
      commentUrl: typeof commentObj.commentUrl === "string" ? commentObj.commentUrl : null,
      publishedAt: commentObj.postedDate ? new Date(String(commentObj.postedDate)).toISOString() : null,
      likeCount: typeof commentObj.likesCount === "number" ? commentObj.likesCount : 0,
      replyCount: typeof commentObj.repliesCount === "number" ? commentObj.repliesCount : 0,
      rawData: commentObj,
    });
  }

  return { posts, comments };
}
