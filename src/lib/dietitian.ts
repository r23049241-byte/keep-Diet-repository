import type { Meal, Profile, Exercise } from './supabase';

export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function getTodaysMeals(meals: Meal[]): Meal[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return meals.filter((m) => {
    const t = new Date(m.logged_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}

export function getTodaysExercises(exercises: Exercise[]): Exercise[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return exercises.filter((e) => {
    const t = new Date(e.logged_at).getTime();
    return t >= start.getTime() && t <= end.getTime();
  });
}

export function sumMacros(meals: Meal[]): DailyTotals {
  return meals.reduce<DailyTotals>(
    (acc, m) => ({
      calories: acc.calories + Number(m.calories || 0),
      protein: acc.protein + Number(m.protein || 0),
      carbs: acc.carbs + Number(m.carbs || 0),
      fat: acc.fat + Number(m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function sumCaloriesBurned(exercises: Exercise[]): number {
  return exercises.reduce((acc, e) => acc + Number(e.calories_burned || 0), 0);
}

// Mifflin-St Jeor BMR
export function calcBMR(p: Profile): number | null {
  if (!p.weight_kg || !p.height_cm || !p.age) return null;
  const s = p.sex === 'female' ? -161 : 5;
  return 10 * p.weight_kg + 6.25 * p.height_cm - 5 * p.age + s;
}

const ACTIVITY_FACTOR: Record<string, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  'very active': 1.9,
};

export function calcTDEE(p: Profile): number | null {
  const bmr = calcBMR(p);
  if (bmr == null || !p.activity) return null;
  const factor = ACTIVITY_FACTOR[p.activity.toLowerCase()] ?? 1.2;
  return bmr * factor;
}

export function recommendedTargets(p: Profile): {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
} {
  const tdee = calcTDEE(p);
  if (tdee == null) return { calories: null, protein: null, carbs: null, fat: null };
  let calories = tdee;
  if (p.goal === 'lose') calories = tdee - 500;
  if (p.goal === 'gain') calories = tdee + 350;
  const protein = (calories * 0.3) / 4;
  const fat = (calories * 0.25) / 9;
  const carbs = (calories * 0.45) / 4;
  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fat: Math.round(fat),
  };
}

// ============ FOOD DATABASE ============
interface FoodEntry {
  match: string[];
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  serving: string;
  estCost: number;
}

const FOOD_DB: FoodEntry[] = [
  { match: ['chicken breast', 'chicken'], name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: 'per 100g', estCost: 125 },
  { match: ['white rice', 'rice'], name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving: 'per 100g', estCost: 25 },
  { match: ['brown rice'], name: 'Brown Rice (cooked)', calories: 123, protein: 2.7, carbs: 26, fat: 1, serving: 'per 100g', estCost: 35 },
  { match: ['egg', 'eggs'], name: 'Egg (whole)', calories: 78, protein: 6, carbs: 0.6, fat: 5, serving: 'per 1 large egg', estCost: 8 },
  { match: ['oats', 'oatmeal'], name: 'Oats (dry)', calories: 389, protein: 17, carbs: 66, fat: 7, serving: 'per 100g', estCost: 40 },
  { match: ['banana'], name: 'Banana', calories: 105, protein: 1.3, carbs: 27, fat: 0.4, serving: 'per 1 medium', estCost: 6 },
  { match: ['apple'], name: 'Apple', calories: 95, protein: 0.5, carbs: 25, fat: 0.3, serving: 'per 1 medium', estCost: 10 },
  { match: ['greek yogurt', 'yogurt'], name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, serving: 'per 100g', estCost: 65 },
  { match: ['salmon'], name: 'Salmon', calories: 208, protein: 20, carbs: 0, fat: 13, serving: 'per 100g', estCost: 250 },
  { match: ['broccoli'], name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving: 'per 100g', estCost: 40 },
  { match: ['potato', 'potatoes'], name: 'Potato (baked)', calories: 93, protein: 2.5, carbs: 21, fat: 0.1, serving: 'per 100g', estCost: 20 },
  { match: ['sweet potato'], name: 'Sweet Potato', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, serving: 'per 100g', estCost: 30 },
  { match: ['almonds', 'almond'], name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, serving: 'per 100g', estCost: 100 },
  { match: ['peanut butter'], name: 'Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, serving: 'per 100g', estCost: 65 },
  { match: ['milk'], name: 'Milk (2%)', calories: 50, protein: 3.3, carbs: 5, fat: 2, serving: 'per 100ml', estCost: 15 },
  { match: ['whole wheat bread', 'bread'], name: 'Whole Wheat Bread', calories: 247, protein: 13, carbs: 41, fat: 3.4, serving: 'per 100g', estCost: 35 },
  { match: ['avocado'], name: 'Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, serving: 'per 100g', estCost: 80 },
  { match: ['tofu'], name: 'Tofu', calories: 76, protein: 8, carbs: 1.9, fat: 4.8, serving: 'per 100g', estCost: 50 },
  { match: ['beef', 'steak'], name: 'Beef (lean)', calories: 250, protein: 26, carbs: 0, fat: 17, serving: 'per 100g', estCost: 200 },
  { match: ['tuna'], name: 'Tuna', calories: 132, protein: 28, carbs: 0, fat: 1.3, serving: 'per 100g', estCost: 80 },
  { match: ['spinach'], name: 'Spinach', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, serving: 'per 100g', estCost: 30 },
  { match: ['quinoa'], name: 'Quinoa (cooked)', calories: 120, protein: 4.4, carbs: 21, fat: 1.9, serving: 'per 100g', estCost: 65 },
  { match: ['black beans', 'beans'], name: 'Black Beans', calories: 132, protein: 8.9, carbs: 24, fat: 0.5, serving: 'per 100g', estCost: 35 },
  { match: ['olive oil'], name: 'Olive Oil', calories: 884, protein: 0, carbs: 0, fat: 100, serving: 'per 100g', estCost: 40 },
  { match: ['cabbage'], name: 'Cabbage', calories: 25, protein: 1.3, carbs: 6, fat: 0.1, serving: 'per 100g', estCost: 20 },
  { match: ['lentils'], name: 'Lentils (cooked)', calories: 116, protein: 9, carbs: 20, fat: 0.4, serving: 'per 100g', estCost: 30 },
  { match: ['pasta'], name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1, serving: 'per 100g', estCost: 35 },
  { match: ['orange'], name: 'Orange', calories: 62, protein: 1.2, carbs: 15, fat: 0.2, serving: 'per 1 medium', estCost: 10 },
];

function findFood(text: string): FoodEntry | null {
  const lower = text.toLowerCase();
  for (const food of FOOD_DB) {
    if (food.match.some((m) => lower.includes(m))) return food;
  }
  return null;
}

export interface ParsedMeal {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  quantity: number;
  unit: string;
  cost: number;
}

export function parseMealFromText(text: string): ParsedMeal | null {
  const food = findFood(text);
  if (!food) return null;

  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(g|grams?|ml|oz|cup|cups)?/i);
  let quantity = 1;
  let unit = food.serving.includes('100g') ? 'g' : 'serving';

  if (qtyMatch) {
    quantity = parseFloat(qtyMatch[1]);
    const u = (qtyMatch[2] || '').toLowerCase();
    if (u === 'g' || u.startsWith('gram')) {
      unit = 'g';
      quantity = quantity / 100;
    } else if (u === 'ml') {
      unit = 'ml';
      quantity = quantity / 100;
    } else if (u === 'oz') {
      unit = 'oz';
      quantity = quantity / 3.527;
    } else if (u.startsWith('cup')) {
      unit = 'cup';
    }
  }

  const factor = quantity;

  return {
    name: food.name,
    calories: Math.round(food.calories * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    quantity,
    unit,
    cost: Math.round(food.estCost * factor * 100) / 100,
  };
}

export const FOOD_SUGGESTIONS = FOOD_DB.map((f) => f.name);

// ============ CALORIE GUIDE ============
export const CALORIE_GUIDE = FOOD_DB.map((f) => ({
  name: f.name,
  calories: f.calories,
  protein: f.protein,
  carbs: f.carbs,
  fat: f.fat,
  serving: f.serving,
  estCost: f.estCost,
}));

// ============ EXERCISE DATABASE (calories burned per minute for 70kg person) ============
export const EXERCISE_DB: { name: string; calsPerMin: number; icon: string }[] = [
  { name: 'Walking', calsPerMin: 4.0, icon: '🚶' },
  { name: 'Running', calsPerMin: 11.0, icon: '🏃' },
  { name: 'Cycling', calsPerMin: 8.0, icon: '🚴' },
  { name: 'Swimming', calsPerMin: 10.0, icon: '🏊' },
  { name: 'Weight Training', calsPerMin: 6.0, icon: '🏋️' },
  { name: 'Yoga', calsPerMin: 3.0, icon: '🧘' },
  { name: 'HIIT', calsPerMin: 14.0, icon: '⚡' },
  { name: 'Dancing', calsPerMin: 7.0, icon: '💃' },
  { name: 'Basketball', calsPerMin: 9.0, icon: '🏀' },
  { name: 'Jump Rope', calsPerMin: 13.0, icon: '🪢' },
  { name: 'Hiking', calsPerMin: 7.0, icon: '🥾' },
  { name: 'Pilates', calsPerMin: 4.0, icon: '🤸' },
];

export function calcCaloriesBurned(type: string, minutes: number, weightKg: number | null): number {
  const ex = EXERCISE_DB.find((e) => e.name.toLowerCase() === type.toLowerCase());
  const calsPerMin = ex?.calsPerMin ?? 6;
  const weightFactor = weightKg ? weightKg / 70 : 1;
  return Math.round(calsPerMin * minutes * weightFactor);
}

// ============ BUDGET-FRIENDLY MEAL IDEAS ============
export const BUDGET_MEALS: { name: string; estCost: number; calories: number; protein: number; ingredients: string[] }[] = [
  { name: 'Rice & Bean Bowl', estCost: 120, calories: 420, protein: 18, ingredients: ['1 cup rice', '1 cup black beans', 'spinach', 'olive oil'] },
  { name: 'Egg & Toast Breakfast', estCost: 80, calories: 380, protein: 20, ingredients: ['2 eggs', '2 slices bread', 'banana'] },
  { name: 'Lentil Soup', estCost: 60, calories: 350, protein: 18, ingredients: ['1 cup lentils', 'cabbage', 'onion', 'spices'] },
  { name: 'Pasta with Tuna', estCost: 150, calories: 480, protein: 28, ingredients: ['100g pasta', '1 can tuna', 'olive oil', 'spinach'] },
  { name: 'Oatmeal & Banana', estCost: 55, calories: 350, protein: 12, ingredients: ['80g oats', '1 banana', 'milk', 'peanut butter'] },
  { name: 'Tofu Stir-Fry', estCost: 130, calories: 400, protein: 22, ingredients: ['150g tofu', 'rice', 'broccoli', 'soy sauce'] },
  { name: 'Potato & Egg Hash', estCost: 70, calories: 360, protein: 16, ingredients: ['2 potatoes', '2 eggs', 'spinach'] },
  { name: 'Greek Yogurt Bowl', estCost: 100, calories: 300, protein: 22, ingredients: ['200g yogurt', 'oats', 'apple', 'honey'] },
];

// ============ WATER TARGET ============
export const WATER_TARGET_ML = 2500;

export function getTodaysWaterMl(dates: { logged_at: string; amount_ml: number }[]): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return dates
    .filter((d) => {
      const t = new Date(d.logged_at).getTime();
      return t >= start.getTime() && t <= end.getTime();
    })
    .reduce((acc, d) => acc + d.amount_ml, 0);
}

// ============ AI REPLY GENERATOR ============
export function generateReply(
  userText: string,
  profile: Profile | null,
  todaysMeals: Meal[],
  todaysExercises: Exercise[] = [],
  waterMl: number = 0
): string {
  const text = userText.toLowerCase().trim();
  const totals = sumMacros(todaysMeals);
  const burned = sumCaloriesBurned(todaysExercises);
  const netCalories = totals.calories - burned;
  const targets = profile
    ? {
        calories: profile.target_calories ?? recommendedTargets(profile).calories,
        protein: profile.target_protein ?? recommendedTargets(profile).protein,
        carbs: profile.target_carbs ?? recommendedTargets(profile).carbs,
        fat: profile.target_fat ?? recommendedTargets(profile).fat,
      }
    : null;

  if (/^(hi|hello|hey|yo|sup|good morning|good afternoon|good evening)\b/.test(text)) {
    const name = profile?.name && profile.name !== 'You' ? `, ${profile.name}` : '';
    return `Hi there${name}! I'm your AI diet manager. I can help you with:
- Logging meals ("I had 200g chicken breast and a banana")
- Logging workouts ("I ran for 30 minutes")
- Checking daily nutrition and exercise progress
- Meal and snack suggestions, including budget-friendly options
- Tracking your water intake and reminders
- Calculating your calorie and macro targets

What would you like to do?`;
  }

  if (text.includes('help') || text.includes('what can you do')) {
    return `Here's what I can do:

1. Log a meal — tell me what you ate ("I had 2 eggs and 100g oats")
2. Log a workout — tell me what you did ("I ran for 30 minutes")
3. Check progress — ask "How am I doing today?" for calories consumed vs burned
4. Suggest meals — ask for ideas, including budget-friendly ones
5. Water tracking — ask about water or hydration
6. Budget meals — ask "What's a cheap meal?" for low-cost ideas

I track everything in your dashboard so you can see the full picture.`;
  }

  // Exercise logging
  const exerciseMatch = EXERCISE_DB.find((e) => text.includes(e.name.toLowerCase()));
  const minMatch = text.match(/(\d+)\s*(min|minutes|mins)/);
  if (exerciseMatch && minMatch) {
    const mins = parseInt(minMatch[1]);
    const burned2 = calcCaloriesBurned(exerciseMatch.name, mins, profile?.weight_kg ?? null);
    return `Great workout! ${mins} minutes of ${exerciseMatch.name} burns approximately ${burned2} calories for your body weight. I've logged it in your exercise tracker. That brings your total burned today to ${burned + burned2} calories. Keep it up!`;
  }

  if (text.includes('exercise') || text.includes('workout') || text.includes('burn')) {
    if (burned > 0) {
      return `You've burned ${Math.round(burned)} calories through exercise today. You consumed ${Math.round(totals.calories)} calories, so your net is ${Math.round(netCalories)} calories${targets?.calories ? ` (target ${targets.calories})` : ''}. To log a workout, tell me what you did like "I ran for 30 minutes" or "I did 45 minutes of weight training."`;
    }
    return `You haven't logged any exercise yet today. You can tell me what you did like "I ran for 30 minutes" or "I did yoga for 20 minutes" and I'll calculate calories burned based on your weight. Available exercises: walking, running, cycling, swimming, weight training, yoga, HIIT, dancing, basketball, jump rope, hiking, and pilates.`;
  }

  // Progress check
  if (text.includes('how am i') || text.includes('progress') || (text.includes('today') && (text.includes('eat') || text.includes('do')))) {
    if (!targets || !targets.calories) {
      return `Today: ${Math.round(totals.calories)} cal consumed, ${Math.round(burned)} cal burned (net ${Math.round(netCalories)}). Water: ${waterMl}ml of ${WATER_TARGET_ML}ml. Set up your profile to get personalized targets!`;
    }
    const remaining = Math.round(targets.calories - netCalories);
    const waterPct = Math.round((waterMl / WATER_TARGET_ML) * 100);
    return `Today's summary:
- Consumed: ${Math.round(totals.calories)} / ${targets.calories} cal
- Burned: ${Math.round(burned)} cal (exercise)
- Net: ${Math.round(netCalories)} cal (${remaining > 0 ? remaining + ' left' : Math.abs(remaining) + ' over'})
- Protein: ${Math.round(totals.protein)}/${targets.protein ?? 0}g
- Water: ${waterMl}ml / ${WATER_TARGET_ML}ml (${waterPct}%)
- Exercises logged: ${todaysExercises.length}

${remaining > 200 ? 'You have room for a snack!' : remaining < -200 ? 'Consider a lighter meal or a walk to balance things out.' : 'You\'re right on track!'}`;
  }

  // Budget meals
  if (text.includes('budget') || text.includes('cheap') || text.includes('affordable') || text.includes('inexpensive')) {
    const sorted = [...BUDGET_MEALS].sort((a, b) => a.estCost - b.estCost);
    return `Here are some budget-friendly meal ideas:

• ${sorted[0].name} — ₹${sorted[0].estCost.toFixed(0)} (~${sorted[0].calories} cal, ${sorted[0].protein}g protein)
  Ingredients: ${sorted[0].ingredients.join(', ')}

• ${sorted[1].name} — ₹${sorted[1].estCost.toFixed(0)} (~${sorted[1].calories} cal, ${sorted[1].protein}g protein)
  Ingredients: ${sorted[1].ingredients.join(', ')}

• ${sorted[2].name} — ₹${sorted[2].estCost.toFixed(0)} (~${sorted[2].calories} cal, ${sorted[2].protein}g protein)
  Ingredients: ${sorted[2].ingredients.join(', ')}

Set your monthly food budget in the Budget tab and I'll track your spending against it!`;
  }

  // Meal suggestions
  if (text.includes('suggest') || text.includes('what should i eat') || text.includes('idea') || text.includes('recommend')) {
    const remCal = targets && targets.calories ? targets.calories - netCalories : 500;
    const mealContext = text.includes('breakfast') ? 'breakfast'
      : text.includes('lunch') ? 'lunch'
      : text.includes('dinner') ? 'dinner'
      : 'a meal';
    const ideas: Record<string, string[]> = {
      breakfast: [
        `Greek yogurt with banana and oats (~350 cal, 20g protein)`,
        `2 eggs on toast with avocado (~420 cal, 22g protein)`,
        `Oatmeal with milk, peanut butter, and banana (~450 cal, 18g protein)`,
      ],
      lunch: [
        `Grilled chicken (150g) with quinoa and broccoli (~450 cal, 40g protein)`,
        `Tuna salad with beans and spinach (~380 cal, 35g protein)`,
        `Tofu stir-fry with brown rice and veggies (~420 cal, 22g protein)`,
      ],
      dinner: [
        `Baked salmon with sweet potato and spinach (~500 cal, 35g protein)`,
        `Lean beef with roasted potatoes and broccoli (~550 cal, 38g protein)`,
        `Chicken and avocado bowl with quinoa (~480 cal, 36g protein)`,
      ],
      'a meal': [
        `Grilled chicken with rice and veggies (~450 cal, 35g protein)`,
        `Salmon with sweet potato and spinach (~500 cal, 35g protein)`,
        `Greek yogurt bowl with banana and almonds (~400 cal, 25g protein)`,
      ],
    };
    const list = ideas[mealContext] || ideas['a meal'];
    const budget = remCal > 0 ? `You have about ${Math.round(remCal)} calories left today (after exercise). ` : '';
    return `${budget}Here are some ${mealContext} ideas:

• ${list[0]}
• ${list[1]}
• ${list[2]}

Ask for "budget meals" for cheaper options, or tell me what you ate to log it!`;
  }

  // Try to parse a meal
  const parsed = parseMealFromText(text);
  if (parsed) {
    return `Got it! ${parsed.name}: ~${parsed.calories} cal, ${parsed.protein}g protein, ${parsed.carbs}g carbs, ${parsed.fat}g fat (est. cost ₹${Math.round(parsed.cost)}). I've added it to your meal log and budget. Anything else?`;
  }

  // Water
  if (text.includes('water') || text.includes('hydrate') || text.includes('drink')) {
    const pct = Math.round((waterMl / WATER_TARGET_ML) * 100);
    return `You've had ${waterMl}ml of water today (${pct}% of your ${WATER_TARGET_ML}ml target). ${
      waterMl < WATER_TARGET_ML
        ? `You still need ${WATER_TARGET_ML - waterMl}ml — about ${Math.ceil((WATER_TARGET_ML - waterMl) / 250)} more glasses. Try drinking a glass now!`
        : `Great job hitting your hydration goal! Keep it up.`
    } Use the +water button on your dashboard to log glasses throughout the day.`;
  }

  // Weight loss / gain advice
  if (text.includes('lose weight') || text.includes('cut') || text.includes('fat loss')) {
    return `For sustainable fat loss, aim for a 500-calorie daily deficit — about 1 lb per week. Eat 0.8-1g protein per lb of body weight, fill up on veggies and high-fiber carbs, and keep training. Exercise helps too — even a 30-minute walk burns 120+ calories. Set your goal to "Lose weight" in Profile and I'll calculate your targets.`;
  }
  if (text.includes('gain') || text.includes('bulk') || text.includes('muscle') || text.includes('build')) {
    return `To build muscle, eat in a 300-500 cal surplus with 0.8-1g protein per lb. Focus on progressive overload in training, whole-food carbs for energy, and consistent sleep. Log your workouts so I can track calories burned vs consumed. Set your goal to "Gain muscle" in Profile.`;
  }

  // Protein question
  if (text.includes('protein')) {
    if (profile?.weight_kg) {
      const gramsLow = Math.round(profile.weight_kg * 1.6);
      const gramsHigh = Math.round(profile.weight_kg * 2.2);
      return `Based on your weight (${profile.weight_kg}kg), aim for ${gramsLow}-${gramsHigh}g protein daily. Budget sources: eggs (6g each), tuna (28g/100g), lentils (9g/100g), black beans (9g/100g), and chicken breast (31g/100g). You've had ${Math.round(totals.protein)}g today.`;
    }
    return `A general target is 1.6-2.2g of protein per kg of body weight. Set your weight in the Profile tab and I'll give you a precise number and track your daily intake.`;
  }

  // Calories question
  if (text.includes('calorie') || (text.includes('how many') && text.includes('eat'))) {
    if (profile && targets?.calories) {
      return `Your daily target is ${targets.calories} calories (based on your profile). Today: consumed ${Math.round(totals.calories)}, burned ${Math.round(burned)}, net ${Math.round(netCalories)}. ${remaining(targets.calories, netCalories) > 0 ? `${Math.round(remaining(targets.calories, netCalories))} calories left.` : 'You\'ve hit your target!'}`;
    }
    return `To calculate your calorie target, I need your stats. Head to the Profile tab to enter age, sex, height, weight, activity, and goal — I'll compute your daily maintenance and adjust for your goal.`;
  }

  if (text.includes('thank') || text.includes('cool') || text.includes('nice') || text.includes('great')) {
    return `You're welcome! Keep logging meals and workouts, and I'll keep you on track. Ask for meal ideas, budget tips, or a progress check anytime.`;
  }

  return `I'm not sure I caught that. I can:
- Log meals ("I had 150g chicken and rice")
- Log workouts ("I ran for 30 minutes")
- Check progress ("How am I doing today?")
- Suggest meals ("What should I eat for lunch?" or "budget meals")
- Answer questions about calories, protein, water, or exercise

What would you like?`;
}

function remaining(target: number, net: number): number {
  return target - net;
}
