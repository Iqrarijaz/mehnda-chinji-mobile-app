import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { toastConfig } from '../components/ToastConfig';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';

function DrawerLayout() {
  const { isAuthenticated } = useAuth();

  return (
    <Drawer
      drawerContent={(props: any) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: isAuthenticated, // Secure swipe access
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
    </Drawer>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AuthProvider>
          <StatusBar style="auto" />
          <DrawerLayout />
          <Toast config={toastConfig} />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

