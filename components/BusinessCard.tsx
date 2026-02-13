import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
    Linking,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors } from '@/constants/colors';
import { getCategoryColor, getProfessionIcon } from '@/constants/professions';
import { useTheme } from '@/context/ThemeContext';
import { GlassCard } from './ui/GlassCard';

interface BusinessCardProps {
    business: {
        _id: string;
        name: string;
        categoryName: {
            en: string;
            ur?: string;
        } | string;
        description?: string;
        phone: string;
        village: string;
    };
}

const BusinessCard = React.memo(({ business }: BusinessCardProps) => {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const handleCall = () => {
        if (business.phone) {
            Linking.openURL(`tel:${business.phone}`);
        }
    };

    const capitalize = (str: string) => {
        return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const businessName = capitalize(business.name);
    const categoryText = typeof business.categoryName === 'string'
        ? capitalize(business.categoryName)
        : capitalize(business.categoryName.en);

    const urduCategory = typeof business.categoryName !== 'string' ? business.categoryName.ur : null;
    const englishCategoryRaw = typeof business.categoryName === 'string' ? business.categoryName : business.categoryName.en;

    const iconName = getProfessionIcon(englishCategoryRaw);
    const categoryColor = getCategoryColor(englishCategoryRaw);

    return (
        <GlassCard>
            {/* Header Section */}
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <LinearGradient
                        colors={isDark ? ['#334155', '#1e293b'] : ['#f1f5f9', '#e2e8f0']}
                        style={styles.iconOuter}
                    >
                        <LinearGradient
                            colors={[categoryColor, categoryColor + 'CC']}
                            style={styles.iconInner}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <MaterialCommunityIcons name={iconName as any} size={22} color="#FFFFFF" />
                        </LinearGradient>
                    </LinearGradient>
                </View>

                <View style={styles.mainInfo}>
                    <View style={styles.titleRow}>
                        <ThemedText style={styles.name} numberOfLines={1}>{businessName}</ThemedText>
                    </View>
                    <View style={styles.subHeader}>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20', borderColor: categoryColor + '40' }]}>
                            <ThemedText style={[styles.categoryText, { color: categoryColor }]}>{categoryText}</ThemedText>
                        </View>
                        {urduCategory && (
                            <ThemedText style={styles.urduText}>{urduCategory}</ThemedText>
                        )}
                    </View>
                </View>
            </View>

            {/* Description Section */}
            {business.description ? (
                <View style={styles.descriptionBox}>
                    <ThemedText style={styles.description} numberOfLines={3}>
                        {business.description}
                    </ThemedText>
                </View>
            ) : null}

            {/* Footer Section */}
            <View style={[styles.footer, { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                <View style={styles.locationContainer}>
                    <View style={styles.locationIconBox}>
                        <Ionicons name="location" size={14} color="#ef4444" />
                    </View>
                    <ThemedText style={styles.locationText} numberOfLines={2}>{business.village}</ThemedText>
                </View>

                <TouchableOpacity
                    style={styles.callActionButton}
                    onPress={handleCall}
                    activeOpacity={0.8}
                >
                    <LinearGradient
                        colors={['#10B981', '#059669']}
                        style={styles.circularCallGradient}
                    >
                        <Ionicons name="call" size={18} color="#FFFFFF" />
                    </LinearGradient>
                </TouchableOpacity>
            </View>

        </GlassCard>
    );
});

export default BusinessCard;

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    iconContainer: {
        marginRight: 12,
    },
    iconOuter: {
        width: 48,
        height: 48,
        borderRadius: 16,
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconInner: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#FF9B51',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    mainInfo: {
        flex: 1,
        gap: 6,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    name: {
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: -0.4,
    },
    subHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255, 155, 81, 0.12)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 0.5,
        borderColor: 'rgba(255, 155, 81, 0.2)',
    },
    categoryText: {
        fontSize: 9,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    urduText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#94a3b8',
    },
    descriptionBox: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    description: {
        fontSize: 11.5,
        lineHeight: 16,
        color: '#64748b',
        fontWeight: '500',
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTopWidth: 1,
    },
    locationContainer: {
        flex: 0.8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    locationIconBox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        backgroundColor: 'rgba(255, 155, 81, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#94a3b8',
        textTransform: 'capitalize',
        flex: 1,
    },
    callActionButton: {
        flex: 0.2,
        alignItems: 'flex-end',
    },
    circularCallGradient: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    callBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '900',
        letterSpacing: 0.2,
    },
});
