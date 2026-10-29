import { Tabs } from "expo-router";
import React from "react";
import { SaharaColors } from "../../theme/tokens";

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: SaharaColors.primary,
        tabBarInactiveTintColor: SaharaColors.outline,
        tabBarStyle: {
          backgroundColor: SaharaColors.surfaceContainerLowest,
          borderTopColor: SaharaColors.outlineVariant,
        },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: "Wealth" }} />
      <Tabs.Screen name="copilot" options={{ title: "Sahara Copilot" }} />
    </Tabs>
  );
}
