import { ThemedText } from '@/components/themed-text';
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
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
        + ' \u2022 '
        + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const RequestCard: React.FC<RequestCardProps> = ({ item, categoryColor, isDeleting, onEdit, onDelete }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const statusColor = getStatusColor(item.status);
    const isPending = item.status === 'PENDING';

    return (
        <View style={[styles.card, { backgroundColor: colors.card, borderLeftColor: categoryColor, borderColor: colors.border }]}>
            <View style={[styles.statusBar, { backgroundColor: categoryColor }]} />

            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <ThemedText style={[styles.title, { color: colors.text }]} numberOfLines={2}>
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
                    <Ionicons name="location-outline" size={13} color={colors.icon} />
                    <ThemedText style={[styles.infoText, { color: colors.icon, textTransform: 'capitalize' }]}>
                        {item.address}
                    </ThemedText>
                </View>

                {/* Contact */}
                {item.contact?.map((contact: any, index: number) => (
                    contact.number ? (
                        <View key={index} style={styles.infoRow}>
                            <Ionicons name="call-outline" size={13} color={colors.icon} />
                            <ThemedText style={[styles.infoText, { color: colors.icon, textTransform: 'capitalize' }]} numberOfLines={1}>
                                {contact.name ? `${contact.name}: ` : ''}{contact.number}
                            </ThemedText>
                        </View>
                    ) : null
                ))}

                {/* Description */}
                {item.description ? (
                    <View style={styles.infoRow}>
                        <Ionicons name="information-circle-outline" size={13} color={colors.icon} />
                        <ThemedText style={[styles.infoText, { color: colors.icon }]} numberOfLines={2}>
                            {item.description}
                        </ThemedText>
                    </View>
                ) : null}

                {/* Footer: Time (Left) + Actions (Right) */}
                <View style={styles.footer}>
                    <View style={styles.timeContainer}>
                        <Ionicons name="time-outline" size={13} color={colors.icon} />
                        <ThemedText style={[styles.infoText, { color: colors.icon }]}>
                            {formatDateTime(item.createdAt)}
                        </ThemedText>
                    </View>

                    {isPending && (
                        <View style={styles.actions}>
                            <TouchableOpacity
                                onPress={() => onEdit(item)}
                                style={[styles.actionBtn, styles.editBtn]}
                            >
                                <Ionicons name="create-outline" size={12} color="#3B82F6" />
                                <ThemedText style={[styles.actionText, { color: '#3B82F6' }]}>Edit</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => onDelete(item._id, item.name)}
                                style={[styles.actionBtn, styles.deleteBtn]}
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <>
                                        <Ionicons name="trash-outline" size={12} color="#EF4444" />
                                        <ThemedText style={[styles.actionText, { color: '#EF4444' }]}>Delete</ThemedText>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
};

export default React.memo(RequestCard);

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderLeftWidth: 4,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 4,
    },
    statusBar: {
        height: 3,
        width: '100%',
    },
    content: {
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 15,
        fontWeight: '700',
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
        fontWeight: '700',
        textTransform: 'capitalize',
        letterSpacing: 0.3,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        marginBottom: 4,
    },
    infoText: {
        fontSize: 14,
        flex: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        gap: 4,
    },
    editBtn: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    deleteBtn: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    actionText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
