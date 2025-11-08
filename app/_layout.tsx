import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { I18nManager, Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/auth";
import { ToastProvider } from "@/components/ui/toast";
import * as Updates from "expo-updates";
import {
  initializeNotifications,
  cleanupNotifications,
} from "@/lib/pushNotifications";
// import { supabase } from "@/lib/supabase"; // enable when you wire saving token

if (!I18nManager.isRTL && Platform.OS !== "web") {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  Updates.reloadAsync().catch((error) => {
    console.log("[RTL] Could not reload app:", error);
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

    initializeNotifications(async (token) => {
      // Here you can send the token to your backend / Supabase.
      // Example (make sure you have the current user id before enabling):
      // await supabase.from("profiles").update({ push_token: token }).eq("id", userId);
      console.log("[Push] Expo push token:", token);
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
