import { Fragment, type ReactNode } from "react";
import type { CompileFormat } from "@/lib/compiler";

const SYNTAX = {
  comment: "#4a5268",
  keyword: "#4ade80",
  function: "#60a5fa",
  string: "#fbbf24",
  number: "#a78bfa",
  plain: "#eef0f6",
  jinja: "#c4b5fd",
} as const;

const MULTI_KEYWORDS = [
  "NOT IN",
  "GROUP BY",
  "DEDUP BY",
  "DATE_TRUNC",
  "KEEP_FIRST",
  "IS NULL",
  "IS NOT NULL",
  "NOT_EQUALS",
] as const;

const KEYWORDS_BY_FORMAT: Record<CompileFormat, string[]> = {
  generic: [
    "DEFINE",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "RETURN",
    "ROWS",
    "GROUP",
    "BY",
    "DEDUP",
    "IN",
    "NOT",
  ],
  sql: [
    "SELECT",
    "FROM",
    "WHERE",
    "AND",
    "OR",
    "AS",
    "GROUP",
    "BY",
    "IN",
    "NOT",
    "NULL",
    "IS",
    "LIKE",
  ],
  python: [
    "def",
    "return",
    "import",
    "True",
    "False",
    "and",
    "pd",
    "DataFrame",
    "Series",
    "str",
  ],
  dbt: [
    "select",
    "from",
    "where",
    "and",
    "or",
    "as",
    "group",
    "by",
    "in",
    "not",
    "config",
    "ref",
    "materialized",
  ],
};

const FUNCTIONS = new Set([
  "SUM",
  "COUNT",
  "AVG",
  "MIN",
  "MAX",
  "DATE_TRUNC",
  "monthly_active_revenue",
  "sum",
  "groupby",
  "isin",
  "Grouper",
  "MS",
]);

type TokenKind = keyof typeof SYNTAX;

function isCommentLine(line: string, format: CompileFormat): boolean {
  const t = line.trimStart();
  if (t.startsWith("--")) return true;
  if (format === "python" && t.startsWith("#")) return true;
  if (format === "dbt" && (t.startsWith("{#") || t.startsWith("--"))) return true;
  if (t.startsWith('"""') || t.startsWith("'''")) return true;
  return false;
}

function matchMultiKeyword(line: string, pos: number): string | null {
  const rest = line.slice(pos).toUpperCase();
  for (const kw of MULTI_KEYWORDS) {
    if (rest.startsWith(kw)) {
      const next = rest[kw.length];
      if (!next || /[^A-Z0-9_]/.test(next)) return kw;
    }
  }
  return null;
}

function isKeyword(word: string, format: CompileFormat): boolean {
  const list = KEYWORDS_BY_FORMAT[format];
  return list.some((k) => k.toUpperCase() === word.toUpperCase());
}

function tokenizeLine(line: string, format: CompileFormat): { kind: TokenKind; text: string }[] {
  if (isCommentLine(line, format)) {
    return [{ kind: "comment", text: line }];
  }

  const tokens: { kind: TokenKind; text: string }[] = [];
  let pos = 0;

  while (pos < line.length) {
    const rest = line.slice(pos);

    if (format === "dbt" && rest.startsWith("{{")) {
      const end = rest.indexOf("}}");
      const slice = end === -1 ? rest : rest.slice(0, end + 2);
      tokens.push({ kind: "jinja", text: slice });
      pos += slice.length;
      continue;
    }

    const strMatch = rest.match(/^('([^'\\]|\\.)*'|"([^"\\]|\\.)*")/);
    if (strMatch) {
      tokens.push({ kind: "string", text: strMatch[0] });
      pos += strMatch[0].length;
      continue;
    }

    const numMatch = rest.match(/^(\d+\.?\d*)\b/);
    if (numMatch) {
      tokens.push({ kind: "number", text: numMatch[0] });
      pos += numMatch[0].length;
      continue;
    }

    if (/^(true|false)\b/i.test(rest)) {
      const m = rest.match(/^(true|false)\b/i)!;
      tokens.push({ kind: "number", text: m[0] });
      pos += m[0].length;
      continue;
    }

    const multi = matchMultiKeyword(line, pos);
    if (multi) {
      tokens.push({ kind: "keyword", text: line.slice(pos, pos + multi.length) });
      pos += multi.length;
      continue;
    }

    const wordMatch = rest.match(/^[A-Za-z_][\w]*/);
    if (wordMatch) {
      const word = wordMatch[0];
      const upper = word.toUpperCase();
      if (FUNCTIONS.has(word) || FUNCTIONS.has(upper)) {
        tokens.push({ kind: "function", text: word });
      } else if (isKeyword(word, format)) {
        tokens.push({ kind: "keyword", text: word });
      } else {
        tokens.push({ kind: "plain", text: word });
      }
      pos += word.length;
      continue;
    }

    const spaceMatch = rest.match(/^\s+/);
    if (spaceMatch) {
      tokens.push({ kind: "plain", text: spaceMatch[0] });
      pos += spaceMatch[0].length;
      continue;
    }

    tokens.push({ kind: "plain", text: rest[0] ?? "" });
    pos += 1;
  }

  return tokens;
}

export function highlightCode(code: string, format: CompileFormat): ReactNode {
  const lines = code.split("\n");

  return lines.map((line, lineIndex) => (
    <Fragment key={lineIndex}>
      {lineIndex > 0 ? "\n" : null}
      {tokenizeLine(line, format).map((token, tokenIndex) => (
        <span
          key={`${lineIndex}-${tokenIndex}`}
          style={{ color: SYNTAX[token.kind] }}
        >
          {token.text}
        </span>
      ))}
    </Fragment>
  ));
}
