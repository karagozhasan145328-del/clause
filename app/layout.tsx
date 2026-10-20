import type { Metadata } from "next";
// ── FONTS ─────────────────────────────────────────────────────────────────
// Editorial, NOT Inter/Roboto. Fraunces is a serif display face that gives
// headings legal gravitas; Hanken Grotesk is a clean, humanist body sans;
// JetBrains Mono powers clause counts, risk scores and dates. The setup can
// swap these — keep the CSS variable names (--font-sans-app / --font-display-app
// / --font-mono-app) so globals.css picks them up.
import { Hanken_Grotesk, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/i18n/language-provider";
import appConfig from "@/app.config";
import { DEFAULT_LANG } from "@/lib/i18n/config";

const sans = Hanken_Grotesk({
  variable: "--font-sans-app",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Fraunces — a serif display face for headings and legal gravitas. It is a
// variable font; when `axes` are set, `weight` must be omitted (Next.js 16
// loads the full variable weight range instead).
const display = Fraunces({
  variable: "--font-display-app",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono-app",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: `${appConfig.name} — ${appConfig.tagline[DEFAULT_LANG]}`,
  description: appConfig.description[DEFAULT_LANG],
  applicationName: appConfig.name,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={DEFAULT_LANG}
      suppressHydrationWarning
      className={`${sans.variable} ${display.variable} ${mono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased font-sans">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
