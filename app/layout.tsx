import type { Metadata, Viewport } from "next";
import { El_Messiri, IBM_Plex_Sans_Arabic, Cinzel } from "next/font/google";
import "./globals.css";

const display = El_Messiri({ subsets: ["arabic", "latin"], weight: ["500", "600", "700"], variable: "--font-display" });
const body = IBM_Plex_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-body" });
const latin = Cinzel({ subsets: ["latin"], weight: ["500", "700"], variable: "--font-latin" });

export const metadata: Metadata = {
  title: { default: "بيسترو عرفات | Bistro Arafat", template: "%s | بيسترو عرفات" },
  description: "مطعم بيسترو عرفات للمأكولات الشرقية والغربية في غزة، شارع النصر. اطلب أونلاين توصيل أو استلام.",
  openGraph: { title: "بيسترو عرفات", description: "شاورما، برجر، فرشوحة ووجبات شرقية. اطلب أونلاين.", locale: "ar_PS", type: "website" },
};
export const viewport: Viewport = { themeColor: "#0a0909", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`${display.variable} ${body.variable} ${latin.variable}`}>
      <body>{children}</body>
    </html>
  );
}
