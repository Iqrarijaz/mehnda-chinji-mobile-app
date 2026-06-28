import React, { useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface OfflineIndicatorProps {
    visible: boolean;
}

const OFFLINE_COLOR = '#F59E0B'; // Amber - classic warning color

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ visible }) => {
    const insets = useSafeAreaInsets();
    const translateY = useSharedValue(-100);

    useEffect(() => {
        if (visible) {
            translateY.value = withSpring(insets.top > 0 ? insets.top + 10 : 20, {
                damping: 15,
                stiffness: 120,
            });
        } else {
            translateY.value = withTiming(-100, { duration: 300 });
        }
    }, [visible, insets.top]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    if (!visible && translateY.value === -100) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]}>
            <View style={styles.content}>
                <Ionicons name="cloud-offline-outline" size={20} color="#FFFFFF" />
                <ThemedText style={styles.text}>No Internet Connection</ThemedText>
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
        alignItems: 'center',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: OFFLINE_COLOR,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        gap: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {

            },
        }),
    },
    text: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});

export default React.memo(OfflineIndicator);
