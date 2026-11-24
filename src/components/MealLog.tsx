import { useState } from 'react';
import { Plus, Trash2, Coffee, Sun, Moon, Apple, X } from 'lucide-react';
import type { Meal, MealInput, MealType } from '@/lib/supabase';
import { FOOD_SUGGESTIONS, parseMealFromText } from '@/lib/dietitian';

interface MealLogProps {
  meals: Meal[];
  onAdd: (meal: MealInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const MEAL_META: { type: MealType; label: string; icon: typeof Coffee; color: string }[] = [
  { type: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'text-accent-600 bg-accent-50' },
  { type: 'lunch', label: 'Lunch', icon: Sun, color: 'text-orange-600 bg-orange-50' },
  { type: 'dinner', label: 'Dinner', icon: Moon, color: 'text-indigo-600 bg-indigo-50' },
  { type: 'snack', label: 'Snack', icon: Apple, color: 'text-primary-600 bg-primary-50' },
];

export function MealLog({ meals, onAdd, onDelete }: MealLogProps) {
  const [open, setOpen] = useState(false);
  const [foodText, setFoodText] = useState('');
  const [mealType, setMealType] = useState<MealType>('snack');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = MEAL_META.map((m) => ({
    ...m,
    items: meals.filter((meal) => meal.meal_type === m.type),
  }));

  async function handleQuickAdd() {
    if (!foodText.trim()) return;
    const parsed = parseMealFromText(foodText);
    setSaving(true);
    setError(null);
    try {
      if (parsed) {
        await onAdd({
          name: parsed.name,
          meal_type: mealType,
          calories: parsed.calories,
          protein: parsed.protein,
          carbs: parsed.carbs,
          fat: parsed.fat,
          cost: parsed.cost,
          logged_at: new Date().toISOString(),
        });
      } else {
        await onAdd({
          name: foodText.trim(),
          meal_type: mealType,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          cost: 0,
          logged_at: new Date().toISOString(),
        });
      }
      setFoodText('');
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save meal');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Meal Diary</h2>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 active:scale-95"
        >
          <Plus size={16} /> Add meal
        </button>
      </div>

      <div className="space-y-5">
        {grouped.map((g) => (
          <div key={g.type}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${g.color}`}>
                <g.icon size={15} />
              </span>
              <span className="text-sm font-semibold text-ink-700">{g.label}</span>
            </div>
            {g.items.length === 0 ? (
              <p className="text-xs text-ink-400 pl-9">Nothing logged yet</p>
            ) : (
              <div className="space-y-1.5 pl-9">
                {g.items.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 transition hover:bg-gray-100"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-800">{item.name}</p>
                      <p className="text-[11px] text-ink-400">
                        {Math.round(item.calories)} cal · P{Math.round(item.protein)} · C{Math.round(item.carbs)} · F{Math.round(item.fat)}
                      </p>
                    </div>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-ink-400 hover:text-red-500 p-1"
                      aria-label="Delete meal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-900">Log a meal</h3>
              <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700 p-1">
                <X size={20} />
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              {MEAL_META.map((m) => (
                <button
                  key={m.type}
                  onClick={() => setMealType(m.type)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    mealType === m.type
                      ? 'bg-primary-500 text-white shadow-sm'
                      : 'bg-gray-100 text-ink-500 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={foodText}
              onChange={(e) => setFoodText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd()}
              placeholder="e.g. 150g chicken breast and a banana"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              autoFocus
            />

            <div className="flex flex-wrap gap-1.5 mt-3">
              {FOOD_SUGGESTIONS.slice(0, 8).map((s) => (
                <button
                  key={s}
                  onClick={() => setFoodText(s)}
                  className="rounded-full bg-gray-100 px-3 py-1 text-xs text-ink-600 transition hover:bg-gray-200"
                >
                  {s}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <button
              onClick={handleQuickAdd}
              disabled={saving || !foodText.trim()}
              className="mt-5 w-full rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add to diary'}
            </button>
            <p className="mt-2 text-center text-[11px] text-ink-400">
              I'll estimate calories and macros automatically for known foods.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
