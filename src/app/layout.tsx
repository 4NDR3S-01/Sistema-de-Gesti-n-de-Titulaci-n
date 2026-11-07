import type { Metadata, Viewport } from "next";
import { Public_Sans } from "next/font/google";
import { AuthSessionProvider } from "@/components/auth-session-provider";
import "./globals.css";

const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Titulación ULEAM",
    template: "%s | Titulación ULEAM",
  },
  description:
    "Sistema de gestión y seguimiento de trámites de titulación de la Universidad Laica Eloy Alfaro de Manabí.",
};

export const viewport: Viewport = {
  themeColor: "#06314f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={publicSans.variable}>
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
