export interface ChatbotUsage {
  message_count: number;
  last_message_at: string | null;
}

// Query classification types from the RAG chatbot
export type QueryType =
  | 'immigration'
  | 'newcomer_settlement'
  | 'general'
  | 'fact_check'
  | 'form_help';

// RAG API response structure
export interface RAGResponse {
  answer: string;
  sources?: Source[];
  queryType: QueryType;
  disclaimer?: string;
  suggestedNextSteps?: string[]; // AI-generated follow-up questions
}

// Source document reference
export interface Source {
  document_id: number;
  document_title: string;
  url: string;
}
