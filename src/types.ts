export type BlockType =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "todo"
  | "bullet"
  | "numbered"
  | "quote"
  | "callout"
  | "code"
  | "formula"
  | "table"
  | "divider";

export interface Block {
  id: string;
  type: BlockType;
  /** HTML untuk blok teks-like, ekspresi untuk rumus, kode mentah untuk code */
  html: string;
  /** versi — dinaikkan saat html diubah secara programatik agar Editable remount */
  v: number;
  checked?: boolean;
  icon?: string;
  lang?: string;
  rows?: string[][];
}

export interface Page {
  id: string;
  icon: string;
  title: string;
  blocks: Block[];
  updatedAt: number;
}

export interface SlashDef {
  type: BlockType;
  label: string;
  desc: string;
  kw: string;
}

export interface FocusReq {
  id: string;
  pos: number;
  tick: number;
}

export interface Toast {
  id: number;
  msg: string;
}
