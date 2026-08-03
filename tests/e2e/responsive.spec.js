import { expect, test, devices } from "@playwright/test";

/**
 * The seven invariants of the responsive system, checked on every tier.
 *
 * These are the rules the design system says must never break. They exist as a
 * test because the drift they replace — 134 breakpoint prefixes decided one
 * component at a time — is exactly what a written rule alone does not prevent.
 *
 * NOTE: this file is JavaScript on purpose. Playwright runs under Bun here
 * (there is no `node` on the path) and its transform cannot strip type
 * annotations — a single `: string` stops the whole suite from building, which
 * is why the other specs happen to contain no type syntax either. Written as
 * `.js`, the constraint is explicit and `tsc` does not ask for the annotations
 * that would break it.
 */

/** One width per named tier, plus the smallest phone still in use. */
const TIERS = [
    { name: "compact", width: 320 },
    { name: "poche", width: 390 },
    { name: "tablette", width: 768 },
    { name: "portable", width: 1024 },
    { name: "bureau", width: 1440 },
];

const PAGES = [
    { name: "jour", path: "/fr" },
    { name: "eau", path: "/fr/water" },
    { name: "programme", path: "/fr/program" },
];

/** Tracking data, so the screens are measured with content in them. */
function seedData() {
    const today = new Date();
    const key = (offset) => {
        const date = new Date(today);
        date.setDate(date.getDate() - offset);
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${date.getFullYear()}-${month}-${day}`;
    };

    const drinks = [];
    const entries = [];
    const weights = [];

    for (let index = 0; index < 12; index++) {
        drinks.push({
            id: `d${index}`,
            loggedOn: key(index % 7),
            createdAt: new Date().toISOString(),
            title: index % 2 ? "Café" : "Eau",
            volumeMl: index % 2 ? 200 : 330,
            hydrationPct: index % 2 ? 90 : 100,
            caffeineMg: index % 2 ? 80 : 0,
        });
        entries.push({
            id: `e${index}`,
            loggedOn: key(index % 7),
            createdAt: new Date(Date.now() + index * 1000).toISOString(),
            // Deliberately long, with four-digit values: the widest content the
            // tiles and rows will ever be asked to hold.
            title: "Deux petits pains au sésame et un grand café latte",
            kcal: 1300 + index * 40,
            carbsG: 130 + index,
            proteinG: 118 + index,
            fatG: 66 + index,
            source: "ai_text",
            recipeId: null,
        });
        weights.push({ id: `w${index}`, loggedOn: key(index), weightKg: 82.4 - index * 0.1 });
    }

    localStorage.setItem("cookmate.v1.drinks", JSON.stringify(drinks));
    localStorage.setItem("cookmate.v1.entries", JSON.stringify(entries));
    localStorage.setItem("cookmate.v1.weights", JSON.stringify(weights));
    localStorage.setItem(
        "cookmate.v1.profile",
        JSON.stringify({
            dailyKcal: 2725,
            dailyWaterMl: 2500,
            startWeightKg: 84.2,
            goalWeightKg: 78,
            paceKgPerWeek: -0.5,
            programStartedOn: key(30),
        })
    );
}

async function seed(page) {
    await page.goto("/fr");
    await page.evaluate(seedData);
}

/** Collects invariants 1, 2, 5 and 7 in a single pass over the document. */
function auditLayout() {
    const root = document.documentElement;
    const viewport = root.clientWidth;
    const clipped = [];
    const pastEdge = [];
    const longProse = [];
    const scrollersWithoutEdge = [];

    const describe = (el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`;
    const scrollable = (el) => /(auto|scroll)/.test(getComputedStyle(el).overflowX);

    for (const el of Array.from(document.querySelectorAll("*"))) {
        if (el instanceof SVGElement) continue;

        const rect = el.getBoundingClientRect();
        if (rect.width === 0) continue;

        const style = getComputedStyle(el);
        const inScroller = el.parentElement ? scrollable(el.parentElement) : false;

        // 2. No figure clipped or cut off.
        if (
            !scrollable(el) &&
            !inScroller &&
            style.position !== "absolute" &&
            el.children.length === 0 &&
            el.scrollWidth > Math.ceil(rect.width) + 1
        ) {
            clipped.push(`${describe(el)} "${(el.textContent || "").trim().slice(0, 30)}"`);
        }

        // 1. Nothing reaches past the viewport — scroller contents excepted,
        //    since reaching past is what they are for.
        if (!inScroller && style.position !== "fixed" && rect.right > viewport + 1) {
            pastEdge.push(describe(el));
        }

        // 5. Prose stays under 68 characters.
        if (el.tagName === "P" && (el.textContent || "").trim().length > 90) {
            const fontSize = Number.parseFloat(style.fontSize);
            // ~0.5em per character is the usual measure estimate.
            const chars = rect.width / (fontSize * 0.5);
            if (chars > 68) longProse.push(`${describe(el)} ~${Math.round(chars)}ch`);
        }

        // 7. Any row that actually scrolls shows its edge.
        if (scrollable(el) && el.scrollWidth > el.clientWidth + 1) {
            const mask = style.maskImage || style.webkitMaskImage;
            if (!mask || mask === "none") scrollersWithoutEdge.push(describe(el));
        }
    }

    return {
        pageScroll: root.scrollWidth > viewport ? `${root.scrollWidth} > ${viewport}` : null,
        clipped: Array.from(new Set(clipped)).slice(0, 5),
        pastEdge: Array.from(new Set(pastEdge)).slice(0, 5),
        longProse: Array.from(new Set(longProse)).slice(0, 5),
        scrollersWithoutEdge: Array.from(new Set(scrollersWithoutEdge)).slice(0, 5),
    };
}

/** 6. Anything pinned to the bottom of the screen clears the safe area. */
function auditSafeArea() {
    const offenders = [];

    for (const el of Array.from(document.querySelectorAll("*"))) {
        const style = getComputedStyle(el);
        if (style.position !== "fixed" && style.position !== "sticky") continue;
        if (style.bottom === "auto" || style.bottom === "") continue;
        if (el.getBoundingClientRect().height === 0) continue;

        // Either the element is held off the edge, or it pads itself with the
        // inset — the tab bar does the second.
        const padding = Number.parseFloat(style.paddingBottom) || 0;
        const offset = Number.parseFloat(style.bottom) || 0;
        if (offset === 0 && padding === 0) offenders.push(`${el.tagName.toLowerCase()}.${String(el.className).slice(0, 40)}`);
    }

    return offenders;
}

/** 4. Every control is at least 44 × 44 for a finger. */
function auditTouchTargets() {
    const offenders = [];
    const selector = "button, a[href], [role=button], [role=tab], select, summary";

    for (const el of Array.from(document.querySelectorAll(selector))) {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) continue;

        // The hit area may be grown past the painted box with a pseudo-element,
        // which is what `.tap` and `.row-action` do.
        const after = getComputedStyle(el, "::after");
        const grow = (value) => Math.abs(Number.parseFloat(value) || 0);
        const hasBox = after.content !== "none" && after.position === "absolute";
        const width = rect.width + (hasBox ? grow(after.left) + grow(after.right) : 0);
        const height = rect.height + (hasBox ? grow(after.top) + grow(after.bottom) : 0);

        if (width < 44 || height < 44) {
            const label = el.getAttribute("aria-label") || el.textContent || "";
            offenders.push(`${Math.round(width)}x${Math.round(height)} ${label.trim().slice(0, 24)}`);
        }
    }

    return offenders;
}

test.describe("invariants de mise en page", () => {
    for (const tier of TIERS) {
        for (const target of PAGES) {
            test(`${target.name} @ ${tier.name} (${tier.width}px)`, async ({ page }) => {
                await seed(page);
                await page.setViewportSize({ width: tier.width, height: 900 });
                await page.goto(target.path);
                await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

                const report = await page.evaluate(auditLayout);

                expect(report.pageScroll, "1. aucun défilement horizontal de page").toBeNull();
                expect(report.clipped, "2. aucun chiffre tronqué ni coupé").toEqual([]);
                expect(report.pastEdge, "aucun élément au-delà du bord").toEqual([]);
                expect(report.longProse, "5. prose sous 68 caractères").toEqual([]);
                expect(report.scrollersWithoutEdge, "7. toute zone défilante montre son bord").toEqual([]);

                const unsafe = await page.evaluate(auditSafeArea);
                expect(unsafe, "6. zone sûre respectée par tout élément fixe").toEqual([]);
            });
        }
    }
});

test.describe("invariants au doigt", () => {
    // Only the fixtures that make the browser report a coarse pointer and no
    // hover — spreading a whole device descriptor would also switch the browser
    // engine, which a describe group is not allowed to do.
    const phone = devices["iPhone 13"];
    test.use({
        viewport: phone.viewport,
        deviceScaleFactor: phone.deviceScaleFactor,
        hasTouch: true,
        isMobile: true,
    });

    test("3. aucune action portée par le seul survol", async ({ page }) => {
        await seed(page);
        await page.goto("/fr");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

        const remove = page.getByRole("button", { name: /Supprimer/ }).first();
        await expect(remove).toBeVisible();

        // The regression this guards: opacity 0, revealed by hover alone, on a
        // device that has no hover — the log was write-only on phones.
        expect(await remove.evaluate((el) => getComputedStyle(el).opacity)).toBe("1");

        const before = await page.getByRole("button", { name: /Supprimer/ }).count();
        await remove.tap();
        await expect(page.getByRole("button", { name: /Supprimer/ })).toHaveCount(before - 1);
    });

    test("4. cible tactile de 44 x 44 minimum", async ({ page }) => {
        await seed(page);

        for (const target of PAGES) {
            await page.goto(target.path);
            await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

            const small = await page.evaluate(auditTouchTargets);
            expect(small, `${target.name} : contrôles sous 44 x 44`).toEqual([]);
        }
    });
});
