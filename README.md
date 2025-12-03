# NutriPlan - AI-Driven Meal Planning App

A production-ready React Native mobile application for intelligent meal planning with personalized nutrition management. Built with Expo, Supabase, and Google Gemini AI.

![NutriPlan](https://img.shields.io/badge/NutriPlan-v1.0.0-green)
![React Native](https://img.shields.io/badge/React%20Native-Expo-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## Features

- **AI-Powered Meal Plans**: Generate personalized 7-day meal plans using Google Gemini AI
- **Nutrition Tracking**: Monitor daily calorie and macro intake with visual progress rings
- **Smart Recipes**: Browse, search, and save favorite recipes with detailed nutrition info
- **Auto Shopping Lists**: Automatically generated shopping lists from your meal plan
- **Progress Analytics**: Track your nutrition goals with weekly/monthly charts
- **Dietary Restrictions**: Support for allergies, preferences, and medical conditions
- **Personalized Targets**: BMR/TDEE-based nutrition calculations

## Tech Stack

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: Zustand
- **UI Components**: React Native Paper
- **Forms**: React Hook Form + Zod validation
- **Charts**: React Native Chart Kit

### Backend
- **Database & Auth**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth
- **Real-time**: Supabase subscriptions

### AI Integration
- **Primary**: Google Gemini API (Free tier)
- **Nutrition Data**: USDA FoodData Central API

## Design System

| Color | Hex | Usage |
|-------|-----|-------|
| Primary | `#2E7D32` | Main actions, headers |
| Secondary | `#66BB6A` | Secondary elements |
| Accent | `#81C784` | Highlights |
| Background | `#FFFFFF` | App background |
| Surface | `#F1F8E9` | Cards, inputs |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- Google Cloud account (for Gemini API)

### Installation

1. **Clone the repository**
   ```bash
   cd windsurf-project
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your API keys:
   - `EXPO_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `EXPO_PUBLIC_GEMINI_API_KEY`: Google Gemini API key
   - `EXPO_PUBLIC_USDA_API_KEY`: USDA FoodData Central API key

4. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema in `supabase-schema.sql`
   - Enable Google OAuth in Authentication settings

5. **Start the development server**
   ```bash
   npm start
   ```

6. **Run on device/simulator**
   - Press `a` for Android
   - Press `i` for iOS
   - Press `w` for web

## Project Structure

```
src/
├── components/
│   └── common/           # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── MealCard.tsx
│       ├── NutritionRing.tsx
│       ├── RecipeCard.tsx
│       └── LoadingOverlay.tsx
├── config/
│   ├── api.ts            # API configuration
│   └── supabase.ts       # Supabase client
├── constants/
│   └── theme.ts          # Design system
├── navigation/
│   ├── types.ts          # Navigation types
│   ├── AuthNavigator.tsx
│   ├── OnboardingNavigator.tsx
│   ├── MainTabNavigator.tsx
│   └── RootNavigator.tsx
├── screens/
│   ├── auth/             # Authentication screens
│   ├── onboarding/       # Onboarding flow
│   └── main/             # Main app screens
├── services/
│   ├── aiService.ts      # Gemini AI integration
│   └── nutritionService.ts # Nutrition calculations
├── store/
│   ├── authStore.ts      # Auth state
│   ├── mealPlanStore.ts  # Meal plan state
│   └── onboardingStore.ts # Onboarding state
└── types/
    └── database.ts       # TypeScript types
```

## API Keys Setup

### Google Gemini API
1. Go to [Google AI Studio](https://ai.google.dev/)
2. Create an API key
3. Free tier: 60 requests/minute

### Supabase
1. Create a project at [Supabase](https://supabase.com/)
2. Get your project URL and anon key from Settings > API
3. Enable Google OAuth in Authentication > Providers

### USDA FoodData Central
1. Register at [FoodData Central](https://fdc.nal.usda.gov/)
2. Request an API key (free)

## Key Features Implementation

### AI Meal Plan Generation
The app uses Google Gemini to generate personalized meal plans based on:
- User profile (age, gender, weight, height)
- Activity level and goals
- Dietary restrictions and allergies
- Food preferences and cuisines
- Cooking complexity and time preferences

### Nutrition Calculations
Uses the Mifflin-St Jeor equation for BMR calculation:
- **Men**: BMR = 10×weight + 6.25×height - 5×age + 5
- **Women**: BMR = 10×weight + 6.25×height - 5×age - 161

TDEE is calculated by multiplying BMR with activity factor.

### Shopping List Generation
Automatically extracts ingredients from the weekly meal plan:
- Aggregates quantities by ingredient
- Categorizes items (produce, protein, dairy, etc.)
- Supports check-off functionality

## Scripts

```bash
# Start development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on web
npm run web

# Run linting
npm run lint

# Type checking
npx tsc --noEmit
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Future Enhancements

- [ ] Meal prep mode with batch cooking suggestions
- [ ] Recipe scaling with auto-recalculated ingredients
- [ ] Barcode scanner for quick food logging
- [ ] Integration with fitness apps (Google Fit, Apple Health)
- [ ] AI chatbot for nutrition assistance
- [ ] Community recipe sharing
- [ ] Grocery delivery integration

## License

This project is licensed under the MIT License.

## Support

For support, email support@nutriplan.app or open an issue on GitHub.

---

Built with ❤️ using React Native and AI
