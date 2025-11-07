import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface GlassTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export function GlassTabBar({ state, descriptors, navigation }: GlassTabBarProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.backgroundContainer}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={100} tint="extraLight" style={styles.blurOuter} />
        ) : (
          <View style={styles.blurOuterWeb} />
        )}
        <View style={styles.mask} />
        <View style={styles.shape} />
        <View style={styles.blurInner} />
        <LinearGradient 
          colors={["rgba(255, 255, 255, 0.7)", "rgba(247, 247, 247, 0.5)"]} 
          style={styles.fill} 
        />
        <View style={styles.glassOverlay} />
      </View>

      <View style={styles.tabsRow}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          // Get icon and label from options
          const label = options.tabBarLabel || options.title || route.name;
          const iconComponent = options.tabBarIcon?.({ focused: isFocused, color: isFocused ? "#0088FF" : "#404040" });

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={[styles.tab, isFocused && styles.tabSelectedWrapper]}
              activeOpacity={0.9}
            >
              {isFocused && <View style={styles.tabSelectedBg} />}
              {iconComponent}
              <Text style={[
                isFocused ? styles.tabLabelActive : styles.tabLabelInactive,
              ]}>
                {typeof label === 'string' ? label : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    height: 95,
    paddingTop: 16,
    paddingHorizontal: 25,
    paddingBottom: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-start",
    borderRadius: 30,
  },
  backgroundContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
    overflow: "hidden",
  },
  blurOuter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
  },
  blurOuterWeb: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 30,
  },
  mask: {
    position: "absolute",
    left: -50,
    right: -50,
    top: -50,
    bottom: -50,
    backgroundColor: "#FFFFFF",
    opacity: 0,
  },
  shape: {
    position: "absolute",
    left: 76,
    right: 76,
    top: 76,
    bottom: 76,
    backgroundColor: "#000000",
    borderRadius: 1000,
    opacity: 0,
  },
  blurInner: {
    position: "absolute",
    left: 26,
    right: 26,
    top: 28,
    bottom: 24,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 1000,
    opacity: 0,
  },
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 30,
  },
  glassOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  tabsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    width: "100%",
    height: 54,
    alignSelf: "center",
    zIndex: 10,
  },
  tab: {
    flex: 1,
    height: 54,
    paddingTop: 6,
    paddingHorizontal: 8,
    paddingBottom: 7,
    gap: 1,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  tabSelectedWrapper: {
    zIndex: 1,
  },
  tabSelectedBg: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 0,
    bottom: 0,
    backgroundColor: "#EDEDED",
    borderRadius: 100,
    zIndex: 0,
  },

  tabLabelActive: {
    height: 12,
    fontFamily: Platform.select({ ios: "SF Pro", default: "System" }),
    fontWeight: "600" as const,
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    letterSpacing: -0.1,
    color: "#0088FF",
    zIndex: 2,
    marginTop: 2,
  },
  tabLabelInactive: {
    height: 12,
    fontFamily: Platform.select({ ios: "SF Pro", default: "System" }),
    fontWeight: "500" as const,
    fontSize: 10,
    lineHeight: 12,
    textAlign: "center",
    color: "#404040",
    zIndex: 2,
    marginTop: 2,
  },
});
