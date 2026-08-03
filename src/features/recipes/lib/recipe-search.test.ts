import { describe, expect, it } from "vitest";
import {
    buildSearchPrompt,
    filterFound,
    normalizeFoundRecipe,
    parseNutritionAmount,
    rankRecipes,
    scoreMatch,
    type FoundRecipe,
    type RecipeSearchCriteria,
} from "./recipe-search";

const VALID_RAW = {
    recipe_name: "Omelette aux champignons",
    description: "Une omelette moelleuse.",
    ingredients: ["3 œufs", "150 g de champignons"],
    instructions: ["Battre les œufs", "Cuire à feu moyen"],
    continent: "Europe",
    cuisine: "French",
    duration_to_cook: 15,
    servings: 2,
    difficulty: "Easy",
    meal_type: "Lunch",
    source_name: "Marmiton",
    source_url: "https://www.marmiton.org/recettes/omelette",
    nutrition_facts: { calories: "320 kcal", protein: "22g" },
};

describe("parseNutritionAmount", () => {
    it("reads the number out of a unit string", () => {
        expect(parseNutritionAmount("450 kcal")).toBe(450);
        expect(parseNutritionAmount("25g")).toBe(25);
        expect(parseNutritionAmount("~30 g")).toBe(30);
    });

    it("handles the French decimal comma", () => {
        expect(parseNutritionAmount("12,5g")).toBe(12.5);
    });

    it("averages a range", () => {
        expect(parseNutritionAmount("400-500 kcal")).toBe(450);
        expect(parseNutritionAmount("400 to 500 kcal")).toBe(450);
        expect(parseNutritionAmount("20 à 30 g")).toBe(25);
    });

    it("passes numbers through", () => {
        expect(parseNutritionAmount(450)).toBe(450);
    });

    it("returns null rather than 0 for unknown, so the two stay distinct", () => {
        expect(parseNutritionAmount(undefined)).toBeNull();
        expect(parseNutritionAmount("")).toBeNull();
        expect(parseNutritionAmount("n/a")).toBeNull();
        expect(parseNutritionAmount("0 kcal")).toBe(0);
    });
});

describe("scoreMatch", () => {
    it("scores a perfect calorie hit at 1", () => {
        expect(scoreMatch({ calories: "500 kcal" }, { targetCalories: 500 }).score).toBe(1);
    });

    it("scores calories on relative distance", () => {
        // 100 kcal off a 500 target is 20 % off.
        expect(scoreMatch({ calories: "600 kcal" }, { targetCalories: 500 }).score).toBe(0.8);
        expect(scoreMatch({ calories: "400 kcal" }, { targetCalories: 500 }).score).toBe(0.8);
    });

    it("treats protein as a floor", () => {
        expect(scoreMatch({ protein: "40g" }, { minProtein: 30 }).score).toBe(1);
        expect(scoreMatch({ protein: "15g" }, { minProtein: 30 }).score).toBe(0.5);
    });

    it("combines the criteria that were asked for", () => {
        const match = scoreMatch(
            { calories: "500 kcal", protein: "40g" },
            { targetCalories: 500, minProtein: 30 }
        );
        expect(match).toEqual({ calories: 500, protein: 40, score: 1 });
    });

    it("scores 1 when nothing was asked for", () => {
        expect(scoreMatch({ calories: "900 kcal" }, {}).score).toBe(1);
    });

    it("ranks a known fit above an unknown one", () => {
        const known = scoreMatch({ calories: "500 kcal" }, { targetCalories: 500 }).score;
        const unknown = scoreMatch({}, { targetCalories: 500 }).score;
        expect(unknown).toBe(0.5);
        expect(known).toBeGreaterThan(unknown);
    });

    it("never goes negative on a wild miss", () => {
        expect(scoreMatch({ calories: "3000 kcal" }, { targetCalories: 400 }).score).toBe(0);
    });
});

describe("normalizeFoundRecipe", () => {
    const criteria: RecipeSearchCriteria = { language: "fr", targetCalories: 300 };

    it("keeps a complete recipe and marks it web-sourced", () => {
        const recipe = normalizeFoundRecipe(VALID_RAW, criteria);

        expect(recipe).not.toBeNull();
        expect(recipe?.recipe_name).toBe("Omelette aux champignons");
        expect(recipe?.origin).toBe("web");
        expect(recipe?.source_url).toBe("https://www.marmiton.org/recettes/omelette");
        expect(recipe?.source_name).toBe("Marmiton");
        expect(recipe?.language).toBe("fr");
        expect(recipe?.difficulty).toBe("easy");
        expect(recipe?.meal_type).toBe("lunch");
        expect(recipe?.match.calories).toBe(320);
    });

    it("rejects a recipe missing its essentials", () => {
        expect(normalizeFoundRecipe({ ...VALID_RAW, recipe_name: "" }, criteria)).toBeNull();
        expect(normalizeFoundRecipe({ ...VALID_RAW, ingredients: [] }, criteria)).toBeNull();
        expect(normalizeFoundRecipe({ ...VALID_RAW, instructions: undefined }, criteria)).toBeNull();
    });

    it("labels a recipe with no reachable source as generated, not found", () => {
        const noSource = normalizeFoundRecipe({ ...VALID_RAW, source_url: null }, criteria);
        expect(noSource?.origin).toBe("ai");
        expect(noSource?.source_url).toBeNull();
    });

    it("refuses a non-http source URL", () => {
        const injected = normalizeFoundRecipe(
            { ...VALID_RAW, source_url: "javascript:alert(1)" },
            criteria
        );
        expect(injected?.source_url).toBeNull();
        expect(injected?.origin).toBe("ai");
    });

    it("falls back to the domain when the site name is missing", () => {
        const recipe = normalizeFoundRecipe({ ...VALID_RAW, source_name: null }, criteria);
        expect(recipe?.source_name).toBe("marmiton.org");
    });

    it("recovers units from bare nutrition numbers", () => {
        const recipe = normalizeFoundRecipe(
            { ...VALID_RAW, nutrition_facts: { calories: 320, protein: 22 } },
            criteria
        );
        expect(recipe?.nutrition_facts).toEqual({ calories: "320 kcal", protein: "22g" });
    });

    it("coerces a duration the model wrote as prose", () => {
        const recipe = normalizeFoundRecipe({ ...VALID_RAW, duration_to_cook: "25 minutes" }, criteria);
        expect(recipe?.duration_to_cook).toBe(25);
    });
});

describe("filterFound", () => {
    const make = (overrides: Partial<FoundRecipe>): FoundRecipe =>
        ({ ...normalizeFoundRecipe(VALID_RAW, {})!, ...overrides });

    it("drops a recipe that takes longer than asked", () => {
        const recipes = [make({ duration_to_cook: 90 }), make({ duration_to_cook: 20, source_url: "https://a.test/x" })];
        expect(filterFound(recipes, { maxDuration: 30 })).toHaveLength(1);
    });

    it("keeps a recipe whose duration is unknown", () => {
        expect(filterFound([make({ duration_to_cook: 0 })], { maxDuration: 30 })).toHaveLength(1);
    });

    it("drops the same page returned twice", () => {
        expect(filterFound([make({}), make({})], {})).toHaveLength(1);
    });
});

describe("rankRecipes", () => {
    it("puts the closest match first", () => {
        const base = normalizeFoundRecipe(VALID_RAW, {})!;
        const ranked = rankRecipes([
            { ...base, recipe_name: "far", match: { calories: 900, protein: null, score: 0.2 } },
            { ...base, recipe_name: "close", match: { calories: 500, protein: null, score: 0.95 } },
        ]);
        expect(ranked.map((r) => r.recipe_name)).toEqual(["close", "far"]);
    });
});

describe("buildSearchPrompt", () => {
    it("states every constraint that was set", () => {
        const prompt = buildSearchPrompt({
            ingredients: ["tomate", "œuf"],
            targetCalories: 450,
            minProtein: 30,
            maxDuration: 25,
            language: "fr",
        });

        expect(prompt).toContain("tomate, œuf");
        expect(prompt).toContain("450 kcal");
        expect(prompt).toContain("30 g of protein");
        expect(prompt).toContain("25 minutes or less");
        expect(prompt).toContain("French");
        // The point of the feature: report, do not invent.
        expect(prompt).toContain("Never invent one");
    });

    it("still asks for something useful with no criteria at all", () => {
        expect(buildSearchPrompt({})).toContain("No constraint");
    });
});
