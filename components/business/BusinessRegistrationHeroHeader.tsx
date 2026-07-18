import React from 'react';

import { BusinessHero } from './BusinessHero';

interface BusinessRegistrationHeroHeaderProps {
    isEditing: boolean;
    onBack: () => void;
}

/**
 * Submit/Edit Business header — a thin wrapper around the shared
 * BusinessHero so this screen and the Business Home screen share the exact
 * same hero component.
 */
function BusinessRegistrationHeroHeaderComponent({
    isEditing,
    onBack,
}: BusinessRegistrationHeroHeaderProps) {
    return (
        <BusinessHero
            title={isEditing ? 'Update Your Listing' : 'Grow Your Business'}
            subtitle="Fill in the details below to list your business in the community directory"
            onBack={onBack}
        />
    );
}

export const BusinessRegistrationHeroHeader = React.memo(BusinessRegistrationHeroHeaderComponent);
BusinessRegistrationHeroHeader.displayName = 'BusinessRegistrationHeroHeader';
