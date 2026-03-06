import { GuideVariant } from "@/components/ui/guidePrompt";

export interface GuidePromptData {
    variant: GuideVariant;
    action?: string;
    object?: string;
    benefit?: string;
    primaryAction?: string;
    secondaryAction?: string;
    title?: string;
    message?: string;
    cta?: string;
}

export const GUIDE_PROMPTS: Record<string, GuidePromptData> = {
    NEW_PLACE: {
        variant: 'clean',
        action: 'submit',
        object: 'a new place request',
        benefit: 'add locations for others to discover',
    },
    NEW_DONATION: {
        variant: 'clean',
        action: 'create',
        object: 'a new donation',
        benefit: 'support people in need',
    },
    CARPOOL_TRIP: {
        variant: 'clean',
        action: 'add',
        object: 'a carpool trip',
        benefit: 'help others find shared rides',
    },
    CREATE_POST: {
        variant: 'flexible',
        primaryAction: 'create a new post',
        secondaryAction: 'edit or manage existing ones',
    },
    REGISTER_DONOR: {
        variant: 'flexible',
        primaryAction: 'register as a donor',
        secondaryAction: 'update your availability later',
    },
    ADD_PLACE_MINIMAL: {
        variant: 'minimal',
        action: 'Add new place',
        object: '',
    },
    STRUCTURED_PLACE: {
        variant: 'structured',
        title: "Add New Place",
        message: "Tap here to submit a new place request. It only takes a minute.",
        cta: "Understood"
    }
};
