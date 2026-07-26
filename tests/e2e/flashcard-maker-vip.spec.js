const { test, expect } = require("@playwright/test");

test.describe("Flashcard Maker VIP", () => {
  test("creates, studies and exports without persisting or sending deck content by default", async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.method() !== "GET") writes.push({
        url: request.url(),
        body: request.postData() || ""
      });
    });
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/tools/flashcard-maker/?deck=jamb-english", {
      waitUntil: "domcontentloaded"
    });

    await expect(page.locator("#deckCount")).toHaveText("0 decks");
    expect(await page.evaluate(() => localStorage.getItem("afro_flashcards"))).toBeNull();

    await page.locator("#newDeckName").fill("Private chemistry notes");
    await page.getByRole("button", { name: "+ Create" }).click();
    await page.locator("#cardFront").fill("Water formula");
    await page.locator("#cardBack").fill("H2O");
    await page.getByRole("button", { name: "Add Card", exact: true }).click();
    await expect(page.locator("#deckCount")).toHaveText("1 deck");
    expect(await page.evaluate(() => localStorage.getItem("afro_flashcards"))).toBeNull();

    await page.getByRole("tab", { name: "Study" }).click();
    await expect(page.locator("#flashcard")).toBeVisible();
    await page.locator("#flashcard").click();
    await expect(page.locator("#flashcard")).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Got It/ }).click();
    await page.getByRole("button", { name: /Review Again/ }).click();
    await page.getByRole("tab", { name: "Progress" }).click();
    await expect(page.locator("#statMastered")).toHaveText("0");

    await page.getByRole("tab", { name: "Decks" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export CSV" }).click();
    expect((await download).suggestedFilename()).toBe("Private chemistry notes.csv");
    expect(writes.map((request) => request.body).join(" ")).not.toContain("Private chemistry notes");
    expect(errors).toEqual([]);
  });

  test("remembering is explicit and clearing removes only the saved browser copy", async ({ page }) => {
    await page.addInitScript(() => localStorage.clear());
    await page.goto("/tools/flashcard-maker/", { waitUntil: "domcontentloaded" });
    await page.locator("#newDeckName").fill("Saved deck");
    await page.getByRole("button", { name: "+ Create" }).click();
    await page.locator("#rememberDecks").check();
    expect(await page.evaluate(() => localStorage.getItem("afro_flashcards"))).toContain("Saved deck");
    await page.getByRole("button", { name: "Clear saved copy" }).click();
    expect(await page.evaluate(() => localStorage.getItem("afro_flashcards"))).toBeNull();
    await expect(page.locator("#deckCount")).toHaveText("1 deck");
  });

  test("bulk import, quiz matching, print and mobile dark layout remain usable at 200 percent", async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("aft_theme", "dark");
      window.__printCalled = false;
      window.print = () => {
        window.__printCalled = true;
      };
    });
    await page.goto("/tools/flashcard-maker/", { waitUntil: "domcontentloaded" });
    await page.locator("#newDeckName").fill("Imported");
    await page.getByRole("button", { name: "+ Create" }).click();
    await page.getByRole("button", { name: "Bulk Import" }).click();
    await page.locator("#bulkInput").fill('"Term, one","Answer, one"\nDéjà vu\tMemory feeling');
    await page.getByRole("button", { name: "Import Cards" }).click();
    await expect(page.locator("#cardsList .fc-card-item")).toHaveCount(2);

    await page.getByRole("tab", { name: "Study" }).click();
    await page.getByRole("button", { name: /Quiz/ }).click();
    const prompt = await page.locator(".fc-quiz-prompt-text").textContent();
    await page.locator("#quizAnswer").fill(prompt === "Déjà vu" ? "memory-feeling!" : "Answer, one");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.locator(".fc-quiz-correct")).toBeVisible();

    await page.getByRole("tab", { name: "Decks" }).click();
    await page.getByRole("button", { name: "Print / PDF" }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(10_000);

    const unnamedControls = await page.evaluate(() =>
      Array.from(document.querySelectorAll("button,input,select,textarea,a[href]"))
        .filter((element) => element.offsetParent !== null)
        .filter((element) => {
          const label =
            element.id &&
            document.querySelector(`label[for="${CSS.escape(element.id)}"]`);
          return !(
            element.getAttribute("aria-label") ||
            element.getAttribute("aria-labelledby") ||
            (label && label.textContent.trim()) ||
            element.textContent.trim() ||
            element.getAttribute("title") ||
            element.querySelector("img[alt]")
          );
        })
        .map((element) => element.outerHTML)
    );
    expect(unnamedControls).toEqual([]);
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    )).toBe(true);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(await page.evaluate(() =>
      document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
    )).toBe(true);
    expect(errors).toEqual([]);
  });

  test("has no app-level overflow at 320, 360, or 375 pixels at 200 percent", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("aft_theme", "dark");
    });
    for (const viewport of [
      { width: 320, height: 760, zoom: false },
      { width: 360, height: 800, zoom: false },
      { width: 375, height: 850, zoom: true }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/tools/flashcard-maker/", { waitUntil: "domcontentloaded" });
      if (viewport.zoom) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
      }
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      )).toBe(true);
    }
    expect(await page.locator(".fc-card").first().evaluate((element) =>
      getComputedStyle(element).backgroundColor
    )).not.toBe("rgb(255, 255, 255)");
  });
});
