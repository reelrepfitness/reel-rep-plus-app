import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Camera, Image as ImageIcon } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { colors } from "@/constants/colors";
import { useHomeData } from "@/lib/useHomeData";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";

interface FoodItem {
  name: string;
  quantity: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export default function AIPhotoAnalysisScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { dailyLog } = useHomeData();
  
  const mealType = params.mealType as string | undefined;
  
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analyzedItems, setAnalyzedItems] = useState<FoodItem[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("נדרשת הרשאת מצלמה");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const pickFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert("נדרשת הרשאת גלריה");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
      analyzeImage(result.assets[0].uri);
    }
  };

  const calculatePortions = (calories: number, proteinG: number, carbsG: number, fatsG: number) => {
    const proteinCal = proteinG * 4;
    const carbsCal = carbsG * 4;
    const fatsCal = fatsG * 9;
    
    const totalMacroCal = proteinCal + carbsCal + fatsCal;
    
    if (totalMacroCal === 0) {
      return { protein: 0, carbs: 0, fats: 0 };
    }
    
    const proteinRatio = proteinCal / totalMacroCal;
    const carbsRatio = carbsCal / totalMacroCal;
    const fatsRatio = fatsCal / totalMacroCal;
    
    let proteinPortions = 0;
    let carbsPortions = 0;
    let fatsPortions = 0;
    
    if (proteinRatio > 0.5) {
      proteinPortions = calories / 200;
    } else if (carbsRatio > 0.5) {
      carbsPortions = calories / 120;
    } else if (fatsRatio > 0.5) {
      fatsPortions = calories / 120;
    } else {
      const maxRatio = Math.max(proteinRatio, carbsRatio, fatsRatio);
      
      if (maxRatio === proteinRatio) {
        proteinPortions = (calories * proteinRatio) / 200;
        if (carbsRatio > 0.2) {
          carbsPortions = (calories * carbsRatio) / 120;
        }
        if (fatsRatio > 0.2) {
          fatsPortions = (calories * fatsRatio) / 120;
        }
      } else if (maxRatio === carbsRatio) {
        carbsPortions = (calories * carbsRatio) / 120;
        if (proteinRatio > 0.2) {
          proteinPortions = (calories * proteinRatio) / 200;
        }
        if (fatsRatio > 0.2) {
          fatsPortions = (calories * fatsRatio) / 120;
        }
      } else {
        fatsPortions = (calories * fatsRatio) / 120;
        if (proteinRatio > 0.2) {
          proteinPortions = (calories * proteinRatio) / 200;
        }
        if (carbsRatio > 0.2) {
          carbsPortions = (calories * carbsRatio) / 120;
        }
      }
    }
    
    return {
      protein: Math.round(proteinPortions * 10) / 10,
      carbs: Math.round(carbsPortions * 10) / 10,
      fats: Math.round(fatsPortions * 10) / 10,
    };
  };

  const analyzeImage = async (imageUri: string) => {
    setIsAnalyzing(true);
    
    try {
      console.log("[AI] Analyzing image...");
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockRawData = [
        { name: "חזה עוף צלוי", quantity: "150 גרם", calories: 250, proteinG: 45, carbsG: 0, fatsG: 5 },
        { name: "אורז מלא", quantity: "1 כוס", calories: 180, proteinG: 5, carbsG: 38, fatsG: 1 },
        { name: "סלט ירקות", quantity: "1 מנה", calories: 50, proteinG: 2, carbsG: 8, fatsG: 2 },
      ];
      
      const mockItems: FoodItem[] = mockRawData.map(item => {
        const portions = calculatePortions(item.calories, item.proteinG, item.carbsG, item.fatsG);
        return {
          name: item.name,
          quantity: item.quantity,
          calories: item.calories,
          protein: portions.protein,
          carbs: portions.carbs,
          fats: portions.fats,
        };
      });
      
      setAnalyzedItems(mockItems);
      setShowResults(true);
    } catch (error) {
      console.error("[AI] Error analyzing image:", error);
      alert("שגיאה בניתוח התמונה");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!dailyLog?.id || !mealType || analyzedItems.length === 0) return;

    try {
      console.log("[AI] Adding analyzed items to daily log");
      
      for (const item of analyzedItems) {
        const { error } = await supabase
          .from("daily_items")
          .insert([{
            daily_log_id: dailyLog.id,
            food_id: null,
            meal_category: mealType,
            measure_type: "unit",
            quantity: 1,
            grams: 0,
            kcal: item.calories,
            protein_units: item.protein,
            carb_units: item.carbs,
            fat_units: item.fats,
            veg_units: 0,
            fruit_units: 0,
          }]);

        if (error) {
          console.error("[AI] Error inserting item:", error);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["dailyLog"] });
      queryClient.invalidateQueries({ queryKey: ["dailyItems"] });

      router.back();
    } catch (error) {
      console.error("[AI] Failed to add items:", error);
      alert("שגיאה בהוספת הפריטים");
    }
  };

  const formatUnit = (value: number) => {
    return value % 1 === 0 ? value.toString() : value.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ניתוח AI</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {!selectedImage ? (
          <View style={styles.emptyState}>
            <Camera size={80} color={colors.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>צלם את הצלחת שלך</Text>
            <Text style={styles.emptySubtitle}>
              ה-AI יזהה את המזון ויחשב את הערכים התזונתיים
            </Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Camera size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.cameraButtonText}>פתח מצלמה</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.galleryButton}
                onPress={pickFromGallery}
                activeOpacity={0.8}
              >
                <ImageIcon size={24} color={colors.primary} strokeWidth={2} />
                <Text style={styles.galleryButtonText}>בחר מהגלריה</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.selectedImage}
                resizeMode="cover"
              />
              <View style={styles.retakeButtonsContainer}>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={pickImage}
                  activeOpacity={0.8}
                >
                  <Camera size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.retakeButtonText}>צלם שוב</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.retakeButton}
                  onPress={pickFromGallery}
                  activeOpacity={0.8}
                >
                  <ImageIcon size={16} color="#FFFFFF" strokeWidth={2} />
                  <Text style={styles.retakeButtonText}>גלריה</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isAnalyzing && (
              <View style={styles.analyzingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.analyzingText}>מנתח תמונה...</Text>
              </View>
            )}

            {showResults && !isAnalyzing && (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsTitle}>תוצאות הניתוח</Text>
                
                {analyzedItems.map((item, index) => (
                  <View key={index} style={styles.foodItemCard}>
                    <View style={styles.foodItemHeader}>
                      <Text style={styles.foodItemName}>{item.name}</Text>
                      <Text style={styles.foodItemQuantity}>{item.quantity}</Text>
                    </View>
                    
                    <View style={styles.foodItemMacros}>
                      <View style={styles.macroItem}>
                        <Image
                          source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1759009803/plate-eating_1_d4pvta.webp" }}
                          style={styles.macroIconSmall}
                          resizeMode="contain"
                        />
                        <Text style={styles.macroText}>{item.calories} קל׳</Text>
                      </View>
                      {item.protein > 0 && (
                        <View style={styles.macroItem}>
                          <Image
                            source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984871/steak_5_sp4m3p.webp" }}
                            style={styles.macroIconSmall}
                            resizeMode="contain"
                          />
                          <Text style={styles.macroText}>{formatUnit(item.protein)}</Text>
                        </View>
                      )}
                      {item.carbs > 0 && (
                        <View style={styles.macroItem}>
                          <Image
                            source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984845/bread-slice_5_ghymvi.webp" }}
                            style={styles.macroIconSmall}
                            resizeMode="contain"
                          />
                          <Text style={styles.macroText}>{formatUnit(item.carbs)}</Text>
                        </View>
                      )}
                      {item.fats > 0 && (
                        <View style={styles.macroItem}>
                          <Image
                            source={{ uri: "https://res.cloudinary.com/dtffqhujt/image/upload/v1758984844/avocado_4_bncwv5.webp" }}
                            style={styles.macroIconSmall}
                            resizeMode="contain"
                          />
                          <Text style={styles.macroText}>{formatUnit(item.fats)}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.confirmButtonText}>אשר והוסף</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#E8F5F5",
  },
  header: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#000000",
    zIndex: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    marginTop: 24,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#718096",
    marginTop: 12,
    textAlign: "center",
    lineHeight: 24,
  },
  buttonRow: {
    flexDirection: "row-reverse" as any,
    gap: 12,
    marginTop: 32,
  },
  cameraButton: {
    flex: 1,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  cameraButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  galleryButton: {
    flex: 1,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.primary,
  },
  imageContainer: {
    marginBottom: 24,
  },
  selectedImage: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    backgroundColor: "#F0F0F0",
  },
  retakeButtonsContainer: {
    position: "absolute" as const,
    bottom: 16,
    right: 16,
    flexDirection: "row-reverse" as any,
    gap: 8,
  },
  retakeButton: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retakeButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
  },
  analyzingContainer: {
    alignItems: "center",
    gap: 16,
    paddingVertical: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: "#2d3748",
  },
  resultsContainer: {
    gap: 16,
  },
  resultsTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "center",
    marginBottom: 8,
  },
  foodItemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  foodItemHeader: {
    flexDirection: "row-reverse" as any,
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodItemName: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  foodItemQuantity: {
    fontSize: 14,
    color: "#718096",
  },
  foodItemMacros: {
    flexDirection: "row-reverse" as any,
    flexWrap: "wrap",
    gap: 12,
  },
  macroItem: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F7FAFC",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  macroIconSmall: {
    width: 20,
    height: 20,
  },
  macroText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  actionsContainer: {
    marginTop: 8,
  },
  confirmButton: {
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
});
