/**
 * Centralized ANALYTICS_EVENTS constants to avoid hardcoding strings.
 */
export const AnalyticsEvents = {
    // Core App Events
    APP_OPEN: 'app_open',
    APP_CLOSE: 'app_close',

    // Authentication
    LOGIN: 'login',
    SIGN_UP: 'sign_up',
    LOGOUT: 'logout',
    FORGOT_PASSWORD_REQUEST: 'forgot_password_request',
    FORGOT_PASSWORD_VERIFIED: 'forgot_password_verified',
    RESET_PASSWORD_SUCCESS: 'reset_password_success',

    // Feature Specific
    PLACE_ADDED: 'place_added',
    POST_VIEWED: 'post_viewed',
    SEARCH_USED: 'search_used',
    SEARCH_RESULTS_VIEWED: 'search_results_viewed',
    NOTIFICATION_OPENED: 'notification_opened',
    WEATHER_VIEWED: 'weather_viewed',
    PRAYER_TIMES_VIEWED: 'prayer_times_viewed',

    // Community Specific
    DONOR_CARD_CLICKED: 'donor_card_clicked',
    BUSINESS_CARD_CLICKED: 'business_card_clicked',
    CATEGORY_CLICKED: 'category_clicked', // e.g., emergency, education
    DONOR_REGISTRATION_CLICKED: 'donor_registration_clicked',
    DONOR_REGISTRATION_SUCCESS: 'donor_registration_success',
    BUSINESS_REGISTRATION_CLICKED: 'business_registration_clicked',
    BUSINESS_REGISTRATION_SUCCESS: 'business_registration_success',

    // User Profile
    PROFILE_UPDATED: 'profile_updated',
    AVATAR_CHANGED: 'avatar_changed',

    // System
    CONNECTION_CHANGED: 'connection_changed',
    API_ERROR: 'api_error',
    CLIENT_ERROR: 'client_error',
    API_RETRY: 'api_retry',

    // Updates
    UPDATE_AVAILABLE: 'update_available',
    UPDATE_CLICKED: 'update_clicked',
} as const;

export type EventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];
