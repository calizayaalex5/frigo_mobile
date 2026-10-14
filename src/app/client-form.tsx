import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    TextInput,
    TextInputProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/constants/api";
import { Spacing } from "@/constants/theme";
import { getToken } from "@/lib/auth";

function FormInput(props: TextInputProps) {
  return (
    <TextInput style={styles.input} placeholderTextColor="#888" {...props} />
  );
}

const emptyToNull = (value: string) =>
  value.trim() === "" ? null : value.trim();

export default function ClientFormScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    district1?: string;
    district2?: string;
    phone1?: string;
    phone2?: string;
    companyId?: string;
    companyName?: string;
  }>();
  const isEdit = !!params.id;

  // Only used when creating
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [personalId, setPersonalId] = useState("");

  const [firstName, setFirstName] = useState(params.firstName ?? "");
  const [lastName, setLastName] = useState(params.lastName ?? "");
  const [address1, setAddress1] = useState(params.address1 ?? "");
  const [address2, setAddress2] = useState(params.address2 ?? "");
  const [district1, setDistrict1] = useState(params.district1 ?? "");
  const [district2, setDistrict2] = useState(params.district2 ?? "");
  const [phone1, setPhone1] = useState(params.phone1 ?? "");
  const [phone2, setPhone2] = useState(params.phone2 ?? "");
  const [companyId, setCompanyId] = useState(params.companyId ?? "");
  const [companyName, setCompanyName] = useState(params.companyName ?? "");

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError("");

    if (firstName.trim() === "" || lastName.trim() === "") {
      setError("First name and last name are required");
      return;
    }
    if (
      !isEdit &&
      (email.trim() === "" || password === "" || personalId.trim() === "")
    ) {
      setError("Email, password and personal ID are required");
      return;
    }

    const common = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      address1: emptyToNull(address1),
      address2: emptyToNull(address2),
      district1: emptyToNull(district1),
      district2: emptyToNull(district2),
      phone1: emptyToNull(phone1),
      phone2: emptyToNull(phone2),
      companyId: emptyToNull(companyId),
      companyName: emptyToNull(companyName),
    };

    const body = isEdit
      ? common
      : {
          ...common,
          email: email.trim(),
          password,
          personalId: personalId.trim(),
        };

    setSaving(true);
    try {
      const token = await getToken();
      const url = isEdit
        ? `${API_URL}/clients/${params.id}`
        : `${API_URL}/clients`;

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
        setError(data.message ?? "Could not save the client");
        return;
      }

      router.back();
    } catch (e) {
      console.log("Client form error:", e);
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
            {isEdit ? "Edit client" : "Add client"}
          </ThemedText>

          {!isEdit && (
            <>
              <FormInput
                placeholder="Email (used to log in)"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <FormInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <FormInput
                placeholder="Personal ID"
                value={personalId}
                onChangeText={setPersonalId}
              />
            </>
          )}

          <FormInput
            placeholder="First name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <FormInput
            placeholder="Last name"
            value={lastName}
            onChangeText={setLastName}
          />
          <FormInput
            placeholder="Address"
            value={address1}
            onChangeText={setAddress1}
          />
          <FormInput
            placeholder="District"
            value={district1}
            onChangeText={setDistrict1}
          />
          <FormInput
            placeholder="Address 2 (optional)"
            value={address2}
            onChangeText={setAddress2}
          />
          <FormInput
            placeholder="District 2 (optional)"
            value={district2}
            onChangeText={setDistrict2}
          />
          <FormInput
            placeholder="Phone"
            value={phone1}
            onChangeText={setPhone1}
            keyboardType="phone-pad"
          />
          <FormInput
            placeholder="Alternate phone (optional)"
            value={phone2}
            onChangeText={setPhone2}
            keyboardType="phone-pad"
          />
          <FormInput
            placeholder="Company ID (optional)"
            value={companyId}
            onChangeText={setCompanyId}
          />
          <FormInput
            placeholder="Company name (optional)"
            value={companyName}
            onChangeText={setCompanyName}
          />

          {error !== "" && <ThemedText>{error}</ThemedText>}

          <Pressable
            style={[styles.button, saving && styles.disabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={styles.buttonText}>
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create client"}
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
