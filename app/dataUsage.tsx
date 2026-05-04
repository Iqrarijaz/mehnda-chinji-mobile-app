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

const DataUsageScreen = () => {
    const router = useRouter();
    const {
        total,
        wifi,
        mobile,
        resetDate,
        resetUsage,
        toggleSetting,
        clearCache,
        lowDataMode,
        downloadWifiOnly,
        autoSyncMobile,
        backgroundUsage
    } = useDataUsageStore();

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
        <SafeAreaView style={styles.container}>
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
    );
};

export default DataUsageScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        paddingTop: Platform.OS === 'android' ? 40 : 0,
    },
    scrollContent: {
        paddingBottom: 40,
    },
});
