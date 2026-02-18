"use client";

import { useEffect } from "react";

const DEV_TITLE_PREFIX = "[DEV] ";

const greenIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="96" fill="#22c55e"/><polygon points="192,128 192,384 400,256" fill="white"/></svg>`;

function setFavicon(svg: string) {
  const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function EnvIndicator() {
  useEffect(() => {
    const host = window.location.hostname;
    const isDev = host === "localhost" || host === "127.0.0.1";
    if (!isDev) return;

    document.title = DEV_TITLE_PREFIX + document.title;
    setFavicon(greenIconSvg);
  }, []);

  return null;
}
