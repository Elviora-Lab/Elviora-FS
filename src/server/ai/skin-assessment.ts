import 'server-only';

import { prisma } from '@/lib/db';

/**
 * AI Skin Assessment — service skeleton.
 *
 * Production wiring:
 *  • Replace `runModel` with a call to your LLM (OpenAI, Anthropic, etc.).
 *  • Stream the response back via a Route Handler with `ReadableStream`.
 *  • Persist the final assessment + recommendations into `ai_skin_assessments`.
 *  • Use the JSON `recommendations` field to store product IDs + reasoning.
 */
export type AssessmentInput = {
  userId?: string | null;
  skinType?: string;
  answers: Record<string, string>; // questionnaire responses
};

export type AssessmentResult = {
  skinType: string;
  concerns: string[];
  recommendations: Array<{ productId: string; reason: string }>;
};

export async function runSkinAssessment(input: AssessmentInput): Promise<AssessmentResult> {
  // Placeholder logic — swap for the real LLM call.
  const result: AssessmentResult = await runModel(input);

  await prisma.aiSkinAssessment.create({
    data: {
      userId: input.userId ?? null,
      skinType: result.skinType,
      concerns: result.concerns,
      recommendations: result.recommendations,
    },
  });

  return result;
}

async function runModel(input: AssessmentInput): Promise<AssessmentResult> {
  return {
    skinType: input.skinType ?? 'normal',
    concerns: ['Hydration'],
    recommendations: [],
  };
}
