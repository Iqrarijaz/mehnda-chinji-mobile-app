import { Router } from 'expo-router';

interface NotificationData {
    route?: string;
    screen?: string;
    ticketId?: string;
    businessId?: string;
    essentialId?: string;
    placeId?: string;
    category?: string;
    placeType?: string;
    type?: string;
    status?: string;
    isOwnerNotification?: boolean;
    [key: string]: any;
}

/**
 * Single source of truth for "what screen does this notification open" —
 * shared by every tap entry point (FCM background/quit-state taps in
 * useFcmNotifications, foreground local-notification taps in
 * usePushNotifications, and taps on a row in the in-app notification list)
 * so a given notification always lands on the same screen regardless of how
 * it was tapped.
 *
 * Backend payloads aren't consistent about how they describe a destination:
 * marketplace notifications ship a ready `route`; most others ship a
 * `screen` name (often a detail-page path like "business/[id]") plus loose
 * entity fields. Several of those `screen` values point at detail routes
 * that only render correctly when navigated to in-app with the full entity
 * object already in hand (see BusinessCard/PlaceCard passing
 * `businessData`/`placeData` via route params) — a screen opened cold from
 * a notification tap has no such object, so this resolves those cases to
 * the closest screen that CAN render on its own, rather than a blank page.
 */
export function handleNotificationNavigation(data: NotificationData, router: Router) {
    if (!data) return;

    // ── Anything that already ships a ready-to-use route ──────────────
    // (marketplace status updates, the weekly "sell something" reminder).
    if (data.route) {
        router.push(data.route as any);
        return;
    }

    const type = (data.type ?? '').toString().toUpperCase();

    // ── Weather alerts (topic-based city forecasts / rain warnings) ───
    if (type === 'WEATHER') {
        router.push('/weather' as any);
        return;
    }

    if (!data.screen) return;
    const screen = data.screen;

    // ── Support ticket — the ticket screen fetches by id on its own,
    // so this is a genuine deep link, not a fallback. ──────────────────
    if (screen.startsWith('support/') && data.ticketId) {
        router.push(`/support/${data.ticketId}` as any);
        return;
    }

    // ── Business status / community broadcast ──────────────────────────
    if (screen.startsWith('business/')) {
        if (data.isOwnerNotification === true) {
            // Owner: go to the Business tab and highlight this business.
            router.push({
                pathname: '/business',
                params: { businessId: data.businessId }
            } as any);
        } else {
            // Community: go to the business directory.
            router.push('/business' as any);
        }
        return;
    }

    // ── Essential (school/hospital/etc.) status / new-listing broadcast ─
    if (screen.startsWith('essentials/')) {
        const category = data.category;
        if (!category) return;

        if (data.isOwnerNotification === true) {
            // Owner: go to that category's listing, on the "My Requests" tab.
            router.push({
                pathname: '/listing/[category]',
                params: { category: String(category).toLowerCase(), tab: 'requests' }
            } as any);
        } else {
            // Community: go to the relevant listing category page.
            router.push({
                pathname: '/listing/[category]',
                params: { category: String(category).toLowerCase() }
            } as any);
        }
        return;
    }

    // ── Quran notification — the surah screen fetches by number on its
    // own, so "quran/67" is a genuine deep link. ───────────────────────
    if (screen.startsWith('quran/')) {
        const parts = screen.split('/');
        if (parts[1]) {
            router.push(`/quran/${parts[1]}` as any);
            return;
        }
    }
}
