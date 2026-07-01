export interface SearchNavResult {
    id: string;
    label: string;
    subtitle?: string;
    route?: string;
    action?: string;  // Special action identifier instead of route navigation
    icon: string;
    color?: string;
}

export interface SearchCategoryResult {
    id: string;
    label: string;
    icon: string;
    color: string;
    keywords: string[];
}

export const SEARCH_NAV_ITEMS: SearchNavResult[] = [
    // Main screens
    { id: 'emergency', label: 'Emergency', route: '/listing/emergency', icon: 'alert-circle', color: '#EF4444' },
    { id: 'blood', label: 'Blood Donors', subtitle: 'Find donors near you', route: '/(drawer)/blood', icon: 'water', color: '#EF4444' },
    { id: 'support', label: 'Support & FAQ', subtitle: 'Get help or report issues', route: '/support', icon: 'help-circle-outline', color: '#8B5CF6' },
    // Account
    { id: 'edit-profile', label: 'Edit Profile', subtitle: 'Update your personal info', route: '/profile', icon: 'person-circle-outline', color: '#3B82F6' },
    { id: 'change-password', label: 'Change Password', subtitle: 'Update your password', action: 'change-password', icon: 'lock-closed-outline', color: '#F59E0B' },
    // Settings sub-pages
    { id: 'settings', label: 'Settings', subtitle: 'App preferences', route: '/settings', icon: 'settings-outline', color: '#64748B' },
    { id: 'notifications-settings', label: 'Notifications', subtitle: 'Manage alert preferences', route: '/manageNotifications', icon: 'notifications-outline', color: '#10B981' },
    { id: 'data-usage', label: 'Data Usage', subtitle: 'Monitor your data consumption', route: '/dataUsage', icon: 'cellular-outline', color: '#6366F1' },
    { id: 'privacy-policy', label: 'Privacy Policy', subtitle: 'How we handle your data', route: '/privacy', icon: 'shield-checkmark-outline', color: '#06B6D4' },
    { id: 'terms', label: 'Terms & Conditions', subtitle: 'App usage terms', route: '/terms', icon: 'document-text-outline', color: '#64748B' },
    // Category Shortcuts
    { id: 'nav-travel', label: 'Travel & Transport', subtitle: 'Bus timings and transport', route: '/listing/travel', icon: 'bus-outline', color: '#F59E0B' },
    { id: 'nav-banks', label: 'Banks & ATMs', subtitle: 'Find nearest bank or ATM', route: '/listing/banks', icon: 'card-outline', color: '#06B6D4' },
];

export const SEARCH_CATEGORIES_CONFIG: SearchCategoryResult[] = [
    {
        id: 'emergency',
        label: 'Emergency',
        icon: 'alert-circle',
        color: '#F87171',
        keywords: ['emergency', 'police', 'ambulance', 'fire', 'hospital', 'help', 'accident']
    },
    {
        id: 'education',
        label: 'Education',
        icon: 'school',
        color: '#3B82F6',
        keywords: ['education', 'school', 'college', 'admission', 'university', 'study', 'teacher']
    },
    {
        id: 'religious',
        label: 'Religious',
        icon: 'book',
        color: '#10B981',
        keywords: ['religious', 'mosque', 'masjid', 'prayer', 'namaz', 'timings', 'quran']
    },
    {
        id: 'health',
        label: 'Health',
        icon: 'medkit',
        color: '#EF4444',
        keywords: ['health', 'doctor', 'clinic', 'hospital', 'pain', 'medicine', 'pharmacy', 'checkup']
    },
    {
        id: 'govt',
        label: 'Govt Offices',
        icon: 'business',
        color: '#6366F1',
        keywords: ['govt', 'office', 'nadra', 'police station', 'utility', 'bill', 'official']
    },
    {
        id: 'travel',
        label: 'Travel',
        icon: 'bus',
        color: '#F59E0B',
        keywords: ['travel', 'bus', 'transport', 'van', 'timing', 'ticket', 'hiace', 'terminal']
    },
    {
        id: 'banks',
        label: 'Banks',
        icon: 'card',
        color: '#06B6D4',
        keywords: ['bank', 'atm', 'cash', 'money', 'hbl', 'meezan', 'mcb', 'uabl', 'branch']
    },
];

export const POPULAR_SEARCHES = [
    "Blood Donors",
    "Govt School",
    "Masjid Timings",
    "Clinic",
    "Police Station",
    "Bus Timings",
    "ATM"
];
