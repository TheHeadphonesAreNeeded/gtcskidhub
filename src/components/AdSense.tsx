"use client";

import Script from "next/script";
import { useEffect, useRef } from "react";

// Google AdSense integration.
//
// Set NEXT_PUBLIC_ADSENSE_CLIENT (e.g. "ca-pub-1234567890123456") in your
// Netlify environment variables to enable ads. When it is unset, nothing is
// rendered — so the site works fine before AdSense approval.

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

// Loads the AdSense library once, sitewide. Rendered from the root layout.
export function AdSenseScript() {
  if (!CLIENT) return null;
  return (
    <Script
      id="adsbygoogle-init"
      strategy="afterInteractive"
      crossOrigin="anonymous"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT}`}
    />
  );
}

interface AdUnitProps {
  slot: string;
  format?: string;
  className?: string;
  responsive?: boolean;
}

// A single responsive ad unit. Provide the numeric `slot` id from your
// AdSense dashboard. Renders nothing if AdSense is not configured.
export function AdUnit({
  slot,
  format = "auto",
  className = "",
  responsive = true,
}: AdUnitProps) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || pushed.current) return;
    try {
      // @ts-expect-error adsbygoogle is injected by the AdSense script.
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch {
      /* ad blockers or not-yet-loaded script — safe to ignore */
    }
  }, []);

  if (!CLIENT) return null;

  return (
    <div className={`overflow-hidden rounded-2xl ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
