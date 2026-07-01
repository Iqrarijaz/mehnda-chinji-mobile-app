import { Ionicons } from '@expo/vector-icons';

export interface AnnouncementTypeConfig {
    label: string;
    color: string;
    bg: string;
    icon?: any; // require() result for local asset
    ionicon: keyof typeof Ionicons.glyphMap;
}

export const ANNOUNCEMENT_TYPE_CONFIG: Record<string, AnnouncementTypeConfig> = {
    emergency: {
        label: 'Emergency',
        color: '#EF4444',
        bg: 'rgba(239, 68, 68, 0.08)',
        icon: require('../assets/icons/emergency.webp'),
        ionicon: 'alert-circle-outline',
    },
    health: {
        label: 'Health',
        color: '#10B981',
        bg: 'rgba(16, 185, 129, 0.08)',
        icon: require('../assets/icons/health.webp'),
        ionicon: 'medical-outline',
    },
    education: {
        label: 'Education',
        color: '#8B5CF6',
        bg: 'rgba(139, 92, 246, 0.08)',
        icon: require('../assets/icons/education_icon.webp'),
        ionicon: 'book-outline',
    },
    travel: {
        label: 'Travel',
        color: '#F59E0B',
        bg: 'rgba(245, 158, 11, 0.08)',
        icon: require('../assets/icons/travel.webp'),
        ionicon: 'bus-outline',
    },
    religious: {
        label: 'Religious',
        color: '#06B6D4',
        bg: 'rgba(6, 182, 212, 0.08)',
        icon: require('../assets/icons/religious.webp'),
        ionicon: 'moon-outline',
    },
    govt: {
        label: 'Govt Office',
        color: '#6B7280',
        bg: 'rgba(107, 114, 128, 0.08)',
        icon: require('../assets/icons/govt_office.webp'),
        ionicon: 'business-outline',
    },
    banks: {
        label: 'Banks',
        color: '#3B82F6',
        bg: 'rgba(59, 130, 246, 0.08)',
        icon: require('../assets/icons/bank.webp'),
        ionicon: 'cash-outline',
    },
    public: {
        label: 'Public',
        color: '#EC4899',
        bg: 'rgba(236, 72, 153, 0.08)',
        ionicon: 'megaphone-outline',
    },
    lost_found: {
        label: 'Lost & Found',
        color: '#14B8A6',
        bg: 'rgba(20, 184, 166, 0.08)',
        ionicon: 'search-outline',
    },
};

export const DEFAULT_TYPE_CONFIG = (primaryColor: string): AnnouncementTypeConfig => ({
    label: 'Public',
    color: primaryColor,
    bg: 'rgba(0, 0, 0, 0.03)',
    ionicon: 'megaphone-outline',
});
