import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface NotificationToggleRowProps {
    label: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
    color?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
    index: number;
}

const NotificationToggleRow: React.FC<NotificationToggleRowProps> = ({
    label,
    description,
    icon,
    color = '#009688',
    value,
    onValueChange,
    index,
}) => {
    return (
        <Animated.View
            entering={FadeInRight.delay(index * 100).duration(400)}
            style={styles.container}
        >
            <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.content}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.descriptionText} numberOfLines={2}>
                    {description}
                </Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#e0e0e0', true: `${color}50` }}
                thumbColor={value ? color : '#f5f5f5'}
                ios_backgroundColor="#e0e0e0"
            />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#f0f0f0',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#e0f2f1',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    content: {
        flex: 1,
        marginRight: 10,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3436',
        marginBottom: 2,
    },
    descriptionText: {
        fontSize: 13,
        color: '#636e72',
        lineHeight: 18,
    },
});

export default NotificationToggleRow;
