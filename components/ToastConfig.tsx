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
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';

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
    const { theme } = useTheme();
    const colors = Colors[theme];
    // Dark mode: tinted-on-surface instead of pastel-on-white, so the toast
    // reads as "success/error accent" rather than a bright light-mode chip
    // dropped onto a dark screen.
    const accent = isSuccess ? colors.success : colors.danger;
    const bg = theme === 'dark'
        ? colors.card // Opaque background for dark mode to fix transparency issue
        : (isSuccess ? '#CFFAE3' : '#FAD1D1');

    return (
        <View
            style={[
                styles.toast,
                { backgroundColor: bg, borderColor: `${accent}33`, borderWidth: 0 },
            ]}
        >
            {/* Animated background blobs */}
            <FloatingBlob color={`${accent}26`} />

            {/* Icon */}
            <View style={[styles.iconWrapper, { backgroundColor: colors.card }]}>
                <Ionicons
                    name={isSuccess ? 'checkmark' : 'alert'}
                    size={18}
                    color={accent}
                />
            </View>

            {/* Content */}
            <View style={styles.textContainer}>
                <ThemedText style={[styles.title, { color: colors.text }]}>{text1}</ThemedText>
                <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>{text2}</ThemedText>
            </View>

            {/* Close */}
            <TouchableOpacity onPress={hide} style={styles.closeBtn}>
                <Ionicons name="close" size={18} color={colors.textSecondary} />
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        zIndex: 2 },

    textContainer: {
        flex: 1,
        zIndex: 2 },

    title: {
        fontSize: 12.5,
        fontWeight: '800' },

    subtitle: {
        fontSize: 10.5,
        marginTop: 2,
        lineHeight: 18 },

    closeBtn: {
        padding: 5,
        zIndex: 2 } });
