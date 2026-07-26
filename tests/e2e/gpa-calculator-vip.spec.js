const { test, expect } = require("@playwright/test");

test.describe("GPA and CGPA worksheet VIP", () => {
  test("calculates direct transcript points and keeps academic data local by default", async ({ page }) => {
    const errors = [];
    const writes = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (request.method() !== "GET") {
        writes.push({ url: request.url(), body: request.postData() || "" });
      }
    });

    await page.goto("/tools/gpa-calculator/", { waitUntil: "domcontentloaded" });
    expect(
      await page.locator("#tabBtn-semester").evaluate(
        (element) => element.getBoundingClientRect().left >= 0
      )
    ).toBe(true);
    await expect(page.locator("h1")).toContainText("GPA & CGPA");
    await expect(page.locator("#gradingSystem")).toHaveValue("direct-points");

    const rows = page.locator(".gpa-course-card");
    const entries = [
      ["Mathematics", "3", "5"],
      ["Physics", "3", "4"],
      ["Writing", "2", "3"]
    ];
    for (let index = 0; index < entries.length; index += 1) {
      await rows.nth(index).locator('[data-course-field="name"]').fill(entries[index][0]);
      await rows.nth(index).locator('[data-course-field="credits"]').fill(entries[index][1]);
      await rows.nth(index).locator('[data-course-field="value"]').fill(entries[index][2]);
    }

    await expect(page.locator("#resultCgpa")).toHaveText("4.13");
    await expect(page.locator("#resultCredits")).toHaveText("8.0");
    await expect(page.locator("#resultPoints")).toHaveText("33.00");
    await expect(page.locator("#classBadge")).toContainText("verify the grade table");
    await page.locator("#gradingVerified").check();
    await expect(page.locator("#classBadge")).toHaveText("Institution table checked by you");

    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    expect(storageKeys).not.toContain("afroGpaCalculator");
    expect(storageKeys.some((key) => key.startsWith("afro_edu_"))).toBe(false);
    expect(storageKeys).not.toContain("afroedu-profile-cache");
    expect(
      writes.filter((request) =>
        request.url.startsWith("http://127.0.0.1:4173/")
      )
    ).toEqual([]);
    expect(writes.map((request) => request.body).join(" ")).not.toMatch(
      /Mathematics|Physics|Writing|4\.13/
    );

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download TXT" }).click();
    expect((await download).suggestedFilename()).toBe("gpa-action-pack.txt");
    expect(errors).toEqual([]);
  });

  test("imports rows, normalizes only relative position, and uses route-only sharing", async ({ page }) => {
    await page.addInitScript(() => {
      window.__openedShare = "";
      window.open = (url) => {
        window.__openedShare = String(url);
        return null;
      };
    });
    await page.goto("/tools/gpa-calculator/", { waitUntil: "domcontentloaded" });

    await page.getByRole("tab", { name: "Transcript Upload" }).click();
    await page.locator("#transcriptText").fill(
      "Course,Credits,Grade points\nEconomics,3,4.5\nStatistics,2,3.5"
    );
    await page.getByRole("button", { name: "Parse Transcript" }).click();
    await expect(page.locator("#transcriptPreview")).toContainText("2 of 2 rows are valid");
    await page.getByRole("button", { name: "Add valid rows as a semester" }).click();
    await expect(page.locator("#resultCgpa")).toHaveText("4.10");

    await page.getByRole("tab", { name: "Scale Normalizer" }).click();
    await page.locator("#convertFromValue").fill("4");
    await expect(page.locator("#conversionOutput")).toContainText("3.20 / 4");
    await expect(page.locator("#conversionOutput")).toContainText(
      "not an official GPA, credential, admission, or scholarship equivalence"
    );

    await page.getByRole("button", { name: "Share tool" }).click();
    const opened = await page.evaluate(() => window.__openedShare);
    expect(opened).toContain("gpa-calculator");
    expect(opened).not.toMatch(/4\.10|Economics|Statistics/);
  });

  test("target and replacement planning work on mobile dark mode without overflow", async ({ page }) => {
    const errors = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
    await page.addInitScript(() => {
      localStorage.setItem("aft_theme", "dark");
      window.__printCalled = false;
      window.print = () => {
        window.__printCalled = true;
      };
    });
    await page.goto("/tools/gpa-calculator/", { waitUntil: "domcontentloaded" });
    expect(
      await page.locator("#tabBtn-semester").evaluate(
        (element) => element.getBoundingClientRect().left >= 0
      )
    ).toBe(true);

    const first = page.locator(".gpa-course-card").first();
    await first.locator('[data-course-field="name"]').fill("Calculus");
    await first.locator('[data-course-field="credits"]').fill("3");
    await first.locator('[data-course-field="value"]').fill("2");
    await page.getByRole("tab", { name: "What-If Calculator" }).click();
    await page.locator("#wfTargetCgpa").fill("3");
    await page.locator("#wfUpcomingCredits").fill("3");
    await page.getByRole("button", { name: "Calculate Required GPA" }).click();
    await expect(page.locator("#whatifResult")).toContainText("4.00 / 5.00");

    await page.getByRole("button", { name: "Grade Replacement" }).click();
    await page.locator("#wfReplaceCourse").selectOption("0:0");
    await page.locator("#wfReplaceGrade").fill("5");
    await page.getByRole("button", { name: "Calculate New CGPA" }).click();
    await expect(page.locator("#whatifResult")).toContainText("5.00 / 5.00");

    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1
      )
    ).toBe(true);
    await page.getByRole("button", { name: "Print / PDF" }).click();
    expect(await page.evaluate(() => window.__printCalled)).toBe(true);
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
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth + 1
      )
    ).toBe(true);
    expect(errors).toEqual([]);
  });
});
