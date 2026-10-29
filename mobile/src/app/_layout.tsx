import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { SaharaCopilotProvider } from "../providers/SaharaCopilotProvider";
import { SaharaColors } from "../theme/tokens";

export default function RootLayout(): React.JSX.Element {
  return (
    <SaharaCopilotProvider>
      <StatusBar style="dark" backgroundColor={SaharaColors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: SaharaColors.background },
        }}
      />
    </SaharaCopilotProvider>
  );
}
