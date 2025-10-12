import "./globals.css";
import "../styles/responsive.css";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata = {
  title: 'Utsarg - NGO Platform',
  description: 'Connect with NGOs, donate to causes, and make a difference in your community.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="min-h-screen flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
