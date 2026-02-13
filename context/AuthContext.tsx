import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';

type UserData = {
    token: string;
    user: any;
} | null;

interface AuthContextType {
    user: UserData;
    loading: boolean;
    login: (data: any) => void;
    logout: () => void;
    updateUser: (data: any) => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    login: () => { },
    logout: () => { },
    updateUser: async () => { },
    isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<UserData>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        const loadUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('userData');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (e) {
                console.error('Failed to load user', e);
            } finally {
                setLoading(false);
            }
        };
        loadUser();
    }, []);

    const login = async (payload: any) => {
        // Handle nested data if present
        const source = payload.data || payload;
        const userData = source.userData || (source.id ? source : null);

        if (!userData) {
            console.error('Invalid login data - userData not found');
            return;
        }

        const authData = { user: userData, token: source.token || payload.token };
        setUser(authData);
        await AsyncStorage.setItem('userData', JSON.stringify(authData));
        // @ts-ignore
        router.replace('/(tabs)');
    };

    const logout = async () => {
        setUser(null);
        await AsyncStorage.removeItem('userData');
        // @ts-ignore
        router.replace('/(auth)/login');
    };

    const updateUser = async (newUserData: any) => {
        if (!user) return;
        const updatedAuthData = { ...user, user: { ...user.user, ...newUserData } };
        setUser(updatedAuthData);
        await AsyncStorage.setItem('userData', JSON.stringify(updatedAuthData));
    };

    const isAuthenticated = !!user;

    // Protect routes
    useEffect(() => {
        if (loading) return;

        // @ts-ignore
        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            // @ts-ignore
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            // @ts-ignore
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
