import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInLeft, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface FeedbackFormProps {
    onSubmit: (subject: string, description: string) => Promise<void>;
    isSubmitting: boolean;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ onSubmit, isSubmitting }) => {
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [focusedField, setFocusedField] = useState<'subject' | 'description' | null>(null);

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
                <View style={[
                    styles.inputContainer,
                    focusedField === 'subject' && styles.inputFocused
                ]}>
                    <Ionicons
                        name="bookmark-outline"
                        size={20}
                        color={focusedField === 'subject' ? "#009688" : "#94A3B8"}
                        style={styles.inputIcon}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Subject"
                        placeholderTextColor="#94A3B8"
                        value={subject}
                        onChangeText={setSubject}
                        onFocus={() => setFocusedField('subject')}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                <View style={[
                    styles.inputContainer,
                    styles.textAreaContainer,
                    focusedField === 'description' && styles.inputFocused
                ]}>
                    <Ionicons
                        name="chatbox-ellipses-outline"
                        size={20}
                        color={focusedField === 'description' ? "#009688" : "#94A3B8"}
                        style={[styles.inputIcon, { marginTop: 14 }]}
                    />
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="How can we help you?"
                        placeholderTextColor="#94A3B8"
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        onFocus={() => setFocusedField('description')}
                        onBlur={() => setFocusedField(null)}
                    />
                </View>

                <TouchableOpacity
                    activeOpacity={0.8}
                    disabled={!isFormValid || isSubmitting}
                    onPress={handleSubmit}
                    style={[
                        styles.submitButton,
                        (!isFormValid || isSubmitting) && styles.submitButtonDisabled
                    ]}
                >
                    {isSubmitting ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Text style={styles.submitText}>Submit Feedback</Text>
                            <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 8 }} />
                        </>
                    )}
                </TouchableOpacity>
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
        borderRadius: 24,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 4,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        borderWidth: 1,
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
        borderRadius: 16,
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
