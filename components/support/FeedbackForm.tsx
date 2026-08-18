import React, { useState } from 'react';
import {
    View,
    StyleSheet
} from 'react-native';
import { Layout } from '@/constants/layout';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';
import { ThemedText } from '@/components/ThemedText';

interface FeedbackFormProps {
    onSubmit: (subject: string, description: string) => Promise<void>;
    isSubmitting: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = React.memo(({ onSubmit, isSubmitting }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = async () => {
        if (!subject.trim() || !description.trim()) return;
        await onSubmit(subject, description);
        setSubject('');
        setDescription('');
    };

    const isFormValid = subject.trim() && description.trim();

    return (
        <View style={styles.container}>
            <ThemedText allowFontScaling={false} style={[styles.title, { color: colors.textSecondary }]}>Send us Feedback</ThemedText>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <FormInput
                    label="SUBJECT"
                    icon="bookmark-outline"
                    placeholder="Subject"
                    value={subject}
                    onChangeText={setSubject}
                    containerStyle={{ marginBottom: 16 }}
                />

                <FormInput
                    label="DESCRIPTION"
                    icon="chatbox-ellipses-outline"
                    placeholder="How can we help you?"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    containerStyle={{ marginBottom: 16 }}
                />

                <SubmitButton
                    title="Submit Feedback"
                    onPress={handleSubmit}
                    isLoading={isSubmitting}
                    disabled={!isFormValid}
                    style={{ marginTop: 8 }}
                    icon="send"
                />
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 8 },
    title: {
        fontSize: 12.5,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4 },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 16 } });

export default FeedbackForm;
