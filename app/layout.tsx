import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Feedback Intelligence | Customer Experience Analytics",
  description: "Multi-source customer feedback intelligence dashboard.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Feedback IQ" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" }
};
export const viewport: Viewport = {
  themeColor: "#101827",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
