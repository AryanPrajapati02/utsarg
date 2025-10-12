'use client'

import "./globals.css";
import "../styles/responsive.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/ui/CookieConsent";
import { Toaster } from 'react-hot-toast';
import { usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const pathname = usePathname();
  
  // Check if current page is a dashboard page
  const isDashboardPage = pathname && (
    pathname.startsWith('/admin/') ||
    pathname.startsWith('/ngo/') ||
    pathname.startsWith('/donor/') ||
    pathname.startsWith('/volunteer/')
  );

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        {!isDashboardPage && <Header />}
        <main className={isDashboardPage ? "min-h-screen" : "flex-1"}>
          {children}
        </main>
        {!isDashboardPage && <Footer />}
        <CookieConsent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
