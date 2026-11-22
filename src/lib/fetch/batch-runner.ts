import { db } from "../db";
import { evaluateAccountCoverage } from "./cache-manager";
import { PLATFORM_ACTORS } from "../apify/actors";
import { runActor } from "../apify/run-actor";
import { getRunStatus } from "../apify/get-run-status";
import { getDatasetItems } from "../apify/get-dataset-items";
import { normalizePlatformItems } from "../social/normalizers";
import { FetchBatch, FetchPlanPreview, SocialAccount, Platform } from "@/types";

export async function generateFetchPlanPreview(
  accountIds: string[],
  startDate: string,
  endDate: string,
  timezone: string = "Asia/Kolkata",
  forceRefresh: boolean = false
): Promise<FetchPlanPreview> {
  const allAccounts = await db.getAccounts();
  const selectedAccounts = allAccounts.filter((a) => accountIds.includes(a.id) && a.isActive);
  const coverages = await db.getCoverages();

  const previewAccounts = selectedAccounts.map((account) => {
    const evaluation = evaluateAccountCoverage(account, startDate, endDate, coverages, forceRefresh);
    return {
      socialAccount: account,
      coverageStatus: evaluation.status,
      cachedCoverage: evaluation.cachedCoverage,
      needsExtraction: evaluation.needsExtraction,
      reason: evaluation.reason,
    };
  });

  const cachedCount = previewAccounts.filter((a) => !a.needsExtraction).length;
  const extractionNeededCount = previewAccounts.filter((a) => a.needsExtraction).length;

  const warnings: string[] = [];
  if (selectedAccounts.some((a) => a.platform === "linkedin")) {
    warnings.push("LinkedIn enforces strict scraping limits. Extraction may run slightly slower or require public company pages.");
  }

  return {
    startDate,
    endDate,
    timezone,
    accounts: previewAccounts,
    totalAccounts: selectedAccounts.length,
    cachedAccountsCount: cachedCount,
    extractionNeededCount,
    estimatedActorRuns: extractionNeededCount,
    warnings,
  };
}

export async function startFetchBatch(
  accountIds: string[],
  startDate: string,
  endDate: string,
  timezone: string = "Asia/Kolkata",
  forceRefresh: boolean = false
): Promise<FetchBatch> {
  const preview = await generateFetchPlanPreview(accountIds, startDate, endDate, timezone, forceRefresh);
  const workspaceId = db.getDefaultWorkspaceId();

  // Create batch in database
  const batch = await db.createBatch({
    workspaceId,
    startDate,
    endDate,
    timezone,
    status: "running",
    refreshRequested: forceRefresh,
    startedAt: new Date().toISOString(),
    postsFetched: 0,
    commentsFetched: 0,
    accounts: preview.accounts.map((item, idx) => ({
      id: `ba-${Date.now()}-${idx}`,
      fetchBatchId: "",
      socialAccountId: item.socialAccount.id,
      status: item.needsExtraction ? "queued" : "completed",
      coverageStatus: item.coverageStatus,
      postsCount: item.cachedCoverage?.postsCount || 0,
      commentsCount: item.cachedCoverage?.commentsCount || 0,
      socialAccount: item.socialAccount,
    })),
  });

  // Execute extraction asynchronously or sequentially
  executeBatchRun(batch, preview.accounts, startDate, endDate, forceRefresh).catch((err) => {
    console.error("Batch run error:", err);
    db.updateBatch(batch.id, {
      status: "failed",
      errorMessage: err.message || "Extraction process failed",
      completedAt: new Date().toISOString(),
    });
  });

  return batch;
}

async function executeBatchRun(
  batch: FetchBatch,
  accountItems: FetchPlanPreview["accounts"],
  startDate: string,
  endDate: string,
  forceRefresh: boolean
) {
  let totalPosts = 0;
  let totalComments = 0;
  let hasPartialFailure = false;

  const updatedBatchAccounts = [...(batch.accounts || [])];

  for (let i = 0; i < accountItems.length; i++) {
    const item = accountItems[i];
    const account = item.socialAccount;
    const batchAccount = updatedBatchAccounts[i];

    if (!item.needsExtraction) {
      // Reused from cache
      totalPosts += item.cachedCoverage?.postsCount || 0;
      totalComments += item.cachedCoverage?.commentsCount || 0;
      continue;
    }

    try {
      if (batchAccount) batchAccount.status = "running";
      await db.updateBatch(batch.id, { accounts: updatedBatchAccounts, status: "processing" });

      const actorConfig = PLATFORM_ACTORS[account.platform];
      const hasApifyToken = Boolean(process.env.APIFY_API_TOKEN);

      let rawItems: Record<string, unknown>[] = [];
      let apifyRunId = `sim_run_${Date.now()}`;
      let datasetId = `sim_ds_${Date.now()}`;

      if (hasApifyToken) {
        // Real Apify Actor execution
        const input = actorConfig.inputTemplate({
          handleOrUrl: account.handle || account.profileUrl,
          startDate,
          endDate,
          maxItems: actorConfig.defaultLimit,
        });

        const runData = await runActor(account.actorId || actorConfig.actorId, input, {
          waitForFinish: 120,
        });
        apifyRunId = runData.id;
        datasetId = runData.defaultDatasetId;

        // Fetch dataset items
        rawItems = await getDatasetItems(datasetId, { limit: 100 });

        // For YouTube: also scrape actual comments using streamers/youtube-comments-scraper
        if (account.platform === "youtube") {
          const videoUrls: { url: string }[] = [];
          for (const item of rawItems) {
            const vUrl =
              typeof item.url === "string" && item.url.includes("watch")
                ? item.url
                : typeof item.id === "string" && item.id.length > 5
                ? `https://www.youtube.com/watch?v=${item.id}`
                : null;
            if (vUrl && !videoUrls.some((u) => u.url === vUrl)) {
              videoUrls.push({ url: vUrl });
            }
          }

          // If handle or profile URL itself is a video
          const directUrl = (account.profileUrl && account.profileUrl.includes("watch"))
            ? account.profileUrl
            : (account.handle && account.handle.includes("watch"))
            ? account.handle
            : null;
          if (directUrl && !videoUrls.some((u) => u.url === directUrl)) {
            videoUrls.push({ url: directUrl });
          }

          if (videoUrls.length > 0) {
            try {
              const topVideos = videoUrls.slice(0, 5);
              const commentsRun = await runActor(
                "streamers/youtube-comments-scraper",
                {
                  startUrls: topVideos,
                  maxComments: 50,
                },
                { waitForFinish: 90 }
              );

              if (commentsRun.defaultDatasetId) {
                const commentItems = await getDatasetItems(commentsRun.defaultDatasetId, { limit: 100 });
                if (Array.isArray(commentItems) && commentItems.length > 0) {
                  rawItems = [...rawItems, ...commentItems];
                }
              }
            } catch (ytCommErr) {
              console.warn("YouTube comments scraper error (continuing with video metadata):", ytCommErr);
            }
          }
        }
      } else {
        throw new Error("APIFY_API_TOKEN is not configured. Please add your token in settings or .env.local.");
      }

      // Normalize items
      const { posts, comments } = normalizePlatformItems(account.platform, rawItems, account.id);

      // Upsert into storage (deduplication occurs inside upsert)
      const savedPosts = await db.upsertPosts(
        posts.map((p) => ({
          workspaceId: account.workspaceId,
          socialAccountId: account.id,
          platform: account.platform,
          externalPostId: p.externalPostId,
          postUrl: p.postUrl,
          textContent: p.textContent,
          publishedAt: p.publishedAt,
          mediaType: p.mediaType,
          rawData: p.rawData,
        }))
      );

      const savedComments = await db.upsertComments(
        comments.map((c) => {
          const matchingPost = savedPosts.find((p) => p.externalPostId === c.externalPostId);
          return {
            workspaceId: account.workspaceId,
            socialAccountId: account.id,
            socialPostId: matchingPost?.id || savedPosts[0]?.id || null,
            platform: account.platform,
            externalCommentId: c.externalCommentId,
            parentExternalCommentId: c.parentExternalCommentId,
            commentText: c.commentText,
            authorName: c.authorName,
            authorProfileUrl: c.authorProfileUrl,
            commentUrl: c.commentUrl,
            publishedAt: c.publishedAt,
            likeCount: c.likeCount,
            replyCount: c.replyCount,
            rawData: c.rawData,
          };
        })
      );

      totalPosts += savedPosts.length;
      totalComments += savedComments.length;

      if (batchAccount) {
        batchAccount.status = "completed";
        batchAccount.coverageStatus = "complete";
        batchAccount.postsCount = savedPosts.length;
        batchAccount.commentsCount = savedComments.length;
      }

      // Live update batch immediately so frontend polling sees live count updates
      await db.updateBatch(batch.id, {
        postsFetched: totalPosts,
        commentsFetched: totalComments,
        accounts: updatedBatchAccounts,
      });

      // Update account's last fetched at
      await db.updateAccount(account.id, {
        lastFetchedAt: new Date().toISOString(),
      });

      // Record successful coverage
      await db.recordCoverage({
        workspaceId: account.workspaceId,
        socialAccountId: account.id,
        platform: account.platform,
        startDate,
        endDate,
        coverageStatus: "complete",
        actorId: account.actorId || actorConfig.actorId,
        lastFetchBatchId: batch.id,
        postsCount: savedPosts.length,
        commentsCount: savedComments.length,
        configurationVersion: "v1.0",
      });

      if (batchAccount) {
        batchAccount.status = "completed";
        batchAccount.coverageStatus = "complete";
        batchAccount.postsCount = savedPosts.length;
        batchAccount.commentsCount = savedComments.length;
        batchAccount.apifyRun = {
          id: `apr-${Date.now()}`,
          workspaceId: account.workspaceId,
          fetchBatchAccountId: batchAccount.id,
          platform: account.platform,
          actorId: account.actorId || actorConfig.actorId,
          apifyRunId,
          datasetId,
          status: "SUCCEEDED",
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
        };
      }
    } catch (err: unknown) {
      hasPartialFailure = true;
      const errorMsg = err instanceof Error ? err.message : "Account extraction failed";
      if (batchAccount) {
        batchAccount.status = "failed";
        batchAccount.errorMessage = errorMsg;
      }
    }
  }

  const finalStatus = hasPartialFailure
    ? (totalComments > 0 ? "partially_completed" : "failed")
    : "completed";

  await db.updateBatch(batch.id, {
    status: finalStatus,
    postsFetched: totalPosts,
    commentsFetched: totalComments,
    completedAt: new Date().toISOString(),
    accounts: updatedBatchAccounts,
  });
}


