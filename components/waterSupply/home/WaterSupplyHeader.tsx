import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';

interface WaterSupplyHeaderProps {
    insets: { top: number };
    colors: any;
    onBack: () => void;
    onRefresh: () => void;
}

const WaterSupplyHeader = React.memo(({ insets, colors, onBack, onRefresh }: WaterSupplyHeaderProps) => {
    return (
        <View style={[styles.headerWrap, { backgroundColor: colors.primary }]}>
            <View style={[styles.headerTopRow, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity
                    onPress={onBack}
                    style={styles.backBtn}
                >
                    <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <ThemedText style={styles.headerTitle}>Water Supply</ThemedText>
                </View>
                <TouchableOpacity
                    onPress={onRefresh}
                    style={styles.backBtn}
                >
                    <Ionicons name="refresh-outline" size={22} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
    );
});

export default WaterSupplyHeader;

const styles = StyleSheet.create({
    headerWrap: {
        paddingBottom: 16,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        overflow: 'hidden',
        zIndex: 10,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            }
        }),
    },
    headerTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    backBtn: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
});
