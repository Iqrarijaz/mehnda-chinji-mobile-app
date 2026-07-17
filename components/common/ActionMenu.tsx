import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Menu, MenuOptions, MenuOption, MenuTrigger } from 'react-native-popup-menu';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '../ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

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
            <MenuOptions customStyles={{ optionsContainer: { backgroundColor: colors.card, borderRadius: 6, paddingHorizontal: 2, width: 120, paddingVertical: 2 } }}>
                {actions.map((action, index) => {
                    const isDestructive = action.destructive;
                    const textColor = isDestructive ? '#FFFFFF' : (action.color || colors.text);
                    const iconColor = isDestructive ? '#FFFFFF' : (action.color || colors.text);
                    const bgColor = isDestructive ? '#FF5A5F' : 'rgba(128, 128, 128, 0.1)';

                    return (
                        <MenuOption key={index} onSelect={action.onPress} style={{ marginBottom: index !== actions.length - 1 ? 1 : 0 }}>
                            <View style={[styles.menuItem, { backgroundColor: bgColor }]}>
                                <Ionicons name={action.icon} size={14} color={iconColor} />
                                <ThemedText style={[styles.menuText, { color: textColor }]}>
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
        paddingHorizontal: 2,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 4,
        borderRadius: 4,
    },
    menuText: {
        marginLeft: 6,
        fontSize: 11,
        fontWeight: '500',
    },
});
