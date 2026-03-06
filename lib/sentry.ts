import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || 'https://2a1515d0ef3f55383ce4d1a959d5a55b@o4510996340473856.ingest.de.sentry.io/4510996344340560';

export const routingInstrumentation = Sentry.reactNavigationIntegration();

Sentry.init({
    dsn: SENTRY_DSN,
    // enableLogs: __DEV__,
    // debug: __DEV__,
    integrations: [
        routingInstrumentation,
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // Adjusted for production - capture 10% of transactions
});

export default Sentry;
