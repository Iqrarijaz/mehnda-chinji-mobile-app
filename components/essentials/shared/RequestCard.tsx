import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';
import { ActionMenu } from '@/components/common/ActionMenu';
import { Layout } from '@/constants/layout';
import { ThemedText } from '@/components/ThemedText';

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
    onDelete
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const statusColor = getStatusColor(item.status);
    const isPending = item.status === 'PENDING';

    return (
        <View style={[
            styles.card,
            {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderLeftColor: categoryColor,
            }
        ]}>
            {/* HEADER */}
            <View style={styles.header}>
                <View style={styles.titleContainer}>
                    <ThemedText
                        style={[styles.title, { color: colors.text }]}
                        numberOfLines={2}
                    >
                        {item.name}
                    </ThemedText>

                    {item.type && (
                        <View style={[
                            styles.typeBadge,
                            { backgroundColor: categoryColor + '15' }
                        ]}>
                            <ThemedText style={[
                                styles.typeText,
                                { color: categoryColor }
                            ]}>
                                {item.type.toUpperCase()}
                            </ThemedText>
                        </View>
                    )}
                </View>

                <View style={[
                    styles.statusBadge,
                    { backgroundColor: statusColor + '18' }
                ]}>
                    <View style={[
                        styles.statusDot,
                        { backgroundColor: statusColor }
                    ]} />
                    <ThemedText style={[
                        styles.statusText,
                        { color: statusColor }
                    ]}>
                        {item.status}
                    </ThemedText>
                </View>
            </View>

            {/* CONTENT */}
            <View style={styles.content}>
                {item.address && (
                    <View style={styles.infoSection}>
                        <ThemedText style={[styles.infoLabel, { color: colors.text }]}>Address</ThemedText>
                        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                            {item.address}
                        </ThemedText>
                    </View>
                )}

                {item.description && (
                    <View style={styles.infoSection}>
                        <ThemedText style={[styles.infoLabel, { color: colors.text }]}>Description</ThemedText>
                        <ThemedText style={[styles.infoText, { color: colors.textSecondary }]} numberOfLines={3}>
                            {item.description}
                        </ThemedText>
                    </View>
                )}

                {item.contact && item.contact.length > 0 && (
                    <View style={styles.infoSection}>
                        <ThemedText style={[styles.infoLabel, { color: colors.text }]}>Contact</ThemedText>
                        {item.contact.map((contact: any, index: number) => (
                            contact.number && (
                                <ThemedText
                                    key={index}
                                    style={[styles.infoText, { color: colors.textSecondary, marginBottom: 2 }]}
                                    numberOfLines={1}
                                >
                                    {contact.name ? `${contact.name}: ` : ''}
                                    {contact.number}
                                </ThemedText>
                            )
                        ))}
                    </View>
                )}
            </View>

            {/* FOOTER */}
            <View style={[
                styles.footer,
                { borderTopColor: colors.border }
            ]}>
                <View style={styles.timeContainer}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
                    <ThemedText style={[styles.timeText, { color: colors.textSecondary }]}>
                        {formatDateTime(item.createdAt)}
                    </ThemedText>
                </View>

                {isPending && (
                    <View>
                        {isDeleting ? (
                            <ActivityIndicator size="small" color="#EF4444" style={{ padding: 6 }} />
                        ) : (
                            <ActionMenu
                                actions={[
                                    {
                                        label: 'Edit',
                                        icon: 'create-outline',
                                        color: '#3B82F6',
                                        onPress: () => onEdit(item),
                                    },
                                    {
                                        label: 'Delete',
                                        icon: 'trash-outline',
                                        destructive: true,
                                        onPress: () => onDelete(item._id, item.name),
                                    }
                                ]}
                            />
                        )}
                    </View>
                )}
            </View>
        </View>
    );
};

export default React.memo(RequestCard);

const styles = StyleSheet.create({
    card: {
        marginBottom: 12,
        borderRadius: Layout.borderRadius,
        borderWidth: 1,
        borderLeftWidth: 4,
        padding: 14,
        elevation: 2,
    },

    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },

    titleContainer: {
        flex: 1,
        marginRight: 10,
    },

    title: {
        fontSize: 16,
        fontWeight: '800',
        lineHeight: 22,
        textTransform: 'capitalize',
    },

    typeBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginTop: 6,
    },

    typeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.6,
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },

    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },

    statusText: {
        fontSize: 10,
        fontWeight: '800',
    },

    content: {
        marginBottom: 10,
    },

    infoSection: {
        marginBottom: 8,
    },
    infoLabel: {
        fontWeight: 'bold',
        fontSize: 13,
    },
    infoText: {
        fontSize: 13,
        flex: 1,
        textTransform: 'capitalize',
    },

    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        paddingTop: 10,
    },

    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    timeText: {
        fontSize: 12,
    },
});