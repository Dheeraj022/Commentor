import { apifyFetch } from "./client";

export interface DatasetPaginationOptions {
  offset?: number;
  limit?: number;
  clean?: boolean;
}

export async function getDatasetItems<T = Record<string, unknown>>(
  datasetId: string,
  options?: DatasetPaginationOptions
): Promise<T[]> {
  const queryParams = new URLSearchParams();
  if (options?.offset !== undefined) {
    queryParams.set("offset", options.offset.toString());
  }
  if (options?.limit !== undefined) {
    queryParams.set("limit", options.limit.toString());
  }
  if (options?.clean !== undefined) {
    queryParams.set("clean", options.clean ? "true" : "false");
  }

  const query = queryParams.toString();
  const endpoint = `/datasets/${encodeURIComponent(datasetId)}/items${query ? `?${query}` : ""}`;

  return apifyFetch<T[]>(endpoint, { method: "GET" });
}
