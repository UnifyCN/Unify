import { ConversationMessage } from '@/services/companion/getConversationMessages';
import { QueryType, RAGResponse } from '@/types/chatbot';

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
  queryType?: QueryType;
  disclaimer?: string;
  suggestedNextSteps?: string[]; // AI-generated follow-up questions
}

export interface ConversationMessageForAPI {
  message: string;
  role: 'user' | 'assistant';
}

/**
 * Parsed response from the RAG API
 */
export interface ParsedRAGResponse {
  answer: string;
  sources: Source[];
  queryType?: QueryType;
  disclaimer?: string;
  suggestedNextSteps?: string[];
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
    // Note: queryType, disclaimer, and suggestedNextSteps are not persisted to DB
    // They are only available in real-time responses, not when loading from DB
  }));
};

/**
 * Formats messages for RAG API context (last 10 messages)
 * Only includes messages that are already in the conversation (not the current one being sent)
 */
export const formatMessagesForAPI = (
  messages: Message[],
  currentUserMessage: string
): ConversationMessageForAPI[] => {
  // Get the last 10 messages from the conversation history (excluding current message)
  // The current message will be added separately by the edge function
  return messages
    .slice(-10)
    .map(msg => ({
      message: msg.text,
      role: msg.isUser ? ('user' as const) : ('assistant' as const),
    }));
};

/**
 * Parses the response from the RAG API to extract answer, sources, queryType, disclaimer, and suggestedNextSteps
 */
export const parseRAGResponse = (response: any): ParsedRAGResponse => {
  let botResponse = 'Sorry, I encountered an error. Please try again.';
  let sources: Source[] = [];
  let queryType: QueryType | undefined;
  let disclaimer: string | undefined;
  let suggestedNextSteps: string[] | undefined;

  // Handle new RAG response format with queryType, disclaimer, and suggestedNextSteps
  if (response && response.answer) {
    botResponse = response.answer.trim();
    sources = response.sources || [];
    queryType = response.queryType;
    disclaimer = response.disclaimer;
    suggestedNextSteps = response.suggestedNextSteps;
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

  return {
    answer: botResponse,
    sources,
    queryType,
    disclaimer,
    suggestedNextSteps,
  };
};
