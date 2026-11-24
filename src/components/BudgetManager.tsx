import { useState } from 'react';
import { Wallet, Plus, Trash2, TrendingDown, X, Edit3 } from 'lucide-react';
import type { Budget, Expense, BudgetInput, ExpenseInput } from '@/lib/supabase';
import { BUDGET_MEALS } from '@/lib/dietitian';

interface BudgetManagerProps {
  budget: Budget | null;
  expenses: Expense[];
  onSaveBudget: (input: BudgetInput) => Promise<void>;
  onAddExpense: (input: ExpenseInput) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CATEGORIES = [
  { value: 'groceries', label: 'Groceries', color: 'bg-primary-100 text-primary-700' },
  { value: 'restaurants', label: 'Restaurants', color: 'bg-orange-100 text-orange-700' },
  { value: 'snacks', label: 'Snacks', color: 'bg-accent-100 text-accent-700' },
  { value: 'supplements', label: 'Supplements', color: 'bg-sky-100 text-sky-700' },
  { value: 'other', label: 'Other', color: 'bg-gray-100 text-gray-700' },
];

export function BudgetManager({ budget, expenses, onSaveBudget, onAddExpense, onDeleteExpense }: BudgetManagerProps) {
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [budgetAmount, setBudgetAmount] = useState(budget?.budget_amount ? String(budget.budget_amount) : '300');
  const [expAmount, setExpAmount] = useState('');
  const [expCategory, setExpCategory] = useState('groceries');
  const [expNote, setExpNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const now = new Date();
  const monthExpenses = expenses.filter((e) => {
    const d = new Date(e.spent_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpent = monthExpenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
  const budgetVal = budget?.budget_amount ? Number(budget.budget_amount) : 0;
  const remaining = budgetVal - totalSpent;
  const pct = budgetVal > 0 ? Math.min(100, (totalSpent / budgetVal) * 100) : 0;

  async function handleSaveBudget() {
    setSaving(true);
    setError(null);
    try {
      await onSaveBudget({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        budget_amount: Number(budgetAmount) || 0,
      });
      setBudgetOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save budget');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddExpense() {
    if (!expAmount || Number(expAmount) <= 0) return;
    setSaving(true);
    setError(null);
    try {
      await onAddExpense({
        amount: Number(expAmount),
        category: expCategory,
        note: expNote.trim(),
        spent_at: new Date().toISOString(),
      });
      setExpAmount('');
      setExpNote('');
      setExpenseOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save expense');
    } finally {
      setSaving(false);
    }
  }

  const catLabel = (val: string) => CATEGORIES.find((c) => c.value === val)?.label ?? val;
  const catColor = (val: string) => CATEGORIES.find((c) => c.value === val)?.color ?? 'bg-gray-100 text-gray-700';

  return (
    <div className="space-y-6">
      {/* Budget overview */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <Wallet size={17} />
            </span>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Monthly Budget</h2>
              <p className="text-[11px] text-ink-400">{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</p>
            </div>
          </div>
          <button
            onClick={() => { setBudgetAmount(budget?.budget_amount ? String(budget.budget_amount) : '5000'); setBudgetOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-gray-200"
          >
            <Edit3 size={13} /> Set budget
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-5">
          <div className="rounded-2xl bg-primary-50 p-4">
            <p className="text-[11px] font-medium text-primary-700 mb-1">Budget</p>
            <p className="font-display text-xl font-bold text-ink-900">₹{budgetVal.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl bg-orange-50 p-4">
            <p className="text-[11px] font-medium text-orange-700 mb-1">Spent</p>
            <p className="font-display text-xl font-bold text-ink-900">₹{totalSpent.toFixed(0)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${remaining < 0 ? 'bg-red-50' : 'bg-primary-50'}`}>
            <p className={`text-[11px] font-medium mb-1 ${remaining < 0 ? 'text-red-700' : 'text-primary-700'}`}>Remaining</p>
            <p className={`font-display text-xl font-bold ${remaining < 0 ? 'text-red-600' : 'text-ink-900'}`}>
              ₹{Math.abs(remaining).toFixed(0)}
            </p>
          </div>
        </div>

        {budgetVal > 0 && (
          <div>
            <div className="flex justify-between text-xs text-ink-500 mb-1.5">
              <span>{pct}% used</span>
              <span>₹{totalSpent.toFixed(0)} / ₹{budgetVal.toFixed(0)}</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  pct > 90 ? 'bg-red-500' : pct > 70 ? 'bg-orange-500' : 'bg-primary-500'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Expenses */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-bold text-ink-900">Food Expenses</h3>
          <button
            onClick={() => setExpenseOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-600 active:scale-95"
          >
            <Plus size={16} /> Add expense
          </button>
        </div>

        {monthExpenses.length === 0 ? (
          <p className="text-sm text-ink-400 py-4 text-center">No expenses logged this month yet.</p>
        ) : (
          <div className="space-y-2">
            {monthExpenses.map((exp) => (
              <div
                key={exp.id}
                className="group flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5 transition hover:bg-gray-100"
              >
                <div className="flex items-center gap-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${catColor(exp.category)}`}>
                    {catLabel(exp.category)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-ink-800">{exp.note || catLabel(exp.category)}</p>
                    <p className="text-[11px] text-ink-400">{new Date(exp.spent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-ink-900">₹{Number(exp.amount).toFixed(0)}</span>
                  <button
                    onClick={() => onDeleteExpense(exp.id)}
                    className="opacity-0 group-hover:opacity-100 transition text-ink-400 hover:text-red-500 p-1"
                    aria-label="Delete expense"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Budget-friendly meal ideas */}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent-50 text-accent-600">
            <TrendingDown size={17} />
          </span>
          <h3 className="font-display text-base font-bold text-ink-900">Budget-Friendly Meals</h3>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {[...BUDGET_MEALS].sort((a, b) => a.estCost - b.estCost).slice(0, 6).map((meal) => (
            <div key={meal.name} className="rounded-2xl bg-gradient-to-br from-primary-50/50 to-white p-4 ring-1 ring-gray-100">
              <div className="flex items-start justify-between mb-1.5">
                <p className="text-sm font-bold text-ink-800">{meal.name}</p>
                <span className="text-sm font-display font-bold text-primary-600">₹{meal.estCost.toFixed(0)}</span>
              </div>
              <p className="text-[11px] text-ink-500 mb-2">{meal.calories} cal · {meal.protein}g protein</p>
              <p className="text-[11px] text-ink-400">{meal.ingredients.join(', ')}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Budget set modal */}
      {budgetOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setBudgetOpen(false)}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-900">Set monthly budget</h3>
              <button onClick={() => setBudgetOpen(false)} className="text-ink-400 hover:text-ink-700 p-1"><X size={20} /></button>
            </div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Food budget for {MONTH_NAMES[now.getMonth()]}</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 font-semibold">₹</span>
              <input type="number" value={budgetAmount} onChange={(e) => setBudgetAmount(e.target.value)} className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100" autoFocus />
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <button onClick={handleSaveBudget} disabled={saving} className="mt-4 w-full rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50">{saving ? 'Saving…' : 'Save budget'}</button>
          </div>
        </div>
      )}

      {/* Expense modal */}
      {expenseOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-ink-900/40 backdrop-blur-sm animate-fade-in" onClick={() => setExpenseOpen(false)}>
          <div className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-xl animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-bold text-ink-900">Add expense</h3>
              <button onClick={() => setExpenseOpen(false)} className="text-ink-400 hover:text-ink-700 p-1"><X size={20} /></button>
            </div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Amount</label>
            <div className="relative mb-4">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 font-semibold">₹</span>
              <input type="number" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100" placeholder="0.00" autoFocus />
            </div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Category</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {CATEGORIES.map((c) => (
                <button key={c.value} onClick={() => setExpCategory(c.value)} className={`rounded-xl py-2 text-xs font-semibold transition ${expCategory === c.value ? 'bg-primary-500 text-white shadow-sm' : 'bg-gray-100 text-ink-600 hover:bg-gray-200'}`}>{c.label}</button>
              ))}
            </div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Note (optional)</label>
            <input type="text" value={expNote} onChange={(e) => setExpNote(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-primary-400 focus:ring-2 focus:ring-primary-100 mb-4" placeholder="e.g. Weekly groceries" />
            {error && <p className="mb-3 text-sm text-red-500">{error}</p>}
            <button onClick={handleAddExpense} disabled={saving || !expAmount} className="w-full rounded-xl bg-primary-500 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 active:scale-[0.98] disabled:opacity-50">{saving ? 'Saving…' : 'Add expense'}</button>
          </div>
        </div>
      )}
    </div>
  );
}
