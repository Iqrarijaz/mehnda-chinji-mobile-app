import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { TintedCard } from '../ui/tintedCard';

interface RequestCardProps {
    item: any;
    categoryColor: string;
    isDeleting?: boolean;
    onEdit: (item: any) => void;
    onDelete: (id: string, name: string) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'APPROVED': return '#10B981';
        case 'REJECTED': return '#EF4444';
        default: return '#F59E0B';
    }
};

const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const RequestCard: React.FC<RequestCardProps> = ({ item, categoryColor, isDeleting, onEdit, onDelete }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const statusColor = getStatusColor(item.status);
    const isPending = item.status === 'PENDING';

    return (
        <TintedCard
            tintColor={categoryColor}
            bgColor="#FFFFFF"
            style={styles.cardWrapper}
        >
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={[styles.title, { color: categoryColor }]} numberOfLines={2}>
                        {item.name.length > 30 ? `${item.name.substring(0, 30)}...` : item.name}
                    </ThemedText>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
                        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                        <ThemedText style={[styles.statusText, { color: statusColor }]}>
                            {item.status}
                        </ThemedText>
                    </View>
                </View>

                {/* Address */}
                <View style={styles.infoRow}>
                    <Ionicons name="location" size={13} color={categoryColor} style={{ opacity: 0.7 }} />
                    <ThemedText style={[styles.infoText, { color: categoryColor, opacity: 0.7, textTransform: 'capitalize' }]}>
                        {item.address}
                    </ThemedText>
                </View>

                {/* Contact */}
                {item.contact?.map((contact: any, index: number) => (
                    contact.number ? (
                        <View key={index} style={styles.infoRow}>
                            <Ionicons name="call" size={13} color={categoryColor} style={{ opacity: 0.7 }} />
                            <ThemedText style={[styles.infoText, { color: categoryColor, opacity: 0.7, textTransform: 'capitalize' }]} numberOfLines={1}>
                                {contact.name ? `${contact.name}: ` : ''}{contact.number}
                            </ThemedText>
                        </View>
                    ) : null
                ))}

                {/* Footer: Time (Left) + Actions (Right) */}
                <View style={styles.footer}>
                    <View style={styles.timeContainer}>
                        <Ionicons name="calendar-outline" size={13} color={categoryColor} style={{ opacity: 0.6 }} />
                        <ThemedText style={[styles.infoText, { color: categoryColor, opacity: 0.6 }]}>
                            {formatDateTime(item.createdAt)}
                        </ThemedText>
                    </View>

                    {isPending && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                onPress={() => onEdit(item)}
                                style={[styles.actionBtn, styles.editBtn]}
                            >
                                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onDelete(item._id, item.name)}
                                style={[styles.actionBtn, styles.deleteBtn]}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </TintedCard>
    );
};

export default React.memo(RequestCard);

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 10,
    },
    content: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    title: {
        fontSize: 16,
        fontWeight: '800',
        textTransform: 'capitalize',
        flex: 1,
        marginRight: 8,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 20,
        gap: 4,
    },
    statusDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'capitalize',
        letterSpacing: 0.3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 2,
    },
    infoText: {
        fontSize: 13,
        fontWeight: '600',
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 6,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#00000008',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 6,
    },
    actionBtn: {
        padding: 8,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowRadius: 8,
    },
editBtn: {
},
deleteBtn: {
},
});
