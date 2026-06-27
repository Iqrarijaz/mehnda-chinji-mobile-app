import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import {
    Modal,
    StyleSheet,
    TouchableOpacity,
    View,
    FlatList,
} from 'react-native';

import { Colors } from '@/constants/colors';
import { Layout } from '@/constants/layout';
import { useTheme } from '@/context/ThemeContext';
import { ThemedText } from '../ThemedText';

interface TimePickerProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (time: string) => void;
    title: string;
    currentValue?: string;
}

export function TimePicker({
    visible,
    onClose,
    onSelect,
    title,
    currentValue
}: TimePickerProps) {
    const { theme, isDark } = useTheme();
    const colors = Colors[theme];

    const [hour, setHour] = useState('06');
    const [minute, setMinute] = useState('00');
    const [period, setPeriod] = useState('AM');

    useEffect(() => {
        if (currentValue && currentValue.includes(':')) {
            try {
                const [time, p] = currentValue.split(' ');
                const [h, m] = time.split(':');
                if (h && m && p) {
                    setHour(h);
                    setMinute(m);
                    setPeriod(p);
                }
            } catch (e) {
                console.warn('Failed to parse current value in TimePicker', e);
            }
        }
    }, [currentValue, visible]);

    const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const periods = ['AM', 'PM'];

    const handleConfirm = () => {
        onSelect(`${hour}:${minute} ${period}`);
        onClose();
    };

    const renderColumn = (data: string[], value: string, setValue: (v: string) => void, flex: number) => (
        <View style={{ flex }}>
            <FlatList
                data={data}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                snapToInterval={44}
                decelerationRate="fast"
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onPress={() => setValue(item)}
                        activeOpacity={0.7}
                        style={[
                            styles.optionItem,
                            value === item && {
                                backgroundColor: colors.primary + '15',
                                borderRadius: 12,
                                borderColor: colors.primary + '30',
                                borderWidth: 1
                            }
                        ]}
                    >
                        <ThemedText style={[
                            styles.optionText,
                            { color: colors.textSecondary },
                            value === item && { color: colors.primary, fontWeight: '900', fontSize: 20 }
                        ]}>
                            {item}
                        </ThemedText>
                    </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingVertical: 80 }}
            />
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    {isDark && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']}
                            style={StyleSheet.absoluteFill}
                        />
                    )}

                    <View style={styles.modalHeader}>
                        <ThemedText style={[styles.modalTitle, { color: colors.text }]}>{title}</ThemedText>
                        <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: colors.border }]}>
                            <Ionicons name="close" size={20} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pickerContainer}>
                        {renderColumn(hours, hour, setHour, 1)}
                        <View style={styles.separatorContainer}>
                            <ThemedText style={[styles.separator, { color: colors.textSecondary }]}>:</ThemedText>
                        </View>
                        {renderColumn(minutes, minute, setMinute, 1)}
                        <View style={{ width: 15 }} />
                        {renderColumn(periods, period, setPeriod, 0.8)}
                    </View>

                    <TouchableOpacity
                        style={styles.confirmBtn}
                        onPress={handleConfirm}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={[colors.primary, colors.primary]}
                            style={styles.gradient}
                        >
                            <ThemedText style={styles.confirmText}>CONFIRM TIME</ThemedText>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '55%',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 48,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pickerContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        paddingHorizontal: 10,
    },
    optionItem: {
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 4,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
    },
    separatorContainer: {
        height: 44,
        justifyContent: 'center',
        paddingBottom: 4,
    },
    separator: {
        fontSize: 24,
        fontWeight: '800',
        marginHorizontal: 4,
    },
    confirmBtn: {
        height: 56,
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 1,
    },
});
