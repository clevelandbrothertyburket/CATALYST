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
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%230A0A0B'/%3E%3Crect x='6' y='6' width='52' height='52' rx='11' fill='%23E2231A'/%3E%3Ctext x='32' y='43' font-family='Archivo,Arial,sans-serif' font-size='30' font-weight='800' fill='%23ffffff' text-anchor='middle' letter-spacing='-1'%3ECB%3C/text%3E%3C/svg%3E"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
