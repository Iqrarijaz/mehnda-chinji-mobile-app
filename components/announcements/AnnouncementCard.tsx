import React, { memo } from 'react';
import { StyleSheet, View, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { ThemedText } from '../ThemedText';
import { useAuth } from '@/context/AuthContext';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';

interface AnnouncementCardProps {
    item: any;
    colors: any;
    selected?: boolean;
    onEdit?: (item: any) => void;
    onDelete?: (item: any) => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; icon?: any; ionicon: (keyof typeof Ionicons.glyphMap) | string }> = {
    emergency: {
        label: 'Emergency',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.08)',
        icon: require('../../assets/icons/emergency.webp'),
        ionicon: 'alert-circle-outline'
    },
    health: {
        label: 'Health',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.08)',
        icon: require('../../assets/icons/health.webp'),
        ionicon: 'medical-outline'
    },
    education: {
        label: 'Education',
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.08)',
        icon: require('../../assets/icons/education_icon.webp'),
        ionicon: 'book-outline'
    },
    travel: {
        label: 'Travel',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.08)',
        icon: require('../../assets/icons/travel.webp'),
        ionicon: 'bus-outline'
    },
    religious: {
        label: 'Religious',
        color: '#06B6D4',
        bg: 'rgba(6, 182, 212, 0.08)',
        icon: require('../../assets/icons/religious.webp'),
        ionicon: 'moon-outline'
    },
    govt: {
        label: 'Govt Office',
        color: '#6B7280',
        bg: 'rgba(107, 114, 128, 0.08)',
        icon: require('../../assets/icons/govt_office.webp'),
        ionicon: 'business-outline'
    },
    banks: {
        label: 'Banks',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.08)',
        icon: require('../../assets/icons/bank.webp'),
        ionicon: 'cash-outline'
    },
    public: {
        label: 'Public',
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.08)',
        ionicon: '../../public/json/announcement.json'
    },
    lost_found: {
        label: 'Lost & Found',
        color: '#14B8A6',
        bg: 'rgba(20, 184, 166, 0.08)',
        ionicon: '../../public/json/announcement.json'
    }
};

export const AnnouncementCard = memo(({ item, colors, selected, onEdit, onDelete }: AnnouncementCardProps) => {
    const { user } = useAuth();

    const isAuthor = user?.user?._id && item.authorId && (item.authorId._id || item.authorId).toString() === user.user._id.toString();
    const isEssentialAdmin = item.essentialId?._id && user?.user?.managedEssentials?.some((id: any) => (id._id || id).toString() === item.essentialId._id.toString());
    const canManage = isAuthor || isEssentialAdmin;

    const config = TYPE_CONFIG[item.type] || {
        label: (item.type || 'public').toUpperCase(),
        color: colors.primary,
        bg: 'rgba(0, 0, 0, 0.03)',
        ionicon: 'megaphone-outline'
    };

    const dateToDisplay = item.eventDate || item.createdAt;
    const formattedDate = React.useMemo(() => {
        if (!dateToDisplay) return null;
        try {
            const date = new Date(dateToDisplay);
            if (isNaN(date.getTime())) return null;
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
            return null;
        }
    }, [dateToDisplay]);

    return (
        <View style={styles.container}>
            <View style={styles.headerLeft}>
                <ThemedText style={[styles.tagText, { backgroundColor: colors.card, color: config.color }]}>
                    {config.label.toUpperCase()}
                </ThemedText>
            </View>
            <View style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                },
                selected && {
                    borderWidth: 2,
                    borderColor: config.color,
                }
            ]}>
                {/* Header section */}


                {/* Content section */}
                <ThemedText style={[styles.cardTitle, { color: config.color }]} numberOfLines={1}>
                    {item.title}
                </ThemedText>
                <ThemedText style={[styles.cardMessage, { color: colors.text }]}>
                    {item.message}
                </ThemedText>

                {/* Footer section (Location & Date Row) */}
                <View style={styles.footerRow}>
                    {item.essentialId ? (
                        <View style={styles.placeInfo}>
                            <Ionicons name="location-outline" size={14} color={colors.primary} />
                            <ThemedText style={[styles.placeText, { color: colors.primary }]} numberOfLines={1}>
                                {item.essentialId.name}
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={{ flex: 1 }} />
                    )}
                    <View style={styles.footerRight}>
                        {formattedDate && (
                            <ThemedText style={[styles.dateText, { color: colors.textSecondary }]}>
                                {formattedDate}
                            </ThemedText>
                        )}
                        {canManage && (onEdit || onDelete) && (
                            <Menu>
                                <MenuTrigger customStyles={{ triggerWrapper: styles.menuBtn }}>
                                    <Ionicons name="ellipsis-horizontal" size={16} color={colors.textSecondary} />
                                </MenuTrigger>
                                <MenuOptions customStyles={{ optionsContainer: [styles.menuOptions, { backgroundColor: colors.card, borderColor: colors.border }] }}>
                                    {onEdit && (
                                        <MenuOption onSelect={() => onEdit(item)} style={styles.menuItem}>
                                            <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                                            <ThemedText style={styles.menuText}>Edit</ThemedText>
                                        </MenuOption>
                                    )}
                                    {onDelete && (
                                        <MenuOption onSelect={() => onDelete(item)} style={styles.menuItem}>
                                            <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                            <ThemedText style={[styles.menuText, { color: '#EF4444' }]}>Delete</ThemedText>
                                        </MenuOption>
                                    )}
                                </MenuOptions>
                            </Menu>
                        )}
                    </View>
                </View>

                {/* Image attachments if any */}
                {item.images && item.images.length > 0 && (
                    <View style={styles.imageGrid}>
                        {item.images.map((img: string, idx: number) => (
                            <Image key={idx} source={{ uri: img }} style={styles.image} />
                        ))}
                    </View>
                )}

            </View>


            {/* Type Icon Overlay on top right corner */}
            {config.icon ? (
                <Image
                    source={config.icon}
                    style={styles.typeOverlayIcon}
                    resizeMode="contain"
                />
            ) : typeof config.ionicon === 'string' && config.ionicon.endsWith('.json') ? (
                <LottieView
                    source={require('../../public/json/announcement.json')}
                    autoPlay
                    loop
                    style={styles.typeOverlayLottie}
                    hardwareAccelerationAndroid
                    renderMode="HARDWARE"
                />
            ) : (
                <View style={[styles.typeOverlayBadge, { backgroundColor: config.bg }]}>
                    <Ionicons name={config.ionicon as any} size={20} color={config.color} />
                </View>
            )}
        </View>
    );
});

AnnouncementCard.displayName = 'AnnouncementCard';

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        paddingTop: 12,
        width: '100%',
    },
    card: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        borderTopLeftRadius: 0,
        borderTopRightRadius: 16,
        paddingTop: 12,
        paddingBottom: 8,
        paddingRight: 10,
        paddingLeft: 10,
    },
    lottieBadge: {
        position: 'absolute',
        top: -20,
        left: -26,
        width: 100,
        height: 100,
        zIndex: 10,
        pointerEvents: 'none',
    },
    typeOverlayIcon: {
        position: 'absolute',
        top: 8,
        right: -10,
        width: 40,
        height: 40,
        zIndex: 10,
    },
    typeOverlayLottie: {
        position: 'absolute',
        top: -6,
        right: -30,
        width: 80,
        height: 80,
        zIndex: 10,
        pointerEvents: 'none',
    },
    typeOverlayBadge: {
        position: 'absolute',
        top: 6,
        right: -6,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    tagText: {
        fontSize: 10,
        paddingTop: 2,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        paddingHorizontal: 10,
        fontWeight: '800',
    },
    dateText: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'right',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '800',
        marginBottom: 6,
    },
    cardMessage: {
        fontSize: 13,
        fontWeight: '600',
        lineHeight: 18,
    },
    footerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    placeInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: '70%',
    },
    placeText: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    image: {
        width: 80,
        height: 80,
        borderRadius: 8,
    },
    cardFooter: {
        marginTop: 14,
        paddingTop: 10,
        borderTopWidth: 1,
    },
    authorText: {
        fontSize: 11,
    },
    footerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    menuBtn: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuOptions: {
        borderRadius: 12,
        borderWidth: 1,
        padding: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        width: 100,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 8,
        gap: 8,
    },
    menuText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
