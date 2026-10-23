import { completeInline } from "@ardia/shell";
import { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { findNodeHandle, type TextInput } from "react-native";
import { acceptsCompletion, completionToWrite, fieldChange, withoutFirst, type EditContext, type FieldChange, type Inline, type PendingInline, type Selection } from "./inline";

const MAX_REFUSALS = 3;

export function useInlineCompletion(input: RefObject<TextInput | null>, typed: string, wanted: string | null) {
  const [inline, setInline] = useState<Inline | null>(null);
  const pending = useRef<PendingInline[]>([]);
  const heard = useRef(typed);
  const refusals = useRef({ of: "", count: 0 });
  const [retry, setRetry] = useState(0);
  const shown = inline?.typed === typed ? inline.completion : "";

  useLayoutEffect(() => {
    if (typed !== heard.current) {
      heard.current = typed;
      pending.current = pending.current.map((p) => ({ ...p, orphaned: true }));
    }
    if (wanted === null) {
      setInline(null);
      return;
    }
    const of = `${typed}\n${wanted}`;
    if (refusals.current.of !== of) refusals.current = { of, count: 0 };
    const write = completionToWrite(typed, wanted, shown, pending.current);
    const tag = write && findNodeHandle(input.current);
    if (!write || tag == null) return;
    pending.current = [...pending.current, write];
    const settle = (result: number) => {
      if (result === 2) return;
      pending.current = withoutFirst(pending.current, write);
      if (result === 1) setInline(write);
      if (result === 0 && refusals.current.count < MAX_REFUSALS) {
        refusals.current.count++;
        requestAnimationFrame(() => setRetry((n) => n + 1));
      }
    };
    completeInline(tag, write.typed, write.completion).then(settle, () => settle(0));
  }, [input, typed, wanted, shown, retry]);

  const read = (next: string, edit?: EditContext): FieldChange => {
    const change = fieldChange(typed, shown, next, pending.current, edit);
    if (change.echo) {
      pending.current = pending.current.slice(change.settled);
      if (!change.stale) setInline(change.inline);
    } else {
      heard.current = change.typed;
      setInline(null);
    }
    return change;
  };

  const accepts = (selection: Selection) => acceptsCompletion(typed, shown, selection, pending.current);

  return { shown, read, accepts };
}
