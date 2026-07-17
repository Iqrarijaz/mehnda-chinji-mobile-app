import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import Animated, {
    FadeIn,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import { ActionMenu, ActionMenuItem } from '@/components/common/ActionMenu';
import { Layout } from '@/constants/layout';

interface RequestCardProps {
    item: any;
    categoryColor: string;
    isDeleting?: boolean;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
    onManage?: (item: any) => void;
}

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return { color: '#7BC043', icon: 'checkmark-circle' as const, label: 'Approved' };
        case 'REJECTED':
            return { color: '#FF5A5F', icon: 'close-circle' as const, label: 'Rejected' };
        case 'UNDER_REVIEW':
            return { color: '#3B82F6', icon: 'eye' as const, label: 'Reviewing' };
        default:
            return { color: '#F0803C', icon: 'time' as const, label: 'Pending' };
    }
};

const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

const RequestCard: React.FC<RequestCardProps> = ({
    item,
    categoryColor,
    isDeleting,
    onEdit,
    onDelete,
    onManage
}) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const statusConfig = getStatusConfig(item.status);
    const isPending = item.status === 'PENDING';
    const isApproved = item.status === 'APPROVED';
    const isEducation = (item.category?.en || item.category) === 'education';
    const canManage = isEducation && isApproved;
    const hasActions = isPending || !isApproved || canManage;

    const actions: ActionMenuItem[] = [];
    if (canManage) {
        actions.push({
            label: 'Manage Toppers/Events',
            icon: 'settings-outline',
            onPress: () => onManage?.(item)
        });
    }
    if (isPending) {
        actions.push({
            label: 'Edit Request',
            icon: 'create-outline',
            onPress: () => onEdit(item)
        });
    }
    if (!isApproved) {
        actions.push({
            label: 'Delete Request',
            icon: 'trash-outline',
            destructive: true,
            onPress: () => onDelete(item._id, item.name)
        });
    }

    // Animation Shared Values
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const onPressIn = () => {
        scale.value = withSpring(0.99);
    };

    const onPressOut = () => {
        scale.value = withSpring(1);
    };

    const mainImage = item.images?.[0] || item.image;

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            style={[animatedStyle]}
        >
            <TouchableOpacity
                activeOpacity={1}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                disabled={true} // Tap function removed as per request
                style={[
                    styles.card,
                    {
                        backgroundColor: colors.card,
                    }
                ]}
            >
                <View style={styles.cardInner}>
                    {/* Left: Image */}
                    <View style={styles.imageContainer}>
                        {mainImage ? (
                            <Image
                                source={{ uri: mainImage }}
                                style={styles.image}
                                contentFit="cover"
                                transition={200}
                            />
                        ) : (
                            <View style={[styles.placeholderImage, { backgroundColor: categoryColor + '15' }]}>
                                <Ionicons name="location" size={28} color={categoryColor} />
                            </View>
                        )}

                        {/* Category Chip Overlay */}
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor }]}>
                            <ThemedText style={styles.categoryText} numberOfLines={1}>
                                {(item.category?.en || item.category || 'Place').split(' ')[0]}
                            </ThemedText>
                        </View>
                    </View>

                    {/* Right: Content */}
                    <View style={styles.content}>
                        <View style={styles.headerRow}>
                            <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                                {item.name}
                            </ThemedText>

                            {/* Status Pill */}
                            <View style={[styles.statusPill, { backgroundColor: statusConfig.color + '15' }]}>
                                <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                                <ThemedText style={[styles.statusLabel, { color: statusConfig.color }]}>
                                    {statusConfig.label}
                                </ThemedText>
                            </View>
                        </View>

                        <ThemedText style={[styles.address, { color: colors.textSecondary }]} numberOfLines={1}>
                            {item.address || item.village || 'No address provided'}
                        </ThemedText>

                        <View style={styles.footerRow}>
                            <View style={styles.metaInfo}>
                                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                                <ThemedText style={[styles.metaText, { color: colors.textSecondary }]}>
                                    {formatDateTime(item.createdAt)}
                                </ThemedText>
                            </View>

                            {/* Action Menu */}
                            <View style={styles.actions}>
                                {hasActions && actions.length > 0 && (
                                    isDeleting ? (
                                        <ActivityIndicator size="small" color="#FF5A5F" />
                                    ) : (
                                        <ActionMenu actions={actions} />
                                    )
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
};

export default React.memo(RequestCard);

const styles = StyleSheet.create({
    card: {
        marginBottom: 16,
        borderRadius: 20,
    },
    cardInner: {
        flexDirection: 'row',
        padding: 12,
    },
    imageContainer: {
        position: 'relative',
        width: 86,
        height: 86,
        borderRadius: 16,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    placeholderImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    categoryBadge: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 2,
        alignItems: 'center',
        opacity: 0.9,
    },
    categoryText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        marginLeft: 14,
        justifyContent: 'space-between',
        paddingVertical: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
        marginRight: 8,
        textTransform: 'capitalize',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: '900',
        textTransform: 'uppercase',
    },
    address: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: -4,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    metaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 11,
        fontWeight: '600',
    },
    actions: {
        flexDirection: 'row',
    },
    menuBtn: {
        padding: 4,
        marginRight: -4,
    },
    menuOptions: {
        width: 200,
        borderRadius: 14,
        padding: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0,
                shadowRadius: 10,
            },
            android: {

            }
        }),
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        paddingHorizontal: 8,
    },
    menuText: {
        fontSize: 14,
        fontWeight: '600',
    }
});