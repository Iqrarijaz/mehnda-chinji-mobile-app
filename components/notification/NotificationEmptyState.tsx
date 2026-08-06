import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

const NotificationEmptyState = React.memo(() => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    return (
        <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.container}>
            <View style={[styles.iconWrap, { backgroundColor: `${colors.primary}14` }]}>
                <Ionicons name="notifications-off-outline" size={32} color={colors.primary} />
            </View>
            <ThemedText style={[styles.title, { color: colors.text }]}>No notifications yet</ThemedText>
            <ThemedText style={[styles.subtitle, { color: colors.placeholder }]}>We'll notify you{'\n'}when something happens</ThemedText>
        </Animated.View>
    );
});

export default NotificationEmptyState;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 36, paddingHorizontal: 36 },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14 },
    title: { fontSize: 12.5, fontWeight: '800', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 10, fontWeight: '500', textAlign: 'center', lineHeight: 18 } });
