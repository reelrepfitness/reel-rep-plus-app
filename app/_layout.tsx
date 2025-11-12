import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { analyticsService } from "@/lib/analytics";
import { Stack } from "expo-router";
import { analyticsService } from "@/lib/analytics";
import * as SplashScreen from "expo-splash-screen";
import { analyticsService } from "@/lib/analytics";
import React, { useEffect } from "react";
import { analyticsService } from "@/lib/analytics";
import { I18nManager, Platform } from "react-native";
import { analyticsService } from "@/lib/analytics";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { analyticsService } from "@/lib/analytics";
import { AuthProvider } from "@/contexts/auth";
import { analyticsService } from "@/lib/analytics";
import { ToastProvider } from "@/components/ui/toast";
import { analyticsService } from "@/lib/analytics";
import * as Updates from "expo-updates";
import { analyticsService } from "@/lib/analytics";
import {
import { analyticsService } from "@/lib/analytics";
  initializeNotifications,
  cleanupNotifications,
} from "@/lib/pushNotifications";
import { enableConnectionMonitoring } from "@/lib/connectionHelper";
import { analyticsService } from "@/lib/analytics";

import { createLogger } from '@/lib/logger';
import { analyticsService } from "@/lib/analytics";

const logger = createLogger('Layout');
// import { supabase } from "@/lib/supabase"; // enable when you wire saving token

if (!I18nManager.isRTL && Platform.OS !== "web") {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  Updates.reloadAsync().catch((error) => {
    logger.info("[RTL] Could not reload app:", error);
  });
}

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "חזור" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();

    if (__DEV__) {
      const cleanupConnection = enableConnectionMonitoring();
      if (cleanupConnection) {
        return cleanupConnection;
      }
    }

    initializeNotifications(undefined, async (token: string) => {
      logger.info("[Push] Expo push token:", token);
    });

    return () => {
      cleanupNotifications();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
