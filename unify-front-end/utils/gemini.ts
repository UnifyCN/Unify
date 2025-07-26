import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.MODEL_ID || '';

// Check if API key is available
export const isGeminiAvailable = () => {
  return !!(GEMINI_API_KEY && GEMINI_MODEL);
};

// Only create the model if API key is available
let model: any;

if (GEMINI_API_KEY) {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  } catch (error) {
    console.error('Failed to initialize Gemini model:', error);
    model = null;
  }
}

export default model;