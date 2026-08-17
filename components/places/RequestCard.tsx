import { ThemedText } from '@/components/themedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import React, { useState, useRef } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import {
    Menu,
    MenuOptions,
    MenuOption,
    MenuTrigger,
} from 'react-native-popup-menu';
import { Layout } from '@/constants/layout';

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

    const [showMenu, setShowMenu] = useState(false);

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
                        <Menu opened={showMenu} onBackdropPress={() => setShowMenu(false)}>
                            <MenuTrigger
                                onPress={() => setShowMenu(true)}
                                customStyles={{
                                    triggerWrapper: styles.moreBtn,
                                }}
                            >
                                {isDeleting ? (
                                    <ActivityIndicator size="small" color="#EF4444" />
                                ) : (
                                    <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSecondary} />
                                )}
                            </MenuTrigger>

                            <MenuOptions
                                customStyles={{
                                    optionsContainer: [
                                        styles.menu,
                                        {
                                            backgroundColor: colors.background,
                                            borderColor: colors.border,
                                        }
                                    ],
                                }}
                            >
                                <MenuOption
                                    onSelect={() => {
                                        setShowMenu(false);
                                        onEdit(item);
                                    }}
                                    customStyles={{
                                        optionWrapper: styles.menuItem,
                                    }}
                                >
                                    <Ionicons name="create-outline" size={16} color="#3B82F6" />
                                    <ThemedText style={{ color: colors.text }}>Edit</ThemedText>
                                </MenuOption>

                                <MenuOption
                                    onSelect={() => {
                                        setShowMenu(false);
                                        onDelete(item._id, item.name);
                                    }}
                                    disabled={isDeleting}
                                    customStyles={{
                                        optionWrapper: styles.menuItem,
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                                    <ThemedText style={{ color: '#EF4444' }}>Delete</ThemedText>
                                </MenuOption>
                            </MenuOptions>
                        </Menu>
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
        borderRadius: 4,
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
        borderRadius: 10,
        gap: 4,
    },

    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 1,
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

    moreBtn: {
        padding: 6,
    },

    overlay: {
        flex: 1,
    },

    menu: {
        width: 150,
        borderRadius: 8,
        padding: 8,
        elevation: 6,
    },

    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
});