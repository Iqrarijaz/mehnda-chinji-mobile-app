import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet
} from 'react-native';
import { Layout } from '@/constants/layout';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { FormInput } from '@/components/common/FormInput';
import { SubmitButton } from '@/components/common/SubmitButton';

interface FeedbackFormProps {
    onSubmit: (subject: string, description: string) => Promise<void>;
    isSubmitting: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, isSubmitting }) => {
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
        <Animated.View
            entering={SlideInLeft.delay(600).duration(450)}
            style={styles.container}
        >
            <Text style={styles.title}>Send us Feedback</Text>
            <View style={styles.card}>
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
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 8,
    },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: Layout.borderRadius,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: Layout.borderRadius,
        borderColor: '#F1F5F9',
        marginBottom: 16,
        paddingHorizontal: 14,
    },
    inputFocused: {
        borderColor: '#009688',
        backgroundColor: '#FFFFFF',
        shadowColor: '#009688',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        height: 52,
        fontSize: 15,
        color: '#1E293B',
    },
    textAreaContainer: {
        alignItems: 'flex-start',
        height: 120,
    },
    textArea: {
        height: 110,
        paddingTop: 14,
    },
    submitButton: {
        flexDirection: 'row',
        backgroundColor: '#009688',
        height: 54,
        borderRadius: Layout.borderRadius,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#009688',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    submitButtonDisabled: {
        backgroundColor: '#CBD5E1',
        shadowOpacity: 0,
    },
    submitText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default FeedbackForm;
