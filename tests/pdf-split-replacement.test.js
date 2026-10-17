const test = require("node:test");

const assert = require("node:assert/strict");

const fs = require("node:fs");

const path = require("node:path");

const vm = require("node:vm");

const root = process.env.AFROTOOLS_PDF_TEST_SOURCE_ROOT || path.resolve(__dirname, "..");

const runtimeRoot = process.env.AFROTOOLS_PDF_TEST_RUNTIME_ROOT || root;

const PDFLib = require(path.join(runtimeRoot, "assets/vendor/pdf-lib/pdf-lib.min.js"));

const source = fs.readFileSync(path.join(root, "assets/js/pages/pdf-merge-split.js"), "utf8");

function deferred() {
    let resolve, reject;
    const promise = new Promise((a, b) => {
        resolve = a;
        reject = b;
    });
    return {
        promise: promise,
        resolve: resolve,
        reject: reject
    };
}

function node(tag = "div") {
    const classes = new Set, el = {
        tagName: tag.toUpperCase(),
        style: {},
        dataset: {},
        children: [],
        attributes: {},
        disabled: false,
        value: "",
        checked: false,
        textContent: "",
        classList: {
            add: x => classes.add(x),
            remove: x => classes.delete(x),
            contains: x => classes.has(x),
            toggle(x, v) {
                if (v === undefined) v = !classes.has(x);
                v ? classes.add(x) : classes.delete(x);
            }
        },
        setAttribute(k, v) {
            this.attributes[k] = String(v);
        },
        getAttribute(k) {
            return this.attributes[k];
        },
        appendChild(x) {
            this.children.push(x);
            return x;
        },
        append(...xs) {
            this.children.push(...xs);
        },
        removeChild(x) {
            this.children = this.children.filter(v => v !== x);
        },
        addEventListener() {},
        querySelectorAll() {
            return [];
        },
        click() {}
    };
    Object.defineProperty(el, "innerHTML", {
        get() {
            return this._html || "";
        },
        set(v) {
            this._html = v;
            this.children = [];
        }
    });
    return el;
}

function harness(options = {}) {
    const els = {}, downloads = [], body = node("body"), modeButtons = [ node("button"), node("button") ];
    let pdfjs = options.pdfjs;
    const document = {
        readyState: "loading",
        documentElement: {
            lang: "en"
        },
        body: body,
        addEventListener() {},
        querySelectorAll(selector) {
            return selector === ".mode-btn" ? modeButtons : [];
        },
        querySelector() {
            return null;
        },
        createElement(tag) {
            const el = node(tag);
            if (tag === "canvas") {
                const ctx = {
                    marker: ""
                };
                el.getContext = () => ctx;
                el.toDataURL = () => ctx.marker;
            }
            return el;
        }
    };
    const implementation = options.pdfLib || PDFLib;
    // VM array literals belong to a different realm; bridge indices only, retaining genuine PDFLib copying/encoding.
        const library = {
        PDFDocument: {
            load: (...args) => implementation.PDFDocument.load(...args),
            create: async () => {
                const doc = await implementation.PDFDocument.create();
                const copy = doc.copyPages.bind(doc);
                doc.copyPages = (pdf, indices) => copy(pdf, Array.from(indices));
                return doc;
            }
        }
    };
    const context = {
        document: document,
        window: {
            PDFLib: library,
            pdfjsLib: pdfjs
        },
        Uint8Array: Uint8Array,
        Uint32Array: Uint32Array,
        ArrayBuffer: ArrayBuffer,
        DataView: DataView,
        TextEncoder: TextEncoder,
        Blob: Blob,
        console: console,
        URL: {
            createObjectURL(blob) {
                downloads.push(blob);
                return "blob:local-test";
            },
            revokeObjectURL() {}
        },
        setTimeout() {
            return 0;
        },
        clearTimeout() {}
    };
    vm.createContext(context);
    const close = source.lastIndexOf("})();");
    assert(close >= 0);
    vm.runInContext(source.slice(0, close) + "globalThis.__owner={state,els,loadSplitFile,makePdfFromPages,performSplit,activateMode,syncSplitButton};\n" + source.slice(close), context);
    const api = context.__owner;
    for (const key of [ "mergeCard", "splitCard", "splitInfo", "actionRow", "splitFileName", "splitPageCount", "resultCard", "resultText", "progressBar", "progressFill", "splitGrid", "splitSummary", "splitBtn", "rangeInput", "rangeCombine", "extractInput", "mergeBtn", "clearMergeBtn", "mergeSummary" ]) api.els[key] = node();
    api.state.currentMode = "split";
    api.state.splitMode = "extract";
    api.els.extractInput.value = "1";
    return {
        ...api,
        downloads: downloads,
        modeButtons: modeButtons
    };
}

function ab(bytes) {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function file(name, bytes, read) {
    return {
        name: name,
        type: "application/pdf",
        arrayBuffer: read || (async () => ab(bytes))
    };
}

let a, b;

test.before(async () => {
    const A = await PDFLib.PDFDocument.create();
    A.addPage([ 200, 250 ]);
    A.addPage([ 201, 251 ]);
    a = await A.save();
    const B = await PDFLib.PDFDocument.create();
    B.addPage([ 300, 350 ]);
    B.addPage([ 301, 351 ]);
    B.addPage([ 302, 352 ]);
    b = await B.save();
}, { timeout: 5000 });

async function expectNewerExport(h) {
    assert.equal(h.state.splitFile.name, "newer-B.pdf");
    assert.equal(h.els.splitFileName.textContent, "newer-B.pdf");
    assert.equal(h.state.splitPdfDoc.getPageCount(), 3);
    const pdf = await PDFLib.PDFDocument.load(await h.makePdfFromPages([ 0 ]));
    assert.equal(pdf.getPage(0).getWidth(), 300);
    await h.performSplit();
    assert.equal(h.state.lastDownload.filename, "newer-B_selected_pages.pdf");
    const exported = await PDFLib.PDFDocument.load(await h.state.lastDownload.blob.arrayBuffer());
    assert.equal(exported.getPage(0).getWidth(), 300);
}

test("split replacement: older File read cannot replace newer PDF bytes or export", {
    timeout: 5e3
}, async () => {
    const h = harness(), gate = deferred();
    const old = h.loadSplitFile(file("older-A.pdf", a, () => gate.promise));
    await h.loadSplitFile(file("newer-B.pdf", b));
    gate.resolve(ab(a));
    await old;
    await expectNewerExport(h);
});

test("split replacement: older parser cannot replace newer PDF or export", {
    timeout: 5e3
}, async () => {
    const gate = deferred(), entered = deferred();
    const h = harness({
        pdfLib: {
            PDFDocument: {
                create: () => PDFLib.PDFDocument.create(),
                load: async bytes => {
                    if (Buffer.from(bytes).equals(Buffer.from(a))) {
                        entered.resolve();
                        await gate.promise;
                    }
                    return PDFLib.PDFDocument.load(bytes);
                }
            }
        }
    });
    const old = h.loadSplitFile(file("older-A.pdf", a));
    await entered.promise;
    await h.loadSplitFile(file("newer-B.pdf", b));
    gate.resolve();
    await old;
    await expectNewerExport(h);
});

test("split replacement: superseded thumbnail render cannot contaminate newer grid or export", {
    timeout: 5e3
}, async () => {
    const gate = deferred(), entered = deferred();
    const pdfjs = {
        GlobalWorkerOptions: {},
        getDocument({data: data}) {
            return {
                promise: (async () => {
                    const pdf = await PDFLib.PDFDocument.load(data);
                    const width = pdf.getPage(0).getWidth();
                    return {
                        numPages: pdf.getPageCount(),
                        destroy: async () => {},
                        getPage: async () => ({
                            getViewport: () => ({
                                width: 10,
                                height: 10
                            }),
                            render({canvasContext: canvasContext}) {
                                return {
                                    promise: (async () => {
                                        if (width === 200) {
                                            entered.resolve();
                                            await gate.promise;
                                        }
                                        canvasContext.marker = "thumb-" + width;
                                    })()
                                };
                            }
                        })
                    };
                })(),
                destroy: async () => {}
            };
        }
    };
    const h = harness({
        pdfjs: pdfjs
    });
    const old = h.loadSplitFile(file("older-A.pdf", a));
    await entered.promise;
    await h.loadSplitFile(file("newer-B.pdf", b));
    gate.resolve();
    await old;
    assert(Object.values(h.state.splitThumbnails).length > 0);
    assert(Object.values(h.state.splitThumbnails).every(x => x === "thumb-300"));
    await expectNewerExport(h);
});

test("split replacement: superseded read error cannot replace newest successful status", {
    timeout: 5e3
}, async () => {
    const h = harness(), gate = deferred();
    const old = h.loadSplitFile(file("older-bad.pdf", a, () => gate.promise));
    await h.loadSplitFile(file("newer-B.pdf", b));
    gate.reject(new Error("synthetic old read failure"));
    await old;
    assert.equal(h.els.resultCard.classList.contains("on"), false);
    assert(!h.els.resultText.textContent.includes("Could not read"));
    await expectNewerExport(h);
});

test("split replacement: invalid latest selection invalidates pending older load and recovers", {
    timeout: 5e3
}, async () => {
    const h = harness(), gate = deferred();
    const old = h.loadSplitFile(file("older-A.pdf", a, () => gate.promise));
    await h.loadSplitFile({
        name: "not-a-pdf.txt",
        type: "text/plain",
        arrayBuffer: async () => ab(a)
    });
    gate.resolve(ab(a));
    await old;
    assert.equal(h.state.splitPdfDoc === null, true);
    assert.equal(h.els.splitBtn.disabled, true);
    assert.equal(h.els.splitGrid.children.length, 0);
    assert.match(h.els.resultText.textContent, /Please choose a PDF/);
    await h.loadSplitFile(file("newer-B.pdf", b));
    await expectNewerExport(h);
});

test("split loading disables export and mode changes; replacement remains available", {
    timeout: 5e3
}, async () => {
    const h = harness();
    await h.loadSplitFile(file("newer-B.pdf", b));
    h.state.busy = true;
    await h.performSplit();
    const busyBlocked = h.state.lastDownload === null && h.state.busy === true;
    h.state.busy = false;
    await h.performSplit();
    assert(h.state.lastDownload);
    const gate = deferred();
    const old = h.loadSplitFile(file("older-A.pdf", a, () => gate.promise));
    const observed = {
        button: h.els.splitBtn.disabled,
        grid: h.els.splitGrid.children.length,
        modesDisabled: h.modeButtons.every(x => x.disabled)
    };
    h.activateMode("merge");
    const mode = h.state.currentMode;
    await h.performSplit();
    const pendingDownload = h.state.lastDownload;
    await h.loadSplitFile(file("newer-B.pdf", b));
    gate.resolve(ab(a));
    await old;
    assert.equal(busyBlocked, true);
    assert.equal(observed.modesDisabled, true);
    assert(h.modeButtons.every(x => !x.disabled));
    assert.equal(observed.button, true);
    assert.equal(observed.grid, 0);
    assert.equal(mode, "split");
    assert.equal(pendingDownload, null);
    await expectNewerExport(h);
});

test("current malformed PDF fails honestly, then genuine valid PDF can export", {
    timeout: 5e3
}, async () => {
    const h = harness();
    await h.loadSplitFile(file("bad.pdf", Buffer.from("not pdf bytes")));
    assert.equal(h.state.splitPdfDoc === null, true);
    assert.equal(h.els.splitBtn.disabled, true);
    assert.match(h.els.resultText.textContent, /Could not read this PDF/);
    assert.equal(h.state.lastDownload, null);
    await h.loadSplitFile(file("newer-B.pdf", b));
    await expectNewerExport(h);
});
