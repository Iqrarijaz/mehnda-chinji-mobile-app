export const prodBaseUrl = "https://api.rehbarapp.com";
export const devBaseUrl = process.env.EXPO_PUBLIC_API_URL || "https://api.rehbarapp.com";

// Use the correct fallback based on environment
export const baseUrl = process.env.EXPO_PUBLIC_API_URL || prodBaseUrl;
