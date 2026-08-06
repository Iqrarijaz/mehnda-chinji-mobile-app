import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { Layout } from '../../constants/layout';
import { useTheme } from '../../context/ThemeContext';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <KeyboardAvoidingView
            behavior="padding"
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            {/* Header / Top Section */}
            <View style={{ backgroundColor: colors.background, zIndex: 1 }}>
                <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: colors.primary, zIndex: 1 }]}>
                    <View style={styles.headerContent}>
                        <Image
                            source={require('../../public/white_logo.svg')}
                            style={{ width: 200, height: 50, marginBottom: 12 }}
                            contentFit="contain"
                        />
                        <ThemedText style={styles.headerTitle}>Create an Account</ThemedText>
                        <ThemedText style={styles.headerSubtitle}>Join Rehbar Community today</ThemedText>
                    </View>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ flex: 1, backgroundColor: colors.background }}
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background, paddingBottom: 36 }}
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                <RegisterForm />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1 },
    headerSection: {
        paddingBottom: 36,
        borderBottomLeftRadius: Layout.headerBorderRadius,
        borderBottomRightRadius: Layout.headerBorderRadius,
        overflow: 'hidden' },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 36 },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 8 },
    headerSubtitle: {
        fontSize: 12.5,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22 } });
