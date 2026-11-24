import { RingProgress } from './RingProgress';
import { Flame, TrendingDown } from 'lucide-react';
import type { DailyTotals } from '@/lib/dietitian';

interface MacroBarProps {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  color: string;
}

function MacroBar({ label, value, target, unit, color }: MacroBarProps) {
  const pct = target && target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const remaining = target ? Math.max(0, Math.round(target - value)) : null;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink-700">{label}</span>
        <span className="text-xs text-ink-500">
          {Math.round(value)}
          {target ? ` / ${Math.round(target)}` : ''} {unit}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full ${color} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
      </div>
      {remaining !== null && <span className="text-[11px] text-ink-400">{remaining}{unit} left</span>}
    </div>
  );
}

interface NutritionOverviewProps {
  totals: DailyTotals;
  targets: { calories: number | null; protein: number | null; carbs: number | null; fat: number | null };
  burned: number;
}

export function NutritionOverview({ totals, targets, burned }: NutritionOverviewProps) {
  const netCalories = totals.calories - burned;
  const calPct = targets.calories ? Math.min(100, (totals.calories / targets.calories) * 100) : 0;
  const remaining = targets.calories ? Math.round(targets.calories - netCalories) : null;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold text-ink-900">Today's Nutrition</h2>
        <span className="text-xs font-medium text-ink-400">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <RingProgress
          value={calPct}
          size={160}
          stroke={14}
          color="#22b25c"
          track="#edf2ee"
          center={
            <div className="text-center">
              <div className="font-display text-3xl font-extrabold text-ink-900 leading-none">
                {Math.round(totals.calories)}
              </div>
              <div className="text-xs text-ink-500 mt-1">
                of {targets.calories ? Math.round(targets.calories) : '—'} cal
              </div>
              {remaining !== null && (
                <div className={`text-[11px] mt-1 font-medium ${remaining < 0 ? 'text-red-500' : 'text-primary-600'}`}>
                  {remaining < 0 ? `${Math.abs(remaining)} over` : `${remaining} left`}
                </div>
              )}
            </div>
          }
        />

        <div className="flex-1 w-full space-y-4">
          <MacroBar label="Protein" value={totals.protein} target={targets.protein} unit="g" color="bg-primary-500" />
          <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" color="bg-accent-400" />
          <MacroBar label="Fat" value={totals.fat} target={targets.fat} unit="g" color="bg-orange-400" />
        </div>
      </div>

      {/* Consumed vs burned */}
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-gray-100 pt-5">
        <div className="text-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600 mb-1">
            <TrendingDown size={16} />
          </span>
          <p className="font-display text-lg font-bold text-ink-900">{Math.round(totals.calories)}</p>
          <p className="text-[10px] text-ink-400">Consumed</p>
        </div>
        <div className="text-center">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-50 text-orange-600 mb-1">
            <Flame size={16} />
          </span>
          <p className="font-display text-lg font-bold text-orange-600">{Math.round(burned)}</p>
          <p className="text-[10px] text-ink-400">Burned</p>
        </div>
        <div className="text-center">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-ink-900/5 text-ink-600 mb-1 font-display font-bold text-sm">
            =
          </div>
          <p className={`font-display text-lg font-bold ${netCalories > (targets.calories ?? 9999) ? 'text-red-600' : 'text-ink-900'}`}>
            {Math.round(netCalories)}
          </p>
          <p className="text-[10px] text-ink-400">Net</p>
        </div>
      </div>
    </div>
  );
}
