import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { ThemedText } from '../themedText';

const PRIMARY = '#006666';

const NotificationEmptyState = React.memo(() => (
    <Animated.View entering={FadeIn.delay(200).duration(500)} style={styles.container}>
        <View style={styles.iconWrap}>
            <Ionicons name="notifications-off-outline" size={48} color={PRIMARY} />
        </View>
        <ThemedText style={styles.title}>No notifications yet</ThemedText>
        <ThemedText style={styles.subtitle}>We'll notify you{'\n'}when something happens</ThemedText>
    </Animated.View>
));

export default NotificationEmptyState;

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60, paddingHorizontal: 40 },
    iconWrap: {
        width: 88,
        height: 88,
        borderRadius: 28,
        backgroundColor: `${PRIMARY}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#94A3B8', fontWeight: '500', textAlign: 'center', lineHeight: 22 },
});
