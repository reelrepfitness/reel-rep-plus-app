import { Tabs } from "expo-router";
import { Home, User, Plus } from "lucide-react-native";
import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";
import { GlassTabBar } from "@/components/GlassTabBar";

export default function TabLayout() {
  const iconSize = 28;
  const normalIconSize = 20;

  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, { width: iconSize, height: iconSize }]}>
              {focused && (
                <View style={[styles.activeBackground, { width: iconSize, height: iconSize }]}>
                  <Svg width={iconSize} height={iconSize} viewBox="0 0 56 56" style={StyleSheet.absoluteFill}>
                    <Defs>
                      <RadialGradient
                        id="activeGradient"
                        cx="50%"
                        cy="50%"
                        r="50%"
                      >
                        <Stop offset="0%" stopColor="#0088FF" stopOpacity="0.3" />
                        <Stop offset="100%" stopColor="#0088FF" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="56" height="56" fill="url(#activeGradient)" rx="28" />
                  </Svg>
                </View>
              )}
              <Home color={focused ? "#0088FF" : "#404040"} size={normalIconSize} fill={focused ? "#0088FF" : "none"} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: "",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.addIconContainer, { width: iconSize, height: iconSize }]}>
              {focused && (
                <View style={[styles.activeBackground, { width: iconSize, height: iconSize }]}>
                  <Svg width={iconSize} height={iconSize} viewBox="0 0 56 56" style={StyleSheet.absoluteFill}>
                    <Defs>
                      <RadialGradient
                        id="activeGradient2"
                        cx="50%"
                        cy="50%"
                        r="50%"
                      >
                        <Stop offset="0%" stopColor="#0088FF" stopOpacity="0.3" />
                        <Stop offset="100%" stopColor="#0088FF" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="56" height="56" fill="url(#activeGradient2)" rx="28" />
                  </Svg>
                </View>
              )}
              <Plus color={focused ? "#0088FF" : "#404040"} size={normalIconSize} strokeWidth={2.5} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "",
          tabBarIcon: ({ focused, color }) => (
            <View style={[styles.tabIconContainer, { width: iconSize, height: iconSize }]}>
              {focused && (
                <View style={[styles.activeBackground, { width: iconSize, height: iconSize }]}>
                  <Svg width={iconSize} height={iconSize} viewBox="0 0 56 56" style={StyleSheet.absoluteFill}>
                    <Defs>
                      <RadialGradient
                        id="activeGradient3"
                        cx="50%"
                        cy="50%"
                        r="50%"
                      >
                        <Stop offset="0%" stopColor="#0088FF" stopOpacity="0.3" />
                        <Stop offset="100%" stopColor="#0088FF" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="56" height="56" fill="url(#activeGradient3)" rx="28" />
                  </Svg>
                </View>
              )}
              <User color={focused ? "#0088FF" : "#404040"} size={normalIconSize} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative" as const,
  },
  activeBackground: {
    position: "absolute" as const,
    borderRadius: 999,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none" as const,
  },
  addIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative" as const,
  },
});
