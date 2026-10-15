import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  View,
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

// Alert.alert with buttons does not work on web, so web uses window.confirm.
function confirmAction(message: string): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(message));
  }
  return new Promise((resolve) => {
    Alert.alert("Confirm", message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: "Delete", style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}

// Staff screen: lets the boss see, add, edit and delete staff accounts.
export default function StaffScreen() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Loads the staff accounts from the API (clients are managed in the Clients tab).
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

  // Asks for confirmation and deletes a staff account (the boss cannot delete themselves)
  async function deleteUser(user: StaffUser) {
    if (user._id === myId) return;
    setError("");

    const confirmed = await confirmAction(
      `Delete ${user.email}? They will no longer be able to log in.`,
    );
    if (!confirmed) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/users/${user._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message ?? "Could not delete the user");
        return;
      }

      setUsers((prev) => prev.filter((u) => u._id !== user._id));
    } catch (e) {
      console.log("Delete user error:", e);
      setError("Cannot reach the server");
    }
  }

  // Opens the staff form with the user's current data to edit it.
  function editUser(user: StaffUser) {
    router.push({
      pathname: "/staff-form",
      params: {
        id: user._id,
        email: user.email,
        role: user.role,
        self: user._id === myId ? "1" : "0",
      },
    });
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

              <View style={styles.actions}>
                <Pressable
                  style={[styles.smallButton, styles.editButton]}
                  onPress={() => editUser(item)}
                >
                  <ThemedText style={styles.buttonText}>Edit</ThemedText>
                </Pressable>
                {item._id !== myId && (
                  <Pressable
                    style={[styles.smallButton, styles.deleteButton]}
                    onPress={() => deleteUser(item)}
                  >
                    <ThemedText style={styles.buttonText}>Delete</ThemedText>
                  </Pressable>
                )}
              </View>
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
  actions: {
    flexDirection: "row",
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  smallButton: {
    flex: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  editButton: { backgroundColor: "#4b5563" },
  deleteButton: { backgroundColor: "#b91c1c" },
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
