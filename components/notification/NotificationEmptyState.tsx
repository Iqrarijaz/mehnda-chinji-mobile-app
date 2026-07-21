import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedText } from '../ThemedText';
import { Layout } from '@/constants/layout';

const PRIMARY = '#006666';

const NotificationEmptyState = React.memo(() => (
    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.container}>
        <View style={styles.iconWrap}>
            <Ionicons name="notifications-off-outline" size={32} color={PRIMARY} />
        </View>
        <ThemedText style={styles.title}>No notifications yet</ThemedText>
        <ThemedText style={styles.subtitle}>We'll notify you{'\n'}when something happens</ThemedText>
    </Animated.View>
));

export default NotificationEmptyState;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 40, paddingHorizontal: 40 },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: Layout.borderRadius,
        backgroundColor: `${PRIMARY}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14 },
    title: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 11, color: '#94A3B8', fontWeight: '500', textAlign: 'center', lineHeight: 18 } });
