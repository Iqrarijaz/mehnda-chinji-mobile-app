import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface OfflineIndicatorProps {
    visible: boolean;
}

// Near-black rather than white: white-on-amber measures 2.15:1 in light theme
// and 1.67:1 in dark, both well under the 4.5:1 AA floor for text this size.
// This value clears 8.65:1 / 11.13:1 against the light/dark warning tokens —
// the same fix already applied to the amber action button in QiblaMessageState.
const ON_WARNING_TEXT = '#1A1200';

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ visible }) => {
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const translateY = useSharedValue(-100);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(insets.top > 0 ? insets.top + 10 : 20, {
                damping: 15,
                stiffness: 120 });
        } else {
            translateY.value = withTiming(-100, { duration: 300 });
        }
    }, [visible, insets.top]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }] }));

    if (!visible && translateY.value === -100) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={[styles.pill, { backgroundColor: colors.warning }]}>
                <Ionicons name="cloud-offline-outline" size={13} color={ON_WARNING_TEXT} />
                <ThemedText style={[styles.text, { color: ON_WARNING_TEXT }]}>
                    No Internet Connection
                </ThemedText>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        zIndex: 9999,
        alignItems: 'center' },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 999,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4 },
    text: {
        fontSize: 11,
        fontWeight: '700' } });

export default React.memo(OfflineIndicator);
