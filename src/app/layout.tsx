import { UI_COPY } from "../content/ui-copy";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: UI_COPY.app.name,
  description:
    "An explainable screening tool for ghost-job, scam, and phishing warning signs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}