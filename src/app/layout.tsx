import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AmplifyProvider } from "@/components/AmplifyProvider";
import AmplifyClientConfig from "@/components/AmplifyClientConfig";
import "@aws-amplify/ui-react/styles.css";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DPE | Oversight Admin",
  description: "Devloped and Managed by DPE | BYC",
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
        <AmplifyClientConfig />
        <AmplifyProvider>
        {children}
        </AmplifyProvider>
      </body>
    </html>
  );
}
