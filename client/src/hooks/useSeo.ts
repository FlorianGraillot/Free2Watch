import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description?: string;
  image?: string;
  type?: 'website' | 'video.movie' | 'video.tv_show';
  canonicalPath?: string;
  jsonLd?: Record<string, unknown>;
}

function setMeta(attribute: 'name' | 'property', key: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute('content', value);
}

/**
 * Applies per-page SEO metadata: title, description, canonical and Open Graph.
 * Values always come from live content, never from hardcoded mock data.
 */
export function useSeo({ title, description, image, type = 'website', canonicalPath, jsonLd }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title.includes('FREE2WATCH') ? title : `${title} — FREE2WATCH`;
    document.title = fullTitle;

    const desc =
      description?.trim() ||
      'Browse and watch movies, TV series, TV shows and anime on FREE2WATCH.';

    setMeta('name', 'description', desc.slice(0, 300));
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc.slice(0, 300));
    setMeta('property', 'og:type', type);
    if (image) setMeta('property', 'og:image', image);

    const path = canonicalPath ?? window.location.pathname;
    const canonicalHref = `${window.location.origin}${path}`;
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalHref;
    setMeta('property', 'og:url', canonicalHref);

    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      if (script) script.remove();
    };
  }, [title, description, image, type, canonicalPath, jsonLd]);
}
