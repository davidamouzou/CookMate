import { DEFAULT_GOALS } from "@/features/tracking/types/entry";
import { DEFAULT_HYDRATION_GOALS } from "@/features/tracking/types/hydration";

/**
 * Device-local persistence for the tracking screens.
 *
 * The tracking data used to live in Supabase behind row-level security, which
 * required every visitor to hold an auth session. Anonymous sign-ins are off
 * for this project, so there is no session to scope rows with and the tracking
 * tables are unused. The log now stays in the browser instead: no account, no
 * network, and nothing to fail. The trade-off is that the data is per-device
 * and disappears with the site data.
 *
 * The version in the key prefix lets a future shape change start clean rather
 * than crash on stale records.
 */
const PREFIX = "cookmate.v1.";

export const STORAGE_KEYS = {
    profile: `${PREFIX}profile`,
    entries: `${PREFIX}entries`,
    drinks: `${PREFIX}drinks`,
    weights: `${PREFIX}weights`,
} as const;

/** Goals and programme settings — the local stand-in for the `profiles` row. */
export type StoredProfile = {
    dailyKcal: number;
    dailyCarbsG: number;
    dailyProteinG: number;
    dailyFatG: number;
    dailyWaterMl: number;
    dailyCaffeineMg: number;
    startWeightKg: number | null;
    goalWeightKg: number | null;
    /** Negative loses weight, positive gains. */
    paceKgPerWeek: number;
    programStartedOn: string | null;
};

export const DEFAULT_PROFILE: StoredProfile = {
    dailyKcal: DEFAULT_GOALS.kcal,
    dailyCarbsG: DEFAULT_GOALS.carbsG,
    dailyProteinG: DEFAULT_GOALS.proteinG,
    dailyFatG: DEFAULT_GOALS.fatG,
    dailyWaterMl: DEFAULT_HYDRATION_GOALS.waterMl,
    dailyCaffeineMg: DEFAULT_HYDRATION_GOALS.caffeineMg,
    startWeightKg: null,
    goalWeightKg: null,
    paceKgPerWeek: -0.5,
    programStartedOn: null,
};

/** Storage is unavailable during SSR and in browsers with it switched off. */
function storage(): Storage | null {
    try {
        return typeof window === "undefined" ? null : window.localStorage;
    } catch {
        // Accessing localStorage throws outright when cookies are blocked.
        return null;
    }
}

/**
 * Reads a stored value, falling back whenever it is absent or unreadable.
 * A corrupt record is dropped rather than surfaced: the tracker showing an
 * empty day beats it refusing to render.
 */
export function read<T>(key: string, fallback: T): T {
    const store = storage();
    if (!store) return fallback;

    const raw = store.getItem(key);
    if (raw === null) return fallback;

    try {
        return JSON.parse(raw) as T;
    } catch {
        store.removeItem(key);
        return fallback;
    }
}

/** Returns false when the write was refused, e.g. the quota is full. */
export function write(key: string, value: unknown): boolean {
    const store = storage();
    if (!store) return false;

    try {
        store.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Could not save tracking data:", error);
        return false;
    }
}

export function readProfile(): StoredProfile {
    // Spread over the defaults so profiles written before a field existed keep
    // working instead of yielding undefined goals.
    return { ...DEFAULT_PROFILE, ...read<Partial<StoredProfile>>(STORAGE_KEYS.profile, {}) };
}

export function writeProfile(patch: Partial<StoredProfile>): boolean {
    return write(STORAGE_KEYS.profile, { ...readProfile(), ...patch });
}

export function createId(): string {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
