# 🥗 NutriPro - AI-Powered Personalized Nutrition Tracker

**Your Personal AI Nutritionist in Your Pocket**

NutriPro is a revolutionary mobile nutrition tracking app that combines cutting-edge AI technology with personalized health insights to transform how you manage your diet and wellness journey.

---

## 📋 Table of Contents

- [The Problem We Solve](#-the-problem-we-solve)
- [What Makes NutriPro Unique](#-what-makes-nutripro-unique)
- [Technology Stack](#-technology-stack)
- [Key Features](#-key-features)
- [Screen-by-Screen Walkthrough](#-screen-by-screen-walkthrough)
- [AI Integration](#-ai-integration)
- [Database Architecture](#-database-architecture)
- [Installation & Setup](#-installation--setup)
- [Building for Production](#-building-for-production)
- [Future Roadmap](#-future-roadmap)

---

## 🎯 The Problem We Solve

**The Challenge:**
Most nutrition apps offer generic meal suggestions that don't consider individual health conditions, dietary restrictions, or personal preferences. Users struggle with:

- **Generic meal plans** that don't account for diabetes, hypertension, or other health conditions
- **Ignoring allergies** - dangerous recommendations that include allergens
- **Time-consuming manual entry** - typing every ingredient and macro
- **No intelligence** - apps that can't learn or adapt to your needs
- **Complexity overload** - too many features, confusing interfaces
- **Outdated data** - no real-time sync across devices

**Our Solution:**
NutriPro uses advanced AI (LLaMA 3.3 70B Versatile via Groq) to generate **personalized, health-aware meal recommendations** in seconds. Every suggestion considers your:
- ✅ Health conditions (diabetes, hypertension, PCOS, etc.)
- ✅ Dietary restrictions (vegetarian, vegan, gluten-free, etc.)
- ✅ Allergies (nuts, dairy, shellfish, etc.)
- ✅ Daily calorie and macro goals
- ✅ Taste preferences and eating habits

---

## 🌟 What Makes NutriPro Unique

### 1. **AI-Powered Meal Generation**
- **Instant Suggestions**: Generate 4 personalized meal ideas in under 10 seconds
- **Health-Condition Aware**: AI considers your diabetes, hypertension, or other conditions
- **Allergen-Free**: Never suggests meals with your specified allergens
- **Nutritionally Balanced**: Every meal includes accurate macros (protein, carbs, fats)
- **Creative Variety**: From "Avocado Poached Egg Toast" to "Baked Cod with Quinoa"

### 2. **Smart Weekly Meal Planning**
- **7-Day Overview**: See your entire week's nutrition at a glance
- **Drag-and-Drop Scheduling**: Move meals between days effortlessly
- **Auto-Fill Intelligence**: AI generates missing meals to meet your goals
- **Visual Progress**: Color-coded indicators show macro balance

### 3. **Offline-First Architecture**
- **Works Without Internet**: All core features function offline
- **Auto-Sync**: Seamlessly syncs when connection returns
- **Local Caching**: Lightning-fast performance with AsyncStorage
- **Zero Data Loss**: Never lose a logged meal or exercise

### 4. **Professional Medical-Grade Design**
- **Clean, Modern UI**: Inspired by Apple Health and MyFitnessPal
- **Accessibility**: High contrast, readable fonts, intuitive navigation
- **Data Visualization**: Animated nutrition rings show daily progress
- **Consistent Experience**: Same look and feel across all screens

### 5. **Comprehensive Exercise Tracking**
- **Library of 200+ Exercises**: Cardio, strength, flexibility, sports
- **Intensity Levels**: Track Low, Moderate, or High intensity
- **Calorie Burn Calculations**: Automatic estimates based on duration
- **Exercise History**: View trends and patterns over time

### 6. **Recipe Intelligence**
- **Saved Recipe Library**: Bookmark your favorite AI-generated meals
- **Detailed Instructions**: Step-by-step cooking guidance
- **Ingredient Lists**: Complete with quantities and alternatives
- **Prep & Cook Times**: Plan your meal preparation efficiently

### 7. **Adaptive User Profiles**
- **12 Avatar Styles**: Personalized DiceBear avatars (Female Variant, Retro, Lorelei, etc.)
- **Dynamic Calculations**: BMI, BMR, TDEE auto-computed
- **Goal Tracking**: Weight loss, maintenance, or muscle gain
- **Health Condition Management**: Update conditions anytime

---

## 🛠️ Technology Stack

### **Frontend**
- **React Native 0.76.5**: Cross-platform mobile framework
- **Expo SDK 54**: Development and build tooling
- **TypeScript 5.3.3**: Type-safe development
- **React Navigation 7.4.1**: Screen navigation and routing
- **Expo Router 4.1.1**: File-based routing system
- **React Native SVG 15.15.1**: Vector graphics for icons
- **React Native Gesture Handler 2.29.1**: Touch interactions

### **Backend & Database**
- **Supabase PostgreSQL**: Real-time database with Row Level Security
- **Supabase Auth**: Email/password authentication
- **@supabase/supabase-js 2.48.1**: JavaScript client library
- **AsyncStorage**: Local persistent storage for offline support

### **AI & External APIs**
- **Groq API (Primary)**: LLaMA 3.3 70B Versatile model for meal generation
- **Google Gemini API (Fallback)**: Backup AI service for reliability
- **Rate Limiting**: 5-second delays between API calls to prevent rate limits
- **Exponential Backoff**: Retry logic with increasing delays (5s, 10s, 15s)

### **UI Components & Styling**
- **Custom Component Library**: Reusable Button, Card, Input, MealCard, RecipeCard
- **Expo Linear Gradient 15.0.7**: Gradient backgrounds
- **NutritionRing Component**: Animated SVG progress rings
- **Professional Theme System**: Consistent colors, typography, spacing

### **State Management**
- **Zustand**: Lightweight state management
  - `authStore`: User authentication state
  - `mealPlanStore`: Weekly meal planning state
  - `onboardingStore`: User profile and preferences
- **React Hooks**: Custom hooks like `useAppState` for lifecycle management

### **Avatar System**
- **DiceBear Avataaars Collection**: 12 professional avatar styles
- **Persistent Selection**: Avatar choice saved in user profile
- **Dynamic URLs**: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}&style=${avatarType}`

### **Development Tools**
- **EAS Build**: Expo Application Services for APK/IPA builds
- **ESLint**: Code linting and quality checks
- **Prettier**: Code formatting (configured but not enforced)
- **Git**: Version control with GitHub integration

---

## 🎨 Key Features

### **Dashboard (Home Screen)**
- **Today's Nutrition Summary**: Calories, protein, carbs, fats with progress rings
- **Weekly Meal Plan**: 7-day calendar view with meal counts per day
- **My Meals Section**: Today's logged meals with quick edit/delete
- **AI Suggestions**: 4 personalized meal recommendations with "Add to Today" button
- **Quick Actions**: Fast access to "Add Meal", "Generate More", "View Recipes"

### **Meal Tracker**
- **Daily Log**: All meals for selected date with nutritional breakdown
- **Quick Add**: Add saved recipes or generate new meals
- **Macro Summary**: Total calories, protein, carbs, fats for the day
- **Meal Details Modal**: View full recipe, ingredients, cooking instructions
- **Edit/Delete**: Modify or remove logged meals

### **AI Meal Generator**
- **Smart Prompts**: "Suggest a breakfast for weight loss" or "Low-carb dinner ideas"
- **Health Filters**: Automatically applies your health conditions and allergies
- **Instant Results**: 4 unique meal ideas in under 10 seconds
- **One-Tap Add**: Add generated meals directly to today or any day
- **Save for Later**: Bookmark meals to your recipe library

### **Recipe Library**
- **Saved Meals**: All your bookmarked AI-generated recipes
- **Search & Filter**: Find recipes by name, tags, or macros
- **Detailed View**: Ingredients, instructions, prep time, cook time
- **Macro Badges**: Visual indicators for calories, protein, carbs, fats
- **Quick Actions**: Cook now, share, or delete recipes

### **Exercise Tracker**
- **200+ Exercise Library**: Pre-loaded with common exercises
- **Custom Exercises**: Add your own activities
- **Intensity Tracking**: Low, Moderate, High intensity levels
- **Duration Logging**: Track minutes or hours
- **Calorie Burn**: Automatic estimation based on exercise type and duration
- **Exercise History**: View past workouts by date

### **User Profile**
- **Avatar Customization**: 12 unique avatar styles to choose from
- **Health Metrics**: Weight, height, age, BMI, BMR, TDEE
- **Health Conditions**: Diabetes, Hypertension, PCOS, Thyroid, Heart Disease, etc.
- **Dietary Restrictions**: Vegetarian, Vegan, Gluten-Free, Lactose-Free, etc.
- **Allergies**: Nuts, Dairy, Eggs, Shellfish, Soy, Wheat, Fish
- **Goal Setting**: Weight loss, maintenance, or muscle gain
- **Account Management**: Email visibility, sign out

---

## 📱 Screen-by-Screen Walkthrough

### 1. **Welcome Screen**
- **Purpose**: First screen users see when opening the app
- **Features**:
  - Animated gradient background (emerald green theme)
  - App logo and tagline: "Your Personal AI Nutritionist"
  - Two action buttons: "Sign In" and "Get Started"
  - Professional onboarding flow
- **Navigation**: Routes to SignInScreen or OnboardingScreen

### 2. **Sign In Screen**
- **Purpose**: User authentication
- **Features**:
  - Email and password input fields
  - "Remember Me" toggle
  - "Forgot Password?" link
  - "Sign In" button with loading state
  - "Don't have an account? Sign Up" link
  - Input validation with error messages
  - Supabase authentication integration
- **Success Flow**: Navigates to DashboardScreen after successful login

### 3. **Onboarding Screen**
- **Purpose**: Collect user profile information for personalization
- **Features**:
  - **Step 1 - Basic Info**: Full name, email, password, age, gender, activity level
  - **Step 2 - Health Info**: Weight, height, goal, health conditions (multi-select)
  - **Step 3 - Dietary Preferences**: Dietary restrictions, allergies (multi-select)
  - **Step 4 - Avatar Selection**: 12 professional avatar styles with preview
  - **Progress Indicator**: Shows current step (1/4, 2/4, etc.)
  - **Navigation**: Back and Continue buttons
  - **Validation**: Each step validates inputs before proceeding
- **Success Flow**: Creates user account, saves profile to Supabase, navigates to Dashboard

### 4. **Dashboard Screen** (1131 lines)
- **Purpose**: Main home screen showing daily nutrition overview
- **Features**:
  - **Header**: Welcome message with current date and profile avatar
  - **Nutrition Rings Section**: 4 animated SVG rings (calories, protein, carbs, fats)
  - **Weekly Meal Plan Component**: 7-day horizontal scroll view with meal counts
  - **My Meals Section**: Today's logged meals with quick actions
  - **AI Suggestions Section**: 4 AI-generated meal recommendations
  - **Quick Action Buttons**: Add Meal, Generate AI Meal, View Recipes, Log Exercise
- **Data Flow**: Loads user profile, fetches meals from Supabase, generates AI suggestions
- **Navigation**: Tapping profile → ProfileScreen, meal card → MealDetailModal, day → MealsTrackerScreen

### 5. **Meals Tracker Screen**
- **Purpose**: View and manage meals for a specific date
- **Features**:
  - **Date Selector**: Horizontal calendar scroll with previous/next day navigation
  - **Meal List**: Grouped by meal type (Breakfast, Lunch, Dinner, Snack)
  - **Daily Summary Card**: Total calories and macro breakdown
  - **Add Meal Options**: Search recipes, generate with AI, create custom
  - **Modals**: AI Generate Modal, Meal Detail Modal, Edit Meal Modal
- **Data Flow**: Fetches meals for selected date, calculates daily totals, syncs changes
- **Smart Features**: Auto-save on edit, undo delete (5-second window), duplicate meal

### 6. **Recipe Library Screen**
- **Purpose**: Browse and manage saved recipes
- **Features**:
  - **Search Bar**: Filter recipes by name or ingredients
  - **Tag Filters**: Healthy, Low-Carb, High-Protein, Vegan, etc.
  - **Sort Options**: By date saved, calories, protein content
  - **Recipe Cards**: Large thumbnail, macro badges, prep/cook time
  - **Bulk Actions**: Select multiple recipes, delete selected
- **Data Flow**: Loads saved recipes from Supabase, filters and sorts locally
- **Navigation**: Tapping recipe card → Recipe Detail Screen, "Cook This" → adds to today

### 7. **Exercise Tracker Screen**
- **Purpose**: Log and track physical activities
- **Features**:
  - **Exercise Library**: 200+ pre-loaded exercises with categories
  - **Log Exercise Form**: Type, duration, intensity, calorie burn, date picker
  - **Exercise History**: List of recent exercises grouped by date
  - **Statistics Dashboard**: Total calories burned, most frequent exercise, streak counter
- **Calorie Burn Calculation**: Uses MET values (Calories = MET × weight × duration)
- **Data Flow**: Saves to Supabase, updates daily calorie goal dynamically

### 8. **Profile Screen**
- **Purpose**: View and edit user profile and settings
- **Features**:
  - **Avatar Section**: Large display with "Change Avatar" button (12 styles)
  - **Personal Information**: Name, email, age, gender, weight, height (editable)
  - **Health Metrics**: BMI, BMR, TDEE (auto-calculated)
  - **Health Conditions**: Editable with multi-select modal
  - **Dietary Restrictions**: Editable with multi-select modal
  - **Allergies**: Editable with warning icon
  - **Settings**: Notification preferences, dark mode toggle, units
  - **Account Actions**: Change Password, Delete Account, Sign Out
- **Data Flow**: Loads profile from Supabase, updates on save, triggers AI meal regeneration
- **Validation**: Weight (20-300 kg), Height (100-250 cm), Age (13-120 years)

---

## 🤖 AI Integration

### **Primary AI Service: Groq (LLaMA 3.3 70B Versatile)**

**Why Groq?**
- **Speed**: 10-20x faster than traditional cloud AI (2-3 second responses)
- **Cost-Effective**: Free tier includes 6,000 tokens per minute
- **Accuracy**: LLaMA 3.3 70B optimized for structured output (JSON responses)
- **Reliability**: 99.5% uptime with automatic failover

**Rate Limiting Strategy**:
- **Problem**: Groq has a limit of 30 requests per minute (free tier)
- **Solution**: 5-second delay between API calls (max 12 requests per minute)
- **Implementation**: Enforce delay using timestamps and promises

**Error Handling & Fallback**:
- **Primary**: Try Groq API with exponential backoff (5s, 10s, 15s delays)
- **Fallback**: If Groq fails 3 times, switch to Google Gemini API
- **Offline**: If no internet, return cached meals from AsyncStorage
- **Last Resort**: Show error message with "Retry" button

**AI Prompt Engineering Best Practices**:
1. **Be Specific**: "Generate a breakfast for weight loss" is better than "Suggest a meal"
2. **Include Context**: Always pass health conditions, allergies, dietary restrictions
3. **Enforce JSON**: Use system prompt to demand valid JSON format
4. **Set Constraints**: Specify calorie ranges, macro ratios
5. **Use Examples**: Include sample output in system prompt to guide AI
6. **Validate Output**: Always check JSON structure and macro calculations

---

## 🗄️ Database Architecture

### **Supabase PostgreSQL Schema**

**Why Supabase?**
- **Real-time Sync**: Automatic updates across devices
- **Row Level Security (RLS)**: Users can only access their own data
- **Built-in Authentication**: No need to build auth from scratch
- **PostgREST API**: Auto-generated REST endpoints
- **Free Tier**: 500MB database, 2GB bandwidth per month

### **Table Structure** (7 Tables)

1. **`users` Table** (Supabase Auth) - Managed by Supabase Auth
2. **`user_profiles` Table** - User profile data (name, age, weight, height, goals)
3. **`health_conditions` Table** - User health conditions (diabetes, hypertension, etc.)
4. **`dietary_restrictions` Table** - Dietary restrictions and allergies
5. **`daily_logs` Table** - Daily meal logs with nutritional data
6. **`saved_recipes` Table** - Saved AI-generated recipes
7. **`exercise_logs` Table** - Exercise activity logs

**Database Relationships**:
```
auth.users (Supabase)
  └── user_profiles (1:1)
      ├── health_conditions (1:N)
      ├── dietary_restrictions (1:N)
      ├── daily_logs (1:N)
      ├── saved_recipes (1:N)
      └── exercise_logs (1:N)
```

**SQL Setup Script**: The complete schema is available in [`supabase-schema.sql`](supabase-schema.sql). Run this in your Supabase SQL editor to set up all tables and RLS policies.

---

## 📦 Installation & Setup

### **Prerequisites**
- Node.js 18+ and npm/yarn
- Expo CLI (`npm install -g expo-cli`)
- Supabase account (free tier)
- Groq API key (free at [console.groq.com](https://console.groq.com))
- Google Gemini API key (optional, for fallback)

### **Step 1: Clone the Repository**
```bash
git clone https://github.com/your-username/nutripro-app.git
cd nutripro-app
```

### **Step 2: Install Dependencies**
```bash
npm install
```

### **Step 3: Set Up Supabase**
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the project URL and anon key from **Settings → API**
3. In the SQL Editor, run the complete schema from [`supabase-schema.sql`](supabase-schema.sql)
4. Enable Row Level Security (RLS) on all tables (should be auto-enabled by the script)

### **Step 4: Configure Environment Variables**
Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GROQ_API_KEY=gsk_your-groq-api-key-here
EXPO_PUBLIC_GEMINI_API_KEY=your-gemini-api-key-here
```

**IMPORTANT**: The `.env` file is in `.gitignore` but is included in EAS builds via `.easignore`. Never commit `.env` to Git.

### **Step 5: Run the App**
```bash
# Start the development server
npm start

# Or use Expo Go on your phone
npm start -- --tunnel

# Or run on Android emulator/device
npm run android

# Or run on iOS simulator (Mac only)
npm run ios
```

### **Step 6: Test the App**
1. Open Expo Go on your phone and scan the QR code
2. Sign up with a new account
3. Complete the onboarding flow (4 steps)
4. Generate your first AI meal suggestions
5. Log a meal and verify it syncs to Supabase

---

## 🚀 Building for Production

### **APK Build (Android)**

#### **Method 1: EAS Build (Recommended)**

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure EAS** (already done in this project):
   - [`eas.json`](eas.json) contains build profiles
   - Preview profile configured for internal APK distribution

4. **Build APK with Cache Cleared**:
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

5. **Download APK**:
   - Build URL will be displayed in the terminal
   - Or go to [expo.dev/accounts/your-username/projects/nutripro-app/builds](https://expo.dev)
   - Download the APK and install on your Android device

**CRITICAL**: The `.easignore` file is configured to include `.env` in the build. This ensures Supabase credentials are packaged with the APK. Without this, the app will run in "demo mode" with no database connection.

#### **Method 2: Local Build (Not Recommended)**

EAS Build is strongly recommended. Local builds with `expo build:android` are deprecated and may not work correctly.

### **IPA Build (iOS)**

```bash
eas build --platform ios --profile preview
```

Note: iOS builds require an Apple Developer account ($99/year).

### **Build Configuration**

The `.easignore` file ensures `.env` is included in builds while keeping it out of Git.

---

## 🛣️ Future Roadmap (2025)

### **Q1 2025 - AI Enhancements**
- [ ] **Image Recognition**: Take a photo of your meal, AI identifies food and calculates macros
- [ ] **Voice Commands**: "Generate a breakfast for 400 calories" via Siri/Google Assistant
- [ ] **Smart Grocery Lists**: Auto-generate shopping lists from weekly meal plan
- [ ] **Recipe Scaling**: Automatically adjust ingredient quantities for servings

### **Q2 2025 - Social Features**
- [ ] **Friend Challenges**: Compete with friends on nutrition goals
- [ ] **Recipe Sharing**: Share your favorite AI-generated meals with the community
- [ ] **Meal Plans Marketplace**: Buy/sell complete 7-day meal plans
- [ ] **Nutrition Coach Matching**: Connect with certified dietitians

### **Q3 2025 - Integrations**
- [ ] **Fitness Tracker Sync**: Apple Health, Google Fit, Fitbit, Garmin
- [ ] **Grocery Delivery**: Order ingredients directly from Instacart, Amazon Fresh
- [ ] **Restaurant Integration**: Find healthy options at nearby restaurants
- [ ] **Meal Kit Services**: One-click order from HelloFresh, Blue Apron

### **Q4 2025 - Advanced Analytics**
- [ ] **Trend Analysis**: Visualize nutrition trends over weeks/months/years
- [ ] **Predictive Insights**: AI predicts when you'll hit your weight goal
- [ ] **Health Correlations**: Discover how meals affect your energy, mood, sleep
- [ ] **Progress Reports**: Weekly PDF summaries to share with your doctor

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 📧 Support

For questions or issues:
- **Email**: support@nutripro.app
- **GitHub Issues**: [github.com/your-username/nutripro-app/issues](https://github.com/your-username/nutripro-app/issues)

---

**Built with ❤️ by the NutriPro Team | 2024-2025**

*Transforming nutrition tracking, one AI-generated meal at a time.* 🥗🤖
