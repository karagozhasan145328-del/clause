"use client";

import Link from "next/link";
import appConfig from "@/app.config";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/components/i18n/language-provider";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { ui } = useLang();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-5">
          <Link href="/">
            <Logo />
          </Link>
          <nav className="ml-auto hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">{ui.features}</a>
            <a href="#how" className="hover:text-foreground transition-colors">{ui.howItWorks}</a>
            <a href="#teklif" className="hover:text-foreground transition-colors">{ui.getQuote}</a>
            <a href="#faq" className="hover:text-foreground transition-colors">{ui.faq}</a>
          </nav>
          <div className="ml-auto flex items-center gap-2 md:ml-7">
            <LanguageToggle className="mr-1" />
            <Link href="/login">
              <Button variant="ghost" size="sm">{ui.signIn}</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">{ui.getStarted}</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-5 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Logo />
            <p className="text-sm text-muted-foreground sm:ml-auto">
              © {new Date().getFullYear()} {appConfig.name} · {appConfig.domain}
            </p>
          </div>
          {/* Tasteful "not legal advice" disclaimer — required for a legal-tech product. */}
          <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-border bg-card px-4 py-3 text-xs leading-relaxed text-muted-foreground shadow-pill">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-primary" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 3 L20 7 V12 C20 16.5 16.5 20 12 21 C7.5 20 4 16.5 4 12 V7 Z" />
              <path d="M12 8 v4 M12 15.5 h.01" />
            </svg>
            <span>{ui.notLegalAdvice}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
