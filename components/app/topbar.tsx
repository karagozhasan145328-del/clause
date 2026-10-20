"use client";

import { usePathname } from "next/navigation";
import { Bell, Upload } from "lucide-react";
import appConfig from "@/app.config";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useLang } from "@/components/i18n/language-provider";

export function Topbar() {
  const pathname = usePathname();
  const { t, lang } = useLang();
  const current =
    appConfig.nav.find((n) => pathname === n.href || pathname.startsWith(n.href + "/")) ??
    appConfig.navGroups.flatMap((g) => g.items).find((n) => pathname === n.href || pathname.startsWith(n.href + "/"));

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-background/80 px-5 backdrop-blur lg:px-8">
      <span className="font-display text-[16px] font-semibold tracking-tight md:hidden">
        {current ? t(current.label) : appConfig.name}
      </span>

      <div className="ml-auto flex items-center gap-1.5">
        <button className="hidden h-9 items-center gap-2 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 sm:inline-flex">
          <Upload className="h-3.5 w-3.5" />
          {lang === "tr" ? "Dosya yükle" : "Upload case"}
        </button>
        <LanguageToggle className="mr-1" />
        <button
          aria-label="Notifications"
          className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
        </button>
      </div>
    </header>
  );
}
