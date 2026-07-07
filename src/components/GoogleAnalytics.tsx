"use client";

import Script from "next/script";

// Google Analytics 4 (gtag.js) integration.
//
// Set NEXT_PUBLIC_GA_ID (your Measurement ID, e.g. "G-XXXXXXXXXX") in your
// Netlify environment variables to enable analytics. When it is unset,
// nothing loads — so the site works fine before you configure GA.
//
// This renders the exact snippet Google gives you in Admin > Data Streams,
// so you can just copy your Measurement ID and paste it into the env var.

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";

export default function GoogleAnalytics() {
  if (!GA_ID) return null;

  return (
    <>
      <Script
        id="ga-lib"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
