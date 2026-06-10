import type { CSSProperties } from "react";

/** Syntax highlighting theme for LogicGate pseudocode (Atom One Dark–style). */
export const logicgatePseudocodeStyle: Record<string, CSSProperties> = {
  hljs: {
    display: "block",
    overflowX: "auto",
    padding: 0,
    background: "transparent",
    color: "#abb2bf",
  },
  comment: { color: "#5c6370", fontStyle: "italic" },
  keyword: { color: "#61afef" },
  built_in: { color: "#98c379" },
  function: { color: "#98c379" },
  title: { color: "#98c379" },
  string: { color: "#e5c07b" },
  number: { color: "#d19a66" },
  literal: { color: "#d19a66" },
  params: { color: "#d19a66" },
  attr: { color: "#e5c07b" },
};
