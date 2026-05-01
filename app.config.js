const { expo } = require('./app.json');

module.exports = () => ({
  ...expo,
  extra: {
    appVariant: process.env.EXPO_PUBLIC_APP_VARIANT || 'collector',
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL || '',
    privyAppId: process.env.EXPO_PUBLIC_PRIVY_APP_ID || '',
    collectorAppUrl: process.env.EXPO_PUBLIC_COLLECTOR_APP_URL || '',
    pvpAppUrl: process.env.EXPO_PUBLIC_PVP_APP_URL || '',
    oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID || '',
  },
});
