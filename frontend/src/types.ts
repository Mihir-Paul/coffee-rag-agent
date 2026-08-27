export interface CustomerPreferences {
  temperature: string;
  sweetness: string;
  milk_preference: string;
  caffeine_preference: string;
  budget: number;
  dietary_restrictions: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: CustomerPreferences;
}

export interface ConversationSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface CoffeeRecommendation {
  id: string;
  name: string;
  category: string;
  price_inr: number;
  temperature: 'Hot' | 'Cold';
  sweetness: 'Low' | 'Medium' | 'High';
  caffeine: 'None' | 'Low' | 'Medium' | 'High';
  milk: string;
  ingredients: string[];
  allergens: string[];
  description: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  recommendations?: CoffeeRecommendation[];
  isError?: boolean;
}

export interface CustomerProfileOption {
  id: string;
  name: string;
  desc: string;
}

