import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>פרופיל</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <Icon sf="plus.app" />
        <Label>הוסף</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="home">
        <Icon sf="house.fill" />
        <Label>בית</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
