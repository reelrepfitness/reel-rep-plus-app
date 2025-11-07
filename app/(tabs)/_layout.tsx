import { Tabs } from 'expo-router';
import React from 'react';
import { GlassTabBar } from '@/components/GlassTabBar';
import { Home, PlusCircle, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'ראשי',
          tabBarIcon: ({ focused, color }) => (
            <Home size={24} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'הוסף',
          tabBarIcon: ({ focused, color }) => (
            <PlusCircle size={24} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'פרופיל',
          tabBarIcon: ({ focused, color }) => (
            <User size={24} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
