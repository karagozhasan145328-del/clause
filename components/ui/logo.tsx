import { cn } from "@/lib/utils";
import appConfig from "@/app.config";

/**
 * Brand mark — a bespoke inline-SVG logomark: an indigo rounded tile holding a
 * section/paragraph mark (§) framed by a bracket, evoking legal gravitas. No
 * external image. The setup can swap `appConfig.name` for the wordmark; drop a
 * real file at public/logo.svg if you have one.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8 shrink-0", className)}
      aria-hidden
      fill="none"
    >
      <defs>
        <linearGradient id="clause-mark" x1="4" y1="3" x2="28" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="oklch(50% 0.13 282)" />
          <stop offset="1" stopColor="oklch(38% 0.13 290)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#clause-mark)" />
      {/* clause brackets — the "review frame" */}
      <path
        d="M11 8 H8.4 V24 H11"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 8 H23.6 V24 H21"
        stroke="#fff"
        strokeOpacity="0.55"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* section / paragraph mark § */}
      <path
        d="M18.4 11.6 C18.4 10.3 17.3 9.5 16 9.5 C14.5 9.5 13.4 10.4 13.4 11.7 C13.4 14.2 18.6 13.4 18.6 16 C18.6 17.4 17.4 18.3 16 18.3 C14.6 18.3 13.5 17.5 13.5 16.2"
        stroke="#fff"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
      <path
        d="M13.6 20.4 C13.6 21.7 14.7 22.5 16 22.5 C17.5 22.5 18.6 21.6 18.6 20.3 C18.6 17.8 13.4 18.6 13.4 16 C13.4 14.6 14.6 13.7 16 13.7 C17.4 13.7 18.5 14.5 18.5 15.8"
        stroke="#fff"
        strokeOpacity="0.85"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  withWordmark = true,
  withChevron = false,
  onDark = false,
}: {
  className?: string;
  withWordmark?: boolean;
  /** Render a small chevron after the wordmark (matches the sidebar header). */
  withChevron?: boolean;
  /** Use light wordmark on a dark surface (e.g. the auth brand panel). */
  onDark?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-8 w-8 shadow-pill" />
      {withWordmark && (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "font-display text-[19px] font-semibold tracking-[-0.015em]",
              onDark ? "text-white" : "text-foreground",
            )}
          >
            {appConfig.name}
          </span>
          {withChevron && (
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-muted-foreground" aria-hidden>
              <path d="M5 6l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          )}
        </span>
      )}
    </span>
  );
}
