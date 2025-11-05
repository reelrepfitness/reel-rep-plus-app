import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  Animated,
  Keyboard,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Search, X, Weight, Coffee, Soup, Hash } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors } from "@/constants/colors";
import { useHomeData } from "@/lib/useHomeData";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { FoodBankItem } from "@/lib/types";
import { useState, useMemo, useRef, useEffect } from "react";

const categoryIcons = {
  "מסעדות": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984906/hamburger_rdbysh.webp",
  "פחמימה": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984887/bread-slice_1_cjf894.webp",
  "שומן": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984886/avocado_btlmth.webp",
  "ירק": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984897/broccoli_uf2pzr.webp",
  "פרי": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984875/apple_jsnkpt.webp",
  "ממרחים": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984926/sauce_xujuvj.webp",
  "חלבון": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984930/steak_1_h9xrdj.webp",
  "מכולת": "https://res.cloudinary.com/dtffqhujt/image/upload/v1758994452/grocery-basket_xutxrp.webp",
};

export default function FoodBankScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { goals, dailyLog } = useHomeData();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedMainCategory, setSelectedMainCategory] = useState<string | null>("חלבון");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [selectedFood, setSelectedFood] = useState<FoodBankItem | null>(null);
  const [quantity, setQuantity] = useState<string>("1");
  const [selectedMeasurement, setSelectedMeasurement] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [sheetAnimation] = useState(new Animated.Value(0));
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

  const categoryScrollRef = useRef<ScrollView>(null);

  const mealType = params.mealType as string | undefined;

  const { data: foodItems = [], isLoading } = useQuery({
    queryKey: ["foodBank"],
    queryFn: async () => {
      console.log("[FoodBank] Fetching all food items");
      
      const { data, error } = await supabase
        .from("food_bank")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error("[FoodBank] Error fetching:", error);
        throw error;
      }

      console.log(`[FoodBank] Loaded ${data?.length || 0} items`);
      console.log("[FoodBank] Sample items:", data?.slice(0, 3));
      return data as FoodBankItem[];
    },
  });

  const mainCategories = useMemo(() => {
    const categoryOrder = ["חלבון", "פחמימה", "שומן", "ירק", "פרי", "ממרחים", "מכולת", "מסעדות"];
    const categories = new Set(foodItems.map(item => item.category));
    const availableCategories = Array.from(categories).filter(Boolean);
    const filteredCategories = categoryOrder.filter(cat => availableCategories.includes(cat));
    if (!filteredCategories.includes("מסעדות")) {
      filteredCategories.push("מסעדות");
    }
    return filteredCategories;
  }, [foodItems]);

  const subCategories = useMemo(() => {
    if (!selectedMainCategory) return [];
    const subs = new Set(
      foodItems
        .filter(item => item.category === selectedMainCategory && item.sub_category)
        .map(item => item.sub_category)
    );
    return Array.from(subs).filter(Boolean) as string[];
  }, [foodItems, selectedMainCategory]);

  const filteredItems = useMemo(() => {
    let filtered = foodItems;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(query)
      );
    } else {
      if (selectedMainCategory) {
        filtered = filtered.filter(item => item.category === selectedMainCategory);
      }

      if (selectedSubCategory) {
        filtered = filtered.filter(item => item.sub_category === selectedSubCategory);
      }
    }

    console.log(`[FoodBank] Filtered ${filtered.length} items (total: ${foodItems.length}, search: "${searchQuery}", category: ${selectedMainCategory}, sub: ${selectedSubCategory})`);
    return filtered;
  }, [foodItems, searchQuery, selectedMainCategory, selectedSubCategory]);

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  const getMeasurementLabel = (value: number, type: 'גרם' | 'כוסות' | 'כפות' | 'יחידות'): string => {
    if (value === 1) {
      switch (type) {
        case 'גרם':
          return 'גרם';
        case 'כוסות':
          return 'כוס אחת';
        case 'כפות':
          return 'כף אחת';
        case 'יחידות':
          return 'יחידה אחת';
      }
    }
    return type;
  };

  const getServingText = (item: FoodBankItem): string | null => {
    // Get the measurement methods that are not 0
    const measurements: { value: number; label: string }[] = [];
    
    if (item.grams_per_single_item && item.grams_per_single_item > 0) {
      const label = getMeasurementLabel(item.grams_per_single_item, 'גרם');
      measurements.push({ value: item.grams_per_single_item, label });
    }
    if (item.grams_per_cup && item.grams_per_cup > 0) {
      const label = getMeasurementLabel(item.grams_per_cup, 'כוסות');
      measurements.push({ value: item.grams_per_cup, label });
    }
    if (item.grams_per_tbsp && item.grams_per_tbsp > 0) {
      const label = getMeasurementLabel(item.grams_per_tbsp, 'כפות');
      measurements.push({ value: item.grams_per_tbsp, label });
    }
    if (item.items_per_unit && item.items_per_unit > 0) {
      const label = getMeasurementLabel(item.items_per_unit, 'יחידות');
      measurements.push({ value: item.items_per_unit, label });
    }

    // If we have measurements, create the text
    if (measurements.length > 0) {
      const parts = measurements.map(m => {
        if (m.value === 1) {
          return m.label;
        }
        return `${formatUnit(m.value)} ${m.label}`;
      });
      return parts.join(' / ') + ' שווים למנה אחת';
    }

    return null;
  };

  const proteinIntake = dailyLog?.total_protein_units || 0;
  const carbIntake = dailyLog?.total_carb_units || 0;
  const fatIntake = dailyLog?.total_fat_units || 0;
  const vegIntake = dailyLog?.total_veg_units || 0;
  const fruitIntake = dailyLog?.total_fruit_units || 0;
  const caloriesIntake = dailyLog?.total_kcal || 0;

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

  const getCategoryColor = (category: string): string | undefined => {
    switch (category) {
      case "חלבון":
        return colors.protein;
      case "פחמימה":
        return colors.carb;
      case "שומן":
        return colors.fat;
      case "ירק":
        return colors.vegetable;
      case "פרי":
        return colors.fruit;
      default:
        return undefined;
    }
  };

  const getMacroColor = (macroKey: string): string => {
    switch (macroKey) {
      case "protein":
        return colors.protein;
      case "carb":
        return colors.carb;
      case "fat":
        return colors.fat;
      case "veg":
        return colors.vegetable;
      case "fruit":
        return colors.fruit;
      case "calories":
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const handleCategoryPress = (category: string) => {
    if (category === "מסעדות") {
      router.push({
        pathname: "/restaurants",
        params: {
          mealType: mealType || "",
        },
      });
      return;
    }
    
    if (selectedMainCategory === category) {
      setSelectedMainCategory(null);
      setSelectedSubCategory(null);
    } else {
      setSelectedMainCategory(category);
      setSelectedSubCategory(null);
    }
  };

  const handleSubCategoryPress = (subCategory: string) => {
    if (selectedSubCategory === subCategory) {
      setSelectedSubCategory(null);
    } else {
      setSelectedSubCategory(subCategory);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const handleFoodPress = (item: FoodBankItem) => {
    console.log("[FoodBank] Selected food:", item.name);
    if (item.category === "ירק" || item.category === "פרי") {
      setSelectedFood(item);
      setQuantity("1");
      Animated.spring(sheetAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    } else if (["חלבון", "פחמימה", "שומן", "ממרחים"].includes(item.category)) {
      setSelectedFood(item);
      setQuantity("1");
      setSelectedMeasurement(null);
      Animated.spring(sheetAnimation, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();
    }
  };

  const incrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    setQuantity((num + 1).toString());
  };

  const decrementQuantity = () => {
    const num = parseFloat(quantity) || 0;
    if (num > 1) {
      setQuantity((num - 1).toString());
    } else {
      setQuantity("1");
    }
  };

  const triggerMacroAnimation = (macroKey: string, newValue: number, goal: number) => {
    // Scale up and down animation
    Animated.sequence([
      Animated.timing(macroFlashAnimations[macroKey], {
        toValue: 1.3,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(macroFlashAnimations[macroKey], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Confetti animations
    const confettiArray = confettiAnimations[macroKey];
    confettiArray.forEach((anim, index) => {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });
  };

  const closeSheet = () => {
    Animated.timing(sheetAnimation, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSelectedFood(null);
      setQuantity("1");
      setSelectedMeasurement(null);
    });
  };

  const handleConfirm = async () => {
    if (!selectedFood || !dailyLog?.id || !mealType) return;

    try {
      console.log("[FoodBank] Adding food:", selectedFood.name, "x", quantity, "to", mealType);

      const quantityNum = parseFloat(quantity) || 1;
      const caloriesPerUnit = selectedFood.caloreis_per_unit;
      const proteinUnits = selectedFood.protien_units * quantityNum;
      const carbUnits = selectedFood.carb_units * quantityNum;
      const fatUnits = selectedFood.fats_units * quantityNum;
      const vegUnits = selectedFood.veg_units * quantityNum;
      const fruitUnits = selectedFood.fruit_units * quantityNum;
      const totalCalories = caloriesPerUnit * quantityNum;

      // Insert into daily_items
      const { error: itemError } = await supabase
        .from("daily_items")
        .insert([{
          daily_log_id: dailyLog.id,
          food_id: selectedFood.id,
          meal_category: mealType,
          measure_type: "unit",
          quantity: quantityNum,
          grams: 0,
          kcal: totalCalories,
          protein_units: proteinUnits,
          carb_units: carbUnits,
          fat_units: fatUnits,
          veg_units: vegUnits,
          fruit_units: fruitUnits,
        }]);

      if (itemError) {
        console.error("[FoodBank] Error inserting daily item:", itemError);
        throw itemError;
      }

      console.log("[FoodBank] Daily item inserted successfully");

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      // Calculate new values
      const newCalories = caloriesIntake + totalCalories;
      const newProtein = proteinIntake + proteinUnits;
      const newCarb = carbIntake + carbUnits;
      const newFat = fatIntake + fatUnits;
      const newVeg = vegIntake + vegUnits;
      const newFruit = fruitIntake + fruitUnits;

      // Trigger animations for updated macros
      if (totalCalories > 0) triggerMacroAnimation('calories', newCalories, goals.calories);
      if (proteinUnits > 0) triggerMacroAnimation('protein', newProtein, goals.protein);
      if (carbUnits > 0) triggerMacroAnimation('carb', newCarb, goals.carb);
      if (fatUnits > 0) triggerMacroAnimation('fat', newFat, goals.fat);
      if (vegUnits > 0) triggerMacroAnimation('veg', newVeg, goals.veg || 0);
      if (fruitUnits > 0) triggerMacroAnimation('fruit', newFruit, goals.fruit || 0);

      setSuccessItem(selectedFood);
      setShowSuccess(true);
      closeSheet();
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity("1");
      }, 2000);
    } catch (error) {
      console.error("[FoodBank] Failed to add food:", error);
    }
  };

  const [successItem, setSuccessItem] = useState<FoodBankItem | null>(null);

  useEffect(() => {
    if (categoryScrollRef.current && mainCategories.length > 0) {
      setTimeout(() => {
        categoryScrollRef.current?.scrollTo({ x: 0, animated: false });
      }, 100);
    }
  }, [mainCategories]);

  useEffect(() => {
    // Initialize animations
    macroCards.forEach((macro) => {
      macroFlashAnimations[macro.key].setValue(1);
    });
  }, [dailyLog?.id]);

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

          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>
              {mealType ? `${mealType}` : "בנק מזון"}
            </Text>
          </View>

          <View style={styles.macroCardsContainer}>
            {macroCards.map((macro, index) => {
              const progress = macro.goal > 0 ? Math.min(macro.value / macro.goal, 1) : 0;
              const isOverGoal = macro.value >= macro.goal && macro.goal > 0;

              if (macro.isCalories) {
                return (
                  <View
                    key={index}
                    style={styles.macroCardWrapperCalories}
                  >
                    <View style={styles.macroCardCalories}>
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
                  </View>
                );
              } else {
                return (
                  <View
                    key={index}
                    style={styles.macroCardWrapper}
                  >
                    <Text style={styles.macroIntakeText}>
                      {formatUnit(macro.value)}/{formatUnit(macro.goal)}
                    </Text>
                    <View style={styles.macroIconOnly}>
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
                      <Animated.View
                        style={[
                          styles.iconProgressContainerLarge,
                          {
                            transform: [{
                              scale: macroFlashAnimations[macro.key].interpolate({
                                inputRange: [0, 1, 1.3],
                                outputRange: [1, 1, 1.3],
                              }),
                            }],
                          },
                        ]}
                      >
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
                      </Animated.View>
                    ) : null}
                    </View>
                  </View>
                );
              }
            })}
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.controlsSection}>
            <View style={styles.categoriesCard}>
              <ScrollView
                ref={categoryScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoriesScroll}
                directionalLockEnabled={true}
              >
                {mainCategories.map((category) => {
                  const isSelected = selectedMainCategory === category;
                  const icon = categoryIcons[category as keyof typeof categoryIcons];
                  const categoryColor = getCategoryColor(category);
                  
                  return (
                    <TouchableOpacity
                      key={category}
                      style={styles.categoryItem}
                      onPress={() => handleCategoryPress(category)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.categoryIconContainer,
                          isSelected && styles.categoryIconContainerActive,
                          isSelected && categoryColor && { borderColor: categoryColor, backgroundColor: `${categoryColor}15` },
                        ]}
                      >
                        {icon && (
                          <Image
                            source={{ uri: icon }}
                            style={styles.categoryIcon}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                      <Text
                        style={[
                          styles.categoryText,
                          isSelected && styles.categoryTextActive,
                          isSelected && categoryColor && { color: categoryColor },
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {subCategories.length > 0 && (
              <View style={styles.subCategoriesContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subCategoriesScroll}
                >
                  {subCategories.map((subCategory) => {
                    const isSelected = selectedSubCategory === subCategory;
                    return (
                      <TouchableOpacity
                        key={subCategory}
                        style={[
                          styles.subCategoryChip,
                          isSelected && styles.subCategoryChipActive,
                        ]}
                        onPress={() => handleSubCategoryPress(subCategory)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.subCategoryText,
                            isSelected && styles.subCategoryTextActive,
                          ]}
                        >
                          {subCategory}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <View style={styles.searchContainer}>
              <View style={styles.searchInputContainer}>
                <Search color="#999" size={20} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="חיפוש..."
                  placeholderTextColor="#999"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={clearSearch} activeOpacity={0.7}>
                    <X color="#999" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : filteredItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>אין תוצאות</Text>
            </View>
          ) : (
            <View style={styles.foodGrid}>
              {filteredItems.map((item) => {
                const showCategoryIcon = !["ממרחים", "מסעדות", "מכולת"].includes(item.category);
                const categoryIcon = categoryIcons[item.category as keyof typeof categoryIcons];
                
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.foodCard}
                    onPress={() => handleFoodPress(item)}
                    activeOpacity={0.8}
                  >
                    {item.img_url ? (
                      <Image
                        source={{ uri: item.img_url }}
                        style={styles.foodImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.foodImagePlaceholder}>
                        <Text style={styles.foodImagePlaceholderText}>
                          {item.name.charAt(0)}
                        </Text>
                      </View>
                    )}

                    <View style={styles.foodInfo}>
                      {showCategoryIcon && categoryIcon && (
                        <View style={styles.categoryIconTopContainer}>
                          <Image
                            source={{ uri: categoryIcon }}
                            style={styles.categoryIconTop}
                            resizeMode="contain"
                          />
                        </View>
                      )}
                      
                      <Text style={styles.foodName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      
                      {getServingText(item) && (
                        <Text style={styles.servingText} numberOfLines={2}>
                          מנה אחת של {item.category}:
                          {"\n"}{getServingText(item)}
                        </Text>
                      )}
                      
                      <View style={styles.foodNutrition}>
                        {item.category === "פרי" && item.fruit_units > 0 ? (
                          <View style={[styles.nutritionBadge, { backgroundColor: `${colors.fruit}30` }]}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp" }}
                              style={styles.nutritionIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.nutritionText}>{formatUnit(item.fruit_units)}</Text>
                          </View>
                        ) : item.category === "ירק" ? (
                          <View style={[
                            styles.nutritionBadge,
                            item.veg_units === 0
                              ? { backgroundColor: '#3FCDD1' }
                              : { backgroundColor: `${colors.vegetable}30` }
                          ]}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp" }}
                              style={styles.nutritionIcon}
                              resizeMode="contain"
                            />
                            <Text style={[
                              styles.nutritionText,
                              item.veg_units === 0 && { color: '#FFFFFF', fontWeight: '700' as const }
                            ]}>
                              {item.veg_units === 0 ? "ללא הגבלה" : formatUnit(item.veg_units)}
                            </Text>
                          </View>
                        ) : (
                          <>
                            {item.protien_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.protein}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(item.protien_units)}</Text>
                              </View>
                            )}
                            {item.carb_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.carb}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(item.carb_units)}</Text>
                              </View>
                            )}
                            {item.fats_units > 0 && (
                              <View style={[styles.nutritionBadge, { backgroundColor: `${colors.fat}30` }]}>
                                <Image
                                  source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                                  style={styles.nutritionIcon}
                                  resizeMode="contain"
                                />
                                <Text style={styles.nutritionText}>{formatUnit(item.fats_units)}</Text>
                              </View>
                            )}
                          </>
                        )}
                      </View>

                      <Text style={styles.foodCalories}>{item.caloreis_per_unit} קל׳</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>



        {showSuccess && successItem && (
          <View style={styles.successNotification}>
            <View style={styles.successContent}>
              <Text style={styles.successText}>✓</Text>
              <Text style={styles.successMessage}>
                {parseFloat(quantity) || 1} {successItem.name} נוסף ליומן בהצלחה
              </Text>
            </View>
          </View>
        )}

        {selectedFood && (
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={closeSheet}
          >
            <Animated.View
              style={[
                styles.bottomSheet,
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
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View>
                  <View style={styles.sheetHandle} />
                  {selectedFood.img_url && (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: selectedFood.img_url }}
                        style={styles.sheetImage}
                        resizeMode="contain"
                      />
                    </View>
                  )}
              
              {(["חלבון", "פחמימה", "שומן", "ממרחים"].includes(selectedFood.category)) ? (
                <View style={styles.sheetContent}>
                  <Text style={styles.sheetTitle}>{selectedFood.name}</Text>

                  <View style={styles.measurementOptions}>
                    {selectedFood.grams_per_cup && selectedFood.grams_per_cup > 0 ? (
                      <TouchableOpacity
                        style={[
                          styles.measurementButton,
                          selectedMeasurement === 'grams_per_cup' && styles.measurementButtonActive,
                        ]}
                        onPress={() => setSelectedMeasurement('grams_per_cup')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.measurementButtonContent}>
                          <Coffee 
                            size={18} 
                            color={selectedMeasurement === 'grams_per_cup' ? '#FFFFFF' : '#2d3748'} 
                          />
                          <Text style={[
                            styles.measurementButtonText,
                            selectedMeasurement === 'grams_per_cup' && styles.measurementButtonTextActive,
                          ]}>כוסות</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    {selectedFood.grams_per_single_item && selectedFood.grams_per_single_item > 0 ? (
                      <TouchableOpacity
                        style={[
                          styles.measurementButton,
                          selectedMeasurement === 'grams_per_single_item' && styles.measurementButtonActive,
                        ]}
                        onPress={() => setSelectedMeasurement('grams_per_single_item')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.measurementButtonContent}>
                          <Weight 
                            size={18} 
                            color={selectedMeasurement === 'grams_per_single_item' ? '#FFFFFF' : '#2d3748'} 
                          />
                          <Text style={[
                            styles.measurementButtonText,
                            selectedMeasurement === 'grams_per_single_item' && styles.measurementButtonTextActive,
                          ]}>גרם</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    {selectedFood.grams_per_tbsp && selectedFood.grams_per_tbsp > 0 ? (
                      <TouchableOpacity
                        style={[
                          styles.measurementButton,
                          selectedMeasurement === 'grams_per_tbsp' && styles.measurementButtonActive,
                        ]}
                        onPress={() => setSelectedMeasurement('grams_per_tbsp')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.measurementButtonContent}>
                          <Soup 
                            size={18} 
                            color={selectedMeasurement === 'grams_per_tbsp' ? '#FFFFFF' : '#2d3748'} 
                          />
                          <Text style={[
                            styles.measurementButtonText,
                            selectedMeasurement === 'grams_per_tbsp' && styles.measurementButtonTextActive,
                          ]}>כפות</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                    {selectedFood.items_per_unit && selectedFood.items_per_unit > 0 ? (
                      <TouchableOpacity
                        style={[
                          styles.measurementButton,
                          selectedMeasurement === 'items_per_unit' && styles.measurementButtonActive,
                        ]}
                        onPress={() => setSelectedMeasurement('items_per_unit')}
                        activeOpacity={0.7}
                      >
                        <View style={styles.measurementButtonContent}>
                          <Hash 
                            size={18} 
                            color={selectedMeasurement === 'items_per_unit' ? '#FFFFFF' : '#2d3748'} 
                          />
                          <Text style={[
                            styles.measurementButtonText,
                            selectedMeasurement === 'items_per_unit' && styles.measurementButtonTextActive,
                          ]}>יחידות</Text>
                        </View>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {selectedMeasurement && (
                    <>
                      {(() => {
                        let measurementValue = 1;
                        let measurementLabel = "";
                        
                        if (selectedMeasurement === 'grams_per_single_item') {
                          measurementValue = selectedFood.grams_per_single_item || 1;
                          measurementLabel = getMeasurementLabel(measurementValue, 'גרם');
                        } else if (selectedMeasurement === 'items_per_unit') {
                          measurementValue = selectedFood.items_per_unit || 1;
                          measurementLabel = getMeasurementLabel(measurementValue, 'יחידות');
                        } else if (selectedMeasurement === 'grams_per_cup') {
                          measurementValue = selectedFood.grams_per_cup || 1;
                          measurementLabel = getMeasurementLabel(measurementValue, 'כוסות');
                        } else if (selectedMeasurement === 'grams_per_tbsp') {
                          measurementValue = selectedFood.grams_per_tbsp || 1;
                          measurementLabel = getMeasurementLabel(measurementValue, 'כפות');
                        }

                        const servingText = measurementValue === 1 
                          ? `${measurementLabel} שווה למנה אחת`
                          : `${formatUnit(measurementValue)} ${measurementLabel} שווים למנה אחת`;

                        return (
                          <Text style={styles.servingInfoText}>{servingText}</Text>
                        );
                      })()}

                      <View style={styles.counterSection}>
                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={decrementQuantity}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.counterButtonText}>-</Text>
                        </TouchableOpacity>

                        <TextInput
                          style={styles.counterValue}
                          value={quantity}
                          onChangeText={(text) => {
                            const cleaned = text.replace(/[^0-9.]/g, '');
                            const parts = cleaned.split('.');
                            if (parts.length > 2) {
                              setQuantity(parts[0] + '.' + parts.slice(1).join(''));
                            } else {
                              setQuantity(cleaned);
                            }
                          }}
                          keyboardType="decimal-pad"
                          selectTextOnFocus
                          returnKeyType="done"
                          onSubmitEditing={() => Keyboard.dismiss()}
                          blurOnSubmit={true}
                        />

                        <TouchableOpacity
                          style={styles.counterButton}
                          onPress={incrementQuantity}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.counterButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <View style={styles.calculationSection}>
                        <View style={styles.calcCard}>
                          <Image
                            source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp" }}
                            style={styles.calcIcon}
                            resizeMode="contain"
                          />
                          <Text style={styles.calcValue}>{formatUnit(calculateCalories())} קל׳</Text>
                        </View>
                        {selectedFood.protien_units > 0 && (
                          <View style={styles.calcCard}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                              style={styles.calcIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.calcValue}>{formatUnit(calculateMacro('protein'))}</Text>
                          </View>
                        )}
                        {selectedFood.carb_units > 0 && (
                          <View style={styles.calcCard}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                              style={styles.calcIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.calcValue}>{formatUnit(calculateMacro('carb'))}</Text>
                          </View>
                        )}
                        {selectedFood.fats_units > 0 && (
                          <View style={styles.calcCard}>
                            <Image
                              source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                              style={styles.calcIcon}
                              resizeMode="contain"
                            />
                            <Text style={styles.calcValue}>{formatUnit(calculateMacro('fat'))}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.sheetActions}>
                        <TouchableOpacity
                          style={styles.confirmButton}
                          onPress={handleConfirmMacroFood}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.confirmButtonText}>אישור</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cancelButton}
                          onPress={closeSheet}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.cancelButtonText}>ביטול</Text>
                        </TouchableOpacity>
                      </View>
                    </>
                  )}
                </View>
              ) : (
              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>{selectedFood.name}</Text>
                
                <View style={styles.counterSection}>
                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={decrementQuantity}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.counterButtonText}>-</Text>
                  </TouchableOpacity>

                  <TextInput
                    style={styles.counterValue}
                    value={quantity}
                    onChangeText={(text) => {
                      const cleaned = text.replace(/[^0-9.]/g, '');
                      const parts = cleaned.split('.');
                      if (parts.length > 2) {
                        setQuantity(parts[0] + '.' + parts.slice(1).join(''));
                      } else {
                        setQuantity(cleaned);
                      }
                    }}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                    returnKeyType="done"
                    onSubmitEditing={() => Keyboard.dismiss()}
                    blurOnSubmit={true}
                  />

                  <TouchableOpacity
                    style={styles.counterButton}
                    onPress={incrementQuantity}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.counterButtonText}>+</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calculationSection}>
                  <View style={styles.calcCard}>
                    <Image
                      source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009838/plate-eating_2_qqulpo.webp" }}
                      style={styles.calcIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.calcValue}>{formatUnit(selectedFood.caloreis_per_unit * (parseFloat(quantity) || 1))} קל׳</Text>
                  </View>
                  {selectedFood.category === "פרי" && selectedFood.fruit_units > 0 && (
                    <View style={styles.calcCard}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984881/apple-whole_qd32pt.webp" }}
                        style={styles.calcIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.calcValue}>{formatUnit(selectedFood.fruit_units * (parseFloat(quantity) || 1))} {selectedFood.fruit_unit || 'יח׳'}</Text>
                    </View>
                  )}
                  {selectedFood.category === "ירק" && selectedFood.veg_units > 0 && (
                    <View style={styles.calcCard}>
                      <Image
                        source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984894/broccoli_2_lk8kty.webp" }}
                        style={styles.calcIcon}
                        resizeMode="contain"
                      />
                      <Text style={styles.calcValue}>{formatUnit(selectedFood.veg_units * (parseFloat(quantity) || 1))} {selectedFood.veg_unit || 'יח׳'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.sheetActions}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>אישור</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={closeSheet}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cancelButtonText}>ביטול</Text>
                  </TouchableOpacity>
                </View>
              </View>
              )}
                </View>
              </ScrollView>
            </Animated.View>
          </TouchableOpacity>
        )}
      </View>
    </>
  );

  function calculateCalories(): number {
    if (!selectedFood || !selectedMeasurement) return 0;
    
    const quantityNum = parseFloat(quantity) || 1;
    let servings = 0;
    if (selectedMeasurement === 'grams_per_single_item') {
      const measurementValue = selectedFood.grams_per_single_item || 1;
      servings = quantityNum / measurementValue;
    } else if (selectedMeasurement === 'items_per_unit') {
      const measurementValue = selectedFood.items_per_unit || 1;
      servings = quantityNum / measurementValue;
    } else if (selectedMeasurement === 'grams_per_cup') {
      const measurementValue = selectedFood.grams_per_cup || 1;
      servings = quantityNum / measurementValue;
    } else if (selectedMeasurement === 'grams_per_tbsp') {
      const measurementValue = selectedFood.grams_per_tbsp || 1;
      servings = quantityNum / measurementValue;
    }
    
    return selectedFood.caloreis_per_unit * servings;
  }

  function calculateMacro(type: 'protein' | 'carb' | 'fat'): number {
    if (!selectedFood || !selectedMeasurement) return 0;
    
    const quantityNum = parseFloat(quantity) || 1;
    let servings = 0;
    if (selectedMeasurement === 'grams_per_single_item') {
      const measurementValue = selectedFood.grams_per_single_item || 1;
      servings = quantityNum / measurementValue;
    } else if (selectedMeasurement === 'items_per_unit') {
      const measurementValue = selectedFood.items_per_unit || 1;
      servings = quantityNum / measurementValue;
    } else if (selectedMeasurement === 'grams_per_cup') {
      const measurementValue = selectedFood.grams_per_cup || 1;
      servings = quantityNum / measurementValue;
    } else if (selectedMeasurement === 'grams_per_tbsp') {
      const measurementValue = selectedFood.grams_per_tbsp || 1;
      servings = quantityNum / measurementValue;
    }

    switch (type) {
      case 'protein':
        return selectedFood.protien_units * servings;
      case 'carb':
        return selectedFood.carb_units * servings;
      case 'fat':
        return selectedFood.fats_units * servings;
      default:
        return 0;
    }
  }

  async function handleConfirmMacroFood() {
    if (!selectedFood || !dailyLog?.id || !selectedMeasurement || !mealType) return;

    try {
      const quantityNum = parseFloat(quantity) || 1;
      console.log("[FoodBank] Adding macro food:", selectedFood.name, "x", quantityNum, selectedMeasurement, "to", mealType);

      let servings = 0;
      let totalGrams = 0;
      
      if (selectedMeasurement === 'grams_per_single_item') {
        const measurementValue = selectedFood.grams_per_single_item || 1;
        servings = quantityNum / measurementValue;
        totalGrams = quantityNum;
      } else if (selectedMeasurement === 'items_per_unit') {
        const measurementValue = selectedFood.items_per_unit || 1;
        servings = quantityNum / measurementValue;
        totalGrams = quantityNum;
      } else if (selectedMeasurement === 'grams_per_cup') {
        const measurementValue = selectedFood.grams_per_cup || 1;
        servings = quantityNum / measurementValue;
        totalGrams = quantityNum;
      } else if (selectedMeasurement === 'grams_per_tbsp') {
        const measurementValue = selectedFood.grams_per_tbsp || 1;
        servings = quantityNum / measurementValue;
        totalGrams = quantityNum;
      }

      const proteinUnits = selectedFood.protien_units * servings;
      const carbUnits = selectedFood.carb_units * servings;
      const fatUnits = selectedFood.fats_units * servings;
      const totalCalories = selectedFood.caloreis_per_unit * servings;

      // Insert into daily_items
      const { error: itemError } = await supabase
        .from("daily_items")
        .insert([{
          daily_log_id: dailyLog.id,
          food_id: selectedFood.id,
          meal_category: mealType,
          measure_type: selectedMeasurement === 'grams_per_single_item' ? 'grams' : 
                       selectedMeasurement === 'items_per_unit' ? 'unit' :
                       selectedMeasurement === 'grams_per_cup' ? 'cup' : 'tbsp',
          quantity: quantityNum,
          grams: totalGrams,
          kcal: totalCalories,
          protein_units: proteinUnits,
          carb_units: carbUnits,
          fat_units: fatUnits,
          veg_units: 0,
          fruit_units: 0,
        }]);

      if (itemError) {
        console.error("[FoodBank] Error inserting daily item:", itemError);
        throw itemError;
      }

      console.log("[FoodBank] Daily item inserted successfully");

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      // Calculate new values
      const newCalories = caloriesIntake + totalCalories;
      const newProtein = proteinIntake + proteinUnits;
      const newCarb = carbIntake + carbUnits;
      const newFat = fatIntake + fatUnits;

      if (totalCalories > 0) triggerMacroAnimation('calories', newCalories, goals.calories);
      if (proteinUnits > 0) triggerMacroAnimation('protein', newProtein, goals.protein);
      if (carbUnits > 0) triggerMacroAnimation('carb', newCarb, goals.carb);
      if (fatUnits > 0) triggerMacroAnimation('fat', newFat, goals.fat);

      setSuccessItem(selectedFood);
      setShowSuccess(true);
      closeSheet();
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity("1");
      }, 2000);
    } catch (error) {
      console.error("[FoodBank] Failed to add food:", error);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5F5",
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
  headerContent: {
    flexDirection: "row" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  macroCardsContainer: {
    flexDirection: "row-reverse" as any,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
    zIndex: 1,
    alignItems: "center",
  },
  macroCardWrapperCalories: {
    flex: 1.5,
    alignItems: "center",
    gap: 4,
  },
  macroCardCalories: {
    width: "100%",
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
  macroCardWrapper: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  macroIntakeText: {
    fontSize: 9,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "center",
  },
  macroIconOnly: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    height: 68,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  controlsSection: {
    backgroundColor: "#E8F5F5",
    paddingBottom: 16,
    gap: 12,
  },
  categoriesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoriesScroll: {
    paddingHorizontal: 12,
    gap: 16,
    flexDirection: "row-reverse" as any,
  },
  categoryItem: {
    alignItems: "center",
    gap: 8,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  categoryIconContainerActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}15`,
  },
  categoryIcon: {
    width: 32,
    height: 32,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: "center",
    maxWidth: 70,
  },
  categoryTextActive: {
    color: colors.primary,
    fontWeight: "700" as const,
  },
  subCategoriesContainer: {
    marginTop: 4,
  },
  subCategoriesScroll: {
    gap: 8,
    paddingRight: 4,
  },
  subCategoryChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#DDD",
  },
  subCategoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subCategoryText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#666",
  },
  subCategoryTextActive: {
    color: "#FFFFFF",
  },
  searchContainer: {
    marginTop: 4,
  },
  searchInputContainer: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#2d3748",
    textAlign: "right",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  foodGrid: {
    flexDirection: "row-reverse" as any,
    flexWrap: "wrap",
    gap: 12,
  },
  foodCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  foodImage: {
    width: "100%",
    height: 140,
    backgroundColor: "#F0F0F0",
  },
  foodImagePlaceholder: {
    width: "100%",
    height: 140,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  foodImagePlaceholderText: {
    fontSize: 48,
    fontWeight: "700" as const,
    color: "#999",
  },
  foodInfo: {
    padding: 12,
    gap: 8,
    position: "relative" as const,
  },
  categoryIconTopContainer: {
    position: "absolute" as const,
    top: 4,
    right: 4,
    width: 28,
    height: 28,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconTop: {
    width: 20,
    height: 20,
  },
  foodName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: "right",
    minHeight: 36,
  },
  servingText: {
    fontSize: 9,
    fontWeight: "500" as const,
    color: "#718096",
    textAlign: "right",
    marginBottom: 4,
    lineHeight: 13,
  },
  foodNutrition: {
    flexDirection: "row-reverse" as any,
    flexWrap: "wrap",
    gap: 4,
  },
  nutritionBadge: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  nutritionIcon: {
    width: 12,
    height: 12,
  },
  nutritionText: {
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  foodCalories: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.primary,
    textAlign: "right",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
  overlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
    zIndex: 10000,
  },
  bottomSheet: {
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
  keyboardAvoid: {
    flex: 1,
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
  sheetContent: {
    paddingHorizontal: 24,
    gap: 24,
    paddingBottom: 40,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
  },
  counterSection: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 32,
  },
  counterButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  counterButtonText: {
    fontSize: 32,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    lineHeight: 32,
  },
  counterValue: {
    fontSize: 36,
    fontWeight: "700" as const,
    color: "#2d3748",
    minWidth: 60,
    textAlign: "center",
  },
  servingInfoText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#718096",
    textAlign: "center",
    marginBottom: 8,
  },
  calculationSection: {
    flexDirection: "row-reverse" as any,
    justifyContent: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  calcCard: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7FAFC",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  calcIcon: {
    width: 28,
    height: 28,
  },
  calcValue: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  sheetActions: {
    flexDirection: "row-reverse" as any,
    gap: 12,
    marginTop: 8,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#718096",
  },
  successNotification: {
    position: "absolute" as const,
    bottom: 40,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  successContent: {
    backgroundColor: "#48BB78",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  successText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
  successMessage: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    flex: 1,
    textAlign: "right",
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

  macroProgressBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  macroProgressFill: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(112, 238, 255, 0.2)",
    borderRadius: 12,
  },
  macroProgressFillRed: {
    backgroundColor: "rgba(255, 59, 48, 0.2)",
  },
  imageContainer: {
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  sheetImage: {
    width: "100%",
    height: 200,
    borderRadius: 16,
  },
  measurementOptions: {
    flexDirection: "row-reverse" as any,
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  measurementButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F7FAFC",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  measurementButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  measurementButtonContent: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 6,
  },
  measurementButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  measurementButtonTextActive: {
    color: "#FFFFFF",
    fontWeight: "700" as const,
  },
});
