import * as Sentry from '@sentry/react-native';

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN;

export const routingInstrumentation = Sentry.reactNavigationIntegration();

Sentry.init({
    dsn: SENTRY_DSN,
    // enableLogs: __DEV__,
    // debug: __DEV__,
    integrations: [
        routingInstrumentation,
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1,
});
// Sentry.init({
//   dsn: "YOUR_DSN",
//   tracesSampleRate: 0.2,
//   enableAutoSessionTracking: true,
// });

export default Sentry;
