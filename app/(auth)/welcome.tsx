import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/context/ThemeContext';

export default function WelcomeScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const isDark = theme === 'dark';

    // Using app primary colors with some gradients for a premium feel
    const gradientColors = isDark
        ? ['#374151', '#1f2937']
        : ['#F8FAFC', '#E2E8F0'];

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#374151', '#1f2937', '#1f2937'] : ['#E0E7FF', '#F1F5F9', '#FFFFFF']}
                style={styles.background}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Header Text */}
                    <View style={styles.header}>
                        <ThemedText style={[styles.title, { color: isDark ? '#FFFFFF' : '#1f2937' }]}>Welcome =)</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Hi there!{"\n"}
                            We're here to help you explore and connect.{"\n"}
                            The choice is yours: <ThemedText style={{ fontWeight: '700' }}>Log in</ThemedText> or <ThemedText style={{ fontWeight: '700' }}>create an account</ThemedText>.
                        </ThemedText>
                    </View>

                    {/* Illustration Placeholder */}
                    <View style={styles.illustrationContainer}>
                        <Image
                            source={{ uri: 'https://img.freepik.com/free-vector/digital-lifestyle-concept-illustration_114360-7327.jpg' }}
                            style={styles.illustration}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => router.push('/(auth)/register' as any)}
                        >
                            <ThemedText style={styles.primaryButtonText}>Create Account</ThemedText>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={() => router.push('/(auth)/login' as any)}
                        >
                            <ThemedText style={styles.secondaryButtonText}>Log In</ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    background: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingBottom: 40,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        marginTop: 60,
        alignItems: 'center',
    },
    title: {
        fontSize: 40,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 20,
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
        paddingHorizontal: 10,
    },
    illustrationContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    illustration: {
        width: '100%',
        height: 300,
    },
    footer: {
        width: '100%',
        gap: 12,
    },
    button: {
        height: 58,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    primaryButton: {
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    primaryButtonText: {
        color: '#1f2937',
        fontSize: 18,
        fontWeight: '700',
    },
    secondaryButton: {
        borderWidth: 1.5,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    secondaryButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
