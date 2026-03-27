import { ThemedText } from '@/components/themedText';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../constants/colors';
import { useTheme } from '../../context/ThemeContext';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: '#FFFFFF' }]}
        >
            {/* Header / Top Section */}
            <View style={[styles.headerSection, { paddingTop: insets.top, backgroundColor: '#006666', zIndex: 1 }]}>
                <View style={styles.headerContent}>
                    <Image
                        source={require('../../public/icon.svg')}
                        style={{ width: 48, height: 48, marginBottom: 16 }}
                        contentFit="contain"
                    />
                    <ThemedText style={styles.headerTitle}>Sign in to your{"\n"}Account</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Welcome back! Please enter your details</ThemedText>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: colors.background }}
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
                bounces={false}
            >
                <LoginForm />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 38,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 22,
        paddingTop: 38,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
});
