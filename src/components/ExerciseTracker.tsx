import { useState } from 'react';
import { Plus, Trash2, Flame, Dumbbell, X, Clock } from 'lucide-react';
import type { Exercise, ExerciseInput } from '@/lib/supabase';
import { EXERCISE_DB, calcCaloriesBurned } from '@/lib/dietitian';

interface ExerciseTrackerProps {
  exercises: Exercise[];
  onAdd: (input: ExerciseInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  weightKg: number | null;
}

export function ExerciseTracker({ exercises, onAdd, onDelete, weightKg }: ExerciseTrackerProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(EXERCISE_DB[0].name);
  const [minutes, setMinutes] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewBurn = calcCaloriesBurned(type, minutes, weightKg);
  const totalBurned = exercises.reduce((acc, e) => acc + Number(e.calories_burned || 0), 0);

  async function handleAdd() {
    if (minutes < 1) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd({
        type,
        duration_minutes: minutes,
        calories_burned: calcCaloriesBurned(type, minutes, weightKg),
        logged_at: new Date().toISOString(),
      });
      setOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save exercise');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600">
            <Dumbbell size={17} />
          </span>
          <h2 className="font-display text-lg font-bold text-ink-900">Exercise Tracker</h2>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
        >
          <Plus size={16} /> Log workout
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-orange-50 to-red-50 p-4 mb-4">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
          <Flame size={22} />
        </span>
        <div>
          <p className="font-display text-2xl font-bold text-ink-900">{Math.round(totalBurned)}</p>
          <p className="text-xs text-ink-500">calories burned today</p>
        </div>
        <span className="ml-auto text-xs text-ink-400">{exercises.length} session{exercises.length !== 1 ? 's' : ''}</span>
      </div>

      {exercises.length === 0 ? (
        <p className="text-sm text-ink-400 py-4 text-center">No workouts logged yet today. Get moving!</p>
      ) : (
        <div className="space-y-2">
          {exercises.map((ex) => (
            <div
              key={ex.id}
              className="group flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-base shadow-sm">
                  {EXERCISE_DB.find((e) => e.name === ex.type)?.icon || '🏋️'}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink-800">{ex.type}</p>
                  <p className="text-[11px] text-ink-400 flex items-center gap-1">
                    <Clock size={11} /> {ex.duration_minutes} min · {Math.round(ex.calories_burned)} cal burned
                  </p>
                </div>
              </div>
              <button
                onClick={() => onDelete(ex.id)}
                className="opacity-0 group-hover:opacity-100 transition text-ink-400 hover:text-red-500 p-1"
                aria-label="Delete exercise"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

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
              <h3 className="font-display text-lg font-bold text-ink-900">Log a workout</h3>
              <button onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700 p-1">
                <X size={20} />
              </button>
            </div>

            <label className="block text-xs font-medium text-ink-500 mb-1.5">Exercise type</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {EXERCISE_DB.map((ex) => (
                <button
                  key={ex.name}
                  onClick={() => setType(ex.name)}
                  className={`flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold transition ${
                    type === ex.name
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'bg-gray-100 text-ink-600 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg">{ex.icon}</span>
                  {ex.name}
                </button>
              ))}
            </div>

            <label className="block text-xs font-medium text-ink-500 mb-1.5">Duration (minutes)</label>
            <div className="flex items-center gap-3 mb-4">
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="flex-1 accent-orange-500"
              />
              <span className="font-display text-lg font-bold text-ink-900 w-16 text-right">{minutes}m</span>
            </div>

            <div className="rounded-2xl bg-orange-50 p-4 text-center mb-4">
              <p className="text-xs text-ink-500 mb-1">Estimated calories burned</p>
              <p className="font-display text-3xl font-bold text-orange-600">{previewBurn}</p>
              {weightKg && <p className="text-[11px] text-ink-400 mt-1">Based on {weightKg}kg body weight</p>}
            </div>

            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

            <button
              onClick={handleAdd}
              disabled={saving}
              className="w-full rounded-xl bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 active:scale-[0.98] disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Add workout'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
