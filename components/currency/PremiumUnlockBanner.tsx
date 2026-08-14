import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { Layout } from '@/constants/layout';

interface PremiumUnlockBannerProps {
    onPress: () => void;
    isAdLoaded: boolean;
    isAdShowing: boolean;
}

/**
 * Sticky bottom banner offering the "watch a rewarded ad to unlock all
 * 160+ currencies for 24h" upgrade. Shown only while the free tier is active.
 */
export function PremiumUnlockBanner({ onPress, isAdLoaded, isAdShowing }: PremiumUnlockBannerProps) {
    return (
        <Animated.View entering={FadeInUp.duration(400)} style={styles.wrapper}>
            <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPress}
                disabled={!isAdLoaded || isAdShowing}
                style={styles.touchable}
            >
                <LinearGradient
                    colors={['#0EA5E9', '#0D9488']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradient}
                >
                    <View style={styles.iconWrap}>
                        {isAdShowing ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Ionicons name="lock-open-outline" size={22} color="#FFFFFF" />
                        )}
                    </View>
                    <View style={styles.textWrap}>
                        <ThemedText style={styles.title}>Unlock all 160+ currencies</ThemedText>
                        <ThemedText style={styles.subtitle}>
                            Watch a short ad to unlock every global currency for 24 hours
                        </ThemedText>
                    </View>
                    {!isAdShowing && (
                        <Ionicons
                            name={isAdLoaded ? 'chevron-forward' : 'hourglass-outline'}
                            size={20}
                            color="rgba(255,255,255,0.9)"
                        />
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingHorizontal: 20,
    },
    touchable: {
        borderRadius: Layout.borderRadius,
        overflow: 'hidden',
        shadowColor: '#0D9488',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: Platform.OS === 'android' ? 4 : 0,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        minHeight: 44,
    },
    iconWrap: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    textWrap: {
        flex: 1,
        marginRight: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 11.5,
        fontWeight: '400',
        color: 'rgba(255,255,255,0.9)',
        lineHeight: 15,
    },
});
