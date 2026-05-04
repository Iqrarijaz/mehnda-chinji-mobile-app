import { Drawer } from 'expo-router/drawer';
import { View } from 'react-native';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function DrawerLayout() {
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? Colors[theme].card : Colors[theme].background }}>
            <Drawer
                drawerContent={(props: any) => <CustomDrawerContent {...props} />}
                initialRouteName="(tabs)"
                backBehavior="none"
                screenOptions={{
                    headerShown: false,
                    swipeEnabled: isAuthenticated,
                    drawerType: 'front',
                    drawerStyle: { backgroundColor: theme === 'dark' ? Colors[theme].card : Colors[theme].background },
                }}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        drawerLabel: 'Main App',
                        title: 'Main App',
                        drawerItemStyle: isAuthenticated ? {} : { display: 'none' },
                    }}
                />
            </Drawer>
        </View>
    );
}
