import type { Metadata } from "next";
import "./globals.css";

import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";

export const metadata: Metadata = {
  title: "قُرب | اكتشف الأماكن والخدمات من حولك",
  description:
    "قُرب يساعدك تلاقي الأماكن والخدمات القريبة منك في جنوب سيناء بسهولة.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

