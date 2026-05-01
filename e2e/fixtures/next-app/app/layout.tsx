import type { ReactNode } from 'react';

export const metadata = {
  title: 'Quanta Fixture',
  description: 'Real Next.js corpus for IDE e2e tests',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 24 }}>
        <header style={{ marginBottom: 16 }}>
          <strong>Quanta fixture app</strong>
        </header>
        {children}
      </body>
    </html>
  );
}
