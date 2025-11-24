import type { Metadata } from "next";
import { Sarabun } from 'next/font/google';
import "./globals.css";
import Theme from "./Theme";

export const metadata: Metadata = {
  title: "ASLES System",
  description: "ระบบตรวจสอบทรัพย์สินและบังคับคดีกองทุน",
};

const sarabunFont = Sarabun({
  subsets: ['thai'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-sarabun',

})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={sarabunFont.className}>
      <body>
        {/* 2. เอา ThemeRegistry มาครอบ children ทั้งหมด */}
        <Theme>
            {children}
        </Theme>
      </body>
    </html>
  );
}