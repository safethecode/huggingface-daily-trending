import { ChatAnthropic } from "@langchain/anthropic";
import { AI_CONFIG } from "./constants";

export function createAIModel(
  apiKey: string,
  options?: {
    maxTokens?: number;
    temperature?: number;
  }
): ChatAnthropic {
  return new ChatAnthropic({
    apiKey,
    modelName: AI_CONFIG.modelName,
    temperature: options?.temperature ?? AI_CONFIG.temperature,
    maxTokens: options?.maxTokens ?? AI_CONFIG.maxTokens.summary,
  });
}
