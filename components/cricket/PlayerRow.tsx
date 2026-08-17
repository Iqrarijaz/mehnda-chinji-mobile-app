import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { FormInput } from '@/components/common/FormInput';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { Player, PlayerRole } from '@/types/cricket';

interface PlayerRowProps {
    index: number;
    player: Player;
    onUpdate: (index: number, updated: Player) => void;
    onRemove: (index: number) => void;
    onPickImage: (index: number) => void;
}

const ROLES: PlayerRole[] = ['BATSMAN', 'BOWLER', 'ALL_ROUNDER', 'WICKET_KEEPER'];

export const PlayerRow = React.memo(function PlayerRow({
    index,
    player,
    onUpdate,
    onRemove,
    onPickImage
}: PlayerRowProps) {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const getInitials = (name: string) => {
        if (!name) return 'P';
        return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    };

    return (
        <View style={[styles.rowContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.topRow}>
                {/* Optional Player Avatar Picker */}
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => onPickImage(index)}
                    activeOpacity={0.7}
                >
                    {player.image ? (
                        <Image source={{ uri: player.image }} style={styles.avatar} />
                    ) : (
                        <View style={[styles.initialsAvatar, { backgroundColor: `${colors.primary}20` }]}>
                            <ThemedText style={[styles.initialsText, { color: colors.primary }]}>
                                {getInitials(player.name)}
                            </ThemedText>
                            <View style={styles.cameraIconBadge}>
                                <Ionicons name="camera" size={10} color="#FFFFFF" />
                            </View>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Player Name Input */}
                <View style={{ flex: 1 }}>
                    <FormInput
                        placeholder={`Player #${index + 1} Name`}
                        value={player.name}
                        onChangeText={(val) => onUpdate(index, { ...player, name: val })}
                        containerStyle={{ marginBottom: 0 }}
                    />
                </View>

                {/* Remove Button */}
                <TouchableOpacity style={styles.removeBtn} onPress={() => onRemove(index)}>
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </TouchableOpacity>
            </View>

            {/* Role & Captain Selection Bar */}
            <View style={styles.roleBar}>
                <ThemedText style={[styles.roleLabel, { color: colors.textSecondary }]}>Role:</ThemedText>
                <View style={styles.rolePills}>
                    {ROLES.map((r) => {
                        const isSelected = player.role === r;
                        return (
                            <TouchableOpacity
                                key={r}
                                style={[
                                    styles.rolePill,
                                    { backgroundColor: isSelected ? colors.primary : colors.surface }
                                ]}
                                onPress={() => onUpdate(index, { ...player, role: r })}
                            >
                                <ThemedText
                                    style={[
                                        styles.rolePillText,
                                        { color: isSelected ? '#FFFFFF' : colors.textSecondary }
                                    ]}
                                >
                                    {r === 'WICKET_KEEPER' ? 'WK' : r.slice(0, 3)}
                                </ThemedText>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Captain Checkbox */}
                <TouchableOpacity
                    style={[styles.captainBadge, player.isCaptain && { backgroundColor: `${colors.secondary}20` }]}
                    onPress={() => onUpdate(index, { ...player, isCaptain: !player.isCaptain })}
                >
                    <Ionicons
                        name={player.isCaptain ? "checkbox" : "square-outline"}
                        size={16}
                        color={player.isCaptain ? colors.secondary : colors.icon}
                    />
                    <ThemedText style={[styles.captainText, player.isCaptain && { color: colors.secondary, fontWeight: '700' }]}>
                        Capt
                    </ThemedText>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    rowContainer: {
        padding: 10,
        borderRadius: Layout.borderRadius - 4,
        borderWidth: 1,
        marginBottom: 10,
        gap: 8
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    avatarContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden'
    },
    avatar: {
        width: '100%',
        height: '100%'
    },
    initialsAvatar: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative'
    },
    initialsText: {
        fontSize: 13,
        fontWeight: '800'
    },
    cameraIconBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 6,
        padding: 2
    },
    removeBtn: {
        padding: 6
    },
    roleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    roleLabel: {
        fontSize: 10.5,
        fontWeight: '600'
    },
    rolePills: {
        flex: 1,
        flexDirection: 'row',
        gap: 4
    },
    rolePill: {
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4
    },
    rolePillText: {
        fontSize: 9.5,
        fontWeight: '700'
    },
    captainBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 4
    },
    captainText: {
        fontSize: 10.5
    }
});
