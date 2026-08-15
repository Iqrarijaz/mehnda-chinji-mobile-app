import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { useDataUsageStore } from '@/store/dataUsageStore';
import { DataUsageHeader } from '@/components/dataUsage/DataUsageHeader';
import { UsageSummaryCard } from '@/components/dataUsage/UsageSummaryCard';
import { NetworkBreakdownCard } from '@/components/dataUsage/NetworkBreakdownCard';
import { DataControlToggles } from '@/components/dataUsage/DataControlToggles';
import { ClearCacheSection } from '@/components/dataUsage/ClearCacheSection';
import { DataUsageEmptyState } from '@/components/dataUsage/DataUsageEmptyState';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/context/ThemeContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

const DataUsageScreen = () => {
    const router = useRouter();
    const { theme } = useTheme();
    const colors = Colors[theme];
    const total = useDataUsageStore(state => state.total);
    const wifi = useDataUsageStore(state => state.wifi);
    const mobile = useDataUsageStore(state => state.mobile);
    const resetDate = useDataUsageStore(state => state.resetDate);
    const resetUsage = useDataUsageStore(state => state.resetUsage);
    const toggleSetting = useDataUsageStore(state => state.toggleSetting);
    const clearCache = useDataUsageStore(state => state.clearCache);
    const lowDataMode = useDataUsageStore(state => state.lowDataMode);
    const downloadWifiOnly = useDataUsageStore(state => state.downloadWifiOnly);
    const autoSyncMobile = useDataUsageStore(state => state.autoSyncMobile);
    const backgroundUsage = useDataUsageStore(state => state.backgroundUsage);

    const settings = {
        lowDataMode,
        downloadWifiOnly,
        autoSyncMobile,
        backgroundUsage
    };

    const handleBack = useCallback(() => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace('/settings');
        }
    }, [router]);

    const handleReset = useCallback(() => {
        resetUsage();
        Toast.show({
            type: 'success',
            text1: 'Stats Reset',
            text2: 'Data usage statistics have been cleared.'
        });
    }, [resetUsage]);

    const handleClearCache = useCallback(async () => {
        await clearCache();
        Toast.show({
            type: 'success',
            text1: 'Cache Cleared',
            text2: 'Application cache has been successfully emptied.'
        });
    }, [clearCache]);

    return (
        <ErrorBoundary>
        <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
            <DataUsageHeader onBack={handleBack} onReset={handleReset} />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {total === 0 ? (
                    <DataUsageEmptyState />
                ) : (
                    <>
                        <UsageSummaryCard totalBytes={total} resetDate={resetDate} />
                        <NetworkBreakdownCard wifi={wifi} mobile={mobile} total={total} />
                    </>
                )}

                <DataControlToggles
                    settings={settings}
                    onToggle={(key: any) => toggleSetting(key)}
                />

                <ClearCacheSection onClear={handleClearCache} />
            </ScrollView>
        </SafeAreaView>
        </ErrorBoundary>
    );
};

export default DataUsageScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 40 : 0 },
    scrollContent: {
        paddingBottom: 36 } });
