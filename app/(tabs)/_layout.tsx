import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { Tabs, useNavigation } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';

import { CustomTabBar } from '@/components/CustomTabBar';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function TabLayout() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const navigation = useNavigation();



  const getProfileSource = () => {
    if (user?.user?.profileImage) {
      return { uri: user.user.profileImage };
    }
    const gender = user?.user?.gender?.toUpperCase();
    if (gender === 'FEMALE') {
      return require('../../assets/icons/user-female.png');
    }
    return require('../../assets/icons/user-male.png');
  };

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
              onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
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
        <Tabs.Screen
          name="business"
          options={{
            title: 'Business',
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

    </>
  );
}


