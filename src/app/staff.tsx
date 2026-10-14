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
import { clearToken, getToken, getUserId } from "@/lib/auth";

type StaffUser = { _id: string; email: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  boss: "Boss",
  seller: "Seller",
  warehouse: "Warehouse",
};

export default function StaffScreen() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadUsers() {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        await clearToken();
        router.replace("/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not load users");
        return;
      }

      setError("");
      setUsers(
        (data as StaffUser[])
          .filter((u) => u.role !== "customer")
          .sort(
            (a, b) =>
              a.role.localeCompare(b.role) || a.email.localeCompare(b.email),
          ),
      );
    } catch (e) {
      console.log("Staff error:", e);
      setError("Cannot reach the server");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getUserId().then(setMyId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Staff
        </ThemedText>

        {loading && <ActivityIndicator />}
        {error !== "" && <ThemedText>{error}</ThemedText>}

        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <ThemedText type="smallBold">
                {item.email}
                {item._id === myId ? "  (you)" : ""}
              </ThemedText>
              <ThemedText type="small">
                Role: {ROLE_LABELS[item.role] ?? item.role}
              </ThemedText>
            </ThemedView>
          )}
        />

        <Pressable
          style={styles.button}
          onPress={() => router.push("/staff-form")}
        >
          <ThemedText style={styles.buttonText}>Add staff user</ThemedText>
        </Pressable>

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
