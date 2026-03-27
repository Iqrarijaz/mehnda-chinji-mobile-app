import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Tabs, useNavigation, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';

import { CustomTabBar } from '@/components/customTabBar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { LocationPromptModal } from '@/components/profile/LocationPromptModal';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const hasChecked = React.useRef(false);

  useEffect(() => {
    if (!hasChecked.current && user?.user && (!user.user.city)) {
      hasChecked.current = true;
      // Small delay to ensure layout is ready
      const timer = setTimeout(() => {
        setModalVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleUpdate = React.useCallback(() => {
    setModalVisible(false);
    router.push('/profile' as any);
  }, [router]);

  const memoizedModal = React.useMemo(() => (
    <LocationPromptModal
      visible={modalVisible}
      onClose={() => setModalVisible(false)}
      onUpdate={handleUpdate}
    />
  ), [modalVisible, handleUpdate]);





  return (
    <>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: Colors[theme].background,
          },
          headerTintColor: Colors[theme].text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                const parent = navigation.getParent();
                if (parent) {
                  parent.dispatch(DrawerActions.toggleDrawer());
                } else {
                  // Fallback if navigation hierarchy is different
                  navigation.dispatch(DrawerActions.toggleDrawer());
                }
              }}
              style={{ marginLeft: 15 }}
            >
              <Ionicons name="menu" size={28} color={Colors[theme].text} />
            </TouchableOpacity>
          ),
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
          }}
        />
        {/* <Tabs.Screen
          name="feed"
          options={{
            title: 'Feed',
            headerShown: false,
          }}
        /> */}
        <Tabs.Screen
          name="business"
          options={{
            title: 'Directory',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="blood"
          options={{
            title: 'Blood',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
          }}
        />
      </Tabs>

      {memoizedModal}
    </>


  );
}


