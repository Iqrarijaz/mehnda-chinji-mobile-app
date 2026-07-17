import { ThemedText } from '@/components/ThemedText';
import { Image } from 'expo-image';
import {
    KeyboardAvoidingView,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
            behavior="padding"
            style={styles.container}
        >
            <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.flex}
                contentContainerStyle={styles.scroll}
                bounces={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Forest hero with brand lockup ─────────────────────── */}
                <View style={[styles.hero, { paddingTop: insets.top + 32 }]}>
                    <Image
                        source={require('../../public/white_logo.png')}
                        style={styles.brandLogo}
                        contentFit="contain"
                    />
                </View>

                {/* ── Rounded content sheet ─────────────────────────────── */}
                <Animated.View
                    entering={FadeInDown.duration(450)}
                    style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: insets.bottom + 32 }]}
                >
                    <ThemedText style={[styles.heading, { color: colors.text }]}>Create an account</ThemedText>
                    <ThemedText style={[styles.subheading, { color: colors.textSecondary }]}>
                        Join the Rehbar community today
                    </ThemedText>

                    <RegisterForm />
                </Animated.View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#003D36',
    },
    flex: {
        flex: 1,
    },
    scroll: {
        flexGrow: 1,
    },
    hero: {
        alignItems: 'center',
        paddingBottom: 36,
        paddingHorizontal: 24,
    },
    brandLogo: {
        width: 210,
        height: 52,
    },
    sheet: {
        flexGrow: 1,
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        paddingHorizontal: 22,
        paddingTop: 30,
    },
    heading: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.4,
    },
    subheading: {
        fontSize: 14.5,
        marginTop: 4,
        marginBottom: 8,
    },
});
