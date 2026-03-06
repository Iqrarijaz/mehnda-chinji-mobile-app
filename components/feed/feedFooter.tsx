import { ThemedText } from '@/components/themedText';
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

interface FeedFooterProps {
    colors: any;
    isFetchingNextPage: boolean;
    hasNextPage: boolean;
    postsCount: number;
}

export const FeedFooter: React.FC<FeedFooterProps> = React.memo(({
    colors,
    isFetchingNextPage,
    hasNextPage,
    postsCount
}) => {
    if (isFetchingNextPage) {
        return <ActivityIndicator style={{ margin: 20 }} color={colors.primary} />;
    }

    if (postsCount > 0 && !hasNextPage) {
        return (
            <View style={styles.footerContainer}>
                <ThemedText style={styles.endText}>End of feed</ThemedText>
            </View>
        );
    }

    return <View style={{ height: 100 }} />;
});

const styles = StyleSheet.create({
    footerContainer: {
        height: 120,
        justifyContent: 'flex-start',
        alignItems: 'center',
        paddingTop: 20,
    },
    endText: {
        textAlign: 'center',
        opacity: 0.3,
        fontSize: 12,
        marginTop: 20,
    }
});
