import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "دريم فريم — الجيل القادم لتوليد الصور بالذكاء الاصطناعي",
  description: "ابتكر صوراً فوتوغرافية احترافية، مشاهد ثلاثية الأبعاد فائقة الواقعية، وفنوناً سينمائية رقمية بسرعة التفكير مع دريم فريم AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${cairo.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-black text-white selection:bg-zinc-800 selection:text-white font-sans">
        {children}
      </body>
    </html>
  );
}
