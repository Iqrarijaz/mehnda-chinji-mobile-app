import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface NotificationSectionCardProps {
    title: string;
    children: React.ReactNode;
}

const NotificationSectionCard: React.FC<NotificationSectionCardProps> = ({ title, children }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>{title}</Text>
            <View style={styles.card}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#636e72',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4, // Rows have their own padding
        // Shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3,
    },
});

export default NotificationSectionCard;
