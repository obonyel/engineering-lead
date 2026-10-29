import React, { useEffect, useState } from "react";
// ADR-002: Strictly import CopilotKitProvider from /headless to avoid Metro bundler issues
import { CopilotKitProvider } from "@copilotkit/react-native/headless";
import { GenUIRegistry } from "../components/genui/GenUIRegistry";
import { getAccessToken } from "../lib/api";
import { MobileConfig } from "../lib/config";

export function SaharaCopilotProvider({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  const [token, setToken] = useState<string>("sahara-demo-token");

  useEffect(() => {
    void getAccessToken().then(setToken);
  }, []);

  return (
    <CopilotKitProvider
      runtimeUrl={MobileConfig.copilotRuntimeUrl}
      headers={{
        Authorization: `Bearer ${token}`,
      }}
    >
      <GenUIRegistry />
      {children}
    </CopilotKitProvider>
  );
}
