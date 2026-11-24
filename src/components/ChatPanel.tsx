import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Trash2, Bot } from 'lucide-react';
import type { ChatMessage, Meal, Profile, MealInput, Exercise } from '@/lib/supabase';
import { generateReply, parseMealFromText, getTodaysMeals, getTodaysWaterMl, WATER_TARGET_ML } from '@/lib/dietitian';

interface ChatPanelProps {
  messages: ChatMessage[];
  profile: Profile | null;
  meals: Meal[];
  exercises: Exercise[];
  waterMl: number;
  onUserMessage: (content: string) => Promise<void>;
  onAssistantMessage: (content: string) => Promise<void>;
  onClear: () => Promise<void>;
  onMealLogged: (meal: MealInput) => Promise<void>;
}

const QUICK_PROMPTS = [
  'How am I doing today?',
  'What should I eat for lunch?',
  'I had 2 eggs and 100g oats',
  'I ran for 30 minutes',
  'What are some budget meals?',
  'How much water should I drink?',
];

export function ChatPanel({
  messages,
  profile,
  meals,
  exercises,
  waterMl,
  onUserMessage,
  onAssistantMessage,
  onClear,
  onMealLogged,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, thinking]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || thinking) return;
    setInput('');
    setThinking(true);
    await onUserMessage(content);

    // Try to auto-log a meal mentioned in the message
    const parsed = parseMealFromText(content);
    if (parsed) {
      await onMealLogged({
        name: parsed.name,
        meal_type: guessMealType(),
        calories: parsed.calories,
        protein: parsed.protein,
        carbs: parsed.carbs,
        fat: parsed.fat,
        cost: parsed.cost,
        logged_at: new Date().toISOString(),
      });
    }

    const todays = getTodaysMeals(meals);
    const reply = generateReply(content, profile, todays, exercises, waterMl);
    setTimeout(async () => {
      setThinking(false);
      await onAssistantMessage(reply);
    }, 500 + Math.random() * 400);
  }

  function guessMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const h = new Date().getHours();
    if (h < 11) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h < 21) return 'dinner';
    return 'snack';
  }

  return (
    <div className="flex flex-col h-[calc(100vh-9rem)] sm:h-[calc(100vh-7rem)] max-h-[800px] rounded-3xl bg-white shadow-sm ring-1 ring-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
              <Bot size={20} />
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-primary-500 ring-2 ring-white" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-ink-900">AI Diet Manager</h2>
            <p className="text-[11px] text-primary-600 font-medium">Online · Personalized to you</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={onClear} className="text-ink-400 hover:text-red-500 transition p-2 rounded-lg hover:bg-gray-50" aria-label="Clear conversation">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 space-y-4 bg-gray-50/50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 animate-fade-in">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-md mb-4">
              <Sparkles size={26} />
            </span>
            <h3 className="font-display text-lg font-bold text-ink-900 mb-1">Meet your AI diet manager</h3>
            <p className="text-sm text-ink-500 max-w-xs mb-5">
              Chat with me to log meals & workouts, track water, get budget meal ideas, and monitor your daily nutrition and exercise.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-sm">
              {QUICK_PROMPTS.map((q) => (
                <button key={q} onClick={() => send(q)} className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-left text-xs text-ink-700 transition hover:border-primary-300 hover:bg-primary-50 active:scale-95">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}>
            {msg.role === 'assistant' && (
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white mr-2 mt-0.5 shadow-sm">
                <Bot size={16} />
              </span>
            )}
            <div className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${msg.role === 'user' ? 'bg-primary-500 text-white rounded-br-md' : 'bg-white text-ink-800 shadow-sm ring-1 ring-gray-100 rounded-bl-md'}`}>
              {msg.content}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="flex justify-start animate-fade-in">
            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-white mr-2 mt-0.5 shadow-sm">
              <Bot size={16} />
            </span>
            <div className="bg-white rounded-2xl rounded-bl-md shadow-sm ring-1 ring-gray-100 px-4 py-3 flex items-center gap-1">
              <span className="typing-dot h-2 w-2 rounded-full bg-primary-400" />
              <span className="typing-dot h-2 w-2 rounded-full bg-primary-400" />
              <span className="typing-dot h-2 w-2 rounded-full bg-primary-400" />
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 p-3 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
            rows={1}
            placeholder="Ask me anything, log a meal or workout…"
            className="flex-1 resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 max-h-28"
            style={{ minHeight: '46px' }}
          />
          <button onClick={() => send(input)} disabled={!input.trim() || thinking} className="inline-flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-sm transition hover:bg-primary-600 active:scale-95 disabled:opacity-40 disabled:active:scale-100" aria-label="Send message">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
