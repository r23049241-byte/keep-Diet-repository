# Project memory

## Product intent & audience

- Nutrition/meal planning web app with budget tracking and AI-powered meal suggestions
- Target audience: Indian users (currency in rupees, Indian food prices)
- Core features: monthly budget input, budget overview cards, expense entries, food cost database, calorie guide with cost estimates, AI chat with meal cost recommendations

## Brand personality & voice

- Production-quality, polished, visually distinct (not cookie-cutter) — per `.bolt/prompt` global instructions

## Visual design & UX direction

- Styled with Tailwind CSS; icons/logos via Lucide React
- Budget UI uses overview cards (budget / spent / remaining) and input fields for monthly budget
- Dashboard-style layout with data cards and forms inferred from feature set

## Decisions, constraints & rationale

- **Currency**: All money displayed in Indian Rupees (₹) throughout the app
  - Default monthly budget: ₹5,000
  - Food costs set to realistic Indian market prices (e.g., chicken breast ₹125/100g, rice ₹25/100g, eggs ₹8 each)
- **Tech stack**: Vite + React, JSX, Tailwind CSS, Lucide React — no extra UI/theme/icon packages unless requested
- **Imports**: Use `@/` path alias (maps to `src/`) instead of deep relative paths
- `.bolt/prompt` holds authoritative global instructions — refer there; do not restate

## Open questions & assumptions

- Assumed: target audience is Indian based on rupee conversion request
- Assumed: food prices reflect Indian market rates rather than direct USD→INR conversion
- Open: whether other locale elements (language, date formats, units) should localize for Indian users