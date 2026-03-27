import { ThemedText } from '@/components/themedText';
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
import { useTheme } from '../../context/ThemeContext';
import { RegisterForm } from '@/components/auth/RegisterForm';

export default function RegisterScreen() {
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
                    <ThemedText style={styles.headerTitle}>Create an{"\n"}Account</ThemedText>
                    <ThemedText style={styles.headerSubtitle}>Join Rehbar Community today</ThemedText>
                </View>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                style={{ backgroundColor: colors.background }}
                contentContainerStyle={{ flexGrow: 1, backgroundColor: colors.background }}
                bounces={false}
            >
                <RegisterForm />
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 40,
        borderBottomLeftRadius: 36,
        borderBottomRightRadius: 36,
        overflow: 'hidden',
    },
    headerContent: {
        paddingHorizontal: 24,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#FFFFFF',
        lineHeight: 40,
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.9)',
        lineHeight: 22,
    },
});
