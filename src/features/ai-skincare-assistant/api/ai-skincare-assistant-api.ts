import { baseApi } from '@/services/api';

import type { AiSkincareAssistantPlaceholder } from '../types';

/**
 * AiSkincareAssistant endpoints. Inject into the shared baseApi so cache + tag
 * invalidation stay coherent. Replace these scaffolds with real endpoints.
 */
export const aiSkincareAssistantApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listAiSkincareAssistant: builder.query<AiSkincareAssistantPlaceholder[], void>({
      query: () => '/ai-skincare-assistant',
    }),
  }),
});

export const { useListAiSkincareAssistantQuery } = aiSkincareAssistantApi;
