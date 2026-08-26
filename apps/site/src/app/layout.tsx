import type { ReactNode } from 'react';
import { noFlashScript } from '@birb-math/theme';
import '@birb-math/theme/tokens.css';
import './globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
