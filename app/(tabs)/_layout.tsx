import { Tabs } from "expo-router";
import { Home, User, Plus } from "lucide-react-native";
import React from "react";
import { View, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { BlurView } from "expo-blur";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

export default function TabLayout() {
  const { width: screenWidth } = useWindowDimensions();
  const tabBarHeight = 93;
  const tabBarWidth = Math.min(screenWidth - 32, 600);
  const iconSize = 56;
  const addIconSize = 32;
  const normalIconSize = 24;

  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerShown: false,
        tabBarActiveTintColor: "#70eaff",
        tabBarInactiveTintColor: "rgba(211, 211, 211, 0.7)",
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: tabBarHeight,
          width: tabBarWidth,
          paddingBottom: 0,
          paddingTop: 0,
          elevation: 0,
          left: (screenWidth - tabBarWidth) / 2,
          bottom: 20,
          borderRadius: 30,
          alignSelf: "center",
          marginHorizontal: 0,
          start: undefined,
          end: undefined,
        },
        tabBarBackground: () => (
          <View style={styles.tabBarBackground} pointerEvents="none">
            {Platform.OS === "web" ? (
              <View style={styles.webBlur} />
            ) : (
              <BlurView intensity={100} tint="light" style={styles.blurContainer} />
            )}
          </View>
        ),
        tabBarLabelStyle: {
          fontSize: 0,
        },
        tabBarItemStyle: {
          paddingTop: tabBarHeight * 0.29,
        },
      }}
    >
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
                        <Stop offset="0%" stopColor="#70eaff" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#70eaff" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="56" height="56" fill="url(#activeGradient3)" rx="28" />
                  </Svg>
                </View>
              )}
              <User color={focused ? "#70eaff" : color} size={normalIconSize} />
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
                        <Stop offset="0%" stopColor="#70eaff" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#70eaff" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="56" height="56" fill="url(#activeGradient2)" rx="28" />
                  </Svg>
                </View>
              )}
              <Plus color={focused ? "#70eaff" : color} size={addIconSize} strokeWidth={3} />
            </View>
          ),
        }}
      />
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
                        <Stop offset="0%" stopColor="#70eaff" stopOpacity="0.6" />
                        <Stop offset="100%" stopColor="#70eaff" stopOpacity="0" />
                      </RadialGradient>
                    </Defs>
                    <Rect width="56" height="56" fill="url(#activeGradient)" rx="28" />
                  </Svg>
                </View>
              )}
              <Home color={focused ? "#70eaff" : color} size={normalIconSize} fill={focused ? "#70eaff" : "none"} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    flex: 1,
    borderRadius: 30,
    overflow: "hidden",
    shadowColor: "rgba(13, 10, 44, 0.06)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 8,
    pointerEvents: "none" as const,
  },
  blurContainer: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.65)",
  },
  webBlur: {
    flex: 1,
    backgroundColor: "rgba(20, 20, 20, 0.7)",
    backdropFilter: "blur(40px)",
  },
  tabIconContainer: {
    justifyContent: "center",
    alignItems: "center",
    position: "relative" as const,
    pointerEvents: "none" as const,
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
    pointerEvents: "none" as const,
  },
});
