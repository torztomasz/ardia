import assert from "node:assert/strict";
import { test } from "node:test";
import { editOfReplacedText, fieldForHighlightedRow } from "./highlightedRow.ts";

const page = (url) => ({ kind: "page", url, title: "", favicon: null });

test("a row whose address starts with the typed text completes it inline, keeping what was typed", () => {
  assert.deepEqual(fieldForHighlightedRow("wp", page("https://www.wp.pl/")), { completion: ".pl" });
  assert.deepEqual(fieldForHighlightedRow("WOR", page("https://wordpress.com/")), { completion: "dpress.com" });
  assert.deepEqual(fieldForHighlightedRow("wp", { kind: "search", query: "wp", url: "", engine: "Google" }), { completion: "" });
});

test("a row that doesn't start with the typed text replaces the field with its address", () => {
  assert.deepEqual(fieldForHighlightedRow("wp", page("https://sklep.kfd.pl/kfd-regular-wpc-80-p-2451.html")), {
    replace: "sklep.kfd.pl/kfd-regular-wpc-80-p-2451.html",
  });
  assert.deepEqual(fieldForHighlightedRow("", page("https://www.wp.pl/")), { replace: "wp.pl" });
});

test("typing one key onto replaced text may complete again; any other edit may not", () => {
  assert.equal(editOfReplacedText("wp.pl", "wp.pl/").suppress, false);
  assert.equal(editOfReplacedText("wp.pl", "wp.p").suppress, true);
  assert.equal(editOfReplacedText("wp.pl", "xwp.pl").suppress, true);
});
