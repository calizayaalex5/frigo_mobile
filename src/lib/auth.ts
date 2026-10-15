import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "token";

// Saves the login token on the device so the session persists.
export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

// Reads the saved login token from the device, or null if there is none.
export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

// Removes the login token from the device (used to log out).
export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Decodes the middle part of the JWT to read its data (role and user id).
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

// Returns the role of the logged-in user, read from the token.
export async function getRole(): Promise<string | null> {
  const payload = await getPayload();
  return payload?.role ?? null;
}

// Returns the id of the logged-in user, read from the token.
export async function getUserId(): Promise<string | null> {
  const payload = await getPayload();
  return payload?.userId ?? null;
}
