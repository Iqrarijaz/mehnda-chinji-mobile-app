import { format } from 'date-fns';
import moment from '@/utils/dayjs';

/**
 * Converts a 24h time string (e.g., "14:30") to a 12h format with AM/PM (e.g., "2:30 PM").
 * @param timeStr The 24h time string
 * @returns Formatted 12h time string
 */
export const formatTime12h = (timeStr: string): string => {
    if (!timeStr) return '';
    return moment(timeStr, 'HH:mm').format('h:mm A');
};

/**
 * Formats a date into a relative time string.
 * @param date The date to format (Date object, string, or number)
 * @returns A concise relative time string (e.g., "just now", "5m ago", "1h ago", "1 day ago")
 */
export const formatRelativeTime = (date: Date | string | number): string => {
    if (!date) return '';

    const d = new Date(date);
    if (isNaN(d.getTime())) return '';

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    // Future dates
    if (diffInSeconds < 0) return 'just now';

    // Less than 1 minute
    if (diffInSeconds < 60) {
        return 'just now';
    }

    // Less than 1 hour
    if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes}m ago`;
    }

    // Less than 24 hours
    if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours}h ago`;
    }

    // Less than 48 hours
    if (diffInSeconds < 172800) {
        return '1 day ago';
    }

    // Older than 2 days - show actual date
    // If same year, omit year, otherwise show year
    if (d.getFullYear() === now.getFullYear()) {
        return format(d, 'MMM d, h:mm a');
    }

    return format(d, 'MMM d, yyyy');
};
