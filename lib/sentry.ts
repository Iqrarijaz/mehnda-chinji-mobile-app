import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const routingInstrumentation = Sentry.reactNavigationIntegration();

if (__DEV__) {
    console.log('🛡️ [Sentry] Disabled in DEV environment');
}

Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    integrations: [
        routingInstrumentation,
    ],
    tracesSampleRate: 0.1,
});

export default Sentry;
