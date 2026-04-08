export const prodBaseUrl = "https://api.rehbarapp.com";
export const devBaseUrl = "https://8416-39-43-128-80.ngrok-free.app";

// Use the correct fallback based on environment
export const baseUrl = __DEV__ ? devBaseUrl : prodBaseUrl;
