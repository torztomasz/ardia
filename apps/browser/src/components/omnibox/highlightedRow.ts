import { displayUrl, type Suggestion } from "@ardia/core";

type HighlightedField = { completion: string } | { replace: string };

export function fieldForHighlightedRow(typed: string, row: Suggestion | undefined): HighlightedField | null {
  if (!row) return null;
  const text = rowText(row);
  if (typed && text.toLowerCase().startsWith(typed.toLowerCase())) return { completion: text.slice(typed.length) };
  return { replace: text };
}

function rowText(s: Suggestion): string {
  switch (s.kind) {
    case "page":
      return displayUrl(s.url);
    case "search":
      return s.query;
    case "calc":
      return s.value;
    case "action":
    case "create":
      return s.title;
  }
}

export function editOfReplacedText(shown: string, next: string) {
  const typedOneMore = next.length === shown.length + 1 && next.startsWith(shown);
  return { echo: false as const, typed: next, suppress: !typedOneMore };
}
