import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import AppTabs from "@/components/app-tabs";
import { getToken } from "@/lib/auth";

export default function TabsLayout() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    getToken().then((token) => {
      setHasToken(!!token);
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  if (!hasToken) return <Redirect href="/login" />;
  return <AppTabs />;
}
