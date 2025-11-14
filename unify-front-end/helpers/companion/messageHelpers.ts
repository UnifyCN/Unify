import { ConversationMessage } from '@/services/companion/getConversationMessages';

export interface Source {
  document_id: number;
  document_title: string;
  url: string;
}

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  sources?: Source[];
}

export interface ConversationMessageForAPI {
  message: string;
  role: 'user' | 'assistant';
}

/**
 * Converts database messages to UI Message format
 */
export const formatMessagesForUI = (
  dbMessages: ConversationMessage[] | undefined
): Message[] => {
  if (!dbMessages) return [];

  return dbMessages.map(msg => ({
    id: msg.id.toString(),
    text: msg.content,
    isUser: msg.role === 'user',
    timestamp: new Date(msg.created_at),
    sources: msg.sources || undefined,
  }));
};

/**
 * Formats messages for RAG API context (last 10 messages)
 */
export const formatMessagesForAPI = (
  messages: Message[],
  currentUserMessage: string
): ConversationMessageForAPI[] => {
  return [
    ...messages
      .slice(-9) // Get last 9 messages (we'll add current one)
      .map(msg => ({
        message: msg.text,
        role: msg.isUser ? ('user' as const) : ('assistant' as const),
      })),
    {
      message: currentUserMessage,
      role: 'user' as const,
    },
  ].slice(-10); // Ensure we only send last 10 total
};

/**
 * Parses the response from the RAG API to extract answer and sources
 */
export const parseRAGResponse = (
  response: any
): {
  answer: string;
  sources: Source[];
} => {
  let botResponse = 'Sorry, I encountered an error. Please try again.';
  let sources: Source[] = [];

  // Handle new RAG response format
  if (response && response.answer) {
    botResponse = response.answer.trim();
    sources = response.sources || [];
  }
  // Fallback: Handle old Gemini response format (for backward compatibility)
  else if (response && response.candidates && response.candidates[0]) {
    const candidate = response.candidates[0];
    if (
      candidate.content &&
      candidate.content.parts &&
      candidate.content.parts[0]
    ) {
      botResponse = candidate.content.parts[0].text.trim();
    }
  }

  return { answer: botResponse, sources };
};
