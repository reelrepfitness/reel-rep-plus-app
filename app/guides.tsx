import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { 
  ChevronLeft, 
  BookOpen, 
  Utensils, 
  Calendar, 
  Plane, 
  Activity, 
  Sun,
  CheckCircle2,
  CircleDot,
  AlertCircle,
  XCircle,
  TrendingUp,
  Droplets,
  Coffee,
  Flame,
  Apple,
  Fish,
  Wheat,
  Candy,
  ArrowLeft
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/constants/colors";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Guide } from "@/lib/types";
import { useState, ReactElement, useEffect, useRef } from "react";

export default function GuidesScreen() {
  const insets = useSafeAreaInsets();
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const slideAnims = useRef<Animated.Value[]>([]);
  const fadeAnims = useRef<Animated.Value[]>([]);

  const { data: guides, isLoading, error } = useQuery({
    queryKey: ["guides"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("guides")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching guides:", error);
        throw error;
      }

      return data as Guide[];
    },
  });

  useEffect(() => {
    if (guides && guides.length > 0 && !selectedGuide) {
      slideAnims.current = guides.map(() => new Animated.Value(100));
      fadeAnims.current = guides.map(() => new Animated.Value(0));

      const animations = guides.map((_, index) => {
        return Animated.parallel([
          Animated.timing(slideAnims.current[index], {
            toValue: 0,
            duration: 500,
            delay: index * 80,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnims.current[index], {
            toValue: 1,
            duration: 500,
            delay: index * 80,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.stagger(0, animations).start();
    }
  }, [guides, selectedGuide]);

  const handleBack = () => {
    if (selectedGuide) {
      setSelectedGuide(null);
    } else {
      router.back();
    }
  };

  const getIconForGuide = (title: string, emoji: string | null) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes("חופש") || lowerTitle.includes("טיס")) {
      return <Plane color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("גליקמי") || lowerTitle.includes("סוכר")) {
      return <Activity color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("שישי") || lowerTitle.includes("ארוחת")) {
      return <Utensils color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("צום")) {
      return <Calendar color={colors.primary} size={32} />;
    }
    if (lowerTitle.includes("יומ") || lowerTitle.includes("התנהלות")) {
      return <Sun color={colors.primary} size={32} />;
    }
    
    return <BookOpen color={colors.primary} size={32} />;
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>שגיאה בטעינת המדריכים</Text>
        </View>
      </LinearGradient>
    );
  }

  const getIconForEmoji = (emoji: string): ReactElement | null => {
    const iconMap: { [key: string]: ReactElement } = {
      '✅': <CheckCircle2 color="#10B981" size={16} />,
      '🔹': <CircleDot color={colors.primary} size={16} />,
      '🔺': <TrendingUp color="#EF4444" size={16} />,
      '‼️': <AlertCircle color="#F59E0B" size={16} />,
      '💢': <AlertCircle color="#EF4444" size={16} />,
      '🟢': <CheckCircle2 color="#10B981" size={16} />,
      '⚠️': <AlertCircle color="#F59E0B" size={16} />,
      '❌': <XCircle color="#EF4444" size={16} />,
      '💧': <Droplets color="#3B82F6" size={16} />,
      '☕': <Coffee color="#78350F" size={16} />,
      '🔥': <Flame color="#F97316" size={16} />,
      '🍎': <Apple color="#EF4444" size={16} />,
      '🐟': <Fish color="#3B82F6" size={16} />,
      '🌾': <Wheat color="#F59E0B" size={16} />,
      '🍬': <Candy color="#EC4899" size={16} />,
    };
    return iconMap[emoji] || null;
  };

  const removeEmojis = (text: string) => {
    return text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F1E0}-\u{1F1FF}\u{E0020}-\u{E007F}\u{200D}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '').trim();
  };

  const getIconsFromLine = (line: string) => {
    const emojis = ['✅', '🔹', '🔺', '‼️', '💢', '🟢', '⚠️', '❌', '💧', '☕', '🔥', '🍎', '🐟', '🌾', '🍬'];
    const foundEmojis: string[] = [];
    
    emojis.forEach(emoji => {
      if (line.includes(emoji)) {
        foundEmojis.push(emoji);
      }
    });
    
    return foundEmojis;
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmedLine = line.trim();
      
      const isHeader = (
        (trimmedLine.startsWith('✅') || trimmedLine.startsWith('🔹') || 
         trimmedLine.startsWith('‼️') || trimmedLine.startsWith('💢') ||
         trimmedLine.startsWith('🟢')) &&
        (trimmedLine.endsWith('✅') || trimmedLine.endsWith('🟢') || trimmedLine.endsWith('‼️'))
      ) || (
        trimmedLine.endsWith(':') && !trimmedLine.includes('לדוגמה')
      );

      if (!trimmedLine) {
        return <View key={index} style={{ height: 10 }} />;
      }

      const emojisInLine = getIconsFromLine(line);
      const cleanedLine = removeEmojis(line);

      return (
        <View key={index} style={[styles.contentLineContainer, { flexDirection: "row-reverse" as const }]}>
          {emojisInLine.map((emoji, emojiIndex) => (
            <View key={emojiIndex} style={styles.iconWrapper}>
              {getIconForEmoji(emoji)}
            </View>
          ))}
          <Text
          style={[
            styles.contentLine,
            isHeader && styles.contentHeader,
            { writingDirection: "rtl" as const, textAlign: "right" as const, flex: 1 }
          ]}
        >
          {cleanedLine}
        </Text>
        </View>
      );
    });
  };

  if (selectedGuide) {
    return (
      <LinearGradient
        colors={["#3FCDD1", "#FFFFFF"]}
        locations={[0, 0.4]}
        style={styles.container}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backButton}
          >
            <ChevronLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{selectedGuide.title}</Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <View style={styles.detailIconContainer}>
            {getIconForGuide(selectedGuide.title, selectedGuide.emoji)}
          </View>
          {selectedGuide.short_description && (
            <View style={styles.descriptionCard}>
              <Text style={[
                styles.guideDescription,
                { writingDirection: "rtl" as const, textAlign: "right" as const }
              ]}>
                {selectedGuide.short_description}
              </Text>
            </View>
          )}
          <View style={styles.contentCard}>
            {renderContent(selectedGuide.content)}
          </View>
        </ScrollView>
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
      <View style={[styles.customHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerRow1}>
          <TouchableOpacity onPress={handleBack} style={styles.backButtonNew}>
            <ArrowLeft color={colors.white} size={24} />
          </TouchableOpacity>
          <BookOpen color={colors.white} size={28} />
          <View style={styles.backButtonNew} />
        </View>
        <View style={styles.headerRow2}>
          <Text style={styles.customHeaderTitle}>מדריכים</Text>
        </View>
      </View>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {guides && guides.length > 0 ? (
          guides.map((guide, index) => (
            <Animated.View
              key={guide.guide_id}
              style={{
                opacity: fadeAnims.current[index] || 1,
                transform: [{ translateY: slideAnims.current[index] || 0 }],
              }}
            >
              <TouchableOpacity
                style={styles.guideCard}
                onPress={() => setSelectedGuide(guide)}
              >
                <ChevronLeft color={colors.gray} size={20} />
                <View style={styles.guideInfo}>
                  <Text style={[
                    styles.guideTitle,
                    { writingDirection: "rtl" as const, textAlign: "right" as const }
                  ]}>
                    {guide.title}
                  </Text>
                  {guide.short_description && (
                    <Text 
                      style={[
                        styles.guideDescriptionShort,
                        { writingDirection: "rtl" as const, textAlign: "right" as const }
                      ]} 
                      numberOfLines={2}
                    >
                      {guide.short_description}
                    </Text>
                  )}
                </View>
                <View style={styles.guideIconContainer}>
                  {getIconForGuide(guide.title, guide.emoji)}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <BookOpen color={colors.gray} size={64} />
            <Text style={styles.emptyText}>אין מדריכים זמינים כרגע</Text>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
  },
  customHeader: {
    backgroundColor: "#000000",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  headerRow1: {
    flexDirection: "row-reverse" as const,
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerRow2: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 4,
  },
  backButtonNew: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  customHeaderTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: colors.white,
    textAlign: "center",
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    color: colors.white,
    textAlign: "center",
  },
  guideCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row-reverse" as const,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  guideCardEmoji: {
    fontSize: 32,
  },
  guideIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },
  guideInfo: {
    flex: 1,
    gap: 4,
  },
  guideTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: colors.text,
  },
  guideDescriptionShort: {
    fontSize: 14,
    color: "#666",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    textAlign: "center",
  },
  detailIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F0F9FF",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  descriptionCard: {
    backgroundColor: "rgba(63, 205, 209, 0.1)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(63, 205, 209, 0.2)",
  },
  guideDescription: {
    fontSize: 16,
    color: "#333",
    lineHeight: 26,
    fontWeight: "600" as const,
  },
  contentCard: {
    backgroundColor: colors.white,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentLine: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 26,
    marginBottom: 4,
  },
  contentHeader: {
    fontSize: 17,
    fontWeight: "700" as const,
    marginTop: 8,
    marginBottom: 8,
  },
  contentLineContainer: {
    flexDirection: "row-reverse" as const,
    alignItems: "flex-start",
    marginBottom: 4,
    gap: 8,
  },
  iconWrapper: {
    marginTop: 4,
  },
});
