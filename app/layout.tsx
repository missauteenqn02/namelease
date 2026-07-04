import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NameLease | Unicity Identity Marketplace',
  description: 'The premier marketplace for leasing Unicity identities and nametags. Bid, lease, and transfer your web3 identity with ease.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen flex flex-col items-center p-8 md:p-24 max-w-7xl mx-auto">
          <header className="w-full flex justify-between items-center mb-16">
            <h1 className="text-3xl font-bold glow-text tracking-tight">NameLease.</h1>
            <nav>
              <div className="glass-panel px-6 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                <span className="live-indicator"></span> Unicity Testnet v2
              </div>
            </nav>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
