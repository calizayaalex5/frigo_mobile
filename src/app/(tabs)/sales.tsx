import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { clearToken, getToken } from "@/lib/auth";

type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};
type Sale = {
  _id: string;
  customerId: string;
  sellerId?: string;
  store: string;
  products: SaleItem[];
  total: number;
  paymentType: string;
  paymentMethod?: string | null;
  date: string;
};

// Shows "Label: value" and hides the row when the value is empty.
function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <ThemedText type="small">
      <ThemedText type="smallBold">{label}: </ThemedText>
      {value}
    </ThemedText>
  );
}

// Optional lookups: if the role is not allowed to read them, return null.
async function fetchOptional(url: string, headers: Record<string, string>) {
  try {
    const response = await fetch(url, { headers });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Converts a date from the API into the phone's local date and time.
function formatDate(value: string) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

// Sales screen: shows the sales history allowed for the user's role.
export default function SalesScreen() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [clientNames, setClientNames] = useState<Record<string, string>>({});
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Loads the sales and the client and product names to display them
  async function loadSales() {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const response = await fetch(`${API_URL}/sales`, { headers });

      if (response.status === 401) {
        await clearToken();
        router.replace("/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not load sales");
        return;
      }

      setError("");
      setSales(
        [...data].sort(
          (a: Sale, b: Sale) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        ),
      );

      const [clientsData, productsData] = await Promise.all([
        fetchOptional(`${API_URL}/clients`, headers),
        fetchOptional(`${API_URL}/products`, headers),
      ]);

      if (Array.isArray(clientsData)) {
        const names: Record<string, string> = {};
        for (const c of clientsData) {
          if (c.userId) names[c.userId] = `${c.firstName} ${c.lastName}`;
        }
        setClientNames(names);
      }
      if (Array.isArray(productsData)) {
        const names: Record<string, string> = {};
        for (const p of productsData) names[p._id] = p.name;
        setProductNames(names);
      }
    } catch (e) {
      console.log("Sales error:", e);
      setError("Cannot reach the server");
    } finally {
      setLoading(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadSales();
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Sales
        </ThemedText>

        {loading && <ActivityIndicator />}
        {error !== "" && <ThemedText>{error}</ThemedText>}
        {!loading && error === "" && sales.length === 0 && (
          <ThemedText style={styles.title}>No sales yet</ThemedText>
        )}

        <FlatList
          data={sales}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <Field label="Date" value={formatDate(item.date)} />
              <Field
                label="Client"
                value={clientNames[item.customerId] ?? item.customerId}
              />
              <Field label="Store" value={item.store} />

              {item.products.map((p, index) => (
                <ThemedText key={`${p.productId}-${index}`} type="small">
                  {p.quantity} x {productNames[p.productId] ?? p.productId} — $
                  {p.unitPrice} = ${p.subtotal}
                </ThemedText>
              ))}

              <Field label="Payment" value={item.paymentType} />
              <Field label="Method" value={item.paymentMethod} />
              <ThemedText type="smallBold">Total: ${item.total}</ThemedText>
            </ThemedView>
          )}
        />
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
    paddingTop: Platform.OS === "web" ? 24 : Spacing.three,
    gap: Spacing.three,
  },
  title: { textAlign: "center" },
  list: { gap: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
