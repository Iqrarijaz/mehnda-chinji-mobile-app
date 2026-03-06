import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    Platform,
    StyleSheet,
    Switch,
    TouchableOpacity,
    View,
} from 'react-native';

import { ThemedText } from '@/components/themedText';
import { useTheme } from '@/context/ThemeContext';
import { TintedCard } from '../ui/tintedCard';

interface MyRegisteredBusinessCardProps {
    business: any;
    onEdit: (biz: any) => void;
    onDelete: (id: string) => void;
    onToggleSearch: (id: string, name: string, nextValue: boolean) => void;
    isDeleting?: boolean;
    isManageSearchPending?: boolean;
}

const MyRegisteredBusinessCard = React.memo(({
    business,
    onEdit,
    onDelete,
    onToggleSearch,
    isDeleting,
    isManageSearchPending
}: MyRegisteredBusinessCardProps) => {
    const { theme } = useTheme();
    const isAndroid = Platform.OS === 'android';

    const status = business.status?.toUpperCase();

    // Status-based colors
    const statusColor =
        status === 'APPROVED' ? '#10B981' :
            status === 'REJECTED' ? '#EF4444' :
                '#F59E0B'; // PENDING

    const primaryColor = "#000000"
    const softBg = primaryColor + '08';


    const bizName = business.name || 'Business Name';
    const description = business.description;
    const category = business.categoryEn || business.category?.en || 'Category';
    const urduCategory = business.categoryUr || business.category?.ur;
    const address = (business.address || business.village || 'N/A').toLowerCase();

    return (
        <TintedCard
            tintColor={primaryColor}
            bgColor="#FFFFFF"
            style={styles.card}
        >
            <View style={styles.cardHeader}>
                <View style={styles.nameStatusRow}>
                    <ThemedText style={[styles.bizName, { color: primaryColor }]} numberOfLines={1}>
                        {bizName}
                    </ThemedText>

                    <View style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor + '15' }
                    ]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {status}
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.cardBody}>
                <View style={styles.categoryRow}>
                    <View style={styles.catLeft}>
                        <Ionicons name="briefcase-outline" size={14} color={primaryColor} style={{ opacity: 0.7 }} />
                        <ThemedText style={[styles.bizCategory, { color: primaryColor, opacity: 0.8, textTransform: 'capitalize' }]}>
                            {category}
                        </ThemedText>
                    </View>
                    {urduCategory && (
                        <ThemedText style={[styles.bizCategory, styles.urduCat, { color: primaryColor, opacity: 0.8 }]}>
                            {urduCategory}
                        </ThemedText>
                    )}
                </View>

                {description && (
                    <View style={styles.descriptionRow}>
                        <Ionicons name="information-circle-outline" size={14} color={primaryColor} style={{ opacity: 0.5 }} />
                        <ThemedText style={[styles.descriptionText, { color: primaryColor, opacity: 0.7 }]} numberOfLines={2}>
                            {description}
                        </ThemedText>
                    </View>
                )}

                <View style={styles.bizInfoRow}>
                    <Ionicons name="location" size={14} color={primaryColor} style={{ opacity: 0.6, paddingTop: isAndroid ? 2 : 4 }} />
                    <ThemedText style={[styles.bizInfoText, { color: primaryColor, opacity: 0.8, textTransform: 'capitalize' }]} numberOfLines={2}>
                        {address}
                    </ThemedText>
                </View>
            </View>

            {status !== 'REJECTED' && (
                <>
                    <View style={[styles.divider, { backgroundColor: primaryColor + '15' }]} />

                    <View style={styles.cardFooter}>
                        {status === 'APPROVED' && (
                            <View style={styles.searchToggleContainer}>
                                <ThemedText style={[styles.searchText, { color: primaryColor, opacity: 0.8 }]}>Directory Search</ThemedText>
                                <Switch
                                    value={business.search}
                                    onValueChange={(val) => onToggleSearch(business._id, business.name, val)}
                                    trackColor={{ false: '#767577', true: primaryColor + '80' }}
                                    thumbColor={business.search ? primaryColor : '#f4f3f4'}
                                    disabled={isManageSearchPending}
                                />
                            </View>
                        )}

                        <View style={styles.actionButtons}>
                            {status === 'APPROVED' && (
                                <TouchableOpacity
                                    style={[styles.actionBtn, { backgroundColor: '#EF4444' + '15' }]}
                                    onPress={() => onDelete(business._id)}
                                    disabled={isDeleting}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                </TouchableOpacity>
                            )}

                            {status === 'PENDING' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#3B82F6' + '15' }]}
                                        onPress={() => onEdit(business)}
                                        disabled={isDeleting}
                                    >
                                        <Ionicons name="create-outline" size={16} color="#3B82F6" />
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionBtn, { backgroundColor: '#EF4444' + '15' }]}
                                        onPress={() => onDelete(business._id)}
                                        disabled={isDeleting}
                                    >
                                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    </View>
                </>
            )}
        </TintedCard>
    );
});

export default MyRegisteredBusinessCard;

const isAndroid = Platform.OS === 'android';

const styles = StyleSheet.create({
    card: {
        paddingHorizontal: isAndroid ? 14 : 16,
        paddingVertical: isAndroid ? 10 : 12,
        marginBottom: isAndroid ? 10 : 12,
    },
    cardHeader: {
        marginBottom: 8,
    },
    nameStatusRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    bizName: {
        fontSize: isAndroid ? 14 : 16,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    cardBody: {
        gap: 6,
        marginBottom: 10,
    },
    categoryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    catLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    bizCategory: {
        fontSize: isAndroid ? 12 : 14,
        fontWeight: '600',
    },
    urduCat: {
        fontSize: 14,
    },
    descriptionRow: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'flex-start',
    },
    descriptionText: {
        fontSize: 13,
        fontStyle: 'italic',
        flex: 1,
        lineHeight: 18,
    },
    bizInfoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
    },
    bizInfoText: {
        fontSize: 13,
        fontWeight: '500',
        flex: 1,
    },
    divider: {
        height: 1,
        width: '100%',
        marginBottom: 8,
        opacity: 0.5,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    searchToggleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    searchText: {
        fontSize: 12,
        fontWeight: '700',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 10,
        marginLeft: 'auto',
    },
    actionBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
