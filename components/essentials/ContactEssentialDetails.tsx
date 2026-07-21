import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import Toast from 'react-native-toast-message';
import { capitalizeString } from '@/utils/string';
import { Layout } from '@/constants/layout';

interface Contact {
    name?: string;
    number: string;
}

interface ContactEssentialDetailsProps {
    contacts: Contact[];
    primaryColor: string;
}

export const ContactEssentialDetails = React.memo(({ contacts, primaryColor }: ContactEssentialDetailsProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];

    const handleCall = (phoneNumber: string) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        } else {
            Toast.show({
                type: 'error',
                text1: 'No Phone',
                text2: 'Phone number not available.' });
        }
    };

    return (
        <View style={styles.detailSection}>
            <ThemedText style={[styles.sectionHeading, { color: colors.textSecondary }]}>
                Contact Details
            </ThemedText>
            {contacts.map((contact, idx) => (
                <View key={idx} style={styles.contactItem}>
                    <View style={styles.contactInfo}>
                        {contact.name ? (
                            <ThemedText style={[styles.contactName, { color: colors.text }]}>{capitalizeString(contact.name)}</ThemedText>
                        ) : null}
                        <ThemedText style={[styles.contactNumber, { color: colors.textSecondary, fontSize: contact.name ? 13 : 15, fontWeight: contact.name ? '500' : '600' }]}>{contact.number}</ThemedText>
                    </View>
                    <TouchableOpacity
                        style={[styles.callBtn, { backgroundColor: colors.lime + '20' }]}
                        onPress={() => handleCall(contact.number)}
                        activeOpacity={0.7}
                    >
                        <Ionicons name="call" size={16} color={colors.lime} />
                    </TouchableOpacity>
                </View>
            ))}
        </View>
    );
});

ContactEssentialDetails.displayName = 'ContactEssentialDetails';

const styles = StyleSheet.create({
    detailSection: {
        gap: 6 },
    sectionHeading: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.8 },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4 },
    contactInfo: {
        flex: 1 },
    contactName: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2 },
    contactNumber: {
        // Font size and weight depend on whether name is present, handled inline
    },
    callBtn: {
        width: 40,
        height: 40,
        borderRadius: Layout.borderRadius,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12 } });
