import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { Stack, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/lib/supabase";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { UserPlus } from "lucide-react-native";

export default function AdminAddClientScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    name: "",
    kcalGoal: "",
    proteinUnits: "",
    carbUnits: "",
    fatUnits: "",
    fruitUnits: "",
    vegUnits: "",
    weeklyCardioMinutes: "",
    weeklyStrengthWorkouts: "",
  });

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !formData.name) {
      Alert.alert("שגיאה", "נא למלא את כל השדות הנדרשים");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error("[AdminAddClient] Auth error:", authError);
        Alert.alert("שגיאה", authError.message);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            name: formData.name,
            kcal_goal: Number(formData.kcalGoal) || 0,
            protein_units: Number(formData.proteinUnits) || 0,
            carb_units: Number(formData.carbUnits) || 0,
            fat_units: Number(formData.fatUnits) || 0,
            fruit_units: Number(formData.fruitUnits) || 0,
            veg_units: Number(formData.vegUnits) || 0,
            weekly_cardio_minutes: Number(formData.weeklyCardioMinutes) || 0,
            weekly_strength_workouts: Number(formData.weeklyStrengthWorkouts) || 0,
          })
          .eq("user_id", authData.user.id);

        if (profileError) {
          console.error("[AdminAddClient] Profile error:", profileError);
          Alert.alert("שגיאה", "נוצר משתמש אך לא ניתן לעדכן את הפרופיל");
        } else {
          Alert.alert("הצלחה", "לקוח חדש נוסף בהצלחה");
          router.back();
        }
      }
    } catch (error) {
      console.error("[AdminAddClient] Error:", error);
      Alert.alert("שגיאה", "אירעה שגיאה בהוספת הלקוח");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user?.role !== "admin") {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen
          options={{
            headerShown: true,
            title: "הוסף לקוח",
            headerStyle: {
              backgroundColor: "#3FCDD1",
            },
            headerTintColor: "#FFFFFF",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>אין לך הרשאות גישה</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#3FCDD1", "#FFFFFF"]}
      locations={[0, 0.4]}
      style={styles.container}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: "הוסף לקוח חדש",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>פרטי התחברות</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>אימייל *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="הזן אימייל"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>סיסמה *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="הזן סיסמה"
              secureTextEntry
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>שם מלא *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="הזן שם מלא"
              textAlign="right"
            />
          </View>

          <Text style={styles.sectionTitle}>יעדים תזונתיים</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>יעד קלוריות יומי</Text>
            <TextInput
              style={styles.input}
              value={formData.kcalGoal}
              onChangeText={(text) => setFormData({ ...formData, kcalGoal: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות חלבון</Text>
            <TextInput
              style={styles.input}
              value={formData.proteinUnits}
              onChangeText={(text) => setFormData({ ...formData, proteinUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות פחמימות</Text>
            <TextInput
              style={styles.input}
              value={formData.carbUnits}
              onChangeText={(text) => setFormData({ ...formData, carbUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות שומן</Text>
            <TextInput
              style={styles.input}
              value={formData.fatUnits}
              onChangeText={(text) => setFormData({ ...formData, fatUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות פירות</Text>
            <TextInput
              style={styles.input}
              value={formData.fruitUnits}
              onChangeText={(text) => setFormData({ ...formData, fruitUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>מנות ירקות</Text>
            <TextInput
              style={styles.input}
              value={formData.vegUnits}
              onChangeText={(text) => setFormData({ ...formData, vegUnits: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <Text style={styles.sectionTitle}>יעדי אימונים</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>דקות אירובי שבועי</Text>
            <TextInput
              style={styles.input}
              value={formData.weeklyCardioMinutes}
              onChangeText={(text) => setFormData({ ...formData, weeklyCardioMinutes: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>אימוני כוח שבועי</Text>
            <TextInput
              style={styles.input}
              value={formData.weeklyStrengthWorkouts}
              onChangeText={(text) => setFormData({ ...formData, weeklyStrengthWorkouts: text })}
              placeholder="0"
              keyboardType="numeric"
              textAlign="right"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <UserPlus color="#FFFFFF" size={24} />
                <Text style={styles.submitButtonText}>הוסף לקוח</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "right",
    marginTop: 16,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#718096",
    textAlign: "right",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#F7FAFC",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#2d3748",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 16,
    flexDirection: "row" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
});
