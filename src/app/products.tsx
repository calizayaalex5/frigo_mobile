import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
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
  cost?: number; // only present for roles allowed to see it
  stock?: StockEntry[];
};

// Products screen: lists products with the fields the user's role can see.
export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");

  // Deletes the saved token and returns to the login screen.
  async function logout() {
    await clearToken();
    router.replace("/login");
  }

  // Loads the product list from the API.
  async function loadProducts() {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/products`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        await logout();
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not load products");
        return;
      }
      setError("");
      setProducts(data);
    } catch (e) {
      console.log("Products error:", e);
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
      loadProducts();
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Products
        </ThemedText>

        {loading && <ActivityIndicator />}
        {error !== "" && <ThemedText>{error}</ThemedText>}

        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              disabled={role !== "boss"}
              onPress={() =>
                router.push({
                  pathname: "/edit-product",
                  params: {
                    id: item._id,
                    name: item.name,
                    price: String(item.price ?? ""),
                    cost: String(item.cost ?? ""),
                    bulnes: String(
                      item.stock?.find((s) => s.store === "Manuel Bulnes")
                        ?.quantity ?? 0,
                    ),
                    barros: String(
                      item.stock?.find((s) => s.store === "Barros Arana")
                        ?.quantity ?? 0,
                    ),
                  },
                })
              }
            >
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                {item.price !== undefined && (
                  <ThemedText>Price: ${item.price}</ThemedText>
                )}
                {item.cost !== undefined && (
                  <ThemedText>Cost: ${item.cost}</ThemedText>
                )}
                {item.stock?.map((s) => (
                  <ThemedText key={s.store} type="small">
                    {s.store}: {s.quantity}
                  </ThemedText>
                ))}
                {role === "boss" && (
                  <ThemedText type="small">Tap to edit</ThemedText>
                )}
              </ThemedView>
            </Pressable>
          )}
        />

        {role === "boss" && (
          <Pressable
            style={styles.button}
            onPress={() => router.push("/add-product")}
          >
            <ThemedText style={styles.buttonText}>Add product</ThemedText>
          </Pressable>
        )}

        <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
          <ThemedText style={styles.buttonText}>Back</ThemedText>
        </Pressable>
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
  },
  secondaryButton: {
    backgroundColor: "#4b5563",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
    marginBottom: Spacing.three,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
