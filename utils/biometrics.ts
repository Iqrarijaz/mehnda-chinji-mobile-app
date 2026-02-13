import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_KEY = 'biometric_credentials';

export const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
};

export const saveBiometricCredentials = async (email: string, password: string) => {
    try {
        await SecureStore.setItemAsync(BIOMETRIC_KEY, JSON.stringify({ email, password }));
        return true;
    } catch (error) {
        console.error('Error saving biometric credentials:', error);
        return false;
    }
};

export const getBiometricCredentials = async () => {
    try {
        const credentials = await SecureStore.getItemAsync(BIOMETRIC_KEY);
        return credentials ? JSON.parse(credentials) : null;
    } catch (error) {
        console.error('Error getting biometric credentials:', error);
        return null;
    }
};

export const deleteBiometricCredentials = async () => {
    try {
        await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
        return true;
    } catch (error) {
        console.error('Error deleting biometric credentials:', error);
        return false;
    }
};

export const authenticateWithBiometrics = async () => {
    try {
        const result = await LocalAuthentication.authenticateAsync({
            promptMessage: 'Login with Biometrics',
            fallbackLabel: 'Use Passcode',
        });
        return result.success;
    } catch (error) {
        console.error('Biometric authentication error:', error);
        return false;
    }
};
