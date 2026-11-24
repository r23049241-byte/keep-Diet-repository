import { useState, useEffect, useCallback, useRef } from 'react';
import { Salad, MessageCircle, User, TrendingUp, Dumbbell, Wallet, Droplets, BookOpen, LogOut, Bell, X } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';
import {
  supabase,
  type Meal, type Profile, type ChatMessage, type Exercise, type WaterIntake, type Budget, type Expense,
  type MealInput, type ProfileInput, type ExerciseInput, type BudgetInput, type ExpenseInput,
} from '@/lib/supabase';
import {
  getTodaysMeals, sumMacros, sumCaloriesBurned, getTodaysExercises, recommendedTargets,
  getTodaysWaterMl, WATER_TARGET_ML, calcCaloriesBurned,
} from '@/lib/dietitian';
import { NutritionOverview } from '@/components/NutritionOverview';
import { MealLog } from '@/components/MealLog';
import { ProfileCard } from '@/components/ProfileCard';
import { ChatPanel } from '@/components/ChatPanel';
import { AuthScreen } from '@/components/AuthScreen';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import { WaterTracker } from '@/components/WaterTracker';
import { BudgetManager } from '@/components/BudgetManager';
import { CalorieGuide } from '@/components/CalorieGuide';

type Tab = 'dashboard' | 'chat' | 'exercise' | 'budget' | 'guide' | 'profile';

interface Reminder {
  id: string;
  title: string;
  message: string;
  icon: typeof Bell;
  color: string;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [water, setWater] = useState<WaterIntake[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [reminder, setReminder] = useState<Reminder | null>(null);
  const reminderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Load all data when session is available
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    (async () => {
      const [mealsRes, profileRes, chatRes, exRes, waterRes, budgetRes, expRes] = await Promise.all([
        supabase.from('meals').select('*').order('logged_at', { ascending: false }),
        supabase.from('profile').select('*').maybeSingle(),
        supabase.from('chat_messages').select('*').order('created_at', { ascending: true }),
        supabase.from('exercises').select('*').order('logged_at', { ascending: false }),
        supabase.from('water_intake').select('*').order('logged_at', { ascending: false }),
        supabase.from('budget').select('*').eq('year', new Date().getFullYear()).eq('month', new Date().getMonth() + 1).maybeSingle(),
        supabase.from('expenses').select('*').order('spent_at', { ascending: false }),
      ]);
      if (mealsRes.data) setMeals(mealsRes.data as Meal[]);
      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (chatRes.data) setChat(chatRes.data as ChatMessage[]);
      if (exRes.data) setExercises(exRes.data as Exercise[]);
      if (waterRes.data) setWater(waterRes.data as WaterIntake[]);
      if (budgetRes.data) setBudget(budgetRes.data as Budget);
      if (expRes.data) setExpenses(expRes.data as Expense[]);
      setLoading(false);
    })();
  }, [session]);

  // Reminders: water + diet check-ins
  const todaysMeals = getTodaysMeals(meals);
  const totals = sumMacros(todaysMeals);
  const todaysExercises = getTodaysExercises(exercises);
  const burned = sumCaloriesBurned(todaysExercises);
  const waterMl = getTodaysWaterMl(water);

  useEffect(() => {
    if (!session || loading) return;
    if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current);

    // Pick a reminder based on current state
    let r: Reminder | null = null;
    if (waterMl < WATER_TARGET_ML * 0.5 && todaysMeals.length > 0) {
      r = {
        id: 'water',
        title: 'Water reminder',
        message: `You've only had ${waterMl}ml of water today. Aim for ${WATER_TARGET_ML}ml — grab a glass now!`,
        icon: Droplets,
        color: 'from-sky-400 to-blue-500',
      };
    } else if (todaysMeals.length === 0) {
      r = {
        id: 'diet',
        title: 'Diet reminder',
        message: 'You haven\'t logged any meals today. Log your first meal to track your nutrition!',
        icon: Salad,
        color: 'from-primary-400 to-primary-600',
      };
    } else if (todaysExercises.length === 0) {
      r = {
        id: 'exercise',
        title: 'Exercise reminder',
        message: 'No workouts logged today. Even a 20-minute walk makes a difference!',
        icon: Dumbbell,
        color: 'from-orange-400 to-red-500',
      };
    }

    if (r) {
      reminderTimerRef.current = setTimeout(() => setReminder(r), 1500);
    }
    return () => { if (reminderTimerRef.current) clearTimeout(reminderTimerRef.current); };
  }, [session, loading, waterMl, todaysMeals.length, todaysExercises.length]);

  const targets = profile
    ? {
        calories: profile.target_calories ?? recommendedTargets(profile).calories,
        protein: profile.target_protein ?? recommendedTargets(profile).protein,
        carbs: profile.target_carbs ?? recommendedTargets(profile).carbs,
        fat: profile.target_fat ?? recommendedTargets(profile).fat,
      }
    : { calories: null, protein: null, carbs: null, fat: null };

  // CRUD callbacks
  const addMeal = useCallback(async (input: MealInput) => {
    const { data, error } = await supabase.from('meals').insert(input).select().single();
    if (error) throw error;
    setMeals((m) => [data as Meal, ...m]);
  }, []);

  const deleteMeal = useCallback(async (id: string) => {
    setMeals((m) => m.filter((meal) => meal.id !== id));
    await supabase.from('meals').delete().eq('id', id);
  }, []);

  const saveProfile = useCallback(async (input: ProfileInput) => {
    const { data: existing } = await supabase.from('profile').select('id').maybeSingle();
    let result;
    if (existing) {
      result = await supabase.from('profile').update(input).eq('id', existing.id).select().maybeSingle();
    } else {
      result = await supabase.from('profile').insert(input).select().maybeSingle();
    }
    if (result.error) throw result.error;
    if (result.data) setProfile(result.data as Profile);
  }, []);

  const saveUserMessage = useCallback(async (content: string) => {
    const { data, error } = await supabase.from('chat_messages').insert({ role: 'user', content }).select().single();
    if (error) throw error;
    setChat((c) => [...c, data as ChatMessage]);
  }, []);

  const saveAssistantMessage = useCallback(async (content: string) => {
    const { data, error } = await supabase.from('chat_messages').insert({ role: 'assistant', content }).select().single();
    if (error) throw error;
    setChat((c) => [...c, data as ChatMessage]);
  }, []);

  const clearChat = useCallback(async () => {
    await supabase.from('chat_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setChat([]);
  }, []);

  const addExercise = useCallback(async (input: ExerciseInput) => {
    const { data, error } = await supabase.from('exercises').insert(input).select().single();
    if (error) throw error;
    setExercises((e) => [data as Exercise, ...e]);
  }, []);

  const deleteExercise = useCallback(async (id: string) => {
    setExercises((e) => e.filter((ex) => ex.id !== id));
    await supabase.from('exercises').delete().eq('id', id);
  }, []);

  const addWater = useCallback(async (amountMl: number) => {
    const { data, error } = await supabase.from('water_intake').insert({ amount_ml: amountMl }).select().single();
    if (error) throw error;
    setWater((w) => [data as WaterIntake, ...w]);
  }, []);

  const deleteWater = useCallback(async (id: string) => {
    setWater((w) => w.filter((d) => d.id !== id));
    await supabase.from('water_intake').delete().eq('id', id);
  }, []);

  const saveBudget = useCallback(async (input: BudgetInput) => {
    const { data, error } = await supabase
      .from('budget')
      .upsert({ ...input, user_id: session?.user.id }, { onConflict: 'user_id,year,month' })
      .select().maybeSingle();
    if (error) throw error;
    if (data) setBudget(data as Budget);
  }, [session]);

  const addExpense = useCallback(async (input: ExpenseInput) => {
    const { data, error } = await supabase.from('expenses').insert(input).select().single();
    if (error) throw error;
    setExpenses((e) => [data as Expense, ...e]);
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses((e) => e.filter((ex) => ex.id !== id));
    await supabase.from('expenses').delete().eq('id', id);
  }, []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-500" />
      </div>
    );
  }

  if (!session) {
    return <AuthScreen onAuthed={() => {}} />;
  }

  const navItems: { id: Tab; label: string; icon: typeof Salad }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'chat', label: 'AI Coach', icon: MessageCircle },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'budget', label: 'Budget', icon: Wallet },
    { id: 'guide', label: 'Guide', icon: BookOpen },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="absolute inset-0 bg-white/60 backdrop-blur-2xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 text-white shadow-sm">
              <Salad size={20} />
            </span>
            <div>
              <h1 className="font-display text-base font-extrabold text-ink-900 leading-none">NutriMind</h1>
              <p className="text-[10px] text-ink-400 font-medium">AI Diet & Fitness Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <nav className="hidden lg:flex items-center gap-1 rounded-full bg-gray-100/80 p-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    tab === item.id ? 'bg-white text-primary-600 shadow-sm' : 'text-ink-500 hover:text-ink-700'
                  }`}
                >
                  <item.icon size={15} />
                  {item.label}
                </button>
              ))}
            </nav>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-ink-600 transition hover:bg-gray-200"
              title="Sign out"
            >
              <LogOut size={14} /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile / tablet nav */}
      <nav className="lg:hidden sticky top-[53px] z-20 border-b border-gray-100/80 bg-white/80 backdrop-blur-xl overflow-x-auto">
        <div className="flex items-center gap-1 px-2 py-1.5 min-w-max">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1.5 text-[10px] font-semibold whitespace-nowrap transition ${
                tab === item.id ? 'text-primary-600 bg-primary-50' : 'text-ink-400'
              }`}
            >
              <item.icon size={17} />
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 pb-24 lg:pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-500" />
          </div>
        ) : tab === 'dashboard' ? (
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-up">
            <div className="lg:col-span-3 space-y-6">
              <NutritionOverview totals={totals} targets={targets} burned={burned} />
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard label="Meals today" value={String(todaysMeals.length)} accent="primary" />
                <StatCard label="Workouts" value={String(todaysExercises.length)} accent="orange" />
                <StatCard
                  label="Goal"
                  value={profile?.goal ? profile.goal.charAt(0).toUpperCase() + profile.goal.slice(1) : 'Not set'}
                  accent="accent"
                />
              </div>
              <WaterTracker water={water} onAdd={addWater} onDelete={deleteWater} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <MealLog meals={todaysMeals} onAdd={addMeal} onDelete={deleteMeal} />
              <ExerciseTracker exercises={todaysExercises} onAdd={addExercise} onDelete={deleteExercise} weightKg={profile?.weight_kg ?? null} />
            </div>
          </div>
        ) : tab === 'chat' ? (
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-up">
            <div className="lg:col-span-3">
              <ChatPanel
                messages={chat}
                profile={profile}
                meals={meals}
                exercises={todaysExercises}
                waterMl={waterMl}
                onUserMessage={saveUserMessage}
                onAssistantMessage={saveAssistantMessage}
                onClear={clearChat}
                onMealLogged={addMeal}
              />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NutritionOverview totals={totals} targets={targets} burned={burned} />
              <WaterTracker water={water} onAdd={addWater} onDelete={deleteWater} />
            </div>
          </div>
        ) : tab === 'exercise' ? (
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-up">
            <div className="lg:col-span-3 space-y-6">
              <ExerciseTracker exercises={todaysExercises} onAdd={addExercise} onDelete={deleteExercise} weightKg={profile?.weight_kg ?? null} />
              <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                <h3 className="font-display text-base font-bold text-ink-900 mb-3">Calories Burned Chart</h3>
                {todaysExercises.length === 0 ? (
                  <p className="text-sm text-ink-400 py-4 text-center">No data yet. Log a workout to see your progress!</p>
                ) : (
                  <div className="space-y-2">
                    {todaysExercises.map((ex) => {
                      const maxBurn = Math.max(...todaysExercises.map((e) => Number(e.calories_burned)), 1);
                      const pct = (Number(ex.calories_burned) / maxBurn) * 100;
                      return (
                        <div key={ex.id} className="flex items-center gap-3">
                          <span className="text-xs font-medium text-ink-600 w-28 truncate">{ex.type}</span>
                          <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-lg bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-end pr-2 transition-all duration-700" style={{ width: `${pct}%` }}>
                              <span className="text-[10px] font-bold text-white">{Math.round(Number(ex.calories_burned))}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-orange-50 p-4">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-white">
                    <Dumbbell size={20} />
                  </span>
                  <div>
                    <p className="font-display text-xl font-bold text-ink-900">{Math.round(burned)} cal</p>
                    <p className="text-xs text-ink-500">Total burned today across {todaysExercises.length} session{todaysExercises.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NutritionOverview totals={totals} targets={targets} burned={burned} />
            </div>
          </div>
        ) : tab === 'budget' ? (
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-up">
            <div className="lg:col-span-3">
              <BudgetManager
                budget={budget}
                expenses={expenses}
                onSaveBudget={saveBudget}
                onAddExpense={addExpense}
                onDeleteExpense={deleteExpense}
              />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NutritionOverview totals={totals} targets={targets} burned={burned} />
              <WaterTracker water={water} onAdd={addWater} onDelete={deleteWater} />
            </div>
          </div>
        ) : tab === 'guide' ? (
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-up">
            <div className="lg:col-span-3">
              <CalorieGuide />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NutritionOverview totals={totals} targets={targets} burned={burned} />
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-5 animate-fade-up">
            <div className="lg:col-span-3">
              <ProfileCard profile={profile} onSave={saveProfile} />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <NutritionOverview totals={totals} targets={targets} burned={burned} />
            </div>
          </div>
        )}
      </main>

      {/* Reminder toast */}
      {reminder && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-in">
          <div className={`rounded-2xl bg-gradient-to-br ${reminder.color} p-0.5 shadow-2xl`}>
            <div className="rounded-2xl bg-white p-4 flex items-start gap-3">
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${reminder.color} text-white`}>
                <reminder.icon size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-ink-900">{reminder.title}</p>
                <p className="text-xs text-ink-600 mt-0.5">{reminder.message}</p>
              </div>
              <button onClick={() => setReminder(null)} className="text-ink-400 hover:text-ink-700 p-0.5 shrink-0">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, accent,
}: { label: string; value: string; accent: 'primary' | 'accent' | 'ink' | 'orange' }) {
  const colors: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-700',
    accent: 'bg-accent-50 text-accent-700',
    ink: 'bg-ink-900/5 text-ink-700',
    orange: 'bg-orange-50 text-orange-700',
  };
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${colors[accent]} mb-2`}>
        {label}
      </span>
      <p className="font-display text-2xl font-bold text-ink-900">{value}</p>
    </div>
  );
}

export default App;
