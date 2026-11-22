import type { NormalizedPost, NormalizedComment } from "./instagram";

export function normalizeYouTubeItem(
  raw: Record<string, unknown>,
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const posts: NormalizedPost[] = [];
  const comments: NormalizedComment[] = [];

  const externalPostId = String(raw.id || raw.videoId || `yt_vid_${Date.now()}`);
  const postUrl = typeof raw.url === "string" ? raw.url : `https://www.youtube.com/watch?v=${externalPostId}`;
  const textContent = typeof raw.title === "string" ? `${raw.title}\n\n${raw.description || ""}` : (typeof raw.text === "string" ? raw.text : null);
  const publishedAt = raw.date ? new Date(String(raw.date)).toISOString() : (raw.uploadDate ? new Date(String(raw.uploadDate)).toISOString() : null);

  posts.push({
    platform: "youtube",
    accountId,
    externalPostId,
    postUrl,
    textContent,
    publishedAt,
    mediaType: "video",
    rawData: raw,
  });

  const rawComments = Array.isArray(raw.comments)
    ? raw.comments
    : Array.isArray(raw.commentsList)
    ? raw.commentsList
    : [];

  for (const c of rawComments) {
    if (typeof c !== "object" || !c) continue;
    const commentObj = c as Record<string, unknown>;
    const commentId = String(commentObj.id || commentObj.commentId || `yt_comm_${externalPostId}_${Math.random().toString(36).substring(7)}`);
    const commentText = String(commentObj.text || commentObj.commentText || "");

    if (!commentText.trim()) continue;

    comments.push({
      platform: "youtube",
      accountId,
      externalPostId,
      externalCommentId: commentId,
      parentExternalCommentId: commentObj.parentId ? String(commentObj.parentId) : null,
      commentText,
      authorName: typeof commentObj.author === "string" ? commentObj.author : (typeof commentObj.channelName === "string" ? commentObj.channelName : null),
      authorProfileUrl: typeof commentObj.authorUrl === "string" ? commentObj.authorUrl : (typeof commentObj.channelUrl === "string" ? commentObj.channelUrl : null),
      commentUrl: postUrl ? `${postUrl}&lc=${commentId}` : null,
      publishedAt: commentObj.publishedTime ? new Date(String(commentObj.publishedTime)).toISOString() : null,
      likeCount: typeof commentObj.likes === "number" ? commentObj.likes : (typeof commentObj.likeCount === "number" ? commentObj.likeCount : 0),
      replyCount: typeof commentObj.replyCount === "number" ? commentObj.replyCount : 0,
      rawData: commentObj,
    });
  }

  return { posts, comments };
}
