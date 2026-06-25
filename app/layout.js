import './globals.css';

export const metadata = {
  title: 'Catalyst — Cleveland Brothers Cat Rental',
  description: 'Internal campaign taxonomy, code governance, and UTM link management.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Archivo:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230A0A0B'/%3E%3Cpath d='M28 33 L43 22 L53 30' fill='none' stroke='%23FFCD11' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3Cpath d='M49 26 q8 1 8 8 l-9 1 z' fill='%23FFCD11'/%3E%3Crect x='12' y='28' width='20' height='17' rx='3' fill='%23FFCD11'/%3E%3Crect x='7' y='45' width='39' height='9' rx='4.5' fill='%23FFCD11'/%3E%3Ccircle cx='15' cy='49.5' r='2' fill='%230A0A0B'/%3E%3Ccircle cx='26' cy='49.5' r='2' fill='%230A0A0B'/%3E%3Ccircle cx='38' cy='49.5' r='2' fill='%230A0A0B'/%3E%3C/svg%3E"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
