import React from 'react';
import { StyleSheet } from 'react-native';
import Animated, { SlideInLeft } from 'react-native-reanimated';
import { PillsList } from '@/components/common/PillsList';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/constants/colors';

const FILTERS = [
    { id: 'ALL', label: 'All' },
    { id: 'SYSTEM', label: 'System' },
    { id: 'COMMUNITY', label: 'Community' },
    { id: 'ACTIVITY', label: 'Activity' },
];

interface Props {
    active: string;
    onSelect: (v: string) => void;
}

const NotificationFilterTabs = React.memo(({ active, onSelect }: Props) => {
    const { theme } = useTheme();
    const colors = Colors[theme];
    
    return (
        <Animated.View entering={SlideInLeft.delay(180).duration(400)}>
            <PillsList
                data={FILTERS}
                selectedId={active}
                onSelect={onSelect}
                containerStyle={styles.bar}
            />
        </Animated.View>
    );
});

export default NotificationFilterTabs;

const styles = StyleSheet.create({
    bar: { marginTop: 4 }
});
