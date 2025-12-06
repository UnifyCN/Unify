export interface ChatbotUsage {
  message_count: number;
  last_message_at: string | null;
}

// Query classification types from the RAG chatbot
export type QueryType = 'immigration' | 'newcomer_settlement' | 'general';

// RAG API response structure
export interface RAGResponse {
  answer: string;
  sources?: Source[];
  queryType: QueryType;
  disclaimer?: string;
}

// Source document reference
export interface Source {
  document_id: number;
  document_title: string;
  url: string;
}
