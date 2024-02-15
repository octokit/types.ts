export type ResponseHeaders = {
  "cache-control"?: string;
  "content-length"?: number;
  "content-type"?: string;
  date?: string;
  etag?: string;
  "last-modified"?: string;
  link?: string;
  location?: string;
  server?: string;
  status?: string;
  vary?: string;
  "x-accepted-github-permissions"?: string;
  "x-github-mediatype"?: string;
  "x-github-request-id"?: string;
  "x-oauth-scopes"?: string;
  "x-ratelimit-limit"?: string;
  "x-ratelimit-remaining"?: string;
  "x-ratelimit-reset"?: string;

  [header: string]: string | number | undefined;
};
