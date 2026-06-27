import React, { memo } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/context/AuthContext';
import { ThankYouModal } from '../common/ThankYou';

interface ThankYouFeedBackModalProps {
    visible: boolean;
    onClose: () => void;
}

const ThankYouFeedBackModalComponent = ({ visible, onClose }: ThankYouFeedBackModalProps) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const { user } = useAuth();

    const userName = user?.user?.name
        ? user.user.name.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
        : 'User';

    return (
        <ThankYouModal visible={visible} onClose={onClose}>
            <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                Dear <ThemedText style={{ fontWeight: 'bold', color: colors.text }}>{userName}</ThemedText>. We actually care about your inputs to help you own this app!
            </ThemedText>
        </ThankYouModal>
    );
};

export const ThankYouFeedBackModal = memo(ThankYouFeedBackModalComponent);

const styles = StyleSheet.create({
    modalSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        lineHeight: 20,
    }
});
