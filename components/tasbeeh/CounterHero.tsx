import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/themedText';

interface CounterHeroProps {
    count: number;
    target: number;
    progress: number;
    accentColor: string;
    cardColor: string;
    onTap: () => void;
}

export const CounterHero = React.memo(({
    count,
    target,
    progress,
    accentColor,
    cardColor,
    onTap,
}: CounterHeroProps) => (
    <View style={styles.container}>
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onTap}
            style={[styles.counterBtn, { backgroundColor: accentColor }]}
        >
            <Image 
                source={require('@/assets/icons/tasbeeh_icon.webp')} 
                style={styles.btnIcon} 
                resizeMode="contain" 
            />
            <ThemedText style={styles.counterNum}>{count}</ThemedText>
            {target > 0 && (
                <ThemedText style={styles.counterTarget}>/ {target}</ThemedText>
            )}
            <ThemedText style={styles.counterHint}>TAP</ThemedText>
        </TouchableOpacity>

        {target > 0 && (
            <View style={[styles.progressTrack, { backgroundColor: cardColor }]}>
                <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accentColor }]} />
            </View>
        )}
    </View>
));

CounterHero.displayName = 'CounterHero';

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        width: '100%',
        marginBottom: 14,
    },
    counterBtn: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    btnIcon: {
        width: 24,
        height: 24,
        tintColor: '#FFFFFF',
        marginBottom: 4,
    },
    counterNum: {
        fontSize: 50,
        fontWeight: '200',
        color: '#fff',
        lineHeight: 54,
        includeFontPadding: false,
    },
    counterTarget: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginTop: -3,
    },
    counterHint: {
        fontSize: 9,
        fontWeight: '800',
        letterSpacing: 3,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 6,
    },
    progressTrack: {
        height: 6,
        width: '100%',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
});
