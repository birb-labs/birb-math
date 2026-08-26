import type { ReactNode } from 'react';
import { noFlashScript } from '@birb-math/theme';
import '@birb-math/theme/tokens.css';
import './globals.css';

const langSyncScript = `(function() {
  try {
    var seg = window.location.pathname.split('/')[1];
    if (['pt-BR', 'en-US', 'es'].indexOf(seg) !== -1) {
      document.documentElement.lang = seg;
    }
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
        <script dangerouslySetInnerHTML={{ __html: langSyncScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
