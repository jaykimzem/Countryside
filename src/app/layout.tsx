import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Isinya Chuna Estate | Countryside Living",
  description: "Explore premium land parcels in Isinya, Kajiado County, Kenya. A quiet, premium lifestyle invitation one hour from Nairobi.",
  metadataBase: new URL('https://countryside-estate.vercel.app'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Isinya Chuna Estate | Countryside Living",
    description: "Explore premium land parcels in Isinya, Kajiado County, Kenya. A quiet, premium lifestyle invitation one hour from Nairobi.",
    url: 'https://countryside-estate.vercel.app',
    siteName: 'Isinya Chuna Estate',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Isinya Chuna Estate | Countryside Living",
    description: "Explore premium land parcels in Isinya, Kajiado County, Kenya. A quiet, premium lifestyle invitation one hour from Nairobi.",
  },
  category: 'real estate',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}