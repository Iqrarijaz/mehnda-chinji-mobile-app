import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import FAQItem from './FAQItem';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

interface FAQ {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    data: FAQ[];
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ data }) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <ThemedText allowFontScaling={false} style={[styles.title, { color: colors.textSecondary }]}>Frequently Asked Questions</ThemedText>
            {data.map((item, index) => (
                <View key={index}>
                    <FAQItem
                        question={item.question}
                        answer={item.answer}
                        isOpen={openIndex === index}
                        onToggle={() => handleToggle(index)}
                    />
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 32 },
    title: {
        fontSize: 12.5,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4 } });

export default FAQAccordion;
