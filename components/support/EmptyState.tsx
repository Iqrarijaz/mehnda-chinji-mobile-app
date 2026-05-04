import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface EmptyStateProps {
    title: string;
    description: string;
    icon?: keyof typeof Ionicons.glyphMap;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    icon = 'help-circle-outline'
}) => {
    return (
        <Animated.View
            entering={FadeIn.duration(600)}
            style={styles.container}
        >
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={48} color="#94A3B8" />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 8,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default EmptyState;
