import { Router } from 'expo-router';

interface NotificationData {
    screen?: string;
    ticketId?: string;
    businessId?: string;
    placeId?: string;
    category?: string;
    [key: string]: any;
}


export function handleNotificationNavigation(data: NotificationData, router: Router) {
    if (!data?.screen) return;

    const screen = data.screen;

    if (screen.startsWith('support/') && data.ticketId) {
        router.push(`/support/${data.ticketId}` as any);
        return;
    }

    if (screen.startsWith('business/') && data.businessId) {
        router.push({ pathname: '/(tabs)/business', params: { tab: 'portal' } } as any);
        return;
    }

    if (screen.startsWith('places/') && data.placeId) {
        if (data.category) {
            router.push({ pathname: `/listing/${data.category}` as any, params: { tab: 'requests' } } as any);
        }
        return;
    }


}
