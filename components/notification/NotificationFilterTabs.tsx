import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
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
        <View>
            <PillsList
                data={data}
                selectedId={active}
                onSelect={onSelect}
                containerStyle={styles.bar}
            />
        </View>
    );
}

const NotificationFilterTabs = React.memo(NotificationFilterTabsComponent);

export default NotificationFilterTabs;

const styles = StyleSheet.create({
    bar: { marginTop: 4 }
});
