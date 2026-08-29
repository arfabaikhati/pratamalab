import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import type { FocusReq } from "../types";

export function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection();
  const len = (el.textContent ?? "").length;
  if (!sel || sel.rangeCount === 0) return len;
  const r = sel.getRangeAt(0);
  if (!el.contains(r.startContainer)) return len;
  const pre = r.cloneRange();
  pre.selectNodeContents(el);
  pre.setEnd(r.startContainer, r.startOffset);
  return pre.toString().length;
}

export function setCaret(el: HTMLElement, offset: number) {
  const sel = window.getSelection();
  if (!sel) return;
  const range = document.createRange();
  let remaining = offset;
  let found = false;
  const walk = (node: Node): boolean => {
    if (found) return true;
    if (node.nodeType === Node.TEXT_NODE) {
      const len = node.textContent?.length ?? 0;
      if (remaining <= len) {
        range.setStart(node, remaining);
        range.collapse(true);
        found = true;
        return true;
      }
      remaining -= len;
    } else {
      for (const c of Array.from(node.childNodes)) {
        if (walk(c)) return true;
      }
    }
    return false;
  };
  walk(el);
  if (!found) {
    range.selectNodeContents(el);
    range.collapse(false);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

interface Props {
  html: string;
  mountKey: string;
  ph?: string;
  className?: string;
  focusReq?: FocusReq | null;
  onChange?: (html: string, plain: string) => void;
  onEnter?: (offset: number) => void;
  onBackspaceStart?: () => void;
  onArrowNav?: (dir: "up" | "down") => void;
  /** return true untuk menelan event (mis. saat menu slash terbuka) */
  onKeyDown?: (e: ReactKeyboardEvent<HTMLDivElement>) => boolean | void;
  spellCheck?: boolean;
}

export default function Editable({
  html,
  mountKey,
  ph,
  className,
  focusReq,
  onChange,
  onEnter,
  onBackspaceStart,
  onArrowNav,
  onKeyDown,
  spellCheck,
}: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [empty, setEmpty] = useState(true);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html || "";
    setEmpty(!(el.textContent ?? "").trim());
    // hanya jalankan saat mount / remount via mountKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey]);

  useEffect(() => {
    if (focusReq && ref.current) {
      ref.current.focus();
      setCaret(ref.current, focusReq.pos);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusReq?.tick]);

  const handleInput = () => {
    const el = ref.current;
    if (!el) return;
    let h = el.innerHTML;
    if (h === "<br>" || h === "<div><br></div>") {
      h = "";
      el.innerHTML = "";
    }
    const plain = el.textContent ?? "";
    setEmpty(!plain.trim());
    onChange?.(h, plain);
  };

  const handleKey = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (onKeyDown && onKeyDown(e) === true) return;
    const el = ref.current;
    if (!el) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onEnter?.(getCaretOffset(el));
      return;
    }
    if (e.key === "Backspace") {
      const sel = window.getSelection();
      if (sel && sel.isCollapsed && getCaretOffset(el) === 0) {
        e.preventDefault();
        onBackspaceStart?.();
      }
      return;
    }
    if (e.key === "ArrowUp") {
      const sel = window.getSelection();
      if (sel?.isCollapsed && getCaretOffset(el) === 0) {
        e.preventDefault();
        onArrowNav?.("up");
      }
      return;
    }
    if (e.key === "ArrowDown") {
      const sel = window.getSelection();
      const len = (el.textContent ?? "").length;
      if (sel?.isCollapsed && getCaretOffset(el) >= len) {
        e.preventDefault();
        onArrowNav?.("down");
      }
    }
  };

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-ph={ph ?? ""}
      data-empty={empty}
      spellCheck={spellCheck ?? true}
      className={`editable whitespace-pre-wrap break-words ${className ?? ""}`}
      onInput={handleInput}
      onKeyDown={handleKey}
    />
  );
}
