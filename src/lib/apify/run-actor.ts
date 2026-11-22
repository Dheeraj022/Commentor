import { apifyFetch } from "./client";

export interface ApifyRunResponse {
  data: {
    id: string;
    actId: string;
    userId: string;
    startedAt: string;
    finishedAt: string | null;
    status: "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMED-OUT" | "ABORTED";
    statusMessage: string | null;
    defaultDatasetId: string;
    defaultKeyValueStoreId: string;
    defaultRequestQueueId: string;
    usageTotalUsd?: number;
  };
}

export async function runActor(
  actorId: string,
  input: Record<string, unknown>,
  options?: {
    memoryMbytes?: number;
    timeoutSecs?: number;
    waitForFinish?: number;
  }
): Promise<ApifyRunResponse["data"]> {
  const queryParams = new URLSearchParams();
  if (options?.waitForFinish !== undefined) {
    queryParams.set("waitForFinish", options.waitForFinish.toString());
  }
  if (options?.memoryMbytes !== undefined) {
    queryParams.set("memory", options.memoryMbytes.toString());
  }
  if (options?.timeoutSecs !== undefined) {
    queryParams.set("timeout", options.timeoutSecs.toString());
  }

  const query = queryParams.toString();
  const endpoint = `/acts/${encodeURIComponent(actorId)}/runs${query ? `?${query}` : ""}`;

  const result = await apifyFetch<ApifyRunResponse>(endpoint, {
    method: "POST",
    body: JSON.stringify(input),
  });

  return result.data;
}
