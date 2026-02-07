"use client";

import { Navbar, Footer } from "@/components/landing";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-page">
      <Navbar />
      <main style={{ paddingTop: "80px" }}>{children}</main>
      <Footer />
    </div>
  );
}
