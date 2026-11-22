import { apifyFetch } from "./client";
import { ApifyRunResponse } from "./run-actor";

export async function getRunStatus(runId: string): Promise<ApifyRunResponse["data"]> {
  const endpoint = `/actor-runs/${encodeURIComponent(runId)}`;
  const result = await apifyFetch<ApifyRunResponse>(endpoint, { method: "GET" });
  return result.data;
}
