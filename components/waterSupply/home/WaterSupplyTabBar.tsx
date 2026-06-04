import React from 'react';
import { ScrollView, View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/themedText';

export type TabType = 'connections' | 'bills' | 'expenses' | 'report';

interface TabConfigItem {
    label: string;
    icon: any;
    color: string;
    bgLight: string;
}

const TAB_CONFIG: Record<TabType, TabConfigItem> = {
    connections: {
        label: 'Connections',
        icon: 'people-outline',
        color: '#3b82f6',
        bgLight: 'rgba(59, 130, 246, 0.12)',
    },
    bills: {
        label: 'Bills',
        icon: 'receipt-outline',
        color: '#10b981',
        bgLight: 'rgba(16, 185, 129, 0.12)',
    },
    expenses: {
        label: 'Expenses',
        icon: 'card-outline',
        color: '#ef4444',
        bgLight: 'rgba(239, 68, 68, 0.12)',
    },
    report: {
        label: 'Report',
        icon: 'analytics-outline',
        color: '#8b5cf6',
        bgLight: 'rgba(139, 92, 246, 0.12)',
    }
};

interface WaterSupplyTabBarProps {
    activeTab: TabType;
    setActiveTab: (tab: TabType) => void;
    isDark: boolean;
    colors: any;
}

const WaterSupplyTabBar = React.memo(({ activeTab, setActiveTab, isDark, colors }: WaterSupplyTabBarProps) => {
    return (
        <View style={[styles.tabBarContainer, { borderBottomColor: colors.border, backgroundColor: isDark ? '#0f172a' : '#FFF' }]}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tabBarScroll}
            >
                {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => {
                    const isSelected = activeTab === tab;
                    const config = TAB_CONFIG[tab];
                    const tabColor = config.color;
                    const bgActive = config.bgLight;

                    return (
                        <TouchableOpacity
                            key={tab}
                            onPress={() => setActiveTab(tab)}
                            style={[
                                styles.tabButton,
                                {
                                    backgroundColor: isSelected ? bgActive : (isDark ? '#1e293b' : '#f8fafc'),
                                    borderColor: isSelected ? tabColor : (isDark ? '#334155' : '#e2e8f0'),
                                }
                            ]}
                        >
                            <Ionicons
                                name={config.icon}
                                size={16}
                                color={isSelected ? tabColor : colors.textSecondary}
                            />
                            <ThemedText
                                style={[
                                    styles.tabButtonText,
                                    {
                                        color: isSelected ? (isDark ? '#FFF' : tabColor) : colors.textSecondary,
                                        fontWeight: isSelected ? '700' : '600'
                                    }
                                ]}
                            >
                                {config.label}
                            </ThemedText>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
});

export default WaterSupplyTabBar;

const styles = StyleSheet.create({
    tabBarContainer: {
        borderBottomWidth: 1,
    },
    tabBarScroll: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        alignItems: 'center',
        gap: 10,
    },
    tabButton: {
        height: 38,
        paddingHorizontal: 10,
        borderRadius: 19,
        borderWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    tabButtonText: {
        fontSize: 12,
    },
});
