import { Redirect } from "expo-router";
import { useEffect, useState } from "react";

import AppTabs from "@/components/app-tabs";
import { getRole, getToken } from "@/lib/auth";

export default function TabsLayout() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    async function check() {
      const token = await getToken();
      setHasToken(!!token);
      setRole((await getRole()) ?? "");
      setChecking(false);
    }
    check();
  }, []);

  if (checking) return null;
  if (!hasToken) return <Redirect href="/login" />;
  return <AppTabs role={role} />;
}
