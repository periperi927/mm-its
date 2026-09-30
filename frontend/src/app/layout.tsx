import './globals.css';
import AuthProvider from '@/components/AuthProvider';

export const metadata = {
  title: 'Metro Manila Intelligent Transport & Enforcement Command',
  description: 'ITS Operations & Traffic Management Portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-its-blue-950 text-white antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}