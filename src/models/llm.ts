export interface LLMModel {
  id: string;
  name: string;
}

export interface LLMOption {
  provider: string;
  model: LLMModel;
}

export const AvailableLLMs: Record<string, LLMModel[]> = {
  Groq: [
    { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B' },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
  ],
  OpenAI: [
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  Anthropic: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  Google: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  ],
};

export function getProviders(): string[] {
  return Object.keys(AvailableLLMs);
}

export function getModelsForProvider(provider: string): LLMModel[] {
  return AvailableLLMs[provider] || [];
}

export function getModelById(modelId: string): LLMModel | null {
  for (const models of Object.values(AvailableLLMs)) {
    const model = models.find(m => m.id === modelId);
    if (model) return model;
  }
  return null;
}