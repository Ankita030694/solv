import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import ts from "typescript";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
} from "firebase/firestore";

const require = createRequire(import.meta.url);
const ROOT_DIR = process.cwd();

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eqIndex = line.indexOf("=");
    if (eqIndex === -1) continue;
    const key = line.slice(0, eqIndex).trim();
    let val = line.slice(eqIndex + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }
}

function loadInsightArticles() {
  const insightsPath = path.join(ROOT_DIR, "data", "insights.ts");
  const source = fs.readFileSync(insightsPath, "utf8");
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  });
  const mod = { exports: {} };
  const fn = new Function("exports", "require", "module", transpiled.outputText);
  fn(mod.exports, require, mod);
  return mod.exports.INSIGHT_ARTICLES || [];
}

function generateSlug(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function escapeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parsePublishDateToIso(dateStr) {
  if (!dateStr) return new Date().toISOString().split("T")[0];
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().split("T")[0];
  }
  const y = parsed.getFullYear();
  const m = String(parsed.getMonth() + 1).padStart(2, "0");
  const d = String(parsed.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function convertInsightToHtml(article) {
  const parts = [];

  if (article.keyTakeaways?.length) {
    parts.push("<h2>Executive Summary &amp; Key Takeaways</h2>");
    const items = article.keyTakeaways
      .map((item) => `<li><p>${escapeHtml(item)}</p></li>`)
      .join("");
    parts.push(`<ul>${items}</ul>`);
  }

  for (const section of article.sections || []) {
    parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    for (const para of section.body || []) {
      parts.push(`<p>${escapeHtml(para)}</p>`);
    }
  }

  if (article.quote) {
    parts.push(
      `<blockquote><p>&ldquo;${escapeHtml(article.quote.text)}&rdquo;</p><p><strong>&mdash; ${escapeHtml(article.quote.attribution)}</strong></p></blockquote>`
    );
  }

  return parts.join("\n");
}

async function main() {
  loadEnvFile(path.join(ROOT_DIR, ".env"));

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_* env vars in .env");
    process.exit(1);
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);

  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    console.log(`Signing in as ${process.env.ADMIN_EMAIL}...`);
    await signInWithEmailAndPassword(
      auth,
      process.env.ADMIN_EMAIL,
      process.env.ADMIN_PASSWORD
    );
  }

  const articles = loadInsightArticles();
  if (!articles.length) {
    console.error("No INSIGHT_ARTICLES found in data/insights.ts");
    process.exit(1);
  }

  const baseCategories = [
    "Real Estate & Land",
    "Corporate Restructuring",
    "Succession & Legacy",
    "Private Wealth",
    "NRI Advisory",
    "Insolvency & IBC",
    "Growth & Strategy",
    "Decision-Making",
    ...articles.map((a) => a.category),
  ];
  const uniqueCategories = Array.from(new Set(baseCategories.filter(Boolean)));

  const categoriesRef = collection(db, "blogCategories");
  const existingCatSnap = await getDocs(categoriesRef);
  const existingCatSlugs = new Set(
    existingCatSnap.docs.map((d) =>
      String(d.data().slug || generateSlug(d.data().name || ""))
    )
  );

  let catAdded = 0;
  const now = new Date().toISOString();
  for (const name of uniqueCategories) {
    const slug = generateSlug(name);
    if (existingCatSlugs.has(slug)) continue;
    await addDoc(categoriesRef, { name, slug, createdAt: now });
    existingCatSlugs.add(slug);
    catAdded++;
  }

  const blogsRef = collection(db, "blogs");
  const existingBlogSnap = await getDocs(blogsRef);
  const existingSlugs = new Set(
    existingBlogSnap.docs.map((d) =>
      String(d.data().slug || "").trim().toLowerCase()
    )
  );

  let blogsAdded = 0;
  for (const article of articles) {
    const slug = String(article.slug || "").trim().toLowerCase();
    if (!slug || existingSlugs.has(slug)) {
      console.log(`Skipping existing blog: ${slug}`);
      continue;
    }

    const htmlBody = convertInsightToHtml(article);
    await addDoc(blogsRef, {
      title: article.title,
      subtitle: article.lead || "",
      slug,
      category: article.category || "Advisory",
      publishDate: parsePublishDateToIso(article.date),
      authorName: article.author?.name || "SOLV Strategic Advisory",
      authorRole: article.author?.role || "Commercial & Succession Practice",
      authorAvatar: "",
      coverImage: article.imageSrc || "",
      description: htmlBody,
      metaTitle: `${article.title} | SOLV`.slice(0, 68),
      metaDescription: (article.lead || "").slice(0, 160),
      featured: article.id === "1" || article.id === "4",
      readTime: article.readTime || "5 min read",
      faqCount: 0,
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Added blog to Firestore: ${slug}`);
    blogsAdded++;
  }

  console.log(
    `Done! Added ${blogsAdded} blog(s) and ${catAdded} category record(s).`
  );
  process.exit(0);
}

main().catch((err) => {
  if (err?.code === "permission-denied") {
    console.error(
      "\nPermission denied writing to Firestore.\n" +
        "Either:\n" +
        "  1. Pass admin credentials: $env:ADMIN_EMAIL='...'; $env:ADMIN_PASSWORD='...'; npm run seed:insights\n" +
        "  2. Or log in at /admin/login and click 'Import All to Database' in /admin/blogs.\n"
    );
  } else {
    console.error("Seed failed:", err);
  }
  process.exit(1);
});

