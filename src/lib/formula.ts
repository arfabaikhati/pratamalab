export type FormulaResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

const CONSTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E,
  tau: Math.PI * 2,
};

const FUNCS: Record<string, (...a: number[]) => number> = {
  sqrt: (a) => Math.sqrt(a),
  abs: (a) => Math.abs(a),
  sin: (a) => Math.sin(a),
  cos: (a) => Math.cos(a),
  tan: (a) => Math.tan(a),
  asin: (a) => Math.asin(a),
  acos: (a) => Math.acos(a),
  atan: (a) => Math.atan(a),
  log: (a) => Math.log10(a),
  ln: (a) => Math.log(a),
  log2: (a) => Math.log2(a),
  round: (a) => Math.round(a),
  floor: (a) => Math.floor(a),
  ceil: (a) => Math.ceil(a),
  trunc: (a) => Math.trunc(a),
  sign: (a) => Math.sign(a),
  exp: (a) => Math.exp(a),
  min: (...a) => Math.min(...a),
  max: (...a) => Math.max(...a),
  pow: (a, b) => Math.pow(a, b),
  mod: (a, b) => ((a % b) + b) % b,
  hypot: (...a) => Math.hypot(...a),
};

type Tok =
  | { t: "num"; v: number }
  | { t: "id"; v: string }
  | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < src.length && /[0-9.]/.test(src[j])) j++;
      const raw = src.slice(i, j);
      const v = Number(raw);
      if (Number.isNaN(v)) throw new Error(`Angka tidak valid: "${raw}"`);
      toks.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < src.length && /[a-zA-Z_0-9]/.test(src[j])) j++;
      toks.push({ t: "id", v: src.slice(i, j).toLowerCase() });
      i = j;
      continue;
    }
    if ("+-*/^%(),".includes(c)) {
      toks.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error(`Karakter tak dikenal: "${c}"`);
  }
  return toks;
}

class Parser {
  toks: Tok[];
  pos = 0;

  constructor(toks: Tok[]) {
    this.toks = toks;
  }

  peek(): Tok | undefined {
    return this.toks[this.pos];
  }

  next(): Tok | undefined {
    return this.toks[this.pos++];
  }

  expectOp(v: string) {
    const t = this.next();
    if (!t || t.t !== "op" || t.v !== v)
      throw new Error(`Kurung tidak seimbang`);
  }

  parseExpr(): number {
    let v = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "+" || t.v === "-")) {
        this.next();
        const r = this.parseTerm();
        v = t.v === "+" ? v + r : v - r;
      } else break;
    }
    return v;
  }

  parseTerm(): number {
    let v = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === "op" && (t.v === "*" || t.v === "/" || t.v === "%")) {
        this.next();
        const r = this.parseUnary();
        if (t.v === "*") v = v * r;
        else if (t.v === "/") {
          if (r === 0) throw new Error("Pembagian dengan nol");
          v = v / r;
        } else v = v % r;
      } else break;
    }
    return v;
  }

  parseUnary(): number {
    const t = this.peek();
    if (t && t.t === "op" && (t.v === "-" || t.v === "+")) {
      this.next();
      const v = this.parseUnary();
      return t.v === "-" ? -v : v;
    }
    return this.parsePower();
  }

  parsePower(): number {
    const base = this.parsePrimary();
    const t = this.peek();
    if (t && t.t === "op" && t.v === "^") {
      this.next();
      return Math.pow(base, this.parseUnary());
    }
    return base;
  }

  parsePrimary(): number {
    const t = this.next();
    if (!t) throw new Error("Ekspresi belum selesai");
    if (t.t === "num") return t.v;
    if (t.t === "id") {
      const name = t.v;
      if (CONSTS[name] !== undefined) return CONSTS[name];
      const fn = FUNCS[name];
      if (!fn) throw new Error(`Nama tak dikenal: "${name}"`);
      const nx = this.peek();
      if (!nx || nx.t !== "op" || nx.v !== "(")
        throw new Error(`Fungsi ${name} butuh tanda kurung, contoh: ${name}(…)`);
      this.next();
      const args: number[] = [];
      if (!(this.peek()?.t === "op" && (this.peek() as { v: string }).v === ")")) {
        args.push(this.parseExpr());
        while (this.peek()?.t === "op" && (this.peek() as { v: string }).v === ",") {
          this.next();
          args.push(this.parseExpr());
        }
      }
      this.expectOp(")");
      return fn(...args);
    }
    if (t.t === "op" && t.v === "(") {
      const v = this.parseExpr();
      this.expectOp(")");
      return v;
    }
    throw new Error("Ekspresi tidak valid");
  }
}

export function evalFormula(src: string): FormulaResult {
  const trimmed = src.trim();
  if (!trimmed) return { ok: false, error: "" };
  try {
    const p = new Parser(tokenize(trimmed));
    const value = p.parseExpr();
    if (p.pos < p.toks.length) throw new Error("Ekspresi tidak valid");
    if (Number.isNaN(value)) return { ok: false, error: "Hasil bukan angka" };
    return { ok: true, value };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Ekspresi tidak valid" };
  }
}

export function fmtNum(v: number): string {
  if (!Number.isFinite(v)) return "∞";
  const r = parseFloat(v.toPrecision(12));
  return r.toLocaleString("id-ID", { maximumFractionDigits: 6 });
}
