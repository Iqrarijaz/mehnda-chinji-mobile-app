declare module 'expo-device' {
  export const modelName: string | null;
  export const brand: string | null;
  export const manufacturer: string | null;
  export const deviceName: string | null;
  export const osName: string | null;
  export const osVersion: string | null;
  export const isDevice: boolean;
  export const platformApiLevel: number | null;
}
