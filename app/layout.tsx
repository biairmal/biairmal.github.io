import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Serif_JP } from "next/font/google";
import "lenis/dist/lenis.css";
import "./globals.css";
import MainLayout from "@/components/MainLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Only used for a few kanji; the browser fetches just the unicode-range chunks it needs.
const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  weight: ["400", "600"], // 600: the 侍 in the logo
  preload: false,
});

export const metadata: Metadata = {
  title: "biairmal",
  description: "Bandana Irmal Abdillah's personal website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSerifJp.variable} antialiased`}
      >
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
