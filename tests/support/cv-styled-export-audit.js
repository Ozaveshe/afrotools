const {chromium: chromium} = require("playwright");

const fs = require("fs"), path = require("path"), pdf = require("pdf-parse");
const {inspectRasterPdf} = require("./cv-raster-pdf-bounds");

const root = process.cwd(), out = path.resolve(process.env.CV_PDF_AUDIT_OUTPUT || "test-results/cv-all-template-pdf-proof");

fs.mkdirSync(out, {
    recursive: true
});

const fixture = require(path.join(root, "tests/fixtures/cv-complete-form.js"));

const longMode = process.env.CV_PDF_AUDIT_LONG === "1";
const families = ["pan-african-minimal","lagos-corporate","nairobi-tech","accra-graduate","creative-portfolio","ats-plain","cape-town-modern","kigali-developer","ngo-impact","scholarship-academic"];
if (longMode) {
    fixture.exps = Array.from({length:10}, (_,i)=>({t:"Responsable de projet "+(i+1),c:"Organisation synthétique",l:"Nairobi — Kigali",s:"2020-01",e:"2025-01",d:Array.from({length:6},(_,j)=>"Étape "+(j+1)+" : coordination d’équipe et contrôle qualité. Ujuzi wa mawasiliano na usimamizi wa miradi.").join("\n")}));
    fixture.customSections = [{title:"Conclusion personnalisée — Hitimisho",content:"FINALVISIBLEMARKER Élodie François Łukasz — Asha Mwang’ombe"}];
}

// Synthetic fixtures only. Raster PDF text is not claimed to be selectable.
const manifest = {
    longMode,
    sourceRevision: require("child_process").execFileSync("git", [ "rev-parse", "HEAD" ], {
        encoding: "utf8"
    }).trim(),
    viewport: {
        width: 320,
        height: 844
    },
    sourceHashes: Object.fromEntries([ "cv-template-expanded-renderers.js", "cv-pdf-templates.js", "cv-export-pdf-quality.js" ].map(f => [ f, require("crypto").createHash("sha256").update(fs.readFileSync(path.join(root, "tools/cv-builder/js", f))).digest("hex") ]))
};

fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));

(async () => {
    const browser = await chromium.launch({
        headless: true
    });
    const results = [];
    for (const [locale, route] of Object.entries({
        en: "/tools/cv-builder/",
        fr: "/fr/tools/generateur-cv/",
        sw: "/sw/zana/mjenzi-cv/"
    })) {
        const page = await browser.newPage({
            viewport: {
                width: 320,
                height: 844
            },
            acceptDownloads: true
        });
        await page.route("**/*", r => new URL(r.request().url()).origin === (process.env.CV_PDF_AUDIT_BASE_URL || "http://127.0.0.1:4173") ? r.continue() : r.fulfill({
            status: 204
        }));
        await page.goto((process.env.CV_PDF_AUDIT_BASE_URL || "http://127.0.0.1:4173") + route);
        await page.waitForFunction(() => window.CVApp && window.CVTemplateRegistry && window.CVExportUpgrade);
        const ids = longMode ? families : await page.evaluate(() => CVTemplateRegistry.all().map(r => r.id));
        for (const id of ids) {
            try {
                const dom = await page.evaluate(({fixture: fixture, id: id}) => {
                    Object.assign(CVApp.getState().data, fixture);
                    CVApp.getState().template = id;
                    CVApp.getState().country = "NG";
                    CVApp.renderAll();
                    const p = document.querySelector("#cvpreview");
                    return {
                        text: p.textContent,
                        html: p.innerHTML
                    };
                }, {
                    fixture: fixture,
                    id: id
                });
                const markers = [...new Set(JSON.stringify(fixture).match(/QZ[A-Za-z0-9]+X/g) || [])];
                const privateValues = ["nat","gen","mar","so","lga","idNumber","dlStatus","healthStatus","milStatus","religion"].map(key=>fixture[key]);
                const fieldErrors = markers.filter(marker=>dom.text.includes(marker) !== !(id === "diaspora-relocation" && privateValues.includes(marker)));
                if (fieldErrors.length || (longMode && !dom.text.includes("FINALVISIBLEMARKER"))) throw new Error("Pre-capture enabled-field contract failed");
                const pending = page.waitForEvent("download", {
                    timeout: 9e4
                });
                await page.evaluate(() => CVExportUpgrade.exportPdf());
                const file = path.join(out, locale + "-" + id + ".pdf");
                await (await pending).saveAs(file);
                const bytes = fs.readFileSync(file), parsed = await pdf(new Uint8Array(bytes));
                const placements = await inspectRasterPdf(bytes);
                if (placements.some(box=>!box.insidePaper)) throw new Error("Raster image extends beyond physical paper");
                const widths = [ ...bytes.toString("latin1").matchAll(/\/Width\s+(\d+)/g) ].map(m => +m[1]);
                const media = [ ...bytes.toString("latin1").matchAll(/\/MediaBox\s*\[([^\]]+)\]/g) ].map(m => m[1]);
                fs.writeFileSync(file + ".dom.json", JSON.stringify(dom, null, 2));
                results.push({
                    locale: locale,
                    id: id,
                    placements,
                    preCaptureFields: "pass",
                    pages: parsed.numpages,
                    widths: widths,
                    media: media,
                    bytes: bytes.length,
                    file: file
                });
                console.log(locale, id, parsed.numpages, Math.max(...widths));
            } catch (e) {
                results.push({
                    locale: locale,
                    id: id,
                    error: e.message
                });
                console.log("FAIL", locale, id, e.message);
            }
            fs.writeFileSync(path.join(out, "results.json"), JSON.stringify(results, null, 2));
        }
        await page.close();
    }
    await browser.close();
    if (results.length !== (longMode ? 30 : 90) || results.some(r => r.error || r.pages < 1 || !r.widths.length || Math.max(...r.widths) < 1190 || r.media.some(box=>{const p=box.trim().split(/\s+/).map(Number);return Math.abs(p[2]-595.28)>1 || Math.abs(p[3]-841.89)>1;}))) process.exitCode=1;
})();
