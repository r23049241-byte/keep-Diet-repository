import { useState } from 'react';
import { Search, BookOpen } from 'lucide-react';
import { CALORIE_GUIDE } from '@/lib/dietitian';

export function CalorieGuide() {
  const [query, setQuery] = useState('');

  const filtered = CALORIE_GUIDE.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-2 mb-4">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-600">
          <BookOpen size={17} />
        </span>
        <h2 className="font-display text-lg font-bold text-ink-900">Calorie Guide</h2>
      </div>

      <div className="relative mb-4">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          className="w-full rounded-xl border border-gray-200 pl-10 pr-4 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
        />
      </div>

      <div className="overflow-hidden rounded-2xl ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-4 py-2.5 text-xs font-semibold text-ink-500">Food</th>
              <th className="px-3 py-2.5 text-xs font-semibold text-ink-500 text-right">Cal</th>
              <th className="px-3 py-2.5 text-xs font-semibold text-ink-500 text-right hidden sm:table-cell">Protein</th>
              <th className="px-3 py-2.5 text-xs font-semibold text-ink-500 text-right hidden sm:table-cell">Carbs</th>
              <th className="px-3 py-2.5 text-xs font-semibold text-ink-500 text-right hidden sm:table-cell">Fat</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-ink-500 text-right">Est. ₹</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((food) => (
              <tr key={food.name} className="transition hover:bg-gray-50/60">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-ink-800">{food.name}</p>
                  <p className="text-[10px] text-ink-400">{food.serving}</p>
                </td>
                <td className="px-3 py-2.5 text-right font-semibold text-ink-900">{food.calories}</td>
                <td className="px-3 py-2.5 text-right text-ink-600 hidden sm:table-cell">{food.protein}g</td>
                <td className="px-3 py-2.5 text-right text-ink-600 hidden sm:table-cell">{food.carbs}g</td>
                <td className="px-3 py-2.5 text-right text-ink-600 hidden sm:table-cell">{food.fat}g</td>
                <td className="px-4 py-2.5 text-right text-primary-600 font-semibold">₹{food.estCost.toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-400">No foods found matching "{query}"</p>
        )}
      </div>
    </div>
  );
}
