import { useState, useEffect } from 'react';
import { Target, Save } from 'lucide-react';
import type { Profile, ProfileInput } from '@/lib/supabase';
import { calcBMR, calcTDEE, recommendedTargets } from '@/lib/dietitian';

interface ProfileCardProps {
  profile: Profile | null;
  onSave: (input: ProfileInput) => Promise<void>;
}

const ACTIVITY_OPTIONS = [
  { value: 'sedentary', label: 'Sedentary (little/no exercise)' },
  { value: 'light', label: 'Light (1-3 days/week)' },
  { value: 'moderate', label: 'Moderate (3-5 days/week)' },
  { value: 'active', label: 'Active (6-7 days/week)' },
  { value: 'very active', label: 'Very active (daily/physical job)' },
];

const GOAL_OPTIONS = [
  { value: 'lose', label: 'Lose weight' },
  { value: 'maintain', label: 'Maintain' },
  { value: 'gain', label: 'Gain muscle' },
];

export function ProfileCard({ profile, onSave }: ProfileCardProps) {
  const [form, setForm] = useState<ProfileInput>({
    name: 'You',
    age: null,
    sex: null,
    height_cm: null,
    weight_kg: null,
    activity: 'moderate',
    goal: 'maintain',
    target_calories: null,
    target_protein: null,
    target_carbs: null,
    target_fat: null,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        age: profile.age,
        sex: profile.sex,
        height_cm: profile.height_cm,
        weight_kg: profile.weight_kg,
        activity: profile.activity,
        goal: profile.goal,
        target_calories: profile.target_calories,
        target_protein: profile.target_protein,
        target_carbs: profile.target_carbs,
        target_fat: profile.target_fat,
      });
    }
  }, [profile]);

  const preview = recommendedTargets({
    ...form,
    id: '',
    singleton: 1,
    updated_at: '',
  } as Profile);
  const bmr = calcBMR({ ...form, id: '', singleton: 1, updated_at: '' } as Profile);
  const tdee = calcTDEE({ ...form, id: '', singleton: 1, updated_at: '' } as Profile);

  async function handleSave() {
    setSaving(true);
    const targets = recommendedTargets({ ...form, id: '', singleton: 1, updated_at: '' } as Profile);
    await onSave({
      ...form,
      target_calories: targets.calories,
      target_protein: targets.protein,
      target_carbs: targets.carbs,
      target_fat: targets.fat,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function update<K extends keyof ProfileInput>(key: K, value: ProfileInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const inputCls =
    'w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100';

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
          <Target size={17} />
        </span>
        <h2 className="font-display text-lg font-bold text-ink-900">Your Profile</h2>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-ink-500 mb-1">Name</label>
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => update('name', e.target.value)}
            className={inputCls}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1">Age</label>
          <input
            type="number"
            value={form.age ?? ''}
            onChange={(e) => update('age', e.target.value ? Number(e.target.value) : null)}
            className={inputCls}
            placeholder="30"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1">Sex</label>
          <select
            value={form.sex || ''}
            onChange={(e) => update('sex', e.target.value || null)}
            className={inputCls}
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1">Height (cm)</label>
          <input
            type="number"
            value={form.height_cm ?? ''}
            onChange={(e) => update('height_cm', e.target.value ? Number(e.target.value) : null)}
            className={inputCls}
            placeholder="175"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-ink-500 mb-1">Weight (kg)</label>
          <input
            type="number"
            value={form.weight_kg ?? ''}
            onChange={(e) => update('weight_kg', e.target.value ? Number(e.target.value) : null)}
            className={inputCls}
            placeholder="70"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-ink-500 mb-1">Activity level</label>
          <select
            value={form.activity || ''}
            onChange={(e) => update('activity', e.target.value)}
            className={inputCls}
          >
            {ACTIVITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-xs font-medium text-ink-500 mb-1">Goal</label>
          <div className="grid grid-cols-3 gap-2">
            {GOAL_OPTIONS.map((o) => (
              <button
                key={o.value}
                onClick={() => update('goal', o.value)}
                className={`rounded-xl py-2.5 text-xs font-semibold transition ${
                  form.goal === o.value
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 text-ink-600 hover:bg-gray-200'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bmr && tdee && (
        <div className="mt-5 rounded-2xl bg-primary-50 p-4">
          <p className="text-xs font-semibold text-primary-700 mb-2">Your numbers</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-xl font-bold text-ink-900">{Math.round(bmr)}</p>
              <p className="text-[11px] text-ink-500">BMR (cal)</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-ink-900">{Math.round(tdee)}</p>
              <p className="text-[11px] text-ink-500">Maintenance</p>
            </div>
            <div>
              <p className="font-display text-xl font-bold text-primary-600">{preview.calories ?? '—'}</p>
              <p className="text-[11px] text-ink-500">Target cal</p>
            </div>
          </div>
          <div className="mt-3 flex justify-center gap-4 text-[11px] text-ink-500">
            <span>Protein {preview.protein ?? '—'}g</span>
            <span>Carbs {preview.carbs ?? '—'}g</span>
            <span>Fat {preview.fat ?? '—'}g</span>
          </div>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="mt-5 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save profile'}
      </button>
    </div>
  );
}
