import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { clearToken, getToken, getUserId } from "@/lib/auth";

type Client = {
  _id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  personalId?: string | null;
};
type StockEntry = { store: string; quantity: number };
type Product = {
  _id: string;
  name: string;
  price?: number;
  stock?: StockEntry[];
};

const STORES = ["Manuel Bulnes", "Barros Arana"];

// ASSUMPTION: edit these values to match what your database uses.
const PAYMENT_TYPES = [
  { value: "cash", label: "Cash (contado)" },
  { value: "credit", label: "Credit (direct)" },
];
const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "transfer", label: "Transfer" },
  { value: "check", label: "Check" },
  { value: "debit", label: "Debit card" },
  { value: "credit_card", label: "Credit card" },
];

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <ThemedText type="small" style={styles.chipText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function NewSaleScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sellerId, setSellerId] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [store, setStore] = useState("");
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [paymentType, setPaymentType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        const headers = { Authorization: `Bearer ${token}` };
        const [clientsRes, productsRes] = await Promise.all([
          fetch(`${API_URL}/clients`, { headers }),
          fetch(`${API_URL}/products`, { headers }),
        ]);

        if (clientsRes.status === 401 || productsRes.status === 401) {
          await clearToken();
          router.replace("/login");
          return;
        }

        const clientsData = await clientsRes.json();
        const productsData = await productsRes.json();
        if (!clientsRes.ok || !productsRes.ok) {
          setError(
            clientsData.message ??
              productsData.message ??
              "Could not load data",
          );
          return;
        }

        setClients(clientsData);
        setProducts(productsData);
        setSellerId(await getUserId());
      } catch (e) {
        console.log("New sale load error:", e);
        setError("Cannot reach the server");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const total = products.reduce((sum, p) => {
    const qty = Number(quantities[p._id] || 0);
    return sum + (Number.isFinite(qty) ? qty * (p.price ?? 0) : 0);
  }, 0);

  async function handleSave() {
    setError("");

    if (!sellerId) {
      setError("Could not read your user id from the session. Log in again.");
      return;
    }
    if (customerId === "") {
      setError("Select a client");
      return;
    }
    if (store === "") {
      setError("Select a store");
      return;
    }

    const items: { productId: string; quantity: number }[] = [];
    for (const p of products) {
      const raw = quantities[p._id];
      if (!raw || raw.trim() === "") continue;
      const qty = Number(raw);
      if (!Number.isInteger(qty) || qty <= 0) {
        setError("Quantities must be whole numbers greater than 0");
        return;
      }
      items.push({ productId: p._id, quantity: qty });
    }
    if (items.length === 0) {
      setError("Add at least one product");
      return;
    }

    if (paymentType === "") {
      setError("Select a payment type");
      return;
    }
    if (paymentType === "cash" && paymentMethod === "") {
      setError("Select a payment method");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customerId,
          sellerId,
          store,
          products: items,
          paymentType,
          paymentMethod: paymentType === "cash" ? paymentMethod : null,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not register the sale");
        return;
      }

      router.back();
    } catch (e) {
      console.log("Create sale error:", e);
      setError("Cannot reach the server");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.form}>
          <ThemedText type="title" style={styles.title}>
            New sale
          </ThemedText>

          {loading && <ActivityIndicator />}

          <ThemedText type="smallBold">1. Client</ThemedText>
          <View style={styles.chipRow}>
            {clients
              .filter((c) => !!c.userId)
              .map((c) => (
                <Chip
                  key={c._id}
                  label={`${c.firstName} ${c.lastName}`}
                  selected={customerId === c.userId}
                  onPress={() => setCustomerId(c.userId as string)}
                />
              ))}
          </View>

          <ThemedText type="smallBold">2. Store</ThemedText>
          <View style={styles.chipRow}>
            {STORES.map((s) => (
              <Chip
                key={s}
                label={s}
                selected={store === s}
                onPress={() => setStore(s)}
              />
            ))}
          </View>

          <ThemedText type="smallBold">3. Products</ThemedText>
          {products.map((p) => {
            const available =
              store === ""
                ? null
                : (p.stock?.find((s) => s.store === store)?.quantity ?? 0);
            return (
              <ThemedView
                key={p._id}
                type="backgroundElement"
                style={styles.productRow}
              >
                <View style={styles.productInfo}>
                  <ThemedText type="smallBold">{p.name}</ThemedText>
                  <ThemedText type="small">
                    Price: {p.price !== undefined ? `$${p.price}` : "-"}
                    {available !== null ? `  |  Stock: ${available}` : ""}
                  </ThemedText>
                </View>
                <TextInput
                  style={styles.qtyInput}
                  placeholder="0"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={quantities[p._id] ?? ""}
                  onChangeText={(text) =>
                    setQuantities((prev) => ({ ...prev, [p._id]: text }))
                  }
                />
              </ThemedView>
            );
          })}

          <ThemedText type="smallBold">4. Payment</ThemedText>
          <View style={styles.chipRow}>
            {PAYMENT_TYPES.map((t) => (
              <Chip
                key={t.value}
                label={t.label}
                selected={paymentType === t.value}
                onPress={() => setPaymentType(t.value)}
              />
            ))}
          </View>
          {paymentType === "cash" && (
            <View style={styles.chipRow}>
              {PAYMENT_METHODS.map((m) => (
                <Chip
                  key={m.value}
                  label={m.label}
                  selected={paymentMethod === m.value}
                  onPress={() => setPaymentMethod(m.value)}
                />
              ))}
            </View>
          )}

          <ThemedText type="smallBold">Estimated total: ${total}</ThemedText>

          {error !== "" && <ThemedText>{error}</ThemedText>}

          <Pressable
            style={[styles.button, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.buttonText}>
              {saving ? "Saving..." : "Register sale"}
            </ThemedText>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Cancel</ThemedText>
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
  },
  form: { gap: Spacing.three, paddingVertical: Spacing.four },
  title: { textAlign: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    backgroundColor: "#4b5563",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: "#2563eb" },
  chipText: { color: "#fff" },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  productInfo: { flex: 1, gap: Spacing.one },
  qtyInput: {
    width: 70,
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "#fff",
    color: "#000",
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
  },
  disabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
