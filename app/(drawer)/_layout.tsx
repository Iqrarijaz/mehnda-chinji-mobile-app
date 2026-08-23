import { Drawer } from 'expo-router/drawer';
import { View } from 'react-native';
import CustomDrawerContent from '../../components/CustomDrawerContent';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const renderDrawerContent = (props: any) => <CustomDrawerContent {...props} />;

export default function DrawerLayout() {
    const { isAuthenticated } = useAuth();
    const { theme } = useTheme();

    return (
        <View style={{ flex: 1, backgroundColor: theme === 'dark' ? Colors[theme].card : Colors[theme].background }}>
            <Drawer
                drawerContent={renderDrawerContent}
                initialRouteName="(tabs)"
                backBehavior="none"
                screenOptions={{
                    headerShown: false,
                    swipeEnabled: isAuthenticated,
                    drawerType: 'front',
                    overlayColor: 'rgba(0, 0, 0, 0.5)',
                    drawerStyle: { backgroundColor: theme === 'dark' ? Colors[theme].card : Colors[theme].background } }}
            >
                <Drawer.Screen
                    name="(tabs)"
                    options={{
                        drawerLabel: 'Main App',
                        title: 'Main App',
                        drawerItemStyle: isAuthenticated ? {} : { display: 'none' } }}
                />
                <Drawer.Screen
                    name="cricket/index"
                    options={{
                        drawerLabel: 'Cricket Hub',
                        title: 'Cricket Hub',
                        drawerItemStyle: { display: 'none' }
                    }}
                />
            </Drawer>
        </View>
    );
}
