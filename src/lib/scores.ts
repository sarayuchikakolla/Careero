// Extract interview scores from AI's final summary message
export interface InterviewScores {
  technical_skills: number;
  communication: number;
  confidence: number;
  problem_solving: number;
  behavioural_fit: number;
  overall: number;
}

export function extractScoresFromMessage(content: string): InterviewScores | null {
  const scorePatterns: Record<keyof InterviewScores, RegExp[]> = {
    technical_skills: [/technical\s*skills?\s*[:\-–—]\s*(\d{1,3})/i],
    communication: [/communication\s*[:\-–—]\s*(\d{1,3})/i],
    confidence: [/confidence\s*[:\-–—]\s*(\d{1,3})/i],
    problem_solving: [/problem\s*solving\s*[:\-–—]\s*(\d{1,3})/i],
    behavioural_fit: [/behaviou?ral\s*fit\s*[:\-–—]\s*(\d{1,3})/i],
    overall: [/overall\s*score\s*[:\-–—]\s*(\d{1,3})/i, /overall\s*[:\-–—]\s*(\d{1,3})/i],
  };

  const scores: Partial<InterviewScores> = {};
  let found = 0;

  for (const [key, patterns] of Object.entries(scorePatterns)) {
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        const val = parseInt(match[1], 10);
        if (val >= 0 && val <= 100) {
          scores[key as keyof InterviewScores] = val;
          found++;
          break;
        }
      }
    }
  }

  // Need at least overall + 2 others to consider it valid
  if (found < 3 || scores.overall === undefined) return null;

  return {
    technical_skills: scores.technical_skills ?? 0,
    communication: scores.communication ?? 0,
    confidence: scores.confidence ?? 0,
    problem_solving: scores.problem_solving ?? 0,
    behavioural_fit: scores.behavioural_fit ?? 0,
    overall: scores.overall,
  };
}
