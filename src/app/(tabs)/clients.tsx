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
import { clearToken, getRole, getToken } from "@/lib/auth";

type Client = {
  _id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  address1?: string | null;
  address2?: string | null;
  district1?: string | null;
  district2?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  email?: string | null;
  personalId?: string | null;
  companyId?: string | null;
  companyName?: string | null;
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

// Clients screen: lists clients; the boss can also edit and delete them.
export default function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [role, setRole] = useState("");

  // Loads the client list from the API.
  async function loadClients() {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        await clearToken();
        router.replace("/login");
        return;
      }

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not load clients");
        return;
      }
      setError("");
      setClients(data);
    } catch (e) {
      console.log("Clients error:", e);
      setError("Cannot reach the server");
    } finally {
      setLoading(false);
    }
  }

  // Asks for confirmation and deletes a client (and their login) through the API.
  async function deleteClient(client: Client) {
    setError("");
    const confirmed = await confirmAction(
      `Delete ${client.firstName} ${client.lastName}? This also removes their login and cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/clients/${client._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.message ?? "Could not delete the client");
        return;
      }

      setClients((prev) => prev.filter((c) => c._id !== client._id));
    } catch (e) {
      console.log("Delete client error:", e);
      setError("Cannot reach the server");
    }
  }

  // Opens the client form with the client's current data to edit it.
  function editClient(client: Client) {
    router.push({
      pathname: "/client-form",
      params: {
        id: client._id,
        firstName: client.firstName,
        lastName: client.lastName,
        address1: client.address1 ?? "",
        address2: client.address2 ?? "",
        district1: client.district1 ?? "",
        district2: client.district2 ?? "",
        phone1: client.phone1 ?? "",
        phone2: client.phone2 ?? "",
        companyId: client.companyId ?? "",
        companyName: client.companyName ?? "",
      },
    });
  }

  useEffect(() => {
    getRole().then((r) => setRole(r ?? ""));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="title" style={styles.title}>
          Clients
        </ThemedText>

        {loading && <ActivityIndicator />}
        {error !== "" && <ThemedText>{error}</ThemedText>}

        <FlatList
          data={clients}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ThemedView type="backgroundElement" style={styles.card}>
              <Field
                label="Name"
                value={`${item.firstName} ${item.lastName}`}
              />
              <Field label="Personal ID" value={item.personalId} />
              <Field label="Company" value={item.companyName} />
              <Field label="Company ID" value={item.companyId} />
              <Field label="Email" value={item.email} />
              <Field label="Phone" value={item.phone1} />
              <Field label="Alternate phone" value={item.phone2} />
              <Field label="Address" value={item.address1} />
              <Field label="District" value={item.district1} />
              <Field label="Address 2" value={item.address2} />
              <Field label="District 2" value={item.district2} />

              {role === "boss" && (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.smallButton, styles.editButton]}
                    onPress={() => editClient(item)}
                  >
                    <ThemedText style={styles.buttonText}>Edit</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.smallButton, styles.deleteButton]}
                    onPress={() => deleteClient(item)}
                  >
                    <ThemedText style={styles.buttonText}>Delete</ThemedText>
                  </Pressable>
                </View>
              )}
            </ThemedView>
          )}
        />

        {(role === "boss" || role === "seller") && (
          <Pressable
            style={styles.button}
            onPress={() => router.push("/client-form")}
          >
            <ThemedText style={styles.buttonText}>Add client</ThemedText>
          </Pressable>
        )}
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
    marginBottom: Spacing.three,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
});
