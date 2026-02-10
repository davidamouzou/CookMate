import { test, expect } from "@playwright/test";

const recipePayload = {
  id: 30,
  recipe_name: "Miso Soup",
  ingredients: ["Dashi (Japanese soup stock)", "Miso paste", "Tofu (cubed)", "Wakame seaweed", "Green onions (chopped)"],
  instructions: [
    "Bring dashi to a simmer in a pot.",
    "Whisk in miso paste until dissolved.",
    "Add tofu and wakame seaweed.",
    "Simmer for a few minutes until the wakame is tender.",
    "Garnish with green onions.",
    "Serve hot."
  ],
  continent: "Europe",
  language: "en",
  duration_to_cook: 15,
  servings: 2,
  difficulty: "easy",
  cuisine: "Italian",
  description: "A simple pasta recipe.",
  meal_type: "dinner",
  nutrition_facts: {
    calories: "300",
    protein: "12g",
    carbohydrates: "45g",
    fat: "8g",
    vitamins: "",
    minerals: "",
    dietary_fiber: "",
    sugar: "",
    salt: "",
    antioxidants: "",
  },
  image: "https://images.pexels.com/photos/18805658/pexels-photo-18805658.jpeg",
};

test("recipe detail page shows recipe info", async ({ page }) => {
  await page.route("**/recipes/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(recipePayload),
    });
  });

  await page.goto("/en/recipes/30");
  await page.waitForLoadState("networkidle");

  await expect(page.getByText("Miso Soup")).toBeVisible();
  await expect(page.getByText("Ingredients")).toBeVisible();
  await expect(page.getByText("Instructions")).toBeVisible();
  await expect(page.getByText("Dashi (Japanese soup stock)")).toBeVisible();
});
