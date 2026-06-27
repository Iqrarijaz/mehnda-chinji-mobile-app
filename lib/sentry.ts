import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const routingInstrumentation = Sentry.reactNavigationIntegration();

if (__DEV__) {
    console.log('🛡️ [Sentry] Disabled in DEV environment');
}

import { InteractionManager } from 'react-native';

if (SENTRY_DSN) {
    InteractionManager.runAfterInteractions(() => {
        Sentry.init({
            dsn: SENTRY_DSN,
            enabled: !__DEV__,
            integrations: [
                routingInstrumentation,
            ],
            tracesSampleRate: 0.1,
        });
    });
} else {
    console.warn('🛡️ [Sentry] Warning: SENTRY_DSN is not configured. Sentry is disabled.');
}

export default Sentry;
