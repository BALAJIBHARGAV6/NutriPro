// API Configuration for AI and Nutrition Services

// Google Gemini API
export const GEMINI_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY',
  BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  MODEL: 'gemini-1.5-flash', // Fast model for meal generation
  MODEL_PRO: 'gemini-1.5-pro', // Better quality for complex requests
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
};

// USDA FoodData Central API
export const USDA_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_USDA_API_KEY || 'YOUR_USDA_API_KEY',
  BASE_URL: 'https://api.nal.usda.gov/fdc/v1',
};

// Groq API (Fallback)
export const GROQ_CONFIG = {
  API_KEY: process.env.EXPO_PUBLIC_GROQ_API_KEY || 'YOUR_GROQ_API_KEY',
  BASE_URL: 'https://api.groq.com/openai/v1',
  MODEL: 'llama-3.1-70b-versatile',
};

// API Endpoints
export const ENDPOINTS = {
  GEMINI: {
    GENERATE_CONTENT: (model: string) => 
      `${GEMINI_CONFIG.BASE_URL}/models/${model}:generateContent?key=${GEMINI_CONFIG.API_KEY}`,
  },
  USDA: {
    SEARCH: `${USDA_CONFIG.BASE_URL}/foods/search`,
    FOOD: (fdcId: string) => `${USDA_CONFIG.BASE_URL}/food/${fdcId}`,
  },
  GROQ: {
    CHAT_COMPLETIONS: `${GROQ_CONFIG.BASE_URL}/chat/completions`,
  },
};

// Request timeout
export const REQUEST_TIMEOUT = 30000; // 30 seconds

// Rate limiting
export const RATE_LIMITS = {
  GEMINI: {
    REQUESTS_PER_MINUTE: 60,
    TOKENS_PER_MINUTE: 32000,
  },
  USDA: {
    REQUESTS_PER_HOUR: 1000,
  },
};
