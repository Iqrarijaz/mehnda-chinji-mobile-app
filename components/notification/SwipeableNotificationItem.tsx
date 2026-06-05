import { Ionicons } from '@expo/vector-icons';
import React, { useCallback } from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import NotificationItem from './NotificationItem';

const DELETE_THRESHOLD = -80;
const MAX_SWIPE = -90;
const DELETE_RED = '#FF3B30';

interface Props {
    item: any;
    onPress: (item: any) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
    delay?: number;
}

const SwipeableNotificationItem = React.memo(({
    item,
    onPress,
    onDelete,
    isDeleting = false,
    delay = 0,
}: Props) => {
    const translateX = useSharedValue(0);

    const handleDelete = useCallback(() => {
        onDelete(item._id);
    }, [item._id, onDelete]);

    const pan = Gesture.Pan()
        .enabled(!isDeleting)
        .activeOffsetX([-10, 10])
        .onUpdate((e) => {
            if (e.translationX < 0) {
                translateX.value = Math.max(e.translationX, MAX_SWIPE);
            }
        })
        .onEnd((e) => {
            if (e.translationX < DELETE_THRESHOLD) {
                translateX.value = withTiming(MAX_SWIPE, { duration: 150 });
                runOnJS(handleDelete)();
            } else {
                translateX.value = withTiming(0, { duration: 200 });
            }
        });

    const cardStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const deleteRevealStyle = useAnimatedStyle(() => ({
        opacity: translateX.value < -10 ? 1 : 0,
    }));

    return (
        <View style={styles.wrapper}>
            {/* Red delete background — tappable after swipe reveal */}
            <Animated.View style={[styles.deleteBg, deleteRevealStyle]}>
                <TouchableOpacity
                    onPress={handleDelete}
                    disabled={isDeleting}
                    style={styles.deleteTouchable}
                    activeOpacity={0.8}
                >
                    {isDeleting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <View style={styles.deleteAction}>
                            <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
                        </View>
                    )}
                </TouchableOpacity>
            </Animated.View>

            {/* Swipeable card */}
            <GestureDetector gesture={pan}>
                <Animated.View style={cardStyle}>
                    <NotificationItem item={item} onPress={onPress} delay={delay} />
                    {isDeleting && <View style={styles.loadingOverlay} />}
                </Animated.View>
            </GestureDetector>
        </View>
    );
});

export default SwipeableNotificationItem;

const styles = StyleSheet.create({
    wrapper: {
        position: 'relative',
    },
    deleteBg: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 8,
        width: MAX_SWIPE * -1,
        backgroundColor: DELETE_RED,
        borderRadius: 18,
        overflow: 'hidden',
    },
    deleteTouchable: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteAction: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.35)',
        borderRadius: 18,
    },
});
