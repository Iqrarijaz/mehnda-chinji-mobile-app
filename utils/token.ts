import AsyncStorage from '@react-native-async-storage/async-storage';

export const GET_AUTH_HEADER = async () => {
    try {
        const userData = await AsyncStorage.getItem("userData");
        const token = userData ? JSON.parse(userData).token : null;
        return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (e) {
        return {};
    }
};
