import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Animated,
  Modal,
  TextInput,
  Keyboard,
  InputAccessoryView,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Plus, Apple, Barcode, Camera, Edit3, X, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useHomeData } from "@/lib/useHomeData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useMealsData, DailyItem } from "@/lib/useMealsData";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";

type MealType = "breakfast" | "snack" | "lunch" | "dinner";

export default function MealsScreen() {
  const { goals, dailyLog } = useHomeData();
  const { meals } = useMealsData();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const [selectedMealType, setSelectedMealType] = useState<string | null>(null);
  const [showAddSheet, setShowAddSheet] = useState<boolean>(false);
  const [sheetAnimation] = useState(new Animated.Value(0));
  
  const [showEditSheet, setShowEditSheet] = useState<boolean>(false);
  const [editSheetAnimation] = useState(new Animated.Value(0));
  const [editingMealType, setEditingMealType] = useState<string | null>(null);
  const [editingItems, setEditingItems] = useState<DailyItem[]>([]);
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  
  const [macroFlashAnimations] = useState<{ [key: string]: Animated.Value }>({
    calories: new Animated.Value(0),
    protein: new Animated.Value(0),
    carb: new Animated.Value(0),
    fat: new Animated.Value(0),
    veg: new Animated.Value(0),
    fruit: new Animated.Value(0),
  });
  const [confettiAnimations] = useState<{ [key: string]: Animated.Value[] }>({
    calories: Array(5).fill(0).map(() => new Animated.Value(0)),
    protein: Array(5).fill(0).map(() => new Animated.Value(0)),
    carb: Array(5).fill(0).map(() => new Animated.Value(0)),
    fat: Array(5).fill(0).map(() => new Animated.Value(0)),
    veg: Array(5).fill(0).map(() => new Animated.Value(0)),
    fruit: Array(5).fill(0).map(() => new Animated.Value(0)),
  });
  
  const prevMacroValues = useRef({
    calories: 0,
    protein: 0,
    carb: 0,
    fat: 0,
    veg: 0,
    fruit: 0,
  });
  
  useEffect(() => {
    const currentValues = {
      calories: dailyLog?.total_kcal || 0,
      protein: dailyLog?.total_protein_units || 0,
      carb: dailyLog?.total_carb_units || 0,
      fat: dailyLog?.total_fat_units || 0,
      veg: dailyLog?.total_veg_units || 0,
      fruit: dailyLog?.total_fruit_units || 0,
    };
    
    Object.keys(currentValues).forEach((key) => {
      const macroKey = key as keyof typeof currentValues;
      if (prevMacroValues.current[macroKey] !== currentValues[macroKey] && prevMacroValues.current[macroKey] !== 0) {
        Animated.sequence([
          Animated.timing(macroFlashAnimations[macroKey], {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.timing(macroFlashAnimations[macroKey], {
            toValue: 0,
            duration: 150,
            useNativeDriver: false,
          }),
        ]).start();

        const confettiArray = confettiAnimations[macroKey];
        confettiArray.forEach((anim, index) => {
          anim.setValue(0);
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();
        });
      }
      prevMacroValues.current[macroKey] = currentValues[macroKey];
    });
  }, [dailyLog, macroFlashAnimations, confettiAnimations]);
  
  const hasMealPlan = true;

  const mealNames = {
    breakfast: "ארוחת בוקר",
    snack: "ארוחת ביניים",
    lunch: "ארוחת צהריים",
    dinner: "ארוחת ערב",
  };

  const getMealByHebrew = (hebrewName: string) => {
    return meals.find(meal => meal.mealType === hebrewName);
  };


  const proteinIntake = dailyLog?.total_protein_units || 0;
  const carbIntake = dailyLog?.total_carb_units || 0;
  const fatIntake = dailyLog?.total_fat_units || 0;
  const vegIntake = dailyLog?.total_veg_units || 0;
  const fruitIntake = dailyLog?.total_fruit_units || 0;
  const caloriesIntake = dailyLog?.total_kcal || 0;

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };
  
  const openAddSheet = (mealType: string) => {
    setSelectedMealType(mealType);
    setShowAddSheet(true);
    Animated.spring(sheetAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  };
  
  const openEditSheet = (mealType: string) => {
    console.log('[Edit] Opening edit sheet for:', mealType);
    const hebrewMealName = mealType;
    const mealData = getMealByHebrew(hebrewMealName);
    console.log('[Edit] Found meal data:', mealData);
    
    if (!mealData) {
      console.log('[Edit] No meal data found');
      return;
    }
    
    if (mealData.items.length === 0) {
      console.log('[Edit] No items in meal');
      return;
    }
    
    console.log('[Edit] Setting up edit sheet with', mealData.items.length, 'items');
    setEditingMealType(mealType);
    setEditingItems(mealData.items);
    
    const initialQuantities: Record<string, string> = {};
    mealData.items.forEach(item => {
      initialQuantities[item.id] = item.quantity.toString();
    });
    setItemQuantities(initialQuantities);
    
    console.log('[Edit] Showing edit sheet');
    setShowEditSheet(true);
    Animated.spring(editSheetAnimation, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  };
  
  const closeEditSheet = () => {
    Keyboard.dismiss();
    Animated.timing(editSheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowEditSheet(false);
      setEditingMealType(null);
      setEditingItems([]);
      setItemQuantities({});
    });
  };
  
  const handleDeleteItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('daily_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
      
      setEditingItems(prev => prev.filter(item => item.id !== itemId));
      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });
    } catch (error) {
      console.error('[Edit] Error deleting item:', error);
    }
  };
  
  const handleUpdateQuantity = async (itemId: string) => {
    const newQuantity = parseFloat(itemQuantities[itemId]);
    if (!newQuantity || newQuantity <= 0) return;
    
    const item = editingItems.find(i => i.id === itemId);
    if (!item) return;
    
    try {
      const ratio = newQuantity / item.quantity;
      const { error } = await supabase
        .from('daily_items')
        .update({
          quantity: newQuantity,
          kcal: item.kcal * ratio,
          protein_units: item.protein_units * ratio,
          carb_units: item.carb_units * ratio,
          fat_units: item.fat_units * ratio,
          veg_units: item.veg_units * ratio,
          fruit_units: item.fruit_units * ratio,
        })
        .eq('id', itemId);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });
    } catch (error) {
      console.error('[Edit] Error updating quantity:', error);
    }
  };
  
  const closeAddSheet = () => {
    Animated.timing(sheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setShowAddSheet(false);
      setSelectedMealType(null);
    });
  };
  
  const handleOptionSelect = (option: 'food-bank' | 'barcode' | 'ai') => {
    closeAddSheet();
    setTimeout(() => {
      if (option === 'food-bank') {
        router.push({ pathname: "/food-bank", params: { mealType: selectedMealType || "" } });
      } else if (option === 'barcode') {
        router.push({ pathname: "/barcode-scanner", params: { mealType: selectedMealType || "" } });
      } else if (option === 'ai') {
        router.push({ pathname: "/ai-photo-analysis", params: { mealType: selectedMealType || "" } });
      }
    }, 300);
  };
  
  const macroCards = [
    {
      key: "calories",
      label: "קלוריות",
      value: caloriesIntake,
      goal: goals.calories,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
      isCalories: true,
    },
    {
      key: "protein",
      label: "חלבון",
      value: proteinIntake,
      goal: goals.protein,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984876/steak_6_ahllay.webp",
      isCalories: false,
    },
    {
      key: "carb",
      label: "פחמימות",
      value: carbIntake,
      goal: goals.carb,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984847/bread-slice_3_pvs0tu.webp",
      isCalories: false,
    },
    {
      key: "fat",
      label: "שומנים",
      value: fatIntake,
      goal: goals.fat,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_5_joifcx.webp",
      isCalories: false,
    },
    {
      key: "veg",
      label: "ירקות",
      value: vegIntake,
      goal: goals.veg || 0,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762181616/broccoli_1_enipsf.png",
      isCalories: false,
    },
    {
      key: "fruit",
      label: "פירות",
      value: fruitIntake,
      goal: goals.fruit || 0,
      icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1762181534/apple-whole_mcdgtz.png",
      isCalories: false,
    },
  ];

  const renderMealCard = (mealType: MealType) => {
    const hebrewMealName = mealNames[mealType];
    const mealData = getMealByHebrew(hebrewMealName);
    
    const meal = {
      calories: mealData?.totalCalories || 0,
      protein: mealData?.totalProtein || 0,
      carb: mealData?.totalCarbs || 0,
      fat: mealData?.totalFats || 0,
      veg: mealData?.totalVeg || 0,
      fruit: mealData?.totalFruit || 0,
    };
    const foods = mealData?.items || [];
    const hasTotalIntake = meal.calories > 0 || meal.protein > 0 || meal.carb > 0 || meal.fat > 0 || meal.veg > 0 || meal.fruit > 0;

    const mealMacroCards = [
      {
        key: "calories",
        label: "קלוריות",
        value: meal.calories,
        icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp",
        isCalories: true,
      },
      {
        key: "protein",
        label: "חלבון",
        value: meal.protein,
        goal: goals.protein,
        icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984933/steak_mlurou.webp",
        isCalories: false,
      },
      {
        key: "carb",
        label: "פחמימות",
        value: meal.carb,
        goal: goals.carb,
        icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984890/bread-slice_dxwpxq.webp",
        isCalories: false,
      },
      {
        key: "fat",
        label: "שומנים",
        value: meal.fat,
        goal: goals.fat,
        icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984882/avocado_2_brovfe.webp",
        isCalories: false,
      },
      {
        key: "veg",
        label: "ירקות",
        value: meal.veg,
        goal: goals.veg || 0,
        icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921406/broccoli_6_esjw1f.webp",
        isCalories: false,
      },
      {
        key: "fruit",
        label: "פירות",
        value: meal.fruit,
        goal: goals.fruit || 0,
        icon: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759921407/apple_3_r7sndm.webp",
        isCalories: false,
      },
    ];

    return (
      <View key={mealType} style={[styles.mealCard, !hasTotalIntake && styles.mealCardInactive]}>
        <View style={styles.mealHeader}>
          <View style={styles.mealHeaderButtons}>
            <TouchableOpacity 
              style={styles.addFoodButton}
              onPress={() => openAddSheet(mealNames[mealType])}
              activeOpacity={0.7}
            >
              <Plus size={20} color="#000000" />
            </TouchableOpacity>
            {foods.length > 0 && (
              <TouchableOpacity 
                style={styles.editFoodButton}
                onPress={() => {
                  console.log('[Meal Card] Edit button pressed for:', mealNames[mealType]);
                  openEditSheet(mealNames[mealType]);
                }}
                activeOpacity={0.7}
              >
                <Edit3 size={16} color="#000000" />
                <Text style={styles.editButtonText}>ערוך</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={[styles.mealTitle, !hasTotalIntake && styles.mealTitleInactive]}>{mealNames[mealType]}</Text>
        </View>

        {foods.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.foodList}
            contentContainerStyle={styles.foodListContent}
          >
            {foods.map((item) => (
              <View key={item.id} style={styles.foodItem}>
                <Image 
                  source={{ uri: item.food_item?.img_url || 'https://via.placeholder.com/70' }} 
                  style={styles.foodImage} 
                />
                <Text style={styles.foodName} numberOfLines={2}>{item.food_item?.name || 'מזון'}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.mealMacroCardsContainer}>
          {mealMacroCards.map((macro, index) => {
            const isBlackedOut = macro.value === 0;
            return (
              <View
                key={index}
                style={[
                  styles.mealMacroCard,
                  macro.isCalories && styles.mealMacroCardCalories,
                  isBlackedOut && styles.mealMacroCardBlackedOut,
                ]}
              >
                <Text style={[
                  styles.mealMacroValue,
                  isBlackedOut && styles.mealMacroValueBlackedOut
                ]}>
                  {formatUnit(macro.value)}
                </Text>
                {macro.icon ? (
                  <Image
                    source={{ uri: macro.icon }}
                    style={[styles.mealMacroIcon, isBlackedOut && styles.mealMacroIconBlackedOut]}
                    resizeMode="contain"
                  />
                ) : null}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}>
          {Platform.OS === "web" ? (
            <View style={styles.headerGlassWeb} />
          ) : (
            <View style={styles.headerGlass} />
          )}

          <View style={styles.macroCardsContainer}>
            {macroCards.map((macro, index) => {
              const progress = macro.goal > 0 ? Math.min(macro.value / macro.goal, 1) : 0;
              const isOverGoal = macro.value >= macro.goal && macro.goal > 0;

              if (macro.isCalories) {
                return (
                  <View
                    key={index}
                    style={styles.macroCardCalories}
                  >
                    {confettiAnimations[macro.key].map((confetti, cIndex) => {
                      const translateY = confetti.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -40],
                      });
                      const opacity = confetti.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0],
                      });
                      const angle = (cIndex * 360) / 5;
                      const translateX = Math.cos((angle * Math.PI) / 180) * 20;

                      return (
                        <Animated.View
                          key={cIndex}
                          style={[
                            styles.confettiParticle,
                            {
                              opacity,
                              transform: [
                                { translateX: confetti.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, translateX],
                                })},
                                { translateY },
                              ],
                            },
                          ]}
                        >
                          <Text style={styles.confettiText}>✨</Text>
                        </Animated.View>
                      );
                    })}
                    <Text style={styles.macroValue}>
                      {formatUnit(macro.value)}
                    </Text>
                    <Text style={styles.macroUnit}>קק״ל</Text>
                  </View>
                );
              } else {
                return (
                  <View
                    key={index}
                    style={styles.macroIconOnly}
                  >
                    {confettiAnimations[macro.key].map((confetti, cIndex) => {
                      const translateY = confetti.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -40],
                      });
                      const opacity = confetti.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 1, 0],
                      });
                      const angle = (cIndex * 360) / 5;
                      const translateX = Math.cos((angle * Math.PI) / 180) * 20;

                      return (
                        <Animated.View
                          key={cIndex}
                          style={[
                            styles.confettiParticle,
                            {
                              opacity,
                              transform: [
                                { translateX: confetti.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, translateX],
                                })},
                                { translateY },
                              ],
                            },
                          ]}
                        >
                          <Text style={styles.confettiText}>✨</Text>
                        </Animated.View>
                      );
                    })}
                    {macro.icon ? (
                      <View style={styles.iconProgressContainerLarge}>
                        <Image
                          source={{ uri: macro.icon }}
                          style={styles.macroIconBaseLarge}
                          resizeMode="contain"
                        />
                        <View style={[styles.iconProgressWrapperLarge, { height: `${progress * 100}%` }]}>
                          <Image
                            source={{ uri: macro.icon }}
                            style={styles.macroIconProgressLarge}
                            resizeMode="contain"
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              }
            })}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {hasMealPlan && (
            <View style={styles.mealPlanCard}>
              <Text style={styles.mealPlanText}>התפריט שלי</Text>
            </View>
          )}

          {renderMealCard("breakfast")}
          {renderMealCard("snack")}
          {renderMealCard("lunch")}
          {renderMealCard("dinner")}
        </ScrollView>
        
        {showAddSheet && (
          <Modal
            visible={showAddSheet}
            transparent={true}
            animationType="none"
            onRequestClose={closeAddSheet}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeAddSheet}
            >
              <Animated.View
                style={[
                  styles.addOptionsSheet,
                  {
                    transform: [{
                      translateY: sheetAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                      }),
                    }],
                  },
                ]}
              >
                <View style={styles.sheetHandle} />
                <Text style={styles.sheetTitle}>הוסף מזון</Text>
                
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect('food-bank')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      <Apple size={32} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.optionText}>בנק מזון</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect('barcode')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      <Barcode size={32} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.optionText}>סורק ברקוד</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => handleOptionSelect('ai')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.optionIconContainer}>
                      <Camera size={32} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.optionText}>AI</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        )}
        
        {showEditSheet && (
          <Modal
            visible={showEditSheet}
            transparent={true}
            animationType="none"
            onRequestClose={closeEditSheet}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={closeEditSheet}
            >
              <Animated.View
                style={[
                  styles.editSheet,
                  {
                    transform: [{
                      translateY: editSheetAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [500, 0],
                      }),
                    }],
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}
                  style={styles.sheetContentWrapper}
                >
                  <View style={styles.sheetHandle} />
                  <View style={styles.editSheetHeader}>
                    <TouchableOpacity onPress={closeEditSheet} activeOpacity={0.7}>
                      <X size={24} color="#2d3748" />
                    </TouchableOpacity>
                    <Text style={styles.sheetTitle}>ערוך {editingMealType}</Text>
                    <View style={{ width: 24 }} />
                  </View>
                  
                  <ScrollView
                    style={styles.editItemsList}
                    contentContainerStyle={styles.editItemsContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                  >
                    {editingItems.map((item) => (
                      <View key={item.id} style={styles.editItemCard}>
                        <TouchableOpacity
                          style={styles.deleteItemButton}
                          onPress={() => handleDeleteItem(item.id)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={20} color="#FF6B6B" />
                        </TouchableOpacity>
                        
                        <View style={styles.editItemInfo}>
                          {item.food_item?.img_url && (
                            <Image
                              source={{ uri: item.food_item.img_url }}
                              style={styles.editItemImage}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.editItemDetails}>
                            <Text style={styles.editItemName}>{item.food_item?.name || 'מזון'}</Text>
                            <View style={styles.editItemQuantityRow}>
                              <TouchableOpacity
                                style={styles.quantityChangeButton}
                                onPress={() => {
                                  const current = parseFloat(itemQuantities[item.id]) || 1;
                                  if (current > 1) {
                                    const newVal = (current - 1).toString();
                                    setItemQuantities(prev => ({ ...prev, [item.id]: newVal }));
                                    handleUpdateQuantity(item.id);
                                  }
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quantityChangeText}>-</Text>
                              </TouchableOpacity>
                              
                              <TextInput
                                style={styles.editItemQuantityInput}
                                value={itemQuantities[item.id]}
                                onChangeText={(text) => {
                                  const cleaned = text.replace(/[^0-9.]/g, '');
                                  setItemQuantities(prev => ({ ...prev, [item.id]: cleaned }));
                                }}
                                onBlur={() => handleUpdateQuantity(item.id)}
                                keyboardType="decimal-pad"
                                selectTextOnFocus
                                returnKeyType="done"
                                onSubmitEditing={() => Keyboard.dismiss()}
                                blurOnSubmit={true}
                                inputAccessoryViewID="editQuantityDone"
                              />
                              
                              <TouchableOpacity
                                style={styles.quantityChangeButton}
                                onPress={() => {
                                  const current = parseFloat(itemQuantities[item.id]) || 1;
                                  const newVal = (current + 1).toString();
                                  setItemQuantities(prev => ({ ...prev, [item.id]: newVal }));
                                  handleUpdateQuantity(item.id);
                                }}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.quantityChangeText}>+</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.editItemCalories}>{Math.round(item.kcal)} קל'</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </ScrollView>
                  
                  {Platform.OS === 'ios' && (
                    <InputAccessoryView nativeID="editQuantityDone">
                      <View style={styles.keyboardAccessory}>
                        <TouchableOpacity 
                          style={styles.keyboardDoneButton}
                          onPress={() => Keyboard.dismiss()}
                        >
                          <Text style={styles.keyboardDoneText}>סיים</Text>
                        </TouchableOpacity>
                      </View>
                    </InputAccessoryView>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </TouchableOpacity>
          </Modal>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#5ce1e6",
  },
  stickyHeader: {
    backgroundColor: "transparent",
    position: "relative" as const,
    overflow: "hidden",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  headerGlass: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  headerGlassWeb: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000000",
  },
  macroCardsContainer: {
    flexDirection: "row-reverse" as any,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    zIndex: 1,
    alignItems: "center",
  },
  macroCardCalories: {
    flex: 1.5,
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
    height: 72,
  },
  macroIconOnly: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 72,
  },
  macroValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  macroUnit: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
  },
  iconProgressContainer: {
    position: "relative" as const,
    width: 24,
    height: 24,
  },
  macroIconBase: {
    position: "absolute" as const,
    width: 24,
    height: 24,
    opacity: 0.25,
  },
  macroIconRed: {
    tintColor: "#FF3B30",
  },
  iconProgressWrapper: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  macroIconProgress: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    width: 24,
    height: 24,
  },
  iconProgressContainerLarge: {
    position: "relative" as const,
    width: 36,
    height: 36,
  },
  macroIconBaseLarge: {
    position: "absolute" as const,
    width: 36,
    height: 36,
    tintColor: "#3d3d3d",
  },
  iconProgressWrapperLarge: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  macroIconProgressLarge: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    width: 36,
    height: 36,
  },
  confettiParticle: {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    marginLeft: -6,
    marginTop: -6,
  },
  confettiText: {
    fontSize: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mealPlanCard: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  mealPlanText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  mealCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.5,
    shadowRadius: 32,
    elevation: 24,
  },
  mealCardInactive: {
    backgroundColor: "rgba(150, 150, 150, 0.2)",
    borderColor: "rgba(150, 150, 150, 0.3)",
    opacity: 0.6,
  },
  mealHeader: {
    flexDirection: "row-reverse" as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mealHeaderButtons: {
    flexDirection: "row-reverse" as any,
    gap: 8,
    alignItems: "center",
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  mealTitleInactive: {
    color: "#000000",
  },
  addFoodButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  editFoodButton: {
    flexDirection: "row-reverse" as any,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: "#000000",
  },
  foodList: {
    marginBottom: 16,
  },
  foodListContent: {
    gap: 12,
    paddingRight: 4,
  },
  foodItem: {
    alignItems: "center",
    gap: 6,
    maxWidth: 80,
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  foodName: {
    fontSize: 11,
    color: "#FFFFFF",
    textAlign: "center",
  },
  macroSummary: {
    gap: 12,
  },
  calorieCard: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  calorieText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  macroGrid: {
    flexDirection: "row-reverse" as any,
    flexWrap: "wrap",
    gap: 8,
  },
  macroCard: {
    width: "18%",
    aspectRatio: 1,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    borderWidth: 1.5,
  },
  macroCardInactive: {
    backgroundColor: "rgba(200, 200, 200, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  macroValueInactive: {
    color: "rgba(255, 255, 255, 0.3)",
  },
  macroCardIcon: {
    width: 20,
    height: 20,
    tintColor: "#FFFFFF",
  },
  macroCardIconInactive: {
    tintColor: "rgba(255, 255, 255, 0.3)",
  },
  mealMacroCardsContainer: {
    flexDirection: "row-reverse" as any,
    gap: 6,
    flexWrap: "wrap",
  },
  mealMacroCard: {
    flex: 1,
    minWidth: "15%",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    overflow: "hidden",
    position: "relative" as const,
  },
  mealMacroCardCalories: {
    flex: 1.5,
  },
  mealMacroCardInactive: {
    backgroundColor: "rgba(150, 150, 150, 0.15)",
    borderColor: "rgba(150, 150, 150, 0.2)",
  },
  mealMacroValue: {
    fontSize: 11,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  mealMacroValueInactive: {
    color: "#000000",
  },
  mealMacroIcon: {
    width: 22,
    height: 22,
  },
  mealMacroIconInactive: {
    opacity: 0.3,
  },
  mealMacroCardBlackedOut: {
    opacity: 0.15,
  },
  mealMacroValueBlackedOut: {
    color: "#FFFFFF",
  },
  mealMacroIconBlackedOut: {
    opacity: 1,
  },

  mealMacroProgressBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  mealMacroProgressFill: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(112, 238, 255, 0.2)",
    borderRadius: 12,
  },
  mealMacroProgressFillRed: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  addOptionsSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 24,
  },
  optionsContainer: {
    flexDirection: "row-reverse" as any,
    justifyContent: "space-around",
    gap: 16,
  },
  optionButton: {
    flex: 1,
    alignItems: "center",
    gap: 12,
  },
  optionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: `${colors.primary}15`,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  editSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetContentWrapper: {
    flex: 1,
  },
  editSheetHeader: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  editItemsList: {
    flex: 1,
  },
  editItemsContent: {
    padding: 24,
    gap: 12,
    paddingBottom: 40,
  },
  editItemCard: {
    backgroundColor: "#F7FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    position: "relative" as const,
  },
  deleteItemButton: {
    position: "absolute" as const,
    top: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  editItemInfo: {
    flexDirection: "row-reverse" as any,
    gap: 12,
    alignItems: "center",
  },
  editItemImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
  },
  editItemDetails: {
    flex: 1,
    gap: 8,
  },
  editItemName: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "right",
  },
  editItemQuantityRow: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 12,
  },
  editItemQuantityInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: "600" as const,
    textAlign: "center",
    color: "#2d3748",
    backgroundColor: "#FFFFFF",
  },
  quantityChangeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quantityChangeText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  editItemCalories: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
    textAlign: "right",
  },
  keyboardAccessory: {
    backgroundColor: "#F7F7F7",
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: "row" as any,
    justifyContent: "flex-end",
  },
  keyboardDoneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
  },
  keyboardDoneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
});
