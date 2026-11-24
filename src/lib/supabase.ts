import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  user_id: string;
  name: string;
  meal_type: MealType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  cost: number;
  logged_at: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  singleton: number;
  name: string;
  age: number | null;
  sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  activity: string | null;
  goal: string | null;
  target_calories: number | null;
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  user_id: string;
  type: string;
  duration_minutes: number;
  calories_burned: number;
  logged_at: string;
  created_at: string;
}

export interface WaterIntake {
  id: string;
  user_id: string;
  amount_ml: number;
  logged_at: string;
}

export interface Budget {
  id: string;
  user_id: string;
  year: number;
  month: number;
  budget_amount: number;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  note: string;
  spent_at: string;
  created_at: string;
}

export type ProfileInput = Omit<Profile, 'id' | 'user_id' | 'singleton' | 'updated_at'>;
export type MealInput = Omit<Meal, 'id' | 'user_id' | 'created_at'>;
export type ExerciseInput = Omit<Exercise, 'id' | 'user_id' | 'created_at'>;
export type WaterInput = Omit<WaterIntake, 'id' | 'user_id'>;
export type BudgetInput = Pick<Budget, 'year' | 'month' | 'budget_amount'>;
export type ExpenseInput = Omit<Expense, 'id' | 'user_id' | 'created_at'>;
