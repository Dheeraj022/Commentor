import assert from "node:assert";
import { evaluateAccountCoverage } from "../src/lib/fetch/cache-manager";
import { normalizePlatformItems } from "../src/lib/social/normalizers/index";
import { analyzeSentimentRuleBased } from "../src/lib/sentiment/analyzer";
import { generateFeedbackSummary } from "../src/lib/sentiment/summary-generator";
import type { SocialAccount, FetchCoverage, SocialComment } from "../src/types/index";

console.log("=================================================");
console.log("RUNNING SOCIAL COMMENT MONITOR TEST SUITE");
console.log("=================================================");

// ----------------------------------------------------------------------------
// Test 1: Cache & Exact Date Range Check
// ----------------------------------------------------------------------------
console.log("\n[TEST 1] Cache evaluation: Exact date range match");
const testAccount: SocialAccount = {
  id: "acc-test-1",
  workspaceId: "ws-1",
  platform: "instagram",
  displayName: "Test Brand",
  handle: "@testbrand",
  profileUrl: "https://instagram.com/testbrand",
  isActive: true,
  createdAt: "2026-11-01T00:00:00Z",
  updatedAt: "2026-11-01T00:00:00Z",
};

const existingCoverages: FetchCoverage[] = [
  {
    id: "cov-1",
    workspaceId: "ws-1",
    socialAccountId: "acc-test-1",
    platform: "instagram",
    startDate: "2026-11-10",
    endDate: "2026-11-20",
    coverageStatus: "complete",
    completedAt: "2026-11-20T10:00:00Z",
    postsCount: 5,
    commentsCount: 20,
  },
];

const exactResult = evaluateAccountCoverage(
  testAccount,
  "2026-11-10",
  "2026-11-20",
  existingCoverages,
  false
);

assert.strictEqual(exactResult.status, "complete", "Status should be complete for exact match");
assert.strictEqual(exactResult.needsExtraction, false, "Should not require extraction for exact match");
console.log("✓ Exact date range match correctly reuses cache without new Apify run");

// ----------------------------------------------------------------------------
// Test 2: Cache evaluation: Contained Range & Missing Range
// ----------------------------------------------------------------------------
console.log("\n[TEST 2] Cache evaluation: Contained range & missing range");
const containedResult = evaluateAccountCoverage(
  testAccount,
  "2026-11-12",
  "2026-11-18",
  existingCoverages,
  false
);
assert.strictEqual(containedResult.status, "complete");
assert.strictEqual(containedResult.needsExtraction, false);
console.log("✓ Contained date range correctly recognized as cached");

const missingResult = evaluateAccountCoverage(
  testAccount,
  "2026-11-21",
  "2026-11-25",
  existingCoverages,
  false
);
assert.strictEqual(missingResult.status, "missing");
assert.strictEqual(missingResult.needsExtraction, true);
console.log("✓ Uncovered date range correctly triggers extraction");

// ----------------------------------------------------------------------------
// Test 3: Normalization & Deduplication
// ----------------------------------------------------------------------------
console.log("\n[TEST 3] Data Normalization & Deduplication for Instagram");
const rawInstagramItems = [
  {
    id: "post_100",
    shortCode: "Cx99",
    caption: "Exciting new product launch! Let us know your thoughts.",
    timestamp: "2026-11-15T10:00:00Z",
    type: "image",
    latestComments: [
      { id: "c_1", text: "Amazing product! ❤️", ownerUsername: "user1", timestamp: "2026-11-15T11:00:00Z", likesCount: 5 },
      { id: "c_2", text: "Too expensive unfortunately.", ownerUsername: "user2", timestamp: "2026-11-15T12:00:00Z", likesCount: 1 },
      // Duplicate comment with same ID
      { id: "c_1", text: "Amazing product! ❤️", ownerUsername: "user1", timestamp: "2026-11-15T11:00:00Z", likesCount: 5 },
    ],
  },
];

const normalized = normalizePlatformItems("instagram", rawInstagramItems, "acc-test-1");
assert.strictEqual(normalized.posts.length, 1, "Should have 1 post");
assert.strictEqual(normalized.posts[0].externalPostId, "post_100");
assert.strictEqual(normalized.comments.length, 2, "Duplicate comment c_1 should be deduplicated");
assert.strictEqual(normalized.comments[0].externalCommentId, "c_1");
assert.strictEqual(normalized.comments[0].authorName, "user1");
console.log("✓ Instagram item normalized into common post & comment format with duplicate removal");

// ----------------------------------------------------------------------------
// Test 4: Sentiment Analysis (English, Hindi, Hinglish, Emojis)
// ----------------------------------------------------------------------------
console.log("\n[TEST 4] Sentiment Classification (Multi-lingual & Emojis)");

const s1 = analyzeSentimentRuleBased("This dashboard is incredible! Loved the speed and charts 🔥👏");
assert.strictEqual(s1.automatedLabel, "positive");
console.log(`✓ Positive English + Emojis: "${s1.automatedLabel}" (${s1.confidence}) - ${s1.reason}`);

const s2 = analyzeSentimentRuleBased("Bahut badiya interface hai, maza aa gaya dekh ke ❤️");
assert.strictEqual(s2.automatedLabel, "positive");
console.log(`✓ Positive Hinglish: "${s2.automatedLabel}" (${s2.confidence}) - ${s2.reason}`);

const s3 = analyzeSentimentRuleBased("Worst support ever, completely broken and useless waste of time!");
assert.strictEqual(s3.automatedLabel, "negative");
console.log(`✓ Negative English: "${s3.automatedLabel}" (${s3.confidence}) - ${s3.reason}`);

const s4 = analyzeSentimentRuleBased("Bilkul bakwas aur bekar service hai.");
assert.strictEqual(s4.automatedLabel, "negative");
console.log(`✓ Negative Hindi/Hinglish: "${s4.automatedLabel}" (${s4.confidence}) - ${s4.reason}`);

const s5 = analyzeSentimentRuleBased("Can we export these reports to PDF format?");
assert.strictEqual(s5.automatedLabel, "neutral");
console.log(`✓ Neutral Inquiry: "${s5.automatedLabel}" (${s5.confidence}) - ${s5.reason}`);

// Negation test: "not good" should be classified as negative
const s6 = analyzeSentimentRuleBased("The service was not good at all.");
assert.strictEqual(s6.automatedLabel, "negative");
console.log(`✓ Negation handling ("not good"): "${s6.automatedLabel}" (${s6.confidence}) - ${s6.reason}`);

// ----------------------------------------------------------------------------
// Test 5: Summary Generation
// ----------------------------------------------------------------------------
console.log("\n[TEST 5] Feedback Summary Generation");
const sampleComments: SocialComment[] = [
  {
    id: "c1",
    workspaceId: "ws-1",
    socialAccountId: "acc-1",
    platform: "instagram",
    externalCommentId: "ec1",
    commentText: "Great customer service and fast onboarding!",
    firstFetchedAt: "2026-11-20T00:00:00Z",
    lastFetchedAt: "2026-11-20T00:00:00Z",
    sentiment: { automatedLabel: "positive", confidence: 0.9, analysisStatus: "completed" },
  },
  {
    id: "c2",
    workspaceId: "ws-1",
    socialAccountId: "acc-1",
    platform: "instagram",
    externalCommentId: "ec2",
    commentText: "Pricing is too high for smaller agencies.",
    firstFetchedAt: "2026-11-20T00:00:00Z",
    lastFetchedAt: "2026-11-20T00:00:00Z",
    sentiment: { automatedLabel: "negative", confidence: 0.85, analysisStatus: "completed" },
  },
];

const summary = generateFeedbackSummary(sampleComments);
assert(summary.positiveThemes.length > 0, "Should have positive themes");
assert(summary.negativeThemes.length > 0, "Should have negative themes");
console.log("✓ Feedback themes accurately generated from classified comments");

console.log("\n=================================================");
console.log("ALL TESTS PASSED SUCCESSFULLY! (100% PASS RATE)");
console.log("=================================================");
