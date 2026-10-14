import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { clearToken, getRole, getToken } from "@/lib/auth";

type StockEntry = { store: string; quantity: number };
type Product = {
  _id: string;
  name: string;
  price?: number;
  cost?: number;
  stock?: StockEntry[];
};
type Sale = { _id: string; total: number };

const STORES = ["Manuel Bulnes", "Barros Arana"];

const LOW_STOCK_THRESHOLD = 3;

const ROLE_LABELS: Record<string, string> = {
  boss: "Boss",
  seller: "Seller",
  warehouse: "Warehouse",
  customer: "Customer",
};

function money(n: number) {
  return (
    "$" +
    Math.round(n)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

async function fetchOptional(url: string, headers: Record<string, string>) {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

function StatCard({
  label,
  value,
  lines,
}: {
  label: string;
  value: string;
  lines?: string[];
}) {
  return (
    <ThemedView type="backgroundElement" style={styles.statCard}>
      <ThemedText type="small">{label}</ThemedText>
      <ThemedText type="subtitle">{value}</ThemedText>
      {lines?.map((line) => (
        <ThemedText key={line} type="small">
          {line}
        </ThemedText>
      ))}
    </ThemedView>
  );
}

export default function HomeScreen() {
  const [role, setRole] = useState("");
  const [products, setProducts] = useState<Product[] | null>(null);
  const [sales, setSales] = useState<Sale[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function logout() {
    await clearToken();
    router.replace("/login");
  }

  async function loadData() {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const productsRes = await fetch(`${API_URL}/products`, { headers });
      if (productsRes.status === 401) {
        await logout();
        return;
      }
      setProducts(productsRes.ok ? await productsRes.json() : null);

      const salesData = await fetchOptional(`${API_URL}/sales`, headers);
      setSales(Array.isArray(salesData) ? salesData : null);

      setError("");
    } catch (e) {
      console.log("Home error:", e);
      setError("Cannot reach the server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getRole().then((r) => setRole(r ?? ""));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const unitsByStore = STORES.map((store) => ({
    store,
    units: (products ?? []).reduce(
      (sum, p) =>
        sum + (p.stock?.find((s) => s.store === store)?.quantity ?? 0),
      0,
    ),
  }));
  const totalUnits = unitsByStore.reduce((sum, s) => sum + s.units, 0);

  // Only meaningful for roles that receive "cost" (the boss).
  const productsWithCost = (products ?? []).filter((p) => p.cost !== undefined);
  const inventoryValue = productsWithCost.reduce(
    (sum, p) =>
      sum +
      (p.cost ?? 0) *
        (p.stock ?? []).reduce((units, s) => units + s.quantity, 0),
    0,
  );
  const margins = productsWithCost
    .filter((p) => (p.price ?? 0) > 0)
    .map((p) => ((p.price! - p.cost!) / p.price!) * 100);
  const averageMargin =
    margins.length > 0
      ? margins.reduce((a, b) => a + b, 0) / margins.length
      : null;

  const lowStock: { name: string; store: string; quantity: number }[] = [];
  for (const p of products ?? []) {
    for (const s of p.stock ?? []) {
      if (s.quantity <= LOW_STOCK_THRESHOLD) {
        lowStock.push({ name: p.name, store: s.store, quantity: s.quantity });
      }
    }
  }

  const salesTotal = (sales ?? []).reduce((sum, s) => sum + s.total, 0);

  const actions = [
    {
      label: "Clients",
      path: "/clients",
      roles: ["boss", "seller"],
    },
    {
      label: "Staff",
      path: "/staff",
      roles: ["boss"],
    },
    {
      label: "Products",
      path: "/products",
      roles: ["boss", "seller", "warehouse", "customer"],
    },
    { label: "New sale", path: "/new-sale", roles: ["boss", "seller"] },
    {
      label: role === "customer" ? "My purchases" : "Sales",
      path: "/sales",
      roles: ["boss", "seller", "customer"],
    },
  ].filter((a) => a.roles.includes(role));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <ThemedText type="title">Home</ThemedText>
            {role !== "" && (
              <View style={styles.badge}>
                <ThemedText type="smallBold" style={styles.badgeText}>
                  {ROLE_LABELS[role] ?? role}
                </ThemedText>
              </View>
            )}
          </View>

          {loading && <ActivityIndicator />}
          {error !== "" && <ThemedText>{error}</ThemedText>}

          {products !== null && (
            <View style={styles.grid}>
              <StatCard
                label="Total stock"
                value={`${totalUnits} units`}
                lines={unitsByStore.map((s) => `${s.store}: ${s.units}`)}
              />

              {role === "boss" && productsWithCost.length > 0 && (
                <StatCard
                  label="Inventory value (at cost)"
                  value={money(inventoryValue)}
                  lines={
                    averageMargin !== null
                      ? [`Avg. margin: ${averageMargin.toFixed(0)}%`]
                      : []
                  }
                />
              )}

              {sales !== null && (
                <StatCard
                  label={role === "customer" ? "My purchases" : "Sales"}
                  value={String(sales.length)}
                  lines={[`Total: ${money(salesTotal)}`]}
                />
              )}

              <StatCard
                label="Low stock"
                value={`${lowStock.length} alerts`}
                lines={[`${LOW_STOCK_THRESHOLD} units or fewer in a store`]}
              />
            </View>
          )}

          {lowStock.length > 0 && (
            <ThemedView type="backgroundElement" style={styles.alertBox}>
              <ThemedText type="smallBold">Low stock alerts</ThemedText>
              {lowStock.slice(0, 5).map((a) => (
                <ThemedText key={`${a.name}-${a.store}`} type="small">
                  {a.name} — {a.store}: {a.quantity}
                </ThemedText>
              ))}
              {lowStock.length > 5 && (
                <ThemedText type="small">
                  and {lowStock.length - 5} more...
                </ThemedText>
              )}
            </ThemedView>
          )}

          <ThemedText type="smallBold">Quick actions</ThemedText>
          <View style={styles.grid}>
            {actions.map((a) => (
              <Pressable
                key={a.path}
                style={styles.tile}
                onPress={() => router.push(a.path as any)}
              >
                <ThemedText style={styles.buttonText}>{a.label}</ThemedText>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.logoutButton} onPress={logout}>
            <ThemedText style={styles.buttonText}>Log out</ThemedText>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center" },
  safeArea: {
    flex: 1,
    width: "100%",
    maxWidth: 600,
    paddingHorizontal: Spacing.four,
    // removed paddingTop from here
  },
  content: {
    gap: Spacing.three,
    paddingBottom: Spacing.four,
    paddingTop: Platform.OS === "web" ? 96 : Spacing.three,
  },
  badge: {
    backgroundColor: "#2563eb",
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  badgeText: { color: "#fff" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  statCard: {
    flexBasis: "47%",
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  alertBox: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  tile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 22,
    alignItems: "center",
  },
  logoutButton: {
    backgroundColor: "#4b5563",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
