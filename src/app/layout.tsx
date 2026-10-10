import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#F05A28",
};

export const metadata: Metadata = {
  title: {
    default: "Maji | Create your online store in minutes",
    template: "%s | Maji",
  },
  description: "The easiest way to sell physical and digital products online in Nigeria. Instant storefronts, automated Paystack payouts, and seamless delivery.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    title: "Maji | Create your online store in minutes",
    description: "The easiest way to sell physical and digital products online in Nigeria.",
    type: "website",
    siteName: "Maji",
    locale: "en_NG",
    images: [
      {
        url: "/brand/maji-og-banner-1200x630-light.png",
        width: 1200,
        height: 630,
        alt: "Maji — Storefront Basket Smile Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maji | Create your online store in minutes",
    description: "The easiest way to sell physical and digital products online in Nigeria.",
    images: ["/brand/maji-og-banner-1200x630-light.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader color="#F05A28" showSpinner={false} height={3} shadow="0 0 10px #F05A28,0 0 5px #FF8559" />
        {children}
      </body>
    </html>
  );
}
