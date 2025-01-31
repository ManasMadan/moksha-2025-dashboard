import type { Metadata } from "next";
import "./globals.css";
import { Montserrat } from "next/font/google";
import { AuthProvider } from "@/providers/AuthProvider";
import { ReactQueryProvider } from "@/providers/ReactQueryProvider";
import { Toaster } from "sonner";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Content App",
  description: "Content App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.className} antialiased`}>
        <AuthProvider>
          <ReactQueryProvider><Toaster/>{children}</ReactQueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
