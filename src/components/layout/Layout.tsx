import type { ReactNode } from "react";

import NewsletterSignup from "../ui/NewsletterSignup";
import Footer from "./Footer";
import Header from "./Header";

interface LayoutProps {
  children: ReactNode;
  showNewsletter?: boolean;
}

export default function Layout({
  children,
  showNewsletter = true,
}: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      {showNewsletter && <NewsletterSignup />}
      <Footer />
    </div>
  );
}
