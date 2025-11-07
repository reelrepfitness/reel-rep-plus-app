import { NativeTabs, Icon } from 'expo-router/unstable-native-tabs';
import { Stack } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs>
      <Stack.Screen options={{ headerShown: false }} />
      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="add">
        <Icon sf="plus.app" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="home">
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
