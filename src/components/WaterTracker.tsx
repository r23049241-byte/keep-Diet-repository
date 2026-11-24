import { Droplets, Plus, Trash2 } from 'lucide-react';
import type { WaterIntake } from '@/lib/supabase';
import { WATER_TARGET_ML } from '@/lib/dietitian';

interface WaterTrackerProps {
  water: WaterIntake[];
  onAdd: (amountMl: number) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const QUICK_AMOUNTS = [250, 500];

export function WaterTracker({ water, onAdd, onDelete }: WaterTrackerProps) {
  const todayMl = water
    .filter((w) => {
      const d = new Date(w.logged_at);
      const now = new Date();
      return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, w) => acc + w.amount_ml, 0);

  const pct = Math.min(100, (todayMl / WATER_TARGET_ML) * 100);
  const glasses = Math.round(todayMl / 250);
  const targetGlasses = Math.round(WATER_TARGET_ML / 250);
  const remaining = WATER_TARGET_ML - todayMl;

  return (
    <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-blue-50 p-6 shadow-sm ring-1 ring-sky-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600">
            <Droplets size={17} />
          </span>
          <h2 className="font-display text-lg font-bold text-ink-900">Water Intake</h2>
        </div>
        <div className="flex gap-1.5">
          {QUICK_AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => onAdd(amt)}
              className="inline-flex items-center gap-1 rounded-full bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-600 active:scale-95"
            >
              <Plus size={13} /> {amt}ml
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Water glass visualization */}
        <div className="relative w-16 h-24 rounded-b-xl rounded-t-md border-2 border-sky-200 bg-sky-50 overflow-hidden shrink-0">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-sky-400 to-sky-300 transition-all duration-700 ease-out"
            style={{ height: `${pct}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/40 animate-pulse" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display text-sm font-bold text-ink-800 drop-shadow-sm">{glasses}/{targetGlasses}</span>
          </div>
        </div>

        <div className="flex-1">
          <p className="font-display text-2xl font-bold text-ink-900">{todayMl}<span className="text-sm font-normal text-ink-400">ml</span></p>
          <p className="text-xs text-ink-500 mb-2">of {WATER_TARGET_ML}ml daily target</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-sky-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
          {remaining > 0 ? (
            <p className="text-[11px] text-sky-600 font-medium mt-1.5">
              {remaining}ml left — about {Math.ceil(remaining / 250)} more glass{Math.ceil(remaining / 250) !== 1 ? 'es' : ''}
            </p>
          ) : (
            <p className="text-[11px] text-primary-600 font-medium mt-1.5">Goal reached! Great hydration.</p>
          )}
        </div>
      </div>

      {/* Recent entries */}
      {water.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {water.slice(0, 4).map((w) => (
            <div
              key={w.id}
              className="group flex items-center justify-between rounded-lg bg-white/70 px-3 py-1.5"
            >
              <span className="text-xs text-ink-600">
                {w.amount_ml}ml · {new Date(w.logged_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
              <button
                onClick={() => onDelete(w.id)}
                className="opacity-0 group-hover:opacity-100 transition text-ink-400 hover:text-red-500 p-0.5"
                aria-label="Delete water entry"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
