import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { appVariantConfig } from '@/src/shared/config/app-variant';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>{appVariantConfig.appName}</title>
        <meta name="application-name" content={appVariantConfig.appName} />
        <meta name="description" content={appVariantConfig.description} />
        <meta name="theme-color" content={appVariantConfig.themeColor} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={appVariantConfig.appleMobileWebAppTitle} />
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // ponytail: skip SW in dev — it cache-firsts the bundle and serves stale env across restarts
              if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/service-worker.js').catch(function () {});
                });
              }
            `,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
