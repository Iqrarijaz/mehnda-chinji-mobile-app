import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import FAQItem from './FAQItem';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface FAQ {
    question: string;
    answer: string;
}

interface FAQAccordionProps {
    data: FAQ[];
}

const FAQAccordion: React.FC<FAQAccordionProps> = ({ data }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const handleToggle = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Frequently Asked Questions</Text>
            {data.map((item, index) => (
                <Animated.View
                    key={index}
                    entering={FadeInUp.delay(index * 100).duration(500)}
                >
                    <FAQItem
                        question={item.question}
                        answer={item.answer}
                        isOpen={openIndex === index}
                        onToggle={() => handleToggle(index)}
                    />
                </Animated.View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 24,
        marginBottom: 32 },
    title: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
        marginLeft: 4 } });

export default FAQAccordion;
