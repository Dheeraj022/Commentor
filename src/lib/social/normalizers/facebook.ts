import type { NormalizedPost, NormalizedComment } from "./instagram";

export function normalizeFacebookItem(
  raw: Record<string, unknown>,
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const posts: NormalizedPost[] = [];
  const comments: NormalizedComment[] = [];

  // Skip error items (like { error: 'no_items' })
  if (raw.error) {
    return { posts, comments };
  }

  // Case 1: Direct comment item from facebook-comments-scraper
  if (raw.commentId || (raw.id && raw.text && !raw.url && !raw.postId)) {
    const commentId = String(raw.commentId || raw.id || `fb_comm_${Date.now()}`);
    const commentText = String(raw.text || raw.message || "");
    const externalPostId = String(raw.postId || raw.feedbackId || `fb_post_${Date.now()}`);

    if (commentText.trim()) {
      comments.push({
        platform: "facebook",
        accountId,
        externalPostId,
        externalCommentId: commentId,
        parentExternalCommentId: raw.parentId ? String(raw.parentId) : null,
        commentText,
        authorName: typeof raw.profileName === "string" ? raw.profileName : (typeof raw.author === "string" ? raw.author : null),
        authorProfileUrl: typeof raw.profileUrl === "string" ? raw.profileUrl : null,
        commentUrl: typeof raw.commentUrl === "string" ? raw.commentUrl : null,
        publishedAt: raw.date ? new Date(String(raw.date)).toISOString() : null,
        likeCount: typeof raw.likesCount === "number" ? raw.likesCount : (typeof raw.likes === "number" ? raw.likes : 0),
        replyCount: typeof raw.replyCount === "number" ? raw.replyCount : 0,
        rawData: raw,
      });
    }

    return { posts, comments };
  }

  // Case 2: Post item from facebook-posts-scraper
  const externalPostId = String(raw.postId || raw.id || raw.post_id || `fb_post_${Date.now()}`);
  const postUrl = typeof raw.url === "string" ? raw.url : (raw.postUrl ? String(raw.postUrl) : null);
  const textContent = typeof raw.text === "string" ? raw.text : (typeof raw.message === "string" ? raw.message : null);
  const publishedAt = raw.time ? new Date(String(raw.time)).toISOString() : (raw.timestamp ? new Date(Number(raw.timestamp) * 1000).toISOString() : null);

  // Extract thumbnail image from media array
  let thumbnailUrl: string | null = null;
  if (Array.isArray(raw.media)) {
    for (const m of raw.media) {
      if (typeof m === "object" && m) {
        const item = m as Record<string, unknown>;
        if (typeof item.thumbnail === "string") {
          thumbnailUrl = item.thumbnail;
          break;
        }
        if (typeof item.image === "object" && item.image && typeof (item.image as Record<string, unknown>).uri === "string") {
          thumbnailUrl = (item.image as Record<string, unknown>).uri as string;
          break;
        }
      }
    }
  }

  const enrichedRaw = {
    ...raw,
    thumbnailUrl: thumbnailUrl || (typeof raw.displayUrl === "string" ? raw.displayUrl : null),
  };

  posts.push({
    platform: "facebook",
    accountId,
    externalPostId,
    postUrl,
    textContent,
    publishedAt,
    mediaType: typeof raw.mediaType === "string" ? raw.mediaType : (thumbnailUrl ? "image" : null),
    rawData: enrichedRaw,
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
