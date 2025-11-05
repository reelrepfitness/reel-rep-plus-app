import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch } from "react-native";
import { Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/auth";
import { colors } from "@/constants/colors";
import { useState } from "react";
import { Bell, Plus, Clock, Target, TrendingUp, Save, Trash2 } from "lucide-react-native";

type NotificationTrigger = "time" | "goal_reached" | "goal_missed" | "inactive";

interface NotificationTemplate {
  id: string;
  title: string;
  message: string;
  trigger: NotificationTrigger;
  triggerValue?: string;
  isActive: boolean;
}

export default function AdminNotificationsScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"templates" | "create">("templates");
  const [templates, setTemplates] = useState<NotificationTemplate[]>([
    {
      id: "1",
      title: "בוקר טוב!",
      message: "זמן לתכנן את היום התזונתי שלך 🌅",
      trigger: "time",
      triggerValue: "08:00",
      isActive: true,
    },
    {
      id: "2",
      title: "השגת יעד!",
      message: "כל הכבוד! השגת את יעד החלבון היומי 💪",
      trigger: "goal_reached",
      triggerValue: "protein",
      isActive: true,
    },
    {
      id: "3",
      title: "תזכורת מים",
      message: "זמן לשתות כוס מים 💧",
      trigger: "time",
      triggerValue: "10:00,14:00,18:00",
      isActive: true,
    },
  ]);

  const [newNotification, setNewNotification] = useState<NotificationTemplate>({
    id: Date.now().toString(),
    title: "",
    message: "",
    trigger: "time",
    triggerValue: "",
    isActive: true,
  });

  const handleToggleNotification = (id: string) => {
    setTemplates(prev =>
      prev.map(template =>
        template.id === id ? { ...template, isActive: !template.isActive } : template
      )
    );
  };

  const handleDeleteNotification = (id: string) => {
    setTemplates(prev => prev.filter(template => template.id !== id));
  };

  const handleSaveNotification = () => {
    if (newNotification.title && newNotification.message) {
      setTemplates(prev => [...prev, { ...newNotification, id: Date.now().toString() }]);
      setNewNotification({
        id: Date.now().toString(),
        title: "",
        message: "",
        trigger: "time",
        triggerValue: "",
        isActive: true,
      });
      setActiveTab("templates");
    }
  };

  const getTriggerIcon = (trigger: NotificationTrigger) => {
    switch (trigger) {
      case "time":
        return <Clock size={20} color={colors.primary} />;
      case "goal_reached":
        return <Target size={20} color="#10B981" />;
      case "goal_missed":
        return <TrendingUp size={20} color="#EF4444" />;
      case "inactive":
        return <Bell size={20} color="#F59E0B" />;
    }
  };

  const getTriggerLabel = (trigger: NotificationTrigger) => {
    switch (trigger) {
      case "time":
        return "לפי שעה";
      case "goal_reached":
        return "השגת יעד";
      case "goal_missed":
        return "החמצת יעד";
      case "inactive":
        return "חוסר פעילות";
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
            title: "ניהול התראות",
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
          title: "ניהול התראות",
          headerStyle: {
            backgroundColor: "#3FCDD1",
          },
          headerTintColor: "#FFFFFF",
          headerTitleAlign: "center",
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "templates" && styles.tabActive]}
          onPress={() => setActiveTab("templates")}
          activeOpacity={0.8}
        >
          <Bell size={20} color={activeTab === "templates" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "templates" && styles.tabTextActive]}>
            תבניות קיימות
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "create" && styles.tabActive]}
          onPress={() => setActiveTab("create")}
          activeOpacity={0.8}
        >
          <Plus size={20} color={activeTab === "create" ? "#FFFFFF" : colors.primary} />
          <Text style={[styles.tabText, activeTab === "create" && styles.tabTextActive]}>
            צור חדש
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "templates" ? (
          <View style={styles.templatesSection}>
            <Text style={styles.sectionTitle}>התראות אוטומטיות ({templates.length})</Text>
            
            {templates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  <View style={styles.templateInfo}>
                    <View style={styles.templateTitleRow}>
                      {getTriggerIcon(template.trigger)}
                      <Text style={styles.templateTitle}>{template.title}</Text>
                    </View>
                    <Text style={styles.templateMessage}>{template.message}</Text>
                    <View style={styles.templateMeta}>
                      <Text style={styles.templateMetaText}>
                        {getTriggerLabel(template.trigger)}
                        {template.triggerValue && ` • ${template.triggerValue}`}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.templateActions}>
                    <Switch
                      value={template.isActive}
                      onValueChange={() => handleToggleNotification(template.id)}
                      trackColor={{ false: "#D1D5DB", true: colors.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteNotification(template.id)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={18} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>מחק</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.createSection}>
            <Text style={styles.sectionTitle}>צור התראה חדשה</Text>

            <View style={styles.formCard}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>כותרת</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="לדוגמה: בוקר טוב!"
                  placeholderTextColor="#9CA3AF"
                  value={newNotification.title}
                  onChangeText={(text) => setNewNotification({ ...newNotification, title: text })}
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>תוכן ההודעה</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="לדוגמה: זמן לתכנן את היום התזונתי שלך"
                  placeholderTextColor="#9CA3AF"
                  value={newNotification.message}
                  onChangeText={(text) => setNewNotification({ ...newNotification, message: text })}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>סוג טריגר</Text>
                <View style={styles.triggerOptions}>
                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "time" && styles.triggerOptionActive,
                    ]}
                    onPress={() => setNewNotification({ ...newNotification, trigger: "time" })}
                    activeOpacity={0.7}
                  >
                    <Clock size={20} color={newNotification.trigger === "time" ? "#FFFFFF" : colors.primary} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "time" && styles.triggerOptionTextActive,
                      ]}
                    >
                      לפי שעה
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "goal_reached" && styles.triggerOptionActive,
                    ]}
                    onPress={() =>
                      setNewNotification({ ...newNotification, trigger: "goal_reached" })
                    }
                    activeOpacity={0.7}
                  >
                    <Target size={20} color={newNotification.trigger === "goal_reached" ? "#FFFFFF" : "#10B981"} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "goal_reached" && styles.triggerOptionTextActive,
                      ]}
                    >
                      השגת יעד
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "goal_missed" && styles.triggerOptionActive,
                    ]}
                    onPress={() =>
                      setNewNotification({ ...newNotification, trigger: "goal_missed" })
                    }
                    activeOpacity={0.7}
                  >
                    <TrendingUp size={20} color={newNotification.trigger === "goal_missed" ? "#FFFFFF" : "#EF4444"} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "goal_missed" && styles.triggerOptionTextActive,
                      ]}
                    >
                      החמצת יעד
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.triggerOption,
                      newNotification.trigger === "inactive" && styles.triggerOptionActive,
                    ]}
                    onPress={() =>
                      setNewNotification({ ...newNotification, trigger: "inactive" })
                    }
                    activeOpacity={0.7}
                  >
                    <Bell size={20} color={newNotification.trigger === "inactive" ? "#FFFFFF" : "#F59E0B"} />
                    <Text
                      style={[
                        styles.triggerOptionText,
                        newNotification.trigger === "inactive" && styles.triggerOptionTextActive,
                      ]}
                    >
                      חוסר פעילות
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.formLabel}>ערך טריגר</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={
                    newNotification.trigger === "time"
                      ? "לדוגמה: 08:00 או 10:00,14:00,18:00"
                      : "לדוגמה: protein, carb, fat"
                  }
                  placeholderTextColor="#9CA3AF"
                  value={newNotification.triggerValue}
                  onChangeText={(text) =>
                    setNewNotification({ ...newNotification, triggerValue: text })
                  }
                />
              </View>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveNotification}
                activeOpacity={0.8}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>שמור התראה</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingHorizontal: 16,
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
  tabsContainer: {
    flexDirection: "row-reverse" as any,
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: colors.primary,
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: "#2d3748",
    textAlign: "right",
    marginBottom: 16,
  },
  templatesSection: {
    paddingBottom: 24,
  },
  templateCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  templateHeader: {
    flexDirection: "row-reverse" as any,
    justifyContent: "space-between",
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitleRow: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  templateTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#2d3748",
  },
  templateMessage: {
    fontSize: 14,
    color: "#4B5563",
    marginBottom: 8,
    textAlign: "right",
  },
  templateMeta: {
    flexDirection: "row-reverse" as any,
    gap: 8,
  },
  templateMetaText: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  templateActions: {
    justifyContent: "center",
  },
  deleteButton: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: "600" as const,
    color: "#EF4444",
  },
  createSection: {
    paddingBottom: 24,
  },
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formField: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#2d3748",
    textAlign: "right",
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: "#2d3748",
    textAlign: "right",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  formTextArea: {
    height: 100,
  },
  triggerOptions: {
    flexDirection: "row-reverse" as any,
    flexWrap: "wrap" as any,
    gap: 8,
  },
  triggerOption: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  triggerOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  triggerOptionText: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#4B5563",
  },
  triggerOptionTextActive: {
    color: "#FFFFFF",
  },
  saveButton: {
    flexDirection: "row-reverse" as any,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    backgroundColor: colors.primary,
    borderRadius: 12,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: "#FFFFFF",
  },
});
