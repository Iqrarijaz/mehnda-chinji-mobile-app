import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { PillsList } from '@/components/common/PillsList';
import type { NotificationUnreadCounts } from '@/apis/notifications';

const FILTERS = [
    { id: 'ALL', label: 'All' },
    { id: 'PRAYERS', label: 'Prayers' },
    { id: 'FINANCE', label: 'Finance' },
    { id: 'MARKETPLACE', label: 'Marketplace' },
    { id: 'SYSTEM', label: 'System' },
];

interface Props {
    active: string;
    onSelect: (v: string) => void;
    /** Unread count per category, for the pill badges — omitted while loading. */
    unreadCounts?: NotificationUnreadCounts;
}

function NotificationFilterTabsComponent({ active, onSelect, unreadCounts }: Props) {
    const data = useMemo(
        () => FILTERS.map((f) => ({ ...f, badgeCount: unreadCounts?.[f.id as keyof NotificationUnreadCounts] })),
        [unreadCounts]
    );

    return (
        <Animated.View entering={SlideInLeft.delay(180).duration(400)}>
            <PillsList
                data={data}
                selectedId={active}
                onSelect={onSelect}
                containerStyle={styles.bar}
            />
        </Animated.View>
    );
}

const NotificationFilterTabs = React.memo(NotificationFilterTabsComponent);

export default NotificationFilterTabs;

const styles = StyleSheet.create({
    bar: { marginTop: 4 }
});
