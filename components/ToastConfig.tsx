import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { ThemedText } from './themed-text';

/* ------------------ Animated BG Blob ------------------ */
const FloatingBlob = ({ color }: { color: string }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: 20,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.blob,
                {
                    backgroundColor: color,
                    transform: [{ translateX }],
                },
            ]}
        />
    );
};

/* ------------------ Toast Layout ------------------ */
const ToastLayout = ({
    text1,
    text2,
    hide,
    type,
}: BaseToastProps & { hide: () => void; type: 'success' | 'error' }) => {
    const isSuccess = type === 'success';

    return (
        <View
            style={[
                styles.toast,
                isSuccess ? styles.successBg : styles.errorBg,
            ]}
        >
            {/* Animated background blobs */}
            <FloatingBlob
                color={isSuccess ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}
            />

            {/* Icon */}
            <View style={styles.iconWrapper}>
                <Ionicons
                    name={isSuccess ? 'checkmark' : 'alert'}
                    size={22}
                    color={isSuccess ? '#10B981' : '#EF4444'}
                />
            </View>

            {/* Content */}
            <View style={styles.textContainer}>
                <ThemedText style={styles.title}>{text1}</ThemedText>
                <ThemedText style={styles.subtitle}>{text2}</ThemedText>
            </View>

            {/* Close */}
            <TouchableOpacity onPress={hide} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
        </View>
    );
};

/* ------------------ Export Config ------------------ */
export const toastConfig = {
    success: (props: BaseToastProps & { hide: () => void }) => (
        <ToastLayout {...props} type="success" />
    ),
    error: (props: BaseToastProps & { hide: () => void }) => (
        <ToastLayout {...props} type="error" />
    ),
};

/* ------------------ Styles ------------------ */
const styles = StyleSheet.create({
    toast: {
        width: '92%',
        minHeight: 80,
        borderRadius: 28,
        paddingVertical: 16,
        paddingHorizontal: 18,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 14,
        elevation: 6,
        marginTop: 16,
    },

    successBg: {
        backgroundColor: '#CFFAE3',
    },
    errorBg: {
        backgroundColor: '#FAD1D1',
    },

    blob: {
        position: 'absolute',
        left: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
    },

    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
        zIndex: 2,
    },

    textContainer: {
        flex: 1,
        zIndex: 2,
    },

    title: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
    },

    subtitle: {
        fontSize: 14,
        color: '#334155',
        marginTop: 4,
        lineHeight: 20,
    },

    closeBtn: {
        padding: 6,
        zIndex: 2,
    },
});
