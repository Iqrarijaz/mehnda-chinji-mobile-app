import { Router } from 'expo-router';

interface NotificationData {
    screen?: string;
    ticketId?: string;
    businessId?: string;
    placeId?: string;
    category?: string;
    placeType?: string;
    type?: string;
    status?: string;
    /** true  → notification sent to the submitter (go to My Requests)
     *  false → community broadcast (go to the listing page) */
    isOwnerNotification?: boolean;
    [key: string]: any;
}

export function handleNotificationNavigation(data: NotificationData, router: Router) {
    if (!data?.screen) return;

    const screen = data.screen;

    // ── Support ticket ──────────────────────────────────────────────
    if (screen.startsWith('support/') && data.ticketId) {
        router.push(`/support/${data.ticketId}` as any);
        return;
    }

    // ── Business status ─────────────────────────────────────────────
    if (screen.startsWith('business/') && data.businessId) {
        if (data.isOwnerNotification === true) {
            // Owner: go to Business portal and highlight the specific business
            router.push({
                pathname: '/(tabs)/business',
                params: { tab: 'portal', businessId: data.businessId }
            } as any);
        } else {
            // Community: go to business listing
            router.push('/(tabs)/business' as any);
        }
        return;
    }

    // ── Place notification ──────────────────────────────────────────
    if (screen.startsWith('places/') && data.placeId) {

        if (data.isOwnerNotification === true) {
            // Owner: go to My Requests and scroll to/highlight that specific place
            router.push({
                pathname: '/user/requests',
                params: { placeId: data.placeId }
            } as any);
            return;
        }

        // Community: go to the relevant listing category page
        if (data.category) {
            router.push(`/listing/${data.category}` as any);
            return;
        }

        // Fallback
        router.push('/(drawer)/(tabs)' as any);
        return;
    }

    // ── Quran notification ──────────────────────────────────────────
    if (screen.startsWith('quran/')) {
        const parts = screen.split('/');
        if (parts[1]) {
            router.push(`/quran/${parts[1]}` as any);
            return;
        }
    }
}
