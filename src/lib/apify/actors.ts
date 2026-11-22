import type { Platform } from "@/types";

export interface ActorConfig {
  platform: Platform;
  actorId: string;
  name: string;
  description: string;
  docsUrl: string;
  extracts: 'posts' | 'comments' | 'both';
  supportsDateFiltering: boolean;
  defaultLimit: number;
  inputTemplate: (params: {
    handleOrUrl: string;
    startDate: string;
    endDate: string;
    maxItems?: number;
  }) => Record<string, unknown>;
  notes: string;
}

export const PLATFORM_ACTORS: Record<Platform, ActorConfig> = {
  instagram: {
    platform: 'instagram',
    actorId: 'apify/instagram-scraper',
    name: 'Instagram Scraper',
    description: 'Scrapes posts, profiles, and associated comments for public Instagram handles.',
    docsUrl: 'https://apify.com/apify/instagram-scraper',
    extracts: 'both',
    supportsDateFiltering: true,
    defaultLimit: 50,
    inputTemplate: ({ handleOrUrl, startDate, endDate, maxItems = 50 }) => ({
      directUrls: [handleOrUrl.startsWith('http') ? handleOrUrl : `https://www.instagram.com/${handleOrUrl.replace(/^@/, '')}/`],
      resultsType: 'posts',
      resultsLimit: maxItems,
      onlyPostsNewerThan: startDate,
      onlyPostsOlderThan: endDate,
      commentsLimit: 20,
    }),
    notes: 'Requires public profile. Instagram may apply rate limits on rapid consecutive runs.'
  },
  facebook: {
    platform: 'facebook',
    actorId: 'apify/facebook-posts-scraper',
    name: 'Facebook Posts Scraper',
    description: 'Extracts public Facebook page posts and media.',
    docsUrl: 'https://apify.com/apify/facebook-posts-scraper',
    extracts: 'posts',
    supportsDateFiltering: true,
    defaultLimit: 30,
    inputTemplate: ({ handleOrUrl, startDate, endDate, maxItems = 30 }) => ({
      startUrls: [{ url: handleOrUrl.startsWith('http') ? handleOrUrl : `https://www.facebook.com/${handleOrUrl.replace(/^@/, '')}` }],
      resultsLimit: maxItems,
      captionText: true,
      ...(startDate ? { onlyPostsNewerThan: startDate } : {}),
      ...(endDate ? { onlyPostsOlderThan: endDate } : {}),
    }),
    notes: 'Public pages only. Extracts post text, images, reactions, and direct links.'
  },
  youtube: {
    platform: 'youtube',
    actorId: 'streamers/youtube-scraper',
    name: 'YouTube Channel & Comments Scraper',
    description: 'Scrapes YouTube channel videos, metadata, and audience comments.',
    docsUrl: 'https://apify.com/streamers/youtube-scraper',
    extracts: 'both',
    supportsDateFiltering: true,
    defaultLimit: 30,
    inputTemplate: ({ handleOrUrl, startDate, endDate, maxItems = 30 }) => ({
      startUrls: [{ url: handleOrUrl.startsWith('http') ? handleOrUrl : `https://www.youtube.com/${handleOrUrl.startsWith('@') ? handleOrUrl : '@' + handleOrUrl}` }],
      maxResults: maxItems,
      dateFrom: startDate,
      dateTo: endDate,
      maxComments: 50,
    }),
    notes: 'High reliability for public channels and videos.'
  },
  linkedin: {
    platform: 'linkedin',
    actorId: 'curious_coder/linkedin-post-search-scraper',
    name: 'LinkedIn Post & Comments Scraper',
    description: 'Extracts organization posts and comments from public company pages.',
    docsUrl: 'https://apify.com/curious_coder/linkedin-post-search-scraper',
    extracts: 'both',
    supportsDateFiltering: false,
    defaultLimit: 20,
    inputTemplate: ({ handleOrUrl, maxItems = 20 }) => ({
      urls: [handleOrUrl.startsWith('http') ? handleOrUrl : `https://www.linkedin.com/company/${handleOrUrl.replace(/^@/, '')}/`],
      count: maxItems,
      scrapeComments: true,
      maxComments: 20,
    }),
    notes: 'LinkedIn enforces strict anti-bot checks; post dates must be filtered post-extraction.'
  }
};
