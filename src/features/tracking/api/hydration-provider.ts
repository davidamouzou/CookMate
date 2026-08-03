import { STORAGE_KEYS, createId, read, readProfile, write } from "@/features/tracking/api/local-store";
import { type DrinkEntry, type HydrationGoals } from "@/features/tracking/types/hydration";

/** On-disk shape: `createdAt` cannot survive JSON as a Date. */
type StoredDrink = Omit<DrinkEntry, "createdAt"> & { createdAt: string };

function toDrink(stored: StoredDrink): DrinkEntry {
    return { ...stored, createdAt: new Date(stored.createdAt) };
}

function readDrinks(): StoredDrink[] {
    return read<StoredDrink[]>(STORAGE_KEYS.drinks, []);
}

export class HydrationProvider {
    static getGoals(): HydrationGoals {
        const profile = readProfile();
        return { waterMl: profile.dailyWaterMl, caffeineMg: profile.dailyCaffeineMg };
    }

    /** Drinks for one calendar day, oldest first. */
    static getDrinks(dayKey: string): DrinkEntry[] {
        return readDrinks()
            .filter((drink) => drink.loggedOn === dayKey)
            .map(toDrink)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    }

    /** Daily hydration totals over a window, for the bar chart. */
    static getDailyHydration(fromDay: string, toDay: string): Map<string, number> {
        const byDay = new Map<string, number>();

        for (const drink of readDrinks()) {
            // Day keys are `YYYY-MM-DD`, so lexicographic order is date order.
            if (drink.loggedOn < fromDay || drink.loggedOn > toDay) continue;

            const effective = Math.round((drink.volumeMl * drink.hydrationPct) / 100);
            byDay.set(drink.loggedOn, (byDay.get(drink.loggedOn) ?? 0) + effective);
        }

        return byDay;
    }

    static addDrink(
        dayKey: string,
        drink: Omit<DrinkEntry, "id" | "loggedOn" | "createdAt">
    ): DrinkEntry | null {
        const stored: StoredDrink = {
            id: createId(),
            loggedOn: dayKey,
            createdAt: new Date().toISOString(),
            title: drink.title,
            volumeMl: drink.volumeMl,
            hydrationPct: drink.hydrationPct,
            caffeineMg: drink.caffeineMg,
        };

        if (!write(STORAGE_KEYS.drinks, [...readDrinks(), stored])) return null;
        return toDrink(stored);
    }

    static deleteDrink(drinkId: string): boolean {
        return write(
            STORAGE_KEYS.drinks,
            readDrinks().filter((drink) => drink.id !== drinkId)
        );
    }
}
