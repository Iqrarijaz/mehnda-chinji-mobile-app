import React from 'react';

import { ScreenHeader } from '@/components/common/ScreenHeader';

interface BusinessRegistrationHeroHeaderProps {
    isEditing: boolean;
    onBack: () => void;
}

/**
 * Submit/Edit Business header — the shared ScreenHeader with the business
 * decor theme, so every screen in the app uses one header component.
 */
function BusinessRegistrationHeroHeaderComponent({
    isEditing,
    onBack }: BusinessRegistrationHeroHeaderProps) {
    return (
        <ScreenHeader
            showMenuIcon={false}
            onBackPress={onBack}
            hideAccountActions
            decor="business"
            hero={{
                title: isEditing ? 'Update Your Listing' : 'Grow Your Business',
                subtitle: 'Fill in the details below to list your business in the community directory' }}
        />
    );
}

export const BusinessRegistrationHeroHeader = React.memo(BusinessRegistrationHeroHeaderComponent);
BusinessRegistrationHeroHeader.displayName = 'BusinessRegistrationHeroHeader';
