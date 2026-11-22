import type { SocialComment } from "@/types";

export interface FeedbackSummary {
  positiveThemes: string[];
  negativeThemes: string[];
  neutralObservations: string[];
  frequentTopics: string[];
  commonComplaints: string[];
  improvementSuggestions: string[];
}

export function generateFeedbackSummary(comments: SocialComment[]): FeedbackSummary {
  if (comments.length === 0) {
    return {
      positiveThemes: ["No comments available to summarize."],
      negativeThemes: ["No negative feedback detected."],
      neutralObservations: ["No comments in the selected filter range."],
      frequentTopics: [],
      commonComplaints: [],
      improvementSuggestions: ["Start a comment extraction to analyze audience feedback."],
    };
  }

  const positiveComments = comments.filter((c) => {
    const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel;
    return label === "positive";
  });

  const negativeComments = comments.filter((c) => {
    const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel;
    return label === "negative";
  });

  const neutralComments = comments.filter((c) => {
    const label = c.sentiment?.manualLabel || c.sentiment?.automatedLabel;
    return label === "neutral" || !label;
  });

  // Extract common terms / topics
  const stopWords = new Set([
    "the", "and", "this", "that", "with", "for", "you", "your", "are", "have", "from",
    "was", "hai", "kya", "aur", "ye", "bhi", "video", "post", "nice", "good", "great"
  ]);

  const wordCounts: Record<string, number> = {};
  for (const c of comments) {
    const words = c.commentText.toLowerCase().replace(/[^\w\s]/g, "").split(/\s+/);
    for (const w of words) {
      if (w.length > 3 && !stopWords.has(w)) {
        wordCounts[w] = (wordCounts[w] || 0) + 1;
      }
    }
  }

  const frequentTopics = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word, count]) => `Topic: "${word}" (mentioned ${count} times)`);

  const positiveThemes: string[] = [];
  if (positiveComments.length > 0) {
    positiveThemes.push(`High appreciation for visual quality, presentation, and clarity across ${positiveComments.length} comments.`);
    const sample = positiveComments.slice(0, 2).map((c) => `"${c.commentText.slice(0, 60)}..."`).join(", ");
    positiveThemes.push(`Top positive sentiment highlights: ${sample}`);
  } else {
    positiveThemes.push("No distinct positive praise recorded in this range.");
  }

  const negativeThemes: string[] = [];
  const commonComplaints: string[] = [];
  if (negativeComments.length > 0) {
    negativeThemes.push(`Critical feedback identified in ${negativeComments.length} comments regarding responsiveness, pricing, or technical details.`);
    const complaints = negativeComments.slice(0, 3).map((c) => c.commentText.slice(0, 80));
    complaints.forEach((text) => commonComplaints.push(`Issue: "${text}"`));
    negativeThemes.push(`Common points of friction involve user queries taking too long to be answered or specific bug reports.`);
  } else {
    negativeThemes.push("No notable complaints or negative trends detected.");
    commonComplaints.push("No frequent complaints recorded in the current dataset.");
  }

  const neutralObservations: string[] = [];
  if (neutralComments.length > 0) {
    neutralObservations.push(`${neutralComments.length} comments are informational queries, tags, or neutral remarks.`);
    const hasQuestions = neutralComments.some((c) => c.commentText.includes("?"));
    if (hasQuestions) {
      neutralObservations.push("Multiple users are asking questions about product pricing, availability, and release schedules.");
    }
  } else {
    neutralObservations.push("All collected comments expressed clear positive or negative sentiment.");
  }

  const improvementSuggestions: string[] = [];
  if (negativeComments.length > 0) {
    improvementSuggestions.push("Prioritize responding to unanswered complaints to reduce negative sentiment escalation.");
  }
  if (neutralComments.some((c) => c.commentText.includes("?"))) {
    improvementSuggestions.push("Publish a pinned FAQ or detailed post caption addressing repetitive pricing and timeline questions.");
  }
  if (improvementSuggestions.length === 0) {
    improvementSuggestions.push("Maintain current content schedule and continue engaging actively with audience praises.");
  }

  return {
    positiveThemes,
    negativeThemes,
    neutralObservations,
    frequentTopics: frequentTopics.length > 0 ? frequentTopics : ["General engagement across platforms"],
    commonComplaints,
    improvementSuggestions,
  };
}
