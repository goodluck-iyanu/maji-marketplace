import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import NextTopLoader from 'nextjs-toploader';
import { MajiNavigationLoader } from "@/components/brand/maji-navigation-loader";
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

const APP_BASE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://maji.hoberg.com.ng"
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(APP_BASE_URL),
  applicationName: "Maji Marketplace",
  title: {
    default: "Maji | Launch Your Nigerian Storefront & Shop Independent Stores",
    template: "%s | Maji Marketplace",
  },
  description:
    "Launch your Nigerian online storefront in minutes with automated Paystack T+1 bank payouts, live delivery quotes, and Hoberg AI — or buy directly from verified Nigerian stores.",
  keywords: [
    "Maji",
    "Maji Marketplace",
    "Nigerian online store builder",
    "create online storefront Nigeria",
    "Paystack storefront Nigeria",
    "multi-vendor marketplace Nigeria",
    "buy from Nigerian stores",
    "sell physical and digital products Nigeria",
    "Lagos online shopping",
    "Abuja online marketplace",
    "Hoberg Digital",
  ],
  authors: [{ name: "Hoberg Digital", url: `${APP_BASE_URL}/humans.txt` }],
  creator: "Hoberg Digital",
  publisher: "Hoberg Digital",
  category: "shopping",
  alternates: {
    canonical: "/",
  },
  manifest: "/site.webmanifest",
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
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
    title: "Maji | Launch Your Nigerian Storefront & Shop Independent Stores",
    description:
      "Open a custom online storefront for your physical or digital products with automated Paystack T+1 payouts and live delivery quotes — or buy directly from Nigerian stores.",
    url: APP_BASE_URL,
    type: "website",
    siteName: "Maji Marketplace",
    locale: "en_NG",
    images: [
      {
        url: "/brand/maji-og-banner-1200x630-light.png",
        width: 1200,
        height: 630,
        alt: "Maji — Nigerian Storefront & Multi-Vendor Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Maji | Launch Your Nigerian Storefront & Shop Independent Stores",
    description:
      "Open a custom online storefront in Nigeria with automated Paystack payouts and live delivery quotes — or buy directly from independent Nigerian stores.",
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
        <MajiNavigationLoader />
        {children}
      </body>
    </html>
  );
}
