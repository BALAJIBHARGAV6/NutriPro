import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User } from '../types';
import { Meal, professionalAIService, UserProfile } from '../services/professionalAIService';
import { storageService } from '../services/storageService';
import { databaseService } from '../services/databaseService';
import { isSupabaseConfigured } from '../config/supabase';

interface RecipesListScreenProps {
  user: User;
  onRecipePress: (recipe: Meal) => void;
  onAddToMeals: (recipe: Meal) => void;
}

const RecipesListScreen: React.FC<RecipesListScreenProps> = ({
  user,
  onRecipePress,
  onAddToMeals,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [recipes, setRecipes] = useState<Meal[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Meal | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const filters = ['all', 'breakfast', 'lunch', 'snack', 'dinner'];

  // Convert User to UserProfile for AI service
  const getUserProfile = (): UserProfile => ({
    name: user.fullName || user.name || 'User',
    age: user.age,
    gender: user.gender,
    weight: user.weight,
    height: user.height,
    goal: user.healthGoals?.[0] || 'maintain',
    activityLevel: user.exerciseLevel,
    dietaryRestrictions: [],
    allergies: user.allergies || [],
    healthConditions: user.diseases || [],
    calorieTarget: calculateCalorieTarget(),
  });

  const calculateCalorieTarget = (): number => {
    const bmr = user.gender === 'male'
      ? 88.362 + (13.397 * user.weight) + (4.799 * user.height) - (5.677 * user.age)
      : 447.593 + (9.247 * user.weight) + (3.098 * user.height) - (4.330 * user.age);
    const multipliers: Record<string, number> = {
      sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
    };
    return Math.round(bmr * (multipliers[user.exerciseLevel] || 1.55));
  };

  const [myMeals, setMyMeals] = useState<Meal[]>([]);
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  // Define base recipes function first
  const getBaseRecipes = (): Meal[] => [
    // Breakfast Recipes
    {
      id: 'recipe_1',
      name: 'Oatmeal with Berries & Nuts',
      description: 'Heart-healthy oatmeal with antioxidant-rich berries',
      calories: 350, protein: 12, carbs: 45, fats: 14, fiber: 8,
      ingredients: ['1/2 cup rolled oats', '1 cup unsweetened almond milk', '1/4 cup mixed berries', '2 tbsp chopped almonds', '1 tsp honey', 'Pinch of cinnamon'],
      instructions: ['Boil almond milk in a pan', 'Add oats and cinnamon, stir', 'Cook for 5-7 minutes', 'Top with berries and almonds', 'Drizzle honey if desired'],
      prepTime: 5, cookTime: 10, mealType: 'breakfast',
      tags: ['diabetes', 'heart health', 'high-fiber'], emoji: '🥣', imageEmoji: '🥣',
    },
    {
      id: 'recipe_2',
      name: 'Vegetable Omelette',
      description: 'Protein-packed omelette with fresh vegetables',
      calories: 280, protein: 18, carbs: 8, fats: 20, fiber: 3,
      ingredients: ['2 eggs', '1/4 cup spinach', '1/4 cup bell peppers', '2 tbsp onion', '1 tbsp olive oil', 'Salt and pepper'],
      instructions: ['Beat eggs with salt and pepper', 'Heat oil in pan', 'Sauté vegetables', 'Pour eggs over vegetables', 'Cook until set, fold in half'],
      prepTime: 5, cookTime: 8, mealType: 'breakfast',
      tags: ['diabetes', 'weight loss', 'low-carb'], emoji: '🍳', imageEmoji: '🍳',
    },
    // Lunch Recipes
    {
      id: 'recipe_3',
      name: 'Grilled Chicken Salad',
      description: 'Fresh salad with grilled chicken and colorful vegetables',
      calories: 450, protein: 35, carbs: 20, fats: 25, fiber: 6,
      ingredients: ['150g chicken breast', '2 cups mixed greens', '1 cup cherry tomatoes', '1/2 avocado', '2 tbsp olive oil', '1 tbsp lemon juice'],
      instructions: ['Season and grill chicken breast', 'Mix salad greens in a bowl', 'Add sliced tomatoes and avocado', 'Slice chicken and place on top', 'Drizzle with olive oil and lemon'],
      prepTime: 10, cookTime: 15, mealType: 'lunch',
      tags: ['diabetes', 'hypertension', 'high-protein'], emoji: '🥗', imageEmoji: '🥗',
    },
    {
      id: 'recipe_4',
      name: 'Quinoa Buddha Bowl',
      description: 'Nutrient-dense bowl with quinoa and roasted vegetables',
      calories: 420, protein: 15, carbs: 55, fats: 18, fiber: 10,
      ingredients: ['1 cup cooked quinoa', '1 cup roasted chickpeas', '1 cup roasted vegetables', '1/4 cup hummus', '2 tbsp tahini', 'Fresh herbs'],
      instructions: ['Cook quinoa according to package', 'Roast chickpeas with spices', 'Roast vegetables of choice', 'Arrange in bowl', 'Top with hummus and tahini'],
      prepTime: 15, cookTime: 25, mealType: 'lunch',
      tags: ['heart health', 'vegan', 'high-fiber'], emoji: '🥙', imageEmoji: '🥙',
    },
    // Snack Recipes
    {
      id: 'recipe_5',
      name: 'Greek Yogurt with Almonds',
      description: 'Creamy Greek yogurt with crunchy almonds and honey',
      calories: 200, protein: 15, carbs: 18, fats: 8, fiber: 2,
      ingredients: ['1 cup Greek yogurt', '1/4 cup almonds', '1 tbsp honey', '1/2 banana'],
      instructions: ['Add yogurt to a bowl', 'Slice banana on top', 'Sprinkle almonds', 'Drizzle with honey'],
      prepTime: 3, cookTime: 0, mealType: 'snack',
      tags: ['diabetes', 'high-protein', 'quick'], emoji: '🥛', imageEmoji: '🥛',
    },
    {
      id: 'recipe_6',
      name: 'Hummus with Veggie Sticks',
      description: 'Creamy hummus with fresh vegetable sticks',
      calories: 180, protein: 8, carbs: 20, fats: 9, fiber: 5,
      ingredients: ['1/2 cup hummus', '1 carrot', '1 cucumber', '1 celery stalk', '1/2 bell pepper'],
      instructions: ['Cut vegetables into sticks', 'Arrange on a plate', 'Serve with hummus for dipping'],
      prepTime: 5, cookTime: 0, mealType: 'snack',
      tags: ['diabetes', 'heart health', 'vegan'], emoji: '🥕', imageEmoji: '🥕',
    },
    // Dinner Recipes
    {
      id: 'recipe_7',
      name: 'Baked Salmon with Vegetables',
      description: 'Omega-3 rich salmon with roasted seasonal vegetables',
      calories: 500, protein: 40, carbs: 25, fats: 28, fiber: 6,
      ingredients: ['200g salmon fillet', '1 cup broccoli', '1 cup carrots', '2 tbsp olive oil', '1 lemon', 'Fresh dill'],
      instructions: ['Preheat oven to 375°F', 'Season salmon with herbs', 'Arrange vegetables around salmon', 'Drizzle with olive oil', 'Bake for 20 minutes'],
      prepTime: 10, cookTime: 20, mealType: 'dinner',
      tags: ['diabetes', 'heart health', 'omega-3'], emoji: '🐟', imageEmoji: '🐟',
    },
    {
      id: 'recipe_8',
      name: 'Turkey Stir-Fry',
      description: 'Lean turkey with colorful stir-fried vegetables',
      calories: 380, protein: 35, carbs: 22, fats: 16, fiber: 5,
      ingredients: ['200g ground turkey', '2 cups mixed vegetables', '2 tbsp soy sauce', '1 tbsp sesame oil', '1 tsp ginger', '2 cloves garlic'],
      instructions: ['Heat sesame oil in wok', 'Cook turkey until browned', 'Add garlic and ginger', 'Add vegetables and stir-fry', 'Season with soy sauce'],
      prepTime: 10, cookTime: 15, mealType: 'dinner',
      tags: ['diabetes', 'weight loss', 'high-protein'], emoji: '🍲', imageEmoji: '🍲',
    },
  ];

  // Load recipes on mount - runs immediately
  useEffect(() => {
    const baseRecipes = getBaseRecipes();
    setRecipes(baseRecipes);
    console.log('✅ Loaded', baseRecipes.length, 'recipes');
    
    // Load user's added meals
    loadMyMeals();
  }, []);

  // Load user's added meals to show related recipes
  const loadMyMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      let meals: Meal[] = [];
      
      // Try Supabase first
      if (isSupabaseConfigured) {
        try {
          meals = await databaseService.getMyMeals(today);
          console.log('📥 Recipes: Loaded', meals.length, 'meals from Supabase');
        } catch (error) {
          meals = await storageService.getMyMealsToday(user.id);
        }
      } else {
        meals = await storageService.getMyMealsToday(user.id);
      }
      
      setMyMeals(meals);
    } catch (error) {
      console.error('Error loading my meals:', error);
    }
  };

  // Generate recipe variations based on a meal from My Meals
  const generateVariationsForMeal = async (meal: Meal) => {
    setGenerating(true);
    try {
      const profile = getUserProfile();
      const variations = await professionalAIService.generateRecipesForUser(
        meal.mealType,
        profile,
        3
      );
      
      if (variations.length > 0) {
        // Add variations with reference to original meal
        const variationsWithContext = variations.map(v => ({
          ...v,
          description: `Alternative way to cook ${meal.name}: ${v.description}`,
          tags: [...(v.tags || []), `variation-of-${meal.name.toLowerCase().replace(/\s+/g, '-')}`],
        }));
        setRecipes(prev => [...variationsWithContext, ...prev]);
        Alert.alert('Success', `Generated ${variations.length} cooking variations for "${meal.name}"!`);
      }
    } catch (error) {
      console.error('Error generating variations:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateAIRecipes = async () => {
    setGenerating(true);
    try {
      const profile = getUserProfile();
      
      // If user has added meals, generate variations for those
      if (myMeals.length > 0) {
        for (const meal of myMeals) {
          await generateVariationsForMeal(meal);
        }
      } else {
        // Otherwise generate general recipes
        const aiRecipes = await professionalAIService.generateAllRecipesForUser(profile);
        if (aiRecipes.length > 0) {
          setRecipes(aiRecipes);
        }
      }
    } catch (error) {
      console.error('Error generating AI recipes:', error);
      setRecipes(getBaseRecipes());
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = selectedFilter === 'all' || recipe.mealType === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleRecipePress = (recipe: Meal) => {
    Alert.alert('Opening Recipe', recipe.name);
    setSelectedRecipe(recipe);
    setShowRecipeModal(true);
  };

  const renderRecipeCard = (recipe: Meal) => (
    <TouchableOpacity
      key={recipe.id}
      style={styles.recipeCard}
      onPress={() => handleRecipePress(recipe)}
    >
      <Text style={styles.recipeEmoji}>{recipe.emoji || '🍽️'}</Text>
      <View style={styles.recipeInfo}>
        <Text style={styles.recipeName}>{recipe.name}</Text>
        <Text style={styles.recipeStats}>
          ⏱️ {recipe.prepTime + recipe.cookTime} min | {recipe.calories} cal
        </Text>
        <Text style={styles.recipeTags}>
          Good for: {recipe.tags?.slice(0, 2).join(', ')}
        </Text>
      </View>
      <Text style={styles.viewArrow}>→</Text>
    </TouchableOpacity>
  );

  const renderRecipeModal = () => {
    if (!selectedRecipe) return null;

    return (
      <Modal
        visible={showRecipeModal}
        animationType="slide"
        onRequestClose={() => setShowRecipeModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowRecipeModal(false)}>
                <Text style={styles.backButton}>← Back to Recipes</Text>
              </TouchableOpacity>
            </View>

            {/* Recipe Image */}
            <View style={styles.recipeImageContainer}>
              <Text style={styles.recipeImageEmoji}>{selectedRecipe.emoji}</Text>
            </View>

            {/* Recipe Title */}
            <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
            <Text style={styles.modalDescription}>{selectedRecipe.description}</Text>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Prep</Text>
                <Text style={styles.statValue}>{selectedRecipe.prepTime} min</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Cook</Text>
                <Text style={styles.statValue}>{selectedRecipe.cookTime} min</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Calories</Text>
                <Text style={styles.statValue}>{selectedRecipe.calories}</Text>
              </View>
            </View>

            {/* Nutrition */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Nutrition</Text>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionItem}>Protein: {selectedRecipe.protein}g</Text>
                <Text style={styles.nutritionItem}>Carbs: {selectedRecipe.carbs}g</Text>
                <Text style={styles.nutritionItem}>Fats: {selectedRecipe.fats}g</Text>
              </View>
            </View>

            {/* Health Benefits */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ Health Benefits</Text>
              {selectedRecipe.tags?.map((tag, index) => (
                <Text key={index} style={styles.benefitItem}>• Good for {tag}</Text>
              ))}
            </View>

            {/* Ingredients */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛒 Ingredients</Text>
              {selectedRecipe.ingredients.map((ingredient, index) => (
                <Text key={index} style={styles.ingredientItem}>• {ingredient}</Text>
              ))}
            </View>

            {/* Instructions */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>👨‍🍳 Cooking Instructions</Text>
              {selectedRecipe.instructions.map((step, index) => (
                <Text key={index} style={styles.instructionItem}>
                  Step {index + 1}: {step}
                </Text>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.addToMealsBtn}
                onPress={() => {
                  onAddToMeals(selectedRecipe);
                  setShowRecipeModal(false);
                }}
              >
                <Text style={styles.addToMealsBtnText}>Add to My Meals</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📖 RECIPES</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>
            {generating ? 'Generating personalized recipes with AI...' : 'Loading recipes...'}
          </Text>
          {user.diseases && user.diseases.length > 0 && (
            <Text style={styles.loadingSubtext}>
              Customizing for: {user.diseases.join(', ')}
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>📖 RECIPES</Text>
          <TouchableOpacity 
            style={styles.generateBtn}
            onPress={generateAIRecipes}
            disabled={generating}
          >
            <Text style={styles.generateBtnText}>
              {generating ? '⏳' : '🤖 Generate New'}
            </Text>
          </TouchableOpacity>
        </View>
        {user.diseases && user.diseases.length > 0 && (
          <Text style={styles.headerSubtitle}>
            Personalized for: {user.diseases.slice(0, 2).join(', ')}
          </Text>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search recipes..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {filters.map(filter => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, selectedFilter === filter && styles.filterButtonActive]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recipe List - All in one ScrollView */}
      <ScrollView style={styles.recipeList}>
        {/* My Meals Section - Same style as other recipes */}
        {myMeals.length > 0 && (
          <View>
            <Text style={styles.mealTypeHeader}>⭐ YOUR MEALS</Text>
            {myMeals.map(meal => (
              <TouchableOpacity
                key={meal.id}
                style={styles.recipeCard}
                onPress={() => handleRecipePress(meal)}
              >
                <Text style={styles.recipeEmoji}>{meal.emoji || meal.imageEmoji || '🍽️'}</Text>
                <View style={styles.recipeInfo}>
                  <Text style={styles.recipeName}>{meal.name}</Text>
                  <Text style={styles.recipeStats}>
                    ⏱️ {(meal.prepTime || 0) + (meal.cookTime || 0)} min | {meal.calories} cal
                  </Text>
                  <Text style={styles.recipeTags}>
                    {meal.mealType?.toUpperCase()} • Tap for full recipe
                  </Text>
                </View>
                <Text style={styles.viewArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Other Recipes */}
        {filteredRecipes.length === 0 && myMeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No recipes found</Text>
            <TouchableOpacity style={styles.generateNewBtn} onPress={generateAIRecipes}>
              <Text style={styles.generateNewBtnText}>🤖 Generate AI Recipes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          ['breakfast', 'lunch', 'snack', 'dinner'].map(mealType => {
            const mealRecipes = filteredRecipes.filter(r => r.mealType === mealType);
            if (mealRecipes.length === 0) return null;

            return (
              <View key={mealType}>
                <Text style={styles.mealTypeHeader}>
                  {mealType === 'breakfast' && '🍳'} 
                  {mealType === 'lunch' && '🍱'} 
                  {mealType === 'snack' && '🍎'} 
                  {mealType === 'dinner' && '🍽️'} 
                  {' '}{mealType.toUpperCase()} RECIPES
                </Text>
                {mealRecipes.map(renderRecipeCard)}
              </View>
            );
          })
        )}
      </ScrollView>

      {renderRecipeModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    padding: 16,
    backgroundColor: '#84C225',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchInput: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterButtonActive: {
    backgroundColor: '#84C225',
  },
  filterText: {
    color: '#666',
    fontWeight: '500',
  },
  filterTextActive: {
    color: 'white',
  },
  recipeList: {
    flex: 1,
    padding: 16,
  },
  mealTypeHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recipeEmoji: {
    fontSize: 40,
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recipeStats: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  recipeTags: {
    fontSize: 12,
    color: '#84C225',
  },
  viewArrow: {
    fontSize: 20,
    color: '#84C225',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalScroll: {
    flex: 1,
  },
  modalHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    fontSize: 16,
    color: '#84C225',
  },
  recipeImageContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F5F5',
  },
  recipeImageEmoji: {
    fontSize: 80,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#666',
    paddingHorizontal: 16,
    marginTop: 8,
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginTop: 16,
    backgroundColor: '#F5F5F5',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nutritionItem: {
    fontSize: 14,
    color: '#666',
  },
  benefitItem: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  instructionItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  actionButtons: {
    padding: 16,
    paddingBottom: 32,
  },
  addToMealsBtn: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
  },
  addToMealsBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // New styles for AI integration
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#2E7D32',
    textAlign: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#C8E6C9',
    marginTop: 4,
  },
  generateBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  generateBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  generateNewBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  generateNewBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // My Meals section styles
  myMealsSection: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    marginBottom: 8,
  },
  myMealsSectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 4,
  },
  myMealsSectionSubtext: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  myMealChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myMealChipEmoji: {
    fontSize: 20,
    marginRight: 6,
  },
  myMealChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    maxWidth: 100,
  },
  myMealChipAction: {
    fontSize: 14,
    marginLeft: 6,
  },
  // Full Recipe Card Styles
  fullRecipeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fullRecipeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fullRecipeEmoji: {
    fontSize: 48,
    marginRight: 12,
  },
  fullRecipeHeaderInfo: {
    flex: 1,
  },
  fullRecipeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  fullRecipeType: {
    fontSize: 12,
    color: '#2E7D32',
    fontWeight: '600',
    marginTop: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  fullRecipeDesc: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  fullRecipeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  fullStatItem: {
    alignItems: 'center',
  },
  fullStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  fullStatLabel: {
    fontSize: 10,
    color: '#888',
    marginTop: 2,
  },
  recipeDetailSection: {
    marginBottom: 16,
  },
  recipeDetailTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  fullIngredientItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 4,
    paddingLeft: 8,
  },
  instructionRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2E7D32',
    color: 'white',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: 'bold',
    marginRight: 10,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  variationsButton: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  variationsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  // Expandable card styles
  mealCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  mealCardCalories: {
    fontSize: 12,
    color: '#666',
  },
  expandIcon: {
    fontSize: 16,
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  expandedContent: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 16,
  },
});

export default RecipesListScreen;
