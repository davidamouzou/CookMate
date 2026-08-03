/**
 * Dumps the `recipes` Firestore collection to backup/firestore-recipes.json.
 *
 * Read-only. Run before any migration step:
 *   bun run migrate:export
 */
import { initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, Timestamp } from "firebase/firestore";
import { mkdir, writeFile } from "node:fs/promises";

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Missing FIREBASE_* env vars. Check .env.");
    process.exit(1);
}

/** Firestore Timestamps are not JSON-serializable; unwrap them to ISO strings. */
function serialize(value: unknown): unknown {
    if (value instanceof Timestamp) return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(serialize);
    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, serialize(v)])
        );
    }
    return value;
}

const db = getFirestore(initializeApp(firebaseConfig));
const snapshot = await getDocs(collection(db, "recipes"));

const recipes = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(serialize(doc.data()) as Record<string, unknown>),
}));

await mkdir("backup", { recursive: true });
await writeFile("backup/firestore-recipes.json", JSON.stringify(recipes, null, 2));

console.log(`Exported ${recipes.length} recipes to backup/firestore-recipes.json`);
process.exit(0);
