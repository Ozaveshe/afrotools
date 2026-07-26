const { test, expect } = require("@playwright/test");

async function chooseType(page, name) {
  await page.getByRole("radio", { name }).click();
}

async function solve(page, first, second = "") {
  await page.locator("#eqInput").fill(first);
  if (second) await page.locator("#eq2Input").fill(second);
  await page.locator(".solve-btn").click();
  const showAll = page.getByRole("button", { name: "Show All" });
  if (await showAll.isVisible()) await showAll.click();
}

test.describe("Algebra Solver VIP", () => {
  test("solves and derives every advertised equation family", async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/tools/algebra-solver/", { waitUntil: "domcontentloaded" });

    await solve(page, "x/2 + 3 = 7");
    await expect(page.locator(".answer-val")).toHaveText("x = 8");
    await expect(page.locator("#stepsContainer")).toContainText("Left = 7, Right = 7");

    await chooseType(page, "Quadratic");
    await solve(page, "x^2 - 5x + 6 = 0");
    await expect(page.locator(".answer-val")).toContainText("x₁ = 3, x₂ = 2");
    await expect(page.locator("#stepsContainer")).toContainText("Verify x₁");
    await expect(page.locator("#stepsContainer")).toContainText("Verify x₂");

    await solve(page, "x² + 4x + 4 = 0");
    await expect(page.locator(".answer-val")).toHaveText("x = -2 (repeated)");

    await solve(page, "-x^2 - 2x - 5 = 0");
    await expect(page.locator(".answer-val")).toHaveText("-1 ± 2i");
    await expect(page.locator("#stepsContainer")).toContainText("Check the conjugate pair");

    await chooseType(page, "2×2 System");
    await solve(page, "2x + 3y = 13", "x + 2y = 7");
    await expect(page.locator(".answer-val")).toHaveText("x = 5, y = 1");
    await expect(page.locator("#stepsContainer")).toContainText("Verify in Equation 2");

    await solve(page, "x + y = 2", "2x + 2y = 4");
    await expect(page.locator(".answer-val")).toHaveText("Infinitely many solutions");
    await expect(page.locator("#solMethod")).toHaveText("Equivalent Equations");
    await expect(page.locator("#graphCard")).toBeHidden();

    await solve(page, "x + y = 2", "2x + 2y = 5");
    await expect(page.locator(".answer-val")).toHaveText("No solution");
    await expect(page.locator("#solMethod")).toHaveText("Parallel Lines");

    await chooseType(page, "Inequality");
    await solve(page, "-2x + 4 > 0");
    await expect(page.locator(".answer-val")).toHaveText("x < 2");
    await expect(page.locator("#stepsContainer")).toContainText("FLIP the inequality sign");

    await solve(page, "x - x <= 1");
    await expect(page.locator(".answer-val")).toHaveText("All real numbers");
    expect(errors).toEqual([]);
  });

  test("rejects unsupported syntax and keeps equation content local", async ({ page }) => {
    const writes = [];
    page.on("request", (request) => {
      if (request.method() !== "GET") writes.push({
        url: request.url(),
        body: request.postData() || ""
      });
    });
    await page.goto("/tools/algebra-solver/", { waitUntil: "domcontentloaded" });

    for (const invalid of ["2(x + 1) = 4", "x/0 = 2", "hello = 5", "x^3 = 8"]) {
      await solve(page, invalid);
      await expect(page.locator(".answer-label")).toHaveText("Input not accepted");
      await expect(page.locator("#solutionActions")).toBeHidden();
    }

    await solve(page, "2x + 5 = 13");
    const storage = await page.evaluate(() => JSON.stringify(localStorage));
    expect(storage).not.toContain("2x + 5");
    expect(writes.map((request) => request.body).join(" ")).not.toContain("2x + 5");
  });

  test("copies, downloads, and renders a printable PDF worksheet", async ({ page }) => {
    await page.addInitScript(() => {
      window.__copiedSolution = "";
      window.__printCalled = false;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (value) => {
            window.__copiedSolution = String(value);
          }
        }
      });
      window.print = () => {
        window.__printCalled = true;
      };
    });
    await page.goto("/tools/algebra-solver/", { waitUntil: "domcontentloaded" });
    await solve(page, "2x + 5 = 13");

    await page.getByRole("button", { name: "Copy steps" }).click();
    expect(await page.evaluate(() => window.__copiedSolution)).toContain("Answer: x = 4");
    expect(await page.evaluate(() => window.__copiedSolution)).toContain("Left = 13, Right = 13");

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download TXT" }).click();
    expect((await download).suggestedFilename()).toBe("algebra-solution.txt");

    await page.getByRole("button", { name: "Print / PDF" }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(10_000);
  });

  test("practice handoff, controls, dark mode and target mobile sizes remain usable", async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("aft_theme", "dark"));

    for (const viewport of [
      { width: 320, height: 760, zoom: false },
      { width: 360, height: 800, zoom: false },
      { width: 375, height: 850, zoom: true }
    ]) {
      await page.setViewportSize(viewport);
      await page.goto("/tools/algebra-solver/", { waitUntil: "domcontentloaded" });
      if (viewport.zoom) {
        await page.evaluate(() => {
          document.documentElement.style.fontSize = "200%";
        });
      }
      expect(await page.evaluate(() =>
        document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1
      )).toBe(true);
    }

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
      Math.random = () => 0.5;
    });
    await page.getByRole("tab", { name: "Practice" }).click();
    await page.getByRole("button", { name: "New Problem" }).click();
    await expect(page.locator("#practiceQ")).toContainText("Solve:");
    await page.locator("#practiceAnswer").fill("x = 0");
    await page.getByRole("button", { name: "Check", exact: true }).click();
    await expect(page.locator("#practiceFeedback")).toContainText("Correct");
    await expect(page.locator("#practiceCheck")).toBeDisabled();
    await expect(page.locator("#practiceScore")).toContainText("1 / 1");
    await page.getByRole("button", { name: "New Problem" }).click();
    await expect(page.locator("#practiceCheck")).toBeEnabled();
    await page.getByRole("button", { name: "Show Solution" }).click();
    await expect(page.getByRole("tab", { name: "Solve" })).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#solutionCard")).toBeVisible();

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
    expect(await page.locator(".input-card").evaluate((element) =>
      getComputedStyle(element).backgroundColor
    )).not.toBe("rgb(255, 255, 255)");
    expect(errors).toEqual([]);
  });
});
