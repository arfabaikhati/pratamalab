import type { ReactNode, SVGProps } from "react";
import type { BlockType } from "../types";

type P = SVGProps<SVGSVGElement>;

function S({ children, ...p }: P & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IcLogo = (p: P) => (
  <S {...p}>
    <path d="M10 3h4" />
    <path d="M11 3v5.2L5.8 17.5A2.4 2.4 0 0 0 8 21h8a2.4 2.4 0 0 0 2.2-3.5L13 8.2V3" />
    <path d="M7.6 14.5h8.8" />
    <circle cx="10.6" cy="17.6" r="0.5" fill="currentColor" stroke="none" />
    <circle cx="13.6" cy="18.4" r="0.4" fill="currentColor" stroke="none" />
  </S>
);

export const IcSearch = (p: P) => (
  <S {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m16.6 16.6 4.4 4.4" />
  </S>
);

export const IcPlus = (p: P) => (
  <S {...p}>
    <path d="M12 5v14M5 12h14" />
  </S>
);

export const IcMinus = (p: P) => (
  <S {...p}>
    <path d="M5 12h14" />
  </S>
);

export const IcX = (p: P) => (
  <S {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </S>
);

export const IcCheck = (p: P) => (
  <S {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </S>
);

export const IcTrash = (p: P) => (
  <S {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    <path d="m6 7 .8 12.2A2 2 0 0 0 8.8 21h6.4a2 2 0 0 0 2-1.8L18 7" />
    <path d="M10 11v6M14 11v6" />
  </S>
);

export const IcCopy = (p: P) => (
  <S {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </S>
);

export const IcPlay = (p: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
    <path d="M8 5.4v13.2a.6.6 0 0 0 .9.5l10.4-6.6a.6.6 0 0 0 0-1L8.9 4.9a.6.6 0 0 0-.9.5Z" />
  </svg>
);

export const IcPresent = (p: P) => (
  <S {...p}>
    <rect x="3" y="4" width="18" height="12" rx="2" />
    <path d="M12 16v4M8 20h8" />
    <path d="m10.5 8 4 2.5-4 2.5Z" fill="currentColor" stroke="none" />
  </S>
);

export const IcChevL = (p: P) => (
  <S {...p}>
    <path d="m14.5 5.5-6.5 6.5 6.5 6.5" />
  </S>
);

export const IcChevR = (p: P) => (
  <S {...p}>
    <path d="m9.5 5.5 6.5 6.5-6.5 6.5" />
  </S>
);

export const IcChevD = (p: P) => (
  <S {...p}>
    <path d="m5.5 9.5 6.5 6.5 6.5-6.5" />
  </S>
);

export const IcArrowUp = (p: P) => (
  <S {...p}>
    <path d="M12 19V5" />
    <path d="m5.5 11.5 6.5-6.5 6.5 6.5" />
  </S>
);

export const IcArrowDown = (p: P) => (
  <S {...p}>
    <path d="M12 5v14" />
    <path d="m5.5 12.5 6.5 6.5 6.5-6.5" />
  </S>
);

export const IcGrip = (p: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
    <circle cx="9" cy="6" r="1.4" />
    <circle cx="15" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" />
    <circle cx="15" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" />
    <circle cx="15" cy="18" r="1.4" />
  </svg>
);

export const IcDots = (p: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
    <circle cx="5" cy="12" r="1.7" />
    <circle cx="12" cy="12" r="1.7" />
    <circle cx="19" cy="12" r="1.7" />
  </svg>
);

export const IcMenu = (p: P) => (
  <S {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </S>
);

export const IcBraces = (p: P) => (
  <S {...p}>
    <path d="M8 4C6.3 4 5.8 5 5.8 6.4v2.1C5.8 10 4.8 11 3.6 11v2c1.2 0 2.2 1 2.2 2.5v2.1C5.8 19 6.3 20 8 20" />
    <path d="M16 4c1.7 0 2.2 1 2.2 2.4v2.1c0 1.5 1 2.5 2.2 2.5v2c-1.2 0-2.2 1-2.2 2.5v2.1c0 1.4-.5 2.4-2.2 2.4" />
  </S>
);

export const IcSpark = (p: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
    <path d="M12 2.8 13.9 9l6.2 1.9-6.2 1.9L12 19l-1.9-6.2L3.9 10.9 10.1 9 12 2.8Z" />
    <circle cx="19" cy="18.5" r="1.6" />
  </svg>
);

/* --- ikon jenis blok --- */

export const IcType = (p: P) => (
  <S {...p}>
    <path d="M5 7V4h14v3M12 4v16M9 20h6" />
  </S>
);

export const IcH1 = (p: P) => (
  <S {...p}>
    <path d="M4 12h8M4 18V6M12 18V6" />
    <path d="m17.5 11 2.5-1.6V18" />
  </S>
);

export const IcH2 = (p: P) => (
  <S {...p}>
    <path d="M4 12h8M4 18V6M12 18V6" />
    <path d="M16.5 10.7c.3-1 1.3-1.7 2.4-1.7 1.4 0 2.4.9 2.4 2.1 0 2.2-4.8 3.6-4.8 6.9h5" />
  </S>
);

export const IcH3 = (p: P) => (
  <S {...p}>
    <path d="M4 12h8M4 18V6M12 18V6" />
    <path d="M16.4 9.4 19 7v10" />
    <path d="M16.3 11.7c2.6 0 4 .8 4 2.2 0 1.3-1.5 2.1-4 2.1" />
  </S>
);

export const IcTodo = (p: P) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    <path d="m8.2 12.4 2.6 2.6 5-5.8" />
  </S>
);

export const IcList = (p: P) => (
  <S {...p}>
    <path d="M9.5 6h11M9.5 12h11M9.5 18h11" />
    <circle cx="4.5" cy="6" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="4.5" cy="18" r="1.1" fill="currentColor" stroke="none" />
  </S>
);

export const IcListOrdered = (p: P) => (
  <S {...p}>
    <path d="M10 6h10.5M10 12h10.5M10 18h10.5" />
    <path d="M4 5.5h1.2V10M3.6 10h2.6" />
    <path d="M3.8 13.6c.4-.7 1.2-1.1 2-1.1 1 0 1.7.6 1.7 1.4 0 1.6-3.5 2.2-3.5 4.1h3.8" transform="translate(0 .2)" />
  </S>
);

export const IcQuote = (p: P) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" {...p}>
    <path d="M5 13.2C5 9.6 7.3 7 10.6 6l.7 1.6c-2 .8-3.2 2.3-3.4 3.7H11v6H5v-4.1Z" />
    <path d="M13.4 13.2C13.4 9.6 15.7 7 19 6l.7 1.6c-2 .8-3.2 2.3-3.4 3.7h3.1v6h-6v-4.1Z" />
  </svg>
);

export const IcBulb = (p: P) => (
  <S {...p}>
    <path d="M12 3a6 6 0 0 1 4 10.5c-.8.7-1 1.5-1 2.5H9c0-1-.2-1.8-1-2.5A6 6 0 0 1 12 3Z" />
    <path d="M9.5 19h5M10.5 21.5h3" />
  </S>
);

export const IcTable = (p: P) => (
  <S {...p}>
    <rect x="3" y="4.5" width="18" height="15" rx="2" />
    <path d="M3 9.5h18M12 9.5V19.5M3 14.5h18" />
  </S>
);

export const IcSigma = (p: P) => (
  <S {...p}>
    <path d="M18 6.5V5H6.5l5.2 7-5.2 7H18v-1.5" />
  </S>
);

export const IcCode = (p: P) => (
  <S {...p}>
    <path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5" />
  </S>
);

export const IcDividerLine = (p: P) => (
  <S {...p}>
    <path d="M4 12h16" />
    <path d="M7 6.5h10M7 17.5h10" opacity=".35" />
  </S>
);

export function iconFor(type: BlockType, cls?: string) {
  const p = cls ? { className: cls } : {};
  switch (type) {
    case "text": return <IcType {...p} />;
    case "h1": return <IcH1 {...p} />;
    case "h2": return <IcH2 {...p} />;
    case "h3": return <IcH3 {...p} />;
    case "todo": return <IcTodo {...p} />;
    case "bullet": return <IcList {...p} />;
    case "numbered": return <IcListOrdered {...p} />;
    case "quote": return <IcQuote {...p} />;
    case "callout": return <IcBulb {...p} />;
    case "table": return <IcTable {...p} />;
    case "formula": return <IcSigma {...p} />;
    case "code": return <IcCode {...p} />;
    case "divider": return <IcDividerLine {...p} />;
  }
}
