import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { toastConfig } from '../components/ToastConfig';
import { Colors } from '../constants/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { asyncStoragePersister, queryClient } from '../lib/query-client';

function DrawerLayout() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  return (
    <Drawer
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: isAuthenticated, // Secure swipe access
        drawerType: 'front',
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false, // Disable on splash
        }}
      />
      <Drawer.Screen
        name="(auth)"
        options={{
          drawerItemStyle: { display: 'none' },
          swipeEnabled: false, // Disable on auth Screens
        }}
      />
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerLabel: 'Main App',
          title: 'Main App',
          drawerItemStyle: isAuthenticated ? {} : { display: 'none' },
        }}
      />
      <Drawer.Screen
        name="settings"
        options={{
          drawerLabel: 'Settings',
          title: 'Settings',
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          headerStyle: {
            backgroundColor: Colors[theme].background,
          },
          headerTintColor: Colors[theme].text,
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          swipeEnabled: false,
        }}
      />
    </Drawer>
  );
}

export default function RootLayout() {

  useEffect(() => {
    // No-op for now as Firebase notifications are removed
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <AuthProvider>
            <StatusBar style="auto" />
            <DrawerLayout />
            <Toast config={toastConfig} topOffset={60} />
          </AuthProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

