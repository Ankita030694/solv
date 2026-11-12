/**
 * SEO & Text Calibration Utilities for SOLV
 */

export function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanInternalNofollow(html: string): string {
  if (!html) return "";

  return html.replace(/<a\s+([^>]*?)>/gi, (match, attributes) => {
    const hrefMatch = attributes.match(/href=["']([^"']+)["']/i);
    if (!hrefMatch) return match;

    const href = hrefMatch[1];
    const isInternal =
      href.startsWith("/") ||
      href.startsWith("#") ||
      /^(https?:\/\/)?(www\.)?(solvpartners\.in|localhost|127\.0\.0\.1)/i.test(href);

    if (isInternal) {
      const updatedAttributes = attributes.replace(
        /rel=["']([^"']*)["']/i,
        (_relMatch: string, relValue: string) => {
          const cleanedRel = relValue
            .split(/\s+/)
            .filter((token) => token.toLowerCase() !== "nofollow")
            .join(" ")
            .trim();
          return cleanedRel ? `rel="${cleanedRel}"` : "";
        }
      );
      return `<a ${updatedAttributes.trim()}>`;
    }

    return match;
  });
}

export function calibrateMetaTitle(
  title: string,
  fallback: string = "Strategic Direction & Advisory"
): string {
  const brandSuffix = " | SOLV";
  const targetMin = 45;
  const targetMax = 58;

  let base = (title || fallback).trim().replace(/\s*\|\s*SOLV$/i, "").trim();

  const maxBaseLength = targetMax - brandSuffix.length;
  if (base.length > maxBaseLength) {
    let truncated = base.substring(0, maxBaseLength);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 20) {
      truncated = truncated.substring(0, lastSpace);
    }
    base = truncated.trim();
  }

  let finalTitle = `${base}${brandSuffix}`;

  if (finalTitle.length < targetMin && fallback && fallback !== base) {
    const extension = ` - ${fallback}`;
    const potential = `${base}${extension}${brandSuffix}`;
    if (potential.length <= targetMax) {
      finalTitle = potential;
    } else {
      const allowedExt = targetMax - finalTitle.length - 3;
      if (allowedExt > 8) {
        finalTitle = `${base} - ${fallback.substring(0, allowedExt).trim()}${brandSuffix}`;
      }
    }
  }

  return finalTitle;
}

export function calibrateMetaDescription(desc: string, titleContext?: string): string {
  const clean = stripHtml(
    desc ||
      titleContext ||
      "Considered strategic perspectives on commercial real estate, restructuring, and succession from SOLV."
  );
  const targetMin = 120;
  const targetMax = 150;

  if (clean.length > targetMax) {
    let truncated = clean.substring(0, targetMax);
    const lastSpace = truncated.lastIndexOf(" ");
    if (lastSpace > 100) {
      truncated = truncated.substring(0, lastSpace);
    }
    truncated = truncated.replace(/[.,;:\-\s]+$/, "");
    return `${truncated}...`;
  }

  if (clean.length < targetMin) {
    const pad = " Read SOLV strategic guidance across assets, business restructuring, and succession.";
    let padded = clean;
    if (!/[.!?]$/.test(padded)) padded += ".";
    padded += pad;
    if (padded.length > targetMax) {
      let truncated = padded.substring(0, targetMax);
      const lastSpace = truncated.lastIndexOf(" ");
      if (lastSpace > 100) {
        truncated = truncated.substring(0, lastSpace);
      }
      return `${truncated.replace(/[.,;:\-\s]+$/, "")}...`;
    }
    return padded;
  }

  return clean;
}

export function generateSlug(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")
    .replace(/[\s\W-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function calculateReadTime(html: string): string {
  const text = stripHtml(html);
  const words = text ? text.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

