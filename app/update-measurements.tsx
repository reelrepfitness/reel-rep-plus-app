import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Keyboard,
  Platform,
  InputAccessoryView,
  Pressable,
  Modal,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo, ReactNode } from "react";
import { colors } from "@/constants/colors";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Weight,
  Percent,
  Ruler,
  Activity,
  CheckCircle,
  AlertCircle,
  Calendar,
  TrendingUp,
} from "lucide-react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type MeasurementData = {
  bodyWeight: string;
  height: string;
  waist: string;
  arm: string;
  thigh: string;
  neck: string;
  shoulder: string;
  frontArmSkinfold: string;
  backArmSkinfold: string;
  subscapularSkinfold: string;
  abdominalSkinfold: string;
};

export default function UpdateMeasurementsScreen() {
  const { userId, userName } = useLocalSearchParams<{ userId: string; userName: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("gender, age")
        .eq("user_id", userId)
        .single();
      if (error) throw error;
      return data as { gender: "male" | "female" | null; age: string | null };
    },
    enabled: !!userId,
  });

  const { data: previousMeasurements } = useQuery({
    queryKey: ["previous-measurements", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("body_measurements")
        .select("*")
        .eq("user_id", userId)
        .order("measurement_date", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
  
  const [measurements, setMeasurements] = useState<MeasurementData>({
    bodyWeight: "",
    height: "",
    waist: "",
    arm: "",
    thigh: "",
    neck: "",
    shoulder: "",
    frontArmSkinfold: "",
    backArmSkinfold: "",
    subscapularSkinfold: "",
    abdominalSkinfold: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const calculateBMI = useMemo(() => {
    const { bodyWeight, height } = measurements;
    
    if (!bodyWeight || !height) {
      return null;
    }

    const weight = parseFloat(bodyWeight);
    const heightInMeters = parseFloat(height) / 100;

    if (isNaN(weight) || isNaN(heightInMeters) || heightInMeters === 0) {
      return null;
    }

    const bmi = weight / (heightInMeters * heightInMeters);

    let classification: string;
    if (bmi < 18.5) {
      classification = "תת משקל";
    } else if (bmi < 25) {
      classification = "נורמה";
    } else if (bmi < 30) {
      classification = "עודף משקל";
    } else if (bmi < 35) {
      classification = "השמנה דרגה 1";
    } else if (bmi < 40) {
      classification = "השמנה דרגה 2";
    } else {
      classification = "השמנה דרגה 3";
    }

    return { value: bmi.toFixed(2), classification };
  }, [measurements]);

  const calculateBodyFat = useMemo(() => {
    const { frontArmSkinfold, backArmSkinfold, subscapularSkinfold, abdominalSkinfold } = measurements;
    const gender = userProfile?.gender;
    const age = userProfile?.age;
    
    if (!gender || !age || !frontArmSkinfold || !backArmSkinfold || !subscapularSkinfold || !abdominalSkinfold) {
      return null;
    }

    const ageNum = parseInt(age);
    const biceps = parseFloat(frontArmSkinfold);
    const triceps = parseFloat(backArmSkinfold);
    const subscapular = parseFloat(subscapularSkinfold);
    const suprailiac = parseFloat(abdominalSkinfold);

    if (ageNum < 17 || ageNum > 100) {
      return { error: "גי�� חייב להיות בין 17-100" };
    }

    if (biceps < 1 || biceps > 50 || triceps < 1 || triceps > 50 || 
        subscapular < 1 || subscapular > 50 || suprailiac < 1 || suprailiac > 50) {
      return { error: "מדידת קפלי עור חייבת להיות בין 1-50 מ״מ" };
    }

    const sum = biceps + triceps + subscapular + suprailiac;
    const logSum = Math.log10(sum);

    let bodyDensity: number;

    if (gender === "male") {
      if (ageNum >= 17 && ageNum <= 19) {
        bodyDensity = 1.1620 - 0.0630 * logSum;
      } else if (ageNum >= 20 && ageNum <= 29) {
        bodyDensity = 1.1631 - 0.0632 * logSum;
      } else if (ageNum >= 30 && ageNum <= 39) {
        bodyDensity = 1.1422 - 0.0544 * logSum;
      } else if (ageNum >= 40 && ageNum <= 49) {
        bodyDensity = 1.1620 - 0.0700 * logSum;
      } else {
        bodyDensity = 1.1715 - 0.0779 * logSum;
      }
    } else {
      if (ageNum >= 17 && ageNum <= 19) {
        bodyDensity = 1.1549 - 0.0678 * logSum;
      } else if (ageNum >= 20 && ageNum <= 29) {
        bodyDensity = 1.1599 - 0.0717 * logSum;
      } else if (ageNum >= 30 && ageNum <= 39) {
        bodyDensity = 1.1423 - 0.0632 * logSum;
      } else if (ageNum >= 40 && ageNum <= 49) {
        bodyDensity = 1.1333 - 0.0612 * logSum;
      } else {
        bodyDensity = 1.1339 - 0.0645 * logSum;
      }
    }

    if (bodyDensity < 1.0 || bodyDensity > 1.1) {
      return { error: "תוצאת חישוב לא תקינה - נא לבדוק את המדידות" };
    }

    const bodyFatPercentage = ((4.95 / bodyDensity) - 4.50) * 100;

    if (bodyFatPercentage < 3 || bodyFatPercentage > 50) {
      return { error: "תוצאת אחוז שומן לא סבירה - נא לבדוק את המדידות" };
    }

    return { value: bodyFatPercentage.toFixed(1) };
  }, [measurements, userProfile]);

  const updateMutation = useMutation({
    mutationFn: async (data: MeasurementData) => {
      console.log("[UpdateMeasurements] Updating measurements for user:", userId);

      const measurementData: any = {
        user_id: userId,
        measurement_date: selectedDate.toISOString(),
      };

      if (data.bodyWeight) measurementData.body_weight = parseFloat(data.bodyWeight);
      
      if (calculateBodyFat && !calculateBodyFat.error && calculateBodyFat.value) {
        measurementData.body_fat_percentage = parseFloat(calculateBodyFat.value);
      }
      
      if (data.waist) measurementData.waist_circumference = parseFloat(data.waist);
      if (data.arm) measurementData.arm_circumference = parseFloat(data.arm);
      if (data.thigh) measurementData.thigh_circumference = parseFloat(data.thigh);
      if (data.neck) measurementData.neck_circumference = parseFloat(data.neck);
      if (data.shoulder) measurementData.shoulder_circumference = parseFloat(data.shoulder);

      if (data.bodyWeight && calculateBodyFat && !calculateBodyFat.error && calculateBodyFat.value) {
        const weight = parseFloat(data.bodyWeight);
        const fatPercentage = parseFloat(calculateBodyFat.value);
        measurementData.body_fat_mass = (weight * fatPercentage) / 100;
        measurementData.lean_mass = weight - measurementData.body_fat_mass;
      }

      if (data.height) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ height: parseFloat(data.height) })
          .eq("user_id", userId);

        if (profileError) throw profileError;
      }

      const { error } = await supabase
        .from("body_measurements")
        .insert(measurementData);

      if (error) throw error;

      return measurementData;
    },
    onSuccess: () => {
      console.log("[UpdateMeasurements] Measurements updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-calories-7days", userId] });
      setSubmitted(true);
      setTimeout(() => {
        router.back();
      }, 2000);
    },
    onError: (error: any) => {
      console.error("[UpdateMeasurements] Error updating measurements:", error);
    },
  });

  const handleSubmit = () => {
    Keyboard.dismiss();
    
    const hasAnyMeasurement = measurements.bodyWeight || measurements.height || 
                             measurements.waist || measurements.arm || 
                             measurements.thigh || measurements.neck || measurements.shoulder ||
                             (calculateBodyFat && !calculateBodyFat.error);
    
    if (!hasAnyMeasurement) {
      return;
    }

    updateMutation.mutate(measurements);
  };

  const updateMeasurement = (field: keyof MeasurementData, value: string) => {
    setMeasurements(prev => ({ ...prev, [field]: value }));
  };

  const isValid = measurements.bodyWeight || measurements.height || 
                  measurements.waist || measurements.arm || 
                  measurements.thigh || measurements.neck || measurements.shoulder ||
                  (calculateBodyFat && !calculateBodyFat.error);

  if (submitted) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.successContainer}>
          <CheckCircle color={colors.primary} size={80} />
          <Text style={styles.successTitle}>מדידות נשמרו בהצלחה!</Text>
          <Text style={styles.successSubtitle}>חוזרים למסך הקודם...</Text>
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
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft color={colors.white} size={24} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>מפגש מדידה מקצועי</Text>
          <Text style={styles.headerSubtitle}>{userName}</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity 
          style={styles.dateCard}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.7}
        >
          <Calendar color={colors.primary} size={24} />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('he-IL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Activity color={colors.primary} size={28} />
          <Text style={styles.infoTitle}>טופס מדידה מקצועי</Text>
          <Text style={styles.infoText}>
            נא למלא את כל השדות הרלוונטיים. חישוב אחוז שומן מדויק יתבצע אוטומטית על פי שיטת Durnin-Womersley
          </Text>
        </View>



        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Weight color="#E53935" size={24} />
            <Text style={styles.sectionTitle}>מדדי גוף בסיסיים</Text>
          </View>

          <View style={styles.measurementCard}>
            <View style={styles.iconContainer}>
              <Weight color={colors.primary} size={28} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>משקל גוף (ק״ג)</Text>
              <TextInput
                style={styles.input}
                placeholder="75.5"
                placeholderTextColor={colors.gray}
                value={measurements.bodyWeight}
                onChangeText={(value) => updateMeasurement("bodyWeight", value)}
                keyboardType="decimal-pad"
                returnKeyType="done"
                inputAccessoryViewID="measurementDone"
              />
            </View>
          </View>

          <View style={styles.measurementCard}>
            <View style={styles.iconContainer}>
              <Ruler color="#9C27B0" size={28} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>גובה (ס״מ)</Text>
              <TextInput
                style={styles.input}
                placeholder="175"
                placeholderTextColor={colors.gray}
                value={measurements.height}
                onChangeText={(value) => updateMeasurement("height", value)}
                keyboardType="decimal-pad"
                returnKeyType="done"
                inputAccessoryViewID="measurementDone"
              />
            </View>
          </View>

          {calculateBMI && (
            <View style={styles.bmiCard}>
              <View style={styles.bmiRow}>
                <View style={styles.bmiClassificationContainer}>
                  <Text style={styles.bmiClassificationLabel}>סיווג</Text>
                  <Text style={styles.bmiClassificationValue}>{calculateBMI.classification}</Text>
                </View>
                <View style={styles.bmiValueContainer}>
                  <Text style={styles.bmiLabel}>BMI</Text>
                  <Text style={styles.bmiValue}>{calculateBMI.value}</Text>
                </View>
              </View>
            </View>
          )}
        </View>



        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ruler color="#43A047" size={24} />
            <Text style={styles.sectionTitle}>היקפי גוף (ס״מ)</Text>
          </View>

          <MeasurementInput
            label="היקף מותניים"
            icon={<Ruler color="#FBC02D" size={28} />}
            value={measurements.waist}
            onChange={(value) => updateMeasurement("waist", value)}
            previousValues={previousMeasurements?.map(m => m.waist_circumference).filter(Boolean) as number[]}
          />

          <MeasurementInput
            label="היקף ירך"
            icon={<Ruler color="#8BC34A" size={28} />}
            value={measurements.thigh}
            onChange={(value) => updateMeasurement("thigh", value)}
            previousValues={previousMeasurements?.map(m => m.thigh_circumference).filter(Boolean) as number[]}
          />

          <MeasurementInput
            label="היקף יד"
            icon={<Ruler color="#00BCD4" size={28} />}
            value={measurements.arm}
            onChange={(value) => updateMeasurement("arm", value)}
            previousValues={previousMeasurements?.map(m => m.arm_circumference).filter(Boolean) as number[]}
          />

          <MeasurementInput
            label="היקף צוואר"
            icon={<Ruler color="#E91E63" size={28} />}
            value={measurements.neck}
            onChange={(value) => updateMeasurement("neck", value)}
            previousValues={previousMeasurements?.map(m => m.neck_circumference).filter(Boolean) as number[]}
          />

          {userProfile?.gender === "male" && (
            <MeasurementInput
              label="היקף כתפיים"
              icon={<Ruler color="#9C27B0" size={28} />}
              value={measurements.shoulder}
              onChange={(value) => updateMeasurement("shoulder", value)}
              previousValues={previousMeasurements?.map(m => m.shoulder_circumference).filter(Boolean) as number[]}
            />
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Percent color="#FBC02D" size={24} />
            <Text style={styles.sectionTitle}>קפלי עור (מ״מ)</Text>
          </View>
          <View style={styles.skinfoldNote}>
            <AlertCircle color="#FBC02D" size={18} />
            <Text style={styles.skinfoldNoteText}>
              מדידה בעזרת קליפר מקצועי לחישוב אחוז שומן מדויק
            </Text>
          </View>

          <MeasurementInput
            label="יד קדמית"
            icon={<Activity color="#FF6B6B" size={28} />}
            value={measurements.frontArmSkinfold}
            onChange={(value) => updateMeasurement("frontArmSkinfold", value)}
            previousValues={[]}
            placeholder="8.5"
            range="1-50"
          />

          <MeasurementInput
            label="יד אחורית"
            icon={<Activity color="#4ECDC4" size={28} />}
            value={measurements.backArmSkinfold}
            onChange={(value) => updateMeasurement("backArmSkinfold", value)}
            previousValues={[]}
            placeholder="12.5"
            range="1-50"
          />

          <MeasurementInput
            label="גב"
            icon={<Activity color="#95E1D3" size={28} />}
            value={measurements.subscapularSkinfold}
            onChange={(value) => updateMeasurement("subscapularSkinfold", value)}
            previousValues={[]}
            placeholder="15.0"
            range="1-50"
          />

          <MeasurementInput
            label="בטן"
            icon={<Activity color="#F38181" size={28} />}
            value={measurements.abdominalSkinfold}
            onChange={(value) => updateMeasurement("abdominalSkinfold", value)}
            previousValues={[]}
            placeholder="10.0"
            range="1-50"
          />

          {calculateBodyFat && (
            <View style={[styles.resultCard, calculateBodyFat.error && styles.resultCardError]}>
              <Percent color={calculateBodyFat.error ? "#E53935" : colors.primary} size={32} />
              <View style={styles.resultContent}>
                {calculateBodyFat.error ? (
                  <Text style={styles.resultError}>{calculateBodyFat.error}</Text>
                ) : (
                  <>
                    <Text style={styles.resultLabel}>אחוז שומן מחושב</Text>
                    <Text style={styles.resultValue}>{calculateBodyFat.value}%</Text>
                    <Text style={styles.resultMethod}>שיטת Durnin-Womersley</Text>
                  </>
                )}
              </View>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitButton, !isValid && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!isValid || updateMutation.isPending}
          activeOpacity={0.8}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <CheckCircle color={colors.white} size={24} />
              <Text style={styles.submitButtonText}>שמור מדידות במערכת</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.datePickerSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDone}>סגור</Text>
              </TouchableOpacity>
              <Text style={styles.datePickerTitle}>בחר תאריך</Text>
              <View style={{ width: 60 }} />
            </View>
            <View style={styles.datePickerButtons}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setSelectedDate(new Date());
                  setShowDatePicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dateButtonText}>היום</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday);
                  setShowDatePicker(false);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.dateButtonText}>אתמול</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.manualDateContainer}>
              <Text style={styles.manualDateLabel}>או בחר תאריך ספציפי:</Text>
              <View style={styles.dateInputRow}>
                <TextInput
                  style={styles.dateInput}
                  placeholder="יום"
                  placeholderTextColor={colors.gray}
                  value={selectedDate.getDate().toString()}
                  onChangeText={(text) => {
                    const day = parseInt(text) || 1;
                    const newDate = new Date(selectedDate);
                    newDate.setDate(Math.min(Math.max(day, 1), 31));
                    setSelectedDate(newDate);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.dateSeparator}>/</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="חודש"
                  placeholderTextColor={colors.gray}
                  value={(selectedDate.getMonth() + 1).toString()}
                  onChangeText={(text) => {
                    const month = parseInt(text) || 1;
                    const newDate = new Date(selectedDate);
                    newDate.setMonth(Math.min(Math.max(month - 1, 0), 11));
                    setSelectedDate(newDate);
                  }}
                  keyboardType="number-pad"
                  maxLength={2}
                />
                <Text style={styles.dateSeparator}>/</Text>
                <TextInput
                  style={styles.dateInput}
                  placeholder="שנה"
                  placeholderTextColor={colors.gray}
                  value={selectedDate.getFullYear().toString()}
                  onChangeText={(text) => {
                    const year = parseInt(text) || new Date().getFullYear();
                    const newDate = new Date(selectedDate);
                    newDate.setFullYear(year);
                    setSelectedDate(newDate);
                  }}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {Platform.OS === 'ios' && (
        <InputAccessoryView nativeID="measurementDone">
          <View style={styles.keyboardAccessory}>
            <Pressable 
              style={styles.keyboardDoneButton}
              onPress={() => Keyboard.dismiss()}
            >
              <Text style={styles.keyboardDoneText}>סגור</Text>
            </Pressable>
          </View>
        </InputAccessoryView>
      )}
    </LinearGradient>
  );
}

type MeasurementInputProps = {
  label: string;
  icon: ReactNode;
  value: string;
  onChange: (value: string) => void;
  previousValues: number[];
  placeholder?: string;
  range?: string;
};

function MeasurementInput({
  label,
  icon,
  value,
  onChange,
  previousValues,
  placeholder,
  range,
}: MeasurementInputProps) {
  const [showHistory, setShowHistory] = useState(false);
  const hasPrevious = previousValues && previousValues.length > 0;

  return (
    <View style={styles.measurementWrapper}>
      <View style={styles.measurementCard}>
        <View style={styles.iconContainer}>
          {icon}
        </View>
        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.inputLabel}>
              {label} {range && `(${range} מ״מ)`}
            </Text>
            {hasPrevious && (
              <TouchableOpacity
                onPress={() => setShowHistory(!showHistory)}
                style={styles.historyToggle}
                activeOpacity={0.7}
              >
                <TrendingUp color={colors.primary} size={16} />
                <Text style={styles.historyToggleText}>היסטוריה</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholder={placeholder || "0"}
            placeholderTextColor={colors.gray}
            value={value}
            onChangeText={onChange}
            keyboardType="decimal-pad"
            returnKeyType="done"
            inputAccessoryViewID="measurementDone"
          />
        </View>
      </View>

      {showHistory && hasPrevious && (
        <View style={styles.historyCard}>
          <Text style={styles.historyTitle}>מדידות קודמות</Text>
          <View style={styles.historyTable}>
            {previousValues.slice(0, 3).map((val, index) => {
              const diff = index === 0 && value ? parseFloat(value) - val : null;
              return (
                <View key={index} style={styles.historyRow}>
                  <Text style={styles.historyIndex}>מדידה {index + 1}</Text>
                  <Text style={styles.historyValue}>{val.toFixed(1)}</Text>
                  {diff !== null && !isNaN(diff) && (
                    <View style={styles.diffContainer}>
                      <Text
                        style={[
                          styles.diffText,
                          diff > 0 && styles.diffPositive,
                          diff < 0 && styles.diffNegative,
                        ]}
                      >
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTextContainer: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    fontWeight: "500" as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  dateCard: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 16,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  dateText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
  },
  infoCard: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 12,
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.gray,
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 10,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    color: colors.text,
  },
  genderContainer: {
    flexDirection: "row-reverse" as any,
    gap: 12,
    marginBottom: 16,
  },
  genderButton: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  genderButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: colors.text,
  },
  genderTextActive: {
    color: colors.white,
  },
  measurementCard: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(92, 225, 230, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
    marginBottom: 10,
    textAlign: "right",
  },
  input: {
    backgroundColor: "#F8F9FA",
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    textAlign: "right",
    borderWidth: 2,
    borderColor: "transparent",
    fontWeight: "500" as const,
  },
  skinfoldNote: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(251, 192, 45, 0.1)",
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  skinfoldNoteText: {
    flex: 1,
    fontSize: 13,
    color: "#F57C00",
    textAlign: "right",
    fontWeight: "500" as const,
  },
  resultCard: {
    backgroundColor: "rgba(92, 225, 230, 0.15)",
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 20,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  resultCardError: {
    backgroundColor: "rgba(229, 57, 53, 0.1)",
    borderColor: "#E53935",
  },
  resultContent: {
    flex: 1,
    alignItems: "flex-end",
  },
  resultLabel: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4,
    fontWeight: "500" as const,
  },
  resultValue: {
    fontSize: 36,
    fontWeight: "800" as const,
    color: colors.text,
    marginBottom: 4,
  },
  resultMethod: {
    fontSize: 12,
    color: colors.gray,
    fontWeight: "500" as const,
  },
  resultError: {
    fontSize: 15,
    color: "#E53935",
    textAlign: "right",
    fontWeight: "600" as const,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 36,
    flexDirection: "row" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    marginTop: 20,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700" as const,
  },
  successContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    color: colors.text,
    marginTop: 28,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 17,
    color: colors.gray,
    marginTop: 14,
    textAlign: "center",
  },
  keyboardAccessory: {
    backgroundColor: "#F7F7F7",
    borderTopWidth: 1,
    borderTopColor: "#D1D5DB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row" as any,
    justifyContent: "flex-end",
  },
  keyboardDoneButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  keyboardDoneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600" as const,
  },
  measurementWrapper: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: "row-reverse" as any,
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  historyToggle: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(92, 225, 230, 0.08)",
  },
  historyToggleText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600" as const,
  },
  historyCard: {
    backgroundColor: "rgba(92, 225, 230, 0.08)",
    borderRadius: 14,
    padding: 14,
    marginTop: -8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.text,
    marginBottom: 12,
    textAlign: "right",
  },
  historyTable: {
    gap: 8,
  },
  historyRow: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  historyIndex: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.gray,
    flex: 1,
    textAlign: "right",
  },
  historyValue: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: colors.text,
    marginLeft: 12,
  },
  diffContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    minWidth: 50,
    alignItems: "center",
  },
  diffText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: colors.gray,
  },
  diffPositive: {
    color: "#E53935",
  },
  diffNegative: {
    color: "#43A047",
  },
  bmiCard: {
    backgroundColor: "rgba(255, 255, 255, 0.43)",
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: "#FF9800",
    ...Platform.select({
      web: {
        backdropFilter: "blur(6.95px)",
      } as any,
    }),
  },
  bmiRow: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "space-between",
  },
  bmiValueContainer: {
    alignItems: "flex-end",
  },
  bmiLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.gray,
    marginBottom: 4,
  },
  bmiValue: {
    fontSize: 32,
    fontWeight: "800" as const,
    color: "#FF9800",
  },
  bmiClassificationContainer: {
    alignItems: "flex-start",
  },
  bmiClassificationLabel: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: colors.gray,
    marginBottom: 4,
  },
  bmiClassificationValue: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  datePickerSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  datePickerHeader: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text,
  },
  datePickerDone: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  datePickerButtons: {
    flexDirection: "row-reverse" as any,
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  dateButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.white,
  },
  manualDateContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  manualDateLabel: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: colors.text,
    textAlign: "right",
    marginBottom: 12,
  },
  dateInputRow: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dateInput: {
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    borderWidth: 2,
    borderColor: "transparent",
    fontWeight: "600" as const,
    minWidth: 70,
  },
  dateSeparator: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.gray,
  },
});
