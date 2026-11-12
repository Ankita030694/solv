import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebase";
import { generateSlug } from "../seo-utils";
import { SOLV_BLOG_CATEGORIES } from "../constants/admin";

const CATEGORIES_COLLECTION = "blogCategories";
const BLOGS_COLLECTION = "blogs";

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
}

/**
 * Fetch blog categories dynamically from Firestore `blogCategories` collection,
 * merged with any distinct category names already stored on `blogs` documents.
 */
export async function getCategories(): Promise<BlogCategory[]> {
  try {
    const categoriesRef = collection(db, CATEGORIES_COLLECTION);
    const q = query(categoriesRef, orderBy("name", "asc"));
    const snapshot = await getDocs(q);

    const bySlug = new Map<string, BlogCategory>();

    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const name = String(data.name || "").trim();
      if (!name) return;
      const slug = String(data.slug || generateSlug(name));
      bySlug.set(slug, {
        id: docSnap.id,
        name,
        slug,
        createdAt: data.createdAt || "",
      });
    });

    // Also include any distinct category values present on existing blog documents
    try {
      const blogsSnap = await getDocs(collection(db, BLOGS_COLLECTION));
      blogsSnap.docs.forEach((docSnap) => {
        const catName = String(docSnap.data().category || "").trim();
        if (!catName) return;
        const slug = generateSlug(catName);
        if (!bySlug.has(slug)) {
          bySlug.set(slug, {
            id: `derived-${slug}`,
            name: catName,
            slug,
          });
        }
      });
    } catch {
      // Ignore secondary blog scan failures if blogs collection isn't readable yet
    }

    return Array.from(bySlug.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error("Error fetching dynamic categories:", error);
    return [];
  }
}

/**
 * Create a category in Firestore `blogCategories` if it does not already exist.
 */
export async function createCategory(name: string): Promise<BlogCategory> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error("Category name cannot be empty.");
  }

  const slug = generateSlug(cleanName);
  const existing = await getCategories();
  const match = existing.find(
    (c) =>
      (c.slug === slug || c.name.toLowerCase() === cleanName.toLowerCase()) &&
      !c.id.startsWith("derived-")
  );
  if (match) {
    return match;
  }

  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
    name: cleanName,
    slug,
    createdAt: now,
  });

  return {
    id: docRef.id,
    name: cleanName,
    slug,
    createdAt: now,
  };
}

/**
 * Delete a category document from Firestore `blogCategories`.
 */
export async function deleteCategory(id: string): Promise<void> {
  if (!id || id.startsWith("derived-")) return;
  await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
}

/**
 * Ensure all given category names exist in Firestore `blogCategories`.
 */
export async function seedCategoriesFromNames(
  names: readonly string[] = SOLV_BLOG_CATEGORIES
): Promise<number> {
  const categoriesRef = collection(db, CATEGORIES_COLLECTION);
  const snapshot = await getDocs(categoriesRef);

  const existingSlugs = new Set<string>();
  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();
    const rawName = String(data.name || "").trim();
    const rawSlug = String(data.slug || generateSlug(rawName));
    if (rawSlug) existingSlugs.add(rawSlug);
  });

  let created = 0;
  const now = new Date().toISOString();

  for (const name of names) {
    const cleanName = name.trim();
    if (!cleanName) continue;
    const slug = generateSlug(cleanName);
    if (existingSlugs.has(slug)) continue;

    await addDoc(categoriesRef, {
      name: cleanName,
      slug,
      createdAt: now,
    });
    existingSlugs.add(slug);
    created++;
  }

  return created;
}

