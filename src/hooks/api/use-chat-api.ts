import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../../lib/api-client";

export interface ChatMessage {
  id: number;
  user_id: string;
  session_id: string;
  query: string;
  response: string;
  mode: string;
  intent: string;
  created_at: string;
}

export interface SendMessageRequest {
  question: string;
  mode: "fun" | "mentor" | "buddy";
  session_id: string;
  user_id: string;
}

export interface SendMessageResponse {
  response: string;
  mode: string;
  intent: string;
  sources: Array<{
    title: string;
    artist: string;
    similarity: number;
    snippet?: string;
  }>;
  status?: string;
  request_id?: string;
}

// Hook to send message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: SendMessageRequest
    ): Promise<SendMessageResponse> => {
      const response = await apiClient.post("/ask", data);
      return response.data;
    },
    onSuccess: (_data, variables) => {
      // Invalidate chat history queries
      queryClient.invalidateQueries({ queryKey: ["chat-history"] });
      queryClient.invalidateQueries({
        queryKey: ["session-data", variables.session_id],
      });
    },
  });
};

// Hook to get chat history for a user
export const useChatHistory = (userId: string) => {
  return useQuery({
    queryKey: ["chat-history", userId],
    queryFn: async () => {
      const response = await apiClient.get(`/chat-history/${userId}`);
      return response.data as ChatMessage[];
    },
    enabled: !!userId,
  });
};

// Hook to get session data
export const useSessionData = (sessionId: string) => {
  return useQuery({
    queryKey: ["session-data", sessionId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/chat-history/session/${sessionId}`
      );
      return response.data as ChatMessage[];
    },
    enabled: !!sessionId,
  });
};
