// Professional AI Service for NutriPlan - Real API Integration
// Using Groq AI for meal generation with smart rate limiting and retry

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Rate limiting state - increased delays for free tier
let lastApiCall = 0;
const MIN_DELAY_BETWEEN_CALLS = 5000; // 5 seconds between calls (increased)
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;
let rateLimitResetTime = 0;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Extract wait time from rate limit error
function extractWaitTime(errorMessage: string): number {
  const match = errorMessage.match(/try again in (\d+\.?\d*)s/i);
  if (match) {
    return Math.ceil(parseFloat(match[1]) * 1000) + 500; // Add 500ms buffer
  }
  return 5000; // Default 5 second wait
}

// Smart rate-limited retry with exponential backoff
async function rateLimitedCall<T>(
  fn: () => Promise<T>,
  useFallback: () => T,
  maxRetries: number = 2
): Promise<T> {
  // If too many failures, use fallback immediately
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    console.log('🔄 Using fallback due to consecutive API failures');
    // Reset after 30 seconds
    setTimeout(() => { consecutiveFailures = 0; }, 30000);
    return useFallback();
  }

  // Check if we're still in rate limit cooldown
  const now = Date.now();
  if (rateLimitResetTime > now) {
    const waitTime = rateLimitResetTime - now;
    console.log(`⏳ Rate limit cooldown: waiting ${Math.ceil(waitTime/1000)}s`);
    await sleep(waitTime);
  }

  // Ensure minimum delay between API calls
  const timeSinceLastCall = Date.now() - lastApiCall;
  if (timeSinceLastCall < MIN_DELAY_BETWEEN_CALLS) {
    const waitTime = MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
    console.log(`⏳ Rate limiting: waiting ${Math.ceil(waitTime/1000)}s before API call`);
    await sleep(waitTime);
  }

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      lastApiCall = Date.now();
      const result = await fn();
      consecutiveFailures = 0; // Reset on success
      return result;
    } catch (error: any) {
      lastError = error;
      const errorMsg = error.message || '';
      
      // Check if rate limited
      if (errorMsg.includes('rate_limit') || errorMsg.includes('429')) {
        const waitTime = extractWaitTime(errorMsg);
        rateLimitResetTime = Date.now() + waitTime;
        console.log(`⚠️ Rate limited. Waiting ${Math.ceil(waitTime/1000)}s before retry (attempt ${attempt + 1}/${maxRetries + 1})`);
        
        if (attempt < maxRetries) {
          await sleep(waitTime);
          continue;
        }
      }
      
      // Other errors - use exponential backoff
      if (attempt < maxRetries) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.log(`⚠️ API error, retrying in ${backoffTime/1000}s (attempt ${attempt + 1}/${maxRetries + 1})`);
        await sleep(backoffTime);
        continue;
      }
    }
  }
  
  consecutiveFailures++;
  console.log(`❌ API call failed after ${maxRetries + 1} attempts, using fallback`);
  return useFallback();
}

export interface UserProfile {
  name: string;
  age: number;
  gender: string;
  weight: number;
  height: number;
  goal: string;
  activityLevel: string;
  dietaryRestrictions: string[];
  allergies: string[];
  healthConditions: string[];
  calorieTarget: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
  sugar: number;
  ingredients: string[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  tags: string[];
  emoji: string;
  imageEmoji: string;
}

export interface DayPlan {
  date: string;
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
  snacks: Meal[];
}

class ProfessionalAIService {

  private async callGroq(prompt: string): Promise<string> {
    if (!GROQ_API_KEY) {
      console.error('Groq API key not configured');
      throw new Error('Groq API key not configured');
    }
    
    console.log('🤖 Calling Groq API...');
    
    const response = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { 
            role: 'system', 
            content: 'You are a nutritionist. Respond with ONLY valid JSON, no markdown or text.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1024, // Reduced from 2048 to save tokens
        top_p: 0.9,
      }),
    });

    console.log('Groq response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error response:', errorText);
      // Include error details in thrown error for rate limit handling
      throw new Error(`Groq API Error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;
    
    if (!text) {
      console.error('Empty response from Groq');
      throw new Error('Empty response from Groq');
    }
    
    console.log('✅ Groq API response received');
    return text;
  }

  private createPersonalizedPrompt(mealType: string, profile: UserProfile, additionalPrefs?: string): string {
    const conditions = profile.healthConditions.length > 0
      ? profile.healthConditions.join(', ')
      : '';

    const allergies = profile.allergies.length > 0 
      ? profile.allergies.join(', ') 
      : '';

    const targetCalories = this.getTargetCalories(mealType, profile);
    
    // Shortened prompt to reduce token usage
    const avoid = [conditions, allergies].filter(Boolean).join(', ') || 'none';

    return `Create a ${mealType} recipe. Goal: ${profile.goal}. Calories: ~${targetCalories}. Avoid: ${avoid}.${additionalPrefs ? ` Prefer: ${additionalPrefs}` : ''}

Return ONLY this JSON:
{"name":"Recipe Name","description":"Short description","calories":${targetCalories},"protein":${Math.round(targetCalories * 0.25 / 4)},"carbs":${Math.round(targetCalories * 0.45 / 4)},"fats":${Math.round(targetCalories * 0.30 / 9)},"fiber":5,"sugar":${Math.round(targetCalories * 0.05 / 4)},"ingredients":["ingredient 1","ingredient 2"],"instructions":["Step 1","Step 2"],"prepTime":15,"cookTime":20,"tags":["healthy"],"imageEmoji":"🍽️"}`;
  }

  private getTargetCalories(mealType: string, profile: UserProfile): number {
    const baseCalories = profile.calorieTarget;
    switch (mealType) {
      case 'breakfast': return Math.round(baseCalories * 0.25);
      case 'lunch': return Math.round(baseCalories * 0.30);
      case 'dinner': return Math.round(baseCalories * 0.35);
      case 'snack': return Math.round(baseCalories * 0.10);
      default: return 400;
    }
  }

  private parseMealResponse(text: string, mealType: string): Meal {
    console.log('Parsing meal response:', text);
    
    // Try multiple JSON extraction patterns
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // Try to find JSON between ```json and ```
      const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]];
      }
    }
    
    if (!jsonMatch) {
      console.error('No JSON found in response:', text);
      throw new Error('No valid JSON found in response');
    }
    
    try {
      const jsonStr = jsonMatch[0].trim();
      console.log('Attempting to parse JSON:', jsonStr);
      const meal = JSON.parse(jsonStr);
      
      // Validate required fields
      const requiredFields = ['name', 'description', 'calories', 'protein', 'carbs', 'fats', 'ingredients', 'instructions'];
      for (const field of requiredFields) {
        if (!meal[field]) throw new Error(`Missing required field: ${field}`);
      }
      
      return {
        ...meal,
        id: `meal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        mealType: mealType as any,
        fiber: meal.fiber || 5,
        sugar: meal.sugar || 0,
        prepTime: meal.prepTime || 10,
        cookTime: meal.cookTime || 15,
      tags: meal.tags || ['healthy'],
      emoji: meal.emoji || meal.imageEmoji || '🍽️',
      imageEmoji: meal.imageEmoji || meal.emoji || '🍽️',
      };
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text was:', text);
      throw new Error(`JSON Parse error: ${parseError}`);
    }
  }

  async generatePersonalizedMeal(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    profile: UserProfile,
    additionalPrefs?: string
  ): Promise<Meal> {
    const prompt = this.createPersonalizedPrompt(mealType, profile, additionalPrefs);
    
    // Use rate-limited API call with fallback
    return rateLimitedCall(
      async () => {
        const response = await this.callGroq(prompt);
        const meal = this.parseMealResponse(response, mealType);
        console.log('✅ Groq AI generated meal:', meal.name);
        return meal;
      },
      () => {
        console.log('Using fallback meal generation...');
        const fallbackMeal = this.generateFallbackMeal(mealType, profile);
        console.log('✅ Generated fallback meal:', fallbackMeal.name);
        return fallbackMeal;
      }
    );
  }

  private generateFallbackMeal(mealType: string, profile: UserProfile): Meal {
    const targetCalories = this.getTargetCalories(mealType, profile);
    
    // Multiple options per meal type for variety
    const mealOptions = {
      breakfast: [
        { name: 'Protein Oatmeal Bowl', description: 'Nutritious oatmeal with protein powder and fresh berries', emoji: '🥣', ingredients: ['1 cup rolled oats', '1 scoop protein powder', '1 cup almond milk', '1/2 cup berries', '1 tbsp honey'], instructions: ['Cook oats with almond milk', 'Stir in protein powder', 'Top with berries and honey'] },
        { name: 'Veggie Egg Scramble', description: 'Fluffy eggs with colorful vegetables and herbs', emoji: '🍳', ingredients: ['3 eggs', '1/2 cup spinach', '1/4 cup tomatoes', '1/4 cup mushrooms', '1 tbsp olive oil'], instructions: ['Sauté vegetables in olive oil', 'Add beaten eggs', 'Scramble until cooked', 'Season with herbs'] },
        { name: 'Avocado Toast Deluxe', description: 'Whole grain toast with creamy avocado and toppings', emoji: '🥑', ingredients: ['2 slices whole grain bread', '1 ripe avocado', '2 eggs', 'Cherry tomatoes', 'Everything bagel seasoning'], instructions: ['Toast bread until golden', 'Mash avocado and spread', 'Top with poached eggs', 'Add tomatoes and seasoning'] },
      ],
      lunch: [
        { name: 'Grilled Chicken Salad', description: 'Fresh salad with grilled chicken and colorful vegetables', emoji: '🥗', ingredients: ['150g chicken breast', '2 cups mixed greens', '1 cup cherry tomatoes', '1/2 avocado', '2 tbsp olive oil'], instructions: ['Grill chicken breast', 'Mix salad greens', 'Add tomatoes and avocado', 'Top with grilled chicken'] },
        { name: 'Quinoa Buddha Bowl', description: 'Nutritious bowl with quinoa, chickpeas, and roasted veggies', emoji: '🥙', ingredients: ['1 cup quinoa', '1/2 cup chickpeas', '1 cup roasted vegetables', '2 tbsp tahini', 'Lemon juice'], instructions: ['Cook quinoa', 'Roast vegetables', 'Arrange in bowl', 'Drizzle with tahini dressing'] },
        { name: 'Turkey Wrap', description: 'Lean turkey with fresh vegetables in a whole wheat wrap', emoji: '🌯', ingredients: ['100g turkey breast', '1 whole wheat wrap', 'Lettuce', 'Tomato', 'Hummus'], instructions: ['Spread hummus on wrap', 'Layer turkey and vegetables', 'Roll tightly', 'Cut in half'] },
      ],
      dinner: [
        { name: 'Baked Salmon with Veggies', description: 'Healthy baked salmon with roasted vegetables', emoji: '🐟', ingredients: ['200g salmon fillet', '1 cup broccoli', '1 cup carrots', '2 tbsp olive oil', '1 lemon'], instructions: ['Preheat oven to 375°F', 'Season salmon and vegetables', 'Bake for 20 minutes', 'Serve with lemon'] },
        { name: 'Grilled Chicken & Sweet Potato', description: 'Herb-marinated chicken with roasted sweet potato', emoji: '🍗', ingredients: ['150g chicken breast', '1 medium sweet potato', 'Green beans', 'Olive oil', 'Rosemary'], instructions: ['Marinate chicken with herbs', 'Cube and roast sweet potato', 'Grill chicken', 'Steam green beans'] },
        { name: 'Lean Beef Stir-Fry', description: 'Quick stir-fry with lean beef and colorful vegetables', emoji: '🥘', ingredients: ['150g lean beef', 'Bell peppers', 'Broccoli', 'Soy sauce', 'Ginger'], instructions: ['Slice beef thinly', 'Stir-fry vegetables', 'Add beef and sauce', 'Serve over brown rice'] },
      ],
      snack: [
        { name: 'Greek Yogurt Parfait', description: 'Creamy Greek yogurt with nuts and honey', emoji: '🥛', ingredients: ['1 cup Greek yogurt', '1/4 cup nuts', '1 tbsp honey', '1/2 banana'], instructions: ['Layer yogurt in a bowl', 'Add sliced banana', 'Top with nuts and honey'] },
        { name: 'Apple with Almond Butter', description: 'Crisp apple slices with creamy almond butter', emoji: '🍎', ingredients: ['1 medium apple', '2 tbsp almond butter', 'Cinnamon'], instructions: ['Slice apple', 'Serve with almond butter', 'Sprinkle with cinnamon'] },
        { name: 'Veggie Sticks & Hummus', description: 'Fresh vegetable sticks with creamy hummus', emoji: '🥕', ingredients: ['Carrots', 'Celery', 'Cucumber', '1/4 cup hummus'], instructions: ['Cut vegetables into sticks', 'Serve with hummus for dipping'] },
      ]
    };

    // Pick a random meal from the options for variety
    const options = mealOptions[mealType as keyof typeof mealOptions] || mealOptions.snack;
    const meal = options[Math.floor(Math.random() * options.length)];
    
    return {
      id: `fallback_${Date.now()}_${mealType}`,
      name: meal.name,
      description: meal.description,
      calories: targetCalories,
      protein: Math.round(targetCalories * 0.25 / 4),
      carbs: Math.round(targetCalories * 0.45 / 4),
      fats: Math.round(targetCalories * 0.30 / 9),
      fiber: Math.round(targetCalories * 0.05 / 4),
      ingredients: meal.ingredients,
      instructions: meal.instructions,
      prepTime: 15,
      cookTime: 20,
      mealType: mealType as any,
      tags: ['healthy', 'balanced'],
      emoji: meal.emoji,
      imageEmoji: meal.emoji,
    };
  }

  async generateDayPlan(profile: UserProfile): Promise<DayPlan> {
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    const meals = await Promise.allSettled(
      mealTypes.map(mealType => this.generatePersonalizedMeal(mealType, profile))
    );

    const results = meals.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Failed to generate ${mealTypes[index]}:`, result.reason);
        // Use fallback meal instead of throwing error
        return this.generateFallbackMeal(mealTypes[index], profile);
      }
    });

    return {
      date: new Date().toISOString().split('T')[0],
      breakfast: results[0],
      lunch: results[1],
      dinner: results[2],
      snacks: [results[3]],
    };
  }

  async getNutritionAdvice(profile: UserProfile, question: string): Promise<string> {
    const prompt = `As a professional nutritionist, provide personalized advice for this user:

USER PROFILE:
- ${profile.name}, ${profile.age} years old, ${profile.gender}
- Goal: ${profile.goal}
- Weight: ${profile.weight}kg, Height: ${profile.height}cm
- Activity Level: ${profile.activityLevel}
- Restrictions: ${profile.dietaryRestrictions.join(', ') || 'None'}
- Conditions: ${profile.healthConditions.join(', ') || 'None'}

QUESTION: ${question}

Provide concise, actionable advice (2-3 sentences max). Focus on evidence-based nutrition recommendations.`;

    return rateLimitedCall(
      async () => {
        const response = await this.callGroq(prompt);
        return response.trim();
      },
      () => 'Focus on balanced meals with lean proteins, vegetables, and whole grains for optimal health.'
    );
  }

  // Generate multiple recipes for a meal type based on user's health conditions
  async generateRecipesForUser(
    mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack',
    profile: UserProfile,
    count: number = 3
  ): Promise<Meal[]> {
    const diseases = profile.healthConditions.length > 0 
      ? profile.healthConditions.join(', ') 
      : 'general health';
    
    const prompt = `Generate ${count} unique ${mealType} recipes suitable for someone managing ${diseases}.

USER PROFILE:
- Age: ${profile.age}, Gender: ${profile.gender}
- Weight: ${profile.weight}kg, Height: ${profile.height}cm
- Goal: ${profile.goal}
- Allergies: ${profile.allergies.join(', ') || 'None'}
- Dietary Restrictions: ${profile.dietaryRestrictions.join(', ') || 'None'}

For each recipe, provide therapeutic benefits for ${diseases}.

CRITICAL: Respond with ONLY a JSON array. No text before or after.

[
  {
    "name": "Recipe Name",
    "description": "Brief description with health benefits",
    "calories": 350,
    "protein": 15,
    "carbs": 40,
    "fats": 12,
    "fiber": 5,
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["Step 1", "Step 2"],
    "prepTime": 10,
    "cookTime": 15,
    "tags": ["${diseases.split(',')[0]?.trim() || 'healthy'}", "nutritious"],
    "imageEmoji": "🥗",
    "healthBenefits": ["Benefit 1 for condition", "Benefit 2"]
  }
]`;

    return rateLimitedCall(
      async () => {
        const response = await this.callGroq(prompt);
        const recipes = this.parseRecipesResponse(response, mealType);
        return recipes;
      },
      () => {
        console.log('Using fallback recipes...');
        return [this.generateFallbackMeal(mealType, profile)];
      }
    );
  }

  private parseRecipesResponse(text: string, mealType: string): Meal[] {
    try {
      // Try to extract JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found');
      }
      
      const recipes = JSON.parse(jsonMatch[0]);
      
      return recipes.map((recipe: any, index: number) => ({
        id: `recipe_${mealType}_${Date.now()}_${index}`,
        name: recipe.name || 'Healthy Recipe',
        description: recipe.description || '',
        calories: recipe.calories || 300,
        protein: recipe.protein || 15,
        carbs: recipe.carbs || 30,
        fats: recipe.fats || 10,
        fiber: recipe.fiber || 5,
        ingredients: recipe.ingredients || [],
        instructions: recipe.instructions || [],
        prepTime: recipe.prepTime || 10,
        cookTime: recipe.cookTime || 15,
        mealType: mealType as any,
        tags: recipe.tags || ['healthy'],
        emoji: recipe.imageEmoji || '🍽️',
        imageEmoji: recipe.imageEmoji || '🍽️',
        healthBenefits: recipe.healthBenefits || [],
      }));
    } catch (error) {
      console.error('Failed to parse recipes:', error);
      return [];
    }
  }

  // Generate a complete set of recipes for all meal types
  async generateAllRecipesForUser(profile: UserProfile): Promise<Meal[]> {
    const mealTypes: Array<'breakfast' | 'lunch' | 'dinner' | 'snack'> = 
      ['breakfast', 'lunch', 'dinner', 'snack'];
    
    const allRecipes: Meal[] = [];
    
    for (const mealType of mealTypes) {
      try {
        const recipes = await this.generateRecipesForUser(mealType, profile, 2);
        allRecipes.push(...recipes);
      } catch (error) {
        console.error(`Failed to generate ${mealType} recipes:`, error);
        allRecipes.push(this.generateFallbackMeal(mealType, profile));
      }
    }
    
    return allRecipes;
  }

  // Health check for API availability
  async checkAPIHealth(): Promise<{ groq: boolean }> {
    const health = { groq: false };
    
    // Test Groq
    try {
      const testPrompt = 'Respond with "OK" only';
      await this.callGroq(testPrompt);
      health.groq = true;
    } catch (error) {
      console.warn('Groq API health check failed:', error);
    }
    
    return health;
  }
}

export const professionalAIService = new ProfessionalAIService();
