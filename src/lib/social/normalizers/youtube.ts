import type { NormalizedPost, NormalizedComment } from "./instagram";

export function normalizeYouTubeItem(
  raw: Record<string, unknown>,
  accountId: string
): { posts: NormalizedPost[]; comments: NormalizedComment[] } {
  const posts: NormalizedPost[] = [];
  const comments: NormalizedComment[] = [];

  // Case 1: Item from streamers/youtube-comments-scraper (direct comment item)
  if (raw.cid || (raw.type === "comment" && raw.comment !== undefined) || (raw.comment && raw.videoId)) {
    const videoId = String(raw.videoId || `yt_vid_${Date.now()}`);
    const postUrl = typeof raw.pageUrl === "string" ? raw.pageUrl : `https://www.youtube.com/watch?v=${videoId}`;
    const postTitle = typeof raw.title === "string" ? raw.title : null;

    // Create post reference so it can be upserted/matched
    posts.push({
      platform: "youtube",
      accountId,
      externalPostId: videoId,
      postUrl,
      textContent: postTitle,
      publishedAt: raw.publishedTime ? new Date(String(raw.publishedTime)).toISOString() : null,
      mediaType: "video",
      rawData: {
        videoId,
        title: postTitle,
        commentsCount: raw.commentsCount,
      },
    });

    const commentId = String(raw.cid || `yt_comm_${Date.now()}_${Math.random().toString(36).substring(7)}`);
    const commentText = String(raw.comment || raw.text || "");

    if (commentText.trim()) {
      comments.push({
        platform: "youtube",
        accountId,
        externalPostId: videoId,
        externalCommentId: commentId,
        parentExternalCommentId: raw.replyToCid ? String(raw.replyToCid) : null,
        commentText,
        authorName: typeof raw.author === "string" ? raw.author : null,
        authorProfileUrl: typeof raw.author === "string" ? `https://www.youtube.com/${raw.author}` : null,
        commentUrl: postUrl ? `${postUrl}&lc=${commentId}` : null,
        publishedAt: raw.publishedTime ? new Date(String(raw.publishedTime)).toISOString() : null,
        likeCount: typeof raw.voteCount === "number" ? raw.voteCount : (typeof raw.likes === "number" ? raw.likes : 0),
        replyCount: typeof raw.replyCount === "number" ? raw.replyCount : 0,
        rawData: raw,
      });
    }

    return { posts, comments };
  }

  // Case 2: Item from streamers/youtube-scraper (channel video metadata)
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
    const commentId = String(commentObj.id || commentObj.cid || commentObj.commentId || `yt_comm_${externalPostId}_${Math.random().toString(36).substring(7)}`);
    const commentText = String(commentObj.text || commentObj.comment || commentObj.commentText || "");

    if (!commentText.trim()) continue;

    comments.push({
      platform: "youtube",
      accountId,
      externalPostId,
      externalCommentId: commentId,
      parentExternalCommentId: commentObj.parentId ? String(commentObj.parentId) : (commentObj.replyToCid ? String(commentObj.replyToCid) : null),
      commentText,
      authorName: typeof commentObj.author === "string" ? commentObj.author : (typeof commentObj.channelName === "string" ? commentObj.channelName : null),
      authorProfileUrl: typeof commentObj.authorUrl === "string" ? commentObj.authorUrl : (typeof commentObj.channelUrl === "string" ? commentObj.channelUrl : null),
      commentUrl: postUrl ? `${postUrl}&lc=${commentId}` : null,
      publishedAt: commentObj.publishedTime ? new Date(String(commentObj.publishedTime)).toISOString() : null,
      likeCount: typeof commentObj.voteCount === "number" ? commentObj.voteCount : (typeof commentObj.likes === "number" ? commentObj.likes : (typeof commentObj.likeCount === "number" ? commentObj.likeCount : 0)),
      replyCount: typeof commentObj.replyCount === "number" ? commentObj.replyCount : 0,
      rawData: commentObj,
    });
  }

  return { posts, comments };
}
