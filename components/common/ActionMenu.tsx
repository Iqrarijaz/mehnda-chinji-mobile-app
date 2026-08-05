import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';

export interface ActionMenuItem {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    onPress: () => void;
    destructive?: boolean;
}

interface ActionMenuProps {
    actions: ActionMenuItem[];
    triggerIcon?: keyof typeof Ionicons.glyphMap;
    triggerIconSize?: number;
    triggerIconColor?: string;
}

export const ActionMenu: React.FC<ActionMenuProps> = ({
    actions,
    triggerIcon = 'ellipsis-horizontal',
    triggerIconSize = 18,
    triggerIconColor
}) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    return (
        <Menu>
            <MenuTrigger style={styles.trigger}>
                <Ionicons name={triggerIcon} size={triggerIconSize} color={triggerIconColor || colors.textSecondary} />
            </MenuTrigger>
            <MenuOptions customStyles={{
                optionsContainer: {
                    backgroundColor: colors.card,
                    borderRadius: Layout.borderRadius,
                    padding: 5,
                    width: 190,
                    marginTop: 34 } }}>
                {actions.map((action, index) => {
                    const isDestructive = action.destructive;
                    const accent = isDestructive ? '#EF4444' : (action.color || colors.primary);

                    return (
                        <MenuOption key={index} onSelect={action.onPress}>
                            <View style={styles.menuItem}>
                                <View style={[styles.menuIconTile, { backgroundColor: `${accent}18` }]}>
                                    <Ionicons name={action.icon} size={15} color={accent} />
                                </View>
                                <ThemedText style={[styles.menuText, { color: isDestructive ? '#EF4444' : colors.text }]}>
                                    {action.label}
                                </ThemedText>
                            </View>
                        </MenuOption>
                    );
                })}
            </MenuOptions>
        </Menu>
    );
};

const styles = StyleSheet.create({
    trigger: {
        paddingHorizontal: 2 },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 7,
        paddingHorizontal: 7,
        borderRadius: Layout.borderRadius },
    menuIconTile: {
        width: 30,
        height: 30,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center' },
    menuText: {
        fontSize: 12,
        fontWeight: '700' } });
