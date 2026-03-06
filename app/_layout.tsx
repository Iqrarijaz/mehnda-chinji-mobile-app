import { Colors } from '@/constants/colors';
import { SocketProvider } from '@/context/SocketContext';
import Sentry from '@/lib/sentry';
import { useSocketNotifications } from '@/hooks/useSocketNotifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import React, { useState, useEffect } from 'react';
import CustomDrawerContent from '../components/customDrawerContent';
import { toastConfig } from '../components/toastConfig';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { WeatherProvider } from '../context/WeatherContext';
import { asyncStoragePersister, queryClient } from '../lib/query-client';
import { ErrorBoundary } from '@/components/common/errorBoundary';
import NoInternetModal from '@/components/common/NoInternetModal';
import NetInfo from '@react-native-community/netinfo';
import { useDataUsageStore } from '@/store/dataUsageStore';

function DrawerLayout() {
  const { isAuthenticated } = useAuth();
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <Drawer
        drawerContent={(props: any) => <CustomDrawerContent {...props} />}
        initialRouteName="(tabs)"
        backBehavior="none"
        screenOptions={{
          headerShown: false,
          swipeEnabled: isAuthenticated, // Secure swipe access
          drawerType: 'front',
          drawerStyle: { backgroundColor: Colors[theme].background },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerItemStyle: { display: 'none' },
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="onboarding"
          options={{
            drawerItemStyle: { display: 'none' },
            swipeEnabled: false,
            headerShown: false,
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
        <Drawer.Screen
          name="listing/[categoryId]"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="notifications"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="support/index"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="support/create-ticket"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="support/tickets"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="weather"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="dataUsage"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
        <Drawer.Screen
          name="manageNotifications"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
            swipeEnabled: false,
          }}
        />
      </Drawer>
    </View>
  );
}
function AppInitializer() {
  usePushNotifications();
  useSocketNotifications();
  return null;
}

function RootLayout() {
  const [isOffline, setIsOffline] = useState(false);

  // Simple network check placeholder
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = !!state.isConnected && !!state.isInternetReachable !== false;
      setIsOffline(!isConnected);

      // Update data usage store network type
      const store = useDataUsageStore.getState();
      if (!isConnected) {
        store.setNetworkType('none');
      } else if (state.type === 'wifi') {
        store.setNetworkType('wifi');
      } else if (state.type === 'cellular') {
        store.setNetworkType('cellular');
      } else {
        store.setNetworkType('none');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRetry = async () => {
    const state = await NetInfo.refresh();
    const isConnected = !!state.isConnected && !!state.isInternetReachable !== false;
    setIsOffline(!isConnected);
  };

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ErrorBoundary>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <AuthProvider>
                <WeatherProvider>
                  <SocketProvider>
                    <AppInitializer />
                    <StatusBar style="dark" />
                    <DrawerLayout />
                    <NoInternetModal
                      visible={isOffline}
                      onRetry={handleRetry}
                    />
                    <Toast config={toastConfig} topOffset={60} />
                  </SocketProvider>
                </WeatherProvider>
              </AuthProvider>
            </BottomSheetModalProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </GestureHandlerRootView>
    </PersistQueryClientProvider>
  );
}

export default Sentry.wrap(RootLayout);
