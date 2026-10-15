import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
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
import { getToken } from "@/lib/auth";

// Roles accepted by the backend for staff accounts.
const ROLES = [
  { value: "seller", label: "Seller" },
  { value: "warehouse", label: "Warehouse" },
  { value: "boss", label: "Boss" },
];

// Form to create a staff account or edit one (email, password and role).
export default function StaffFormScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    email?: string;
    role?: string;
    self?: string;
  }>();
  const isEdit = !!params.id;
  const isSelf = params.self === "1";

  const [email, setEmail] = useState(params.email ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(params.role ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Validates the form and creates or updates the staff account through the API
  async function handleSave() {
    setError("");

    if (!email.includes("@")) {
      setError("Enter a valid email");
      return;
    }
    if (!isEdit && password.length < 6) {
      setError("The password must have at least 6 characters");
      return;
    }
    if (isEdit && password !== "" && password.length < 6) {
      setError("The new password must have at least 6 characters");
      return;
    }
    if (role === "") {
      setError("Select a role");
      return;
    }

    const body: Record<string, string> = { email: email.trim(), role };
    if (!isEdit || password !== "") body.password = password;

    setSaving(true);
    try {
      const token = await getToken();
      const url = isEdit ? `${API_URL}/users/${params.id}` : `${API_URL}/users`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.message ?? "Could not save the user");
        return;
      }

      router.back();
    } catch (e) {
      console.log("Staff form error:", e);
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
            {isEdit ? "Edit staff user" : "Add staff user"}
          </ThemedText>

          <TextInput
            style={styles.input}
            placeholder="Email (used to log in)"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder={
              isEdit ? "New password (leave empty to keep)" : "Password"
            }
            placeholderTextColor="#888"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ThemedText type="smallBold">Role</ThemedText>
          <View style={styles.chipRow}>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                disabled={isSelf}
                onPress={() => setRole(r.value)}
                style={[
                  styles.chip,
                  role === r.value && styles.chipSelected,
                  isSelf && styles.disabled,
                ]}
              >
                <ThemedText type="small" style={styles.chipText}>
                  {r.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {isSelf && (
            <ThemedText type="small">
              You cannot change your own role.
            </ThemedText>
          )}

          {error !== "" && <ThemedText>{error}</ThemedText>}

          <Pressable
            style={[styles.button, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.buttonText}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create user"}
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
  input: {
    borderWidth: 1,
    borderColor: "#888",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#000",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.two },
  chip: {
    backgroundColor: "#4b5563",
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  chipSelected: { backgroundColor: "#2563eb" },
  chipText: { color: "#fff" },
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
