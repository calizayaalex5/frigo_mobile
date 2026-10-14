import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";

export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

async function getPayload(): Promise<Record<string, any> | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export async function getRole(): Promise<string | null> {
  const payload = await getPayload();
  return payload?.role ?? null;
}

export async function getUserId(): Promise<string | null> {
  const payload = await getPayload();
  return payload?.userId ?? null;
}
