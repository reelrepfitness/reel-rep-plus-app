import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { ChevronLeft, Plus, Trash2 } from "lucide-react-native";
import { colors } from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

interface MealPlanItem {
  id: string;
  food_id: number;
  meal_category: string;
  quantity: number;
  kcal: number;
  protein_units: number;
  carb_units: number;
  fat_units: number;
  veg_units: number;
  fruit_units: number;
  food_item?: {
    id: number;
    name: string;
    img_url: string | null;
  };
}

const MEAL_CATEGORIES = ["ארוחת בוקר", "ארוחת ביניים", "ארוחת צהריים", "ארוחת ערב"];

export default function AdminBuildMealPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const queryClient = useQueryClient();
  
  const { data: mealPlanItems = [], isLoading } = useQuery({
    queryKey: ["adminMealPlan", userId],
    queryFn: async () => {
      if (!userId) return [];

      console.log("[AdminMealPlan] Fetching meal plan for user:", userId);

      const { data, error } = await supabase
        .from("meal_plan_items")
        .select(`
          *,
          food_item:food_id (
            id,
            name,
            img_url
          )
        `)
        .eq("user_id", userId)
        .order("meal_category", { ascending: true });

      if (error) {
        console.error("[AdminMealPlan] Error fetching meal plan:", error);
        throw error;
      }

      console.log(`[AdminMealPlan] Loaded ${data?.length || 0} items`);
      return data as MealPlanItem[];
    },
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from("meal_plan_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminMealPlan", userId] });
    },
    onError: (error) => {
      console.error("[AdminMealPlan] Error deleting item:", error);
      Alert.alert("שגיאה", "אירעה שגיאה במחיקת הפריט");
    },
  });

  const handleAddFood = (category: string) => {
    router.push({
      pathname: "/food-bank",
      params: { 
        mealType: category,
        userId: userId,
        isAdminMealPlan: "true"
      },
    });
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      "מחיקת פריט",
      "האם אתה בטוח שברצונך למחוק פריט זה?",
      [
        { text: "ביטול", style: "cancel" },
        { text: "מחק", style: "destructive", onPress: () => deleteMutation.mutate(itemId) },
      ]
    );
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, { paddingTop: insets.top }]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <View style={[styles.stickyHeader, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerGlass} />

          <View style={styles.headerContent}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <ChevronLeft color="#FFFFFF" size={24} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>בניית תפריט</Text>
              <Text style={styles.headerSubtitle}>{userName}</Text>
            </View>

            <View style={{ width: 40 }} />
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.content, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {MEAL_CATEGORIES.map((category) => {
            const categoryItems = mealPlanItems.filter(
              (item) => item.meal_category === category
            );

            const totals = categoryItems.reduce(
              (acc, item) => ({
                calories: acc.calories + item.kcal,
                protein: acc.protein + item.protein_units,
                carbs: acc.carbs + item.carb_units,
                fats: acc.fats + item.fat_units,
                veg: acc.veg + item.veg_units,
                fruit: acc.fruit + item.fruit_units,
              }),
              { calories: 0, protein: 0, carbs: 0, fats: 0, veg: 0, fruit: 0 }
            );

            return (
              <View key={category} style={styles.mealCard}>
                <View style={styles.mealHeader}>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => handleAddFood(category)}
                    activeOpacity={0.7}
                  >
                    <Plus size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                  <Text style={styles.mealTitle}>{category}</Text>
                </View>

                {categoryItems.length > 0 ? (
                  <>
                    <View style={styles.itemsList}>
                      {categoryItems.map((item) => (
                        <View key={item.id} style={styles.itemCard}>
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteItem(item.id)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={16} color="#FF6B6B" />
                          </TouchableOpacity>

                          <View style={styles.itemInfo}>
                            <Text style={styles.itemName}>
                              {item.food_item?.name || "מזון"}
                            </Text>
                            <Text style={styles.itemDetails}>
                              כמות: {item.quantity} | {Math.round(item.kcal)} קל&apos;
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>

                    <View style={styles.totalsRow}>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>קלוריות</Text>
                        <Text style={styles.totalValue}>{Math.round(totals.calories)}</Text>
                      </View>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>חלבון</Text>
                        <Text style={styles.totalValue}>{totals.protein.toFixed(1)}</Text>
                      </View>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>פחמימות</Text>
                        <Text style={styles.totalValue}>{totals.carbs.toFixed(1)}</Text>
                      </View>
                      <View style={styles.totalItem}>
                        <Text style={styles.totalLabel}>שומן</Text>
                        <Text style={styles.totalValue}>{totals.fats.toFixed(1)}</Text>
                      </View>
                    </View>
                  </>
                ) : (
                  <Text style={styles.emptyText}>לחץ על + להוספת מזון</Text>
                )}
              </View>
            );
          })}
        </ScrollView>
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
  headerContent: {
    flexDirection: "row" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
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
  headerTitleContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mealCard: {
    backgroundColor: "#0A0A0A",
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  mealHeader: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  mealTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  itemsList: {
    gap: 8,
    marginBottom: 16,
  },
  itemCard: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#FFFFFF",
    textAlign: "right",
    marginBottom: 4,
  },
  itemDetails: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  emptyText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    paddingVertical: 20,
  },
  totalsRow: {
    flexDirection: "row-reverse" as any,
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  totalItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: "rgba(255, 255, 255, 0.7)",
  },
  totalValue: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
