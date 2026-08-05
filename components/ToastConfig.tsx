import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';
import { ThemedText } from './ThemedText';
import { Layout } from '@/constants/layout';

/* ------------------ Animated BG Blob ------------------ */
const FloatingBlob = ({ color }: { color: string }) => {
    const translateX = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(translateX, {
                    toValue: 20,
                    duration: 4000,
                    useNativeDriver: true }),
                Animated.timing(translateX, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: true }),
            ])
        ).start();
    }, []);

    return (
        <Animated.View
            style={[
                styles.blob,
                {
                    backgroundColor: color,
                    transform: [{ translateX }] },
            ]}
        />
    );
};

/* ------------------ Toast Layout ------------------ */
const ToastLayout = ({
    text1,
    text2,
    hide,
    type }: BaseToastProps & { hide: () => void; type: 'success' | 'error' }) => {
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
                    size={18}
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
export const ToastConfig = {
    success: (props: BaseToastProps & { hide: () => void }) => (
        <ToastLayout {...props} type="success" />
    ),
    error: (props: BaseToastProps & { hide: () => void }) => (
        <ToastLayout {...props} type="error" />
    ) };

/* ------------------ Styles ------------------ */
const styles = StyleSheet.create({
    toast: {
        width: '92%',
        minHeight: 60,
        borderRadius: Layout.borderRadius,
        paddingVertical: 8,
        paddingHorizontal: 13,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',




        marginTop: 12,
        zIndex: 99999 },

    successBg: {
        backgroundColor: '#CFFAE3' },
    errorBg: {
        backgroundColor: '#FAD1D1' },

    blob: {
        position: 'absolute',
        left: -20,
        width: 80,
        height: 80,
        borderRadius: Layout.borderRadius },

    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: Layout.borderRadius,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        zIndex: 2 },

    textContainer: {
        flex: 1,
        zIndex: 2 },

    title: {
        fontSize: 12.5,
        fontWeight: '800',
        color: '#0F172A' },

    subtitle: {
        fontSize: 10.5,
        color: '#334155',
        marginTop: 2,
        lineHeight: 18 },

    closeBtn: {
        padding: 5,
        zIndex: 2 } });
