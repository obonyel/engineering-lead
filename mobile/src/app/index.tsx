import { Redirect } from "expo-router";
import React from "react";

export default function EntryRedirect(): React.JSX.Element {
  return <Redirect href="/(auth)/welcome" />;
}
