import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { getToken } from "@/lib/auth";

export default function AddProductScreen() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stockBulnes, setStockBulnes] = useState("");
  const [stockBarros, setStockBarros] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");

    const priceNum = Number(price);
    const costNum = Number(cost);
    const bulnesNum = Number(stockBulnes || 0);
    const barrosNum = Number(stockBarros || 0);

    if (name.trim() === "") {
      setError("Name is required");
      return;
    }
    if (
      [priceNum, costNum, bulnesNum, barrosNum].some((n) => Number.isNaN(n))
    ) {
      setError("Price, cost and stock must be numbers");
      return;
    }

    setSaving(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          price: priceNum,
          cost: costNum,
          stock: [
            { store: "Manuel Bulnes", quantity: bulnesNum },
            { store: "Barros Arana", quantity: barrosNum },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not save the product");
        return;
      }

      router.back();
    } catch (e) {
      console.log("Add product error:", e);
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
            Add product
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#888"
            value={name}
            onChangeText={setName}
          />
          <TextInput
            style={styles.input}
            placeholder="Price"
            placeholderTextColor="#888"
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Cost"
            placeholderTextColor="#888"
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Stock - Manuel Bulnes"
            placeholderTextColor="#888"
            value={stockBulnes}
            onChangeText={setStockBulnes}
            keyboardType="numeric"
          />
          <TextInput
            style={styles.input}
            placeholder="Stock - Barros Arana"
            placeholderTextColor="#888"
            value={stockBarros}
            onChangeText={setStockBarros}
            keyboardType="numeric"
          />

          {error !== "" && <ThemedText>{error}</ThemedText>}

          <Pressable
            style={[styles.button, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.buttonText}>
              {saving ? "Saving..." : "Save"}
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
  form: {
    gap: Spacing.three,
    paddingVertical: Spacing.four,
  },
  title: { textAlign: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
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
