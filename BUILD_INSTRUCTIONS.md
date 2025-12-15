# 📱 Build APK Instructions for NutriPro App

## ✅ Pre-Build Checklist

### 1. Run Database Migration (REQUIRED)
Open your Supabase SQL Editor and run:
```sql
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS avatar_type INTEGER DEFAULT 1;
```

### 2. Verify Environment Variables
Check your `.env` file has all required keys:
- ✅ EXPO_PUBLIC_SUPABASE_URL
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY
- ✅ EXPO_PUBLIC_GROQ_API_KEY
- ✅ EXPO_PUBLIC_GEMINI_API_KEY
- ✅ EXPO_PUBLIC_USDA_API_KEY

## 🏗️ Build Options

### Option 1: EAS Build (Recommended - Cloud Build)

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
eas login
```

#### Step 3: Configure Project
```bash
eas build:configure
```

#### Step 4: Build APK
```bash
# Build APK for Android
eas build --platform android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud
- Give you a download link when done (takes 10-20 mins)

### Option 2: Local Build with Expo

#### Step 1: Build locally
```bash
npx expo export --platform android
```

#### Step 2: Generate APK
```bash
npx expo build:android
```

### Option 3: Quick APK for Testing (Fastest)

Use Expo Go app:
1. Install "Expo Go" on your friends' phones from Play Store
2. Share your development URL from `npm start`
3. They scan QR code to test the app

## 📦 After Building

### For EAS Build:
1. Wait for build to complete
2. Download APK from the provided link
3. Share APK file with friends
4. Friends need to enable "Install from Unknown Sources" in Android settings

### File Size:
Expected APK size: 40-60 MB

## 🚨 Common Issues

### "eas: command not found"
```bash
npm install -g eas-cli
```

### Build fails with "No credentials"
```bash
eas credentials
```
Follow prompts to set up Android keystore

### Environment variables not found
Make sure `.env` file is in project root and all values are set

## 📝 Notes

- First build takes longer (15-20 mins)
- Subsequent builds are faster (5-10 mins)
- APK is unsigned for testing (friends will see security warning)
- For Play Store release, use production build profile

## 🎯 Quick Start Command

```bash
# Complete build process
eas build --platform android --profile preview
```

That's it! The APK will be ready to share. 🎉
