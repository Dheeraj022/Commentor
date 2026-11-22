import type { NormalizedPost, NormalizedComment } from "./instagram";

export function normalizeFacebookItem(
  raw: Record<string, unknown>,
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const posts: NormalizedPost[] = [];
  const comments: NormalizedComment[] = [];

  const externalPostId = String(raw.id || raw.postId || raw.post_id || `fb_post_${Date.now()}`);
  const postUrl = typeof raw.url === "string" ? raw.url : (raw.postUrl ? String(raw.postUrl) : null);
  const textContent = typeof raw.text === "string" ? raw.text : (typeof raw.message === "string" ? raw.message : null);
  const publishedAt = raw.time ? new Date(String(raw.time)).toISOString() : (raw.timestamp ? new Date(String(raw.timestamp)).toISOString() : null);

  posts.push({
    platform: "facebook",
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
    : Array.isArray(raw.topComments)
    ? raw.topComments
    : [];

  for (const c of rawComments) {
    if (typeof c !== "object" || !c) continue;
    const commentObj = c as Record<string, unknown>;
    const commentId = String(commentObj.id || commentObj.commentId || `fb_comm_${externalPostId}_${Math.random().toString(36).substring(7)}`);
    const commentText = String(commentObj.text || commentObj.message || "");

    if (!commentText.trim()) continue;

    comments.push({
      platform: "facebook",
      accountId,
      externalPostId,
      externalCommentId: commentId,
      parentExternalCommentId: commentObj.parentId ? String(commentObj.parentId) : null,
      commentText,
      authorName: typeof commentObj.author === "string" ? commentObj.author : (typeof commentObj.userName === "string" ? commentObj.userName : null),
      authorProfileUrl: typeof commentObj.authorUrl === "string" ? commentObj.authorUrl : null,
      commentUrl: typeof commentObj.commentUrl === "string" ? commentObj.commentUrl : null,
      publishedAt: commentObj.date ? new Date(String(commentObj.date)).toISOString() : null,
      likeCount: typeof commentObj.likes === "number" ? commentObj.likes : 0,
      replyCount: typeof commentObj.replyCount === "number" ? commentObj.replyCount : 0,
      rawData: commentObj,
    });
  }

  return { posts, comments };
}
