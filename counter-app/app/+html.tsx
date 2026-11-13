import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Deve coincidere con experiments.baseUrl in app.json (GitHub Pages: /<nome-repo>)
const BASE = '/Contatore';

// Shell HTML usato solo per la versione web (GitHub Pages).
// I meta "apple-*" permettono di aggiungere l'app alla schermata Home su iPhone
// e aprirla a schermo intero come un'app nativa.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="it">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <title>Staffium</title>
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <link rel="apple-touch-icon" href={`${BASE}/apple-touch-icon.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Staffium" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="theme-color" content="#ffffff" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const css = `
html, body { height: 100%; overscroll-behavior: none; }
body { background-color: #fff; -webkit-tap-highlight-color: transparent; }
@media (prefers-color-scheme: dark) { body { background-color: #000; } }
`;
