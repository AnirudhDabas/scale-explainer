import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scale — How it works",
  description:
    "Scan any real object, bind its LiDAR dimensions to a generated 3D mesh, and walk through it at 1:1 in a Quest. An interactive technical walkthrough of the Full Scale system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
