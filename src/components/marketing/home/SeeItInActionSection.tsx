"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Reveal } from "@/components/marketing/Reveal";
import { CompileOutputPanel } from "@/components/marketing/home/CompileOutputPanel";
import {
  DEFAULT_DEMO_CONDITIONS,
  compileDemo,
  demoFormatFromTabIndex,
  displayOperator,
  displayValue,
  isNumericValue,
  type DemoCondition,
} from "@/lib/marketing/demo-compile";

const FORMAT_TABS = [
  {
    name: "Generic",
    desc: "Human-readable pseudocode",
    badge: "v4.2",
    badgeColor: "var(--text3)",
  },
  {
    name: "SQL",
    desc: "Valid SELECT, ready to run",
    badge: "SQL",
    badgeColor: "var(--accent)",
  },
  {
    name: "Python",
    desc: "pandas function, typed",
    badge: "PY",
    badgeColor: "#60a5fa",
  },
  {
    name: "dbt",
    desc: "Model with jinja + ref()",
    badge: "DBT",
    badgeColor: "#a78bfa",
  },
] as const;

const STATUS_OPTIONS = ["completed", "pending", "failed"] as const;

function parseExcludedTypes(value: string): string {
  try {
    const arr = JSON.parse(value) as string[];
    return arr.join(", ");
  } catch {
    return value.replace(/[\[\]"]/g, "");
  }
}

function toExcludedJson(raw: string): string {
  const items = raw
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
  return JSON.stringify(items);
}

type ConditionRowProps = {
  row: DemoCondition;
  onChange: (id: string, patch: Partial<DemoCondition>) => void;
};

function ConditionRow({ row, onChange }: ConditionRowProps) {
  const isIf = row.connector === "IF";

  return (
    <div
      className="demo-condition-row"
      style={{ display: "flex", gap: 9, marginBottom: 8, alignItems: "center" }}
    >
      <span
        className="marketing-mono"
        style={{
          width: 22,
          height: 22,
          flexShrink: 0,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 5,
          fontSize: 9,
          fontWeight: 600,
          background: isIf ? "rgba(96,165,250,0.12)" : "rgba(167,139,250,0.12)",
          color: isIf ? "#60a5fa" : "#a78bfa",
        }}
      >
        {row.connector}
      </span>
      <div className="demo-condition-pill marketing-mono">
        <span className="demo-condition-field">{row.field}</span>
        <span className="demo-condition-op">{displayOperator(row.operator)}</span>

        {row.id === "status" ? (
          <select
            className="demo-condition-select"
            value={row.value}
            aria-label="Status value"
            onChange={(e) =>
              onChange(row.id, { value: e.target.value, valueType: "STRING" })
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                &quot;{opt}&quot;
              </option>
            ))}
          </select>
        ) : null}

        {row.id === "type" ? (
          <input
            className="demo-condition-input"
            type="text"
            value={parseExcludedTypes(row.value)}
            aria-label="Excluded transaction types"
            onChange={(e) =>
              onChange(row.id, {
                value: toExcludedJson(e.target.value),
                valueType: "ARRAY",
              })
            }
          />
        ) : null}

        {row.id === "is_internal" ? (
          <select
            className="demo-condition-select is-bool"
            value={row.value}
            aria-label="Internal flag"
            onChange={(e) =>
              onChange(row.id, { value: e.target.value, valueType: "BOOLEAN" })
            }
          >
            <option value="false">false</option>
            <option value="true">true</option>
          </select>
        ) : null}

        {row.id === "amount" ? (
          <input
            className="demo-condition-input is-num"
            type="number"
            min={0}
            step={1}
            value={row.value}
            aria-label="Minimum amount"
            onChange={(e) =>
              onChange(row.id, { value: e.target.value, valueType: "NUMBER" })
            }
          />
        ) : null}

        {row.id !== "status" &&
        row.id !== "type" &&
        row.id !== "is_internal" &&
        row.id !== "amount" ? (
          <span style={{ color: isNumericValue(row) ? "#a78bfa" : "var(--accent)" }}>
            {displayValue(row)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function SeeItInActionSection() {
  const [conditions, setConditions] = useState<DemoCondition[]>(
    DEFAULT_DEMO_CONDITIONS
  );
  const [activeTab, setActiveTab] = useState(0);
  const [compileToken, setCompileToken] = useState(0);
  const debouncedConditions = useDebouncedValue(conditions, 180);

  const active = FORMAT_TABS[activeTab];
  const compiledCode = useMemo(
    () => compileDemo(debouncedConditions, activeTab),
    [debouncedConditions, activeTab]
  );
  const compileFormat = demoFormatFromTabIndex(activeTab);

  useEffect(() => {
    setCompileToken((t) => t + 1);
  }, [debouncedConditions, activeTab]);

  const updateCondition = useCallback(
    (id: string, patch: Partial<DemoCondition>) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    []
  );

  const handleTabChange = useCallback((index: number) => {
    setActiveTab(index);
  }, []);

  return (
    <section id="action" className="marketing-section-container">
      <Reveal>
        <p className="marketing-eyebrow">SEE IT IN ACTION</p>
      </Reveal>
      <Reveal>
        <h2 className="marketing-section-h2">Define once. Compile to anything.</h2>
      </Reveal>
      <Reveal>
        <p className="marketing-section-body" style={{ maxWidth: 560 }}>
          A definition built visually compiles to four formats — always in sync with
          the latest approved version. Edit a filter below to recompile live.
        </p>
      </Reveal>

      <div
        className="action-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginTop: 52,
        }}
      >
        <Reveal>
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg3)",
                borderBottom: "1px solid var(--border)",
                padding: "13px 16px",
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                Monthly Active Revenue
              </span>
              <span
                className="marketing-mono"
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: "var(--text3)",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "3px 8px",
                }}
              >
                v4.2
              </span>
            </div>
            <div style={{ padding: 16 }}>
              {conditions.map((row) => (
                <ConditionRow key={row.id} row={row} onChange={updateCondition} />
              ))}
              <div
                className="marketing-mono"
                style={{
                  marginTop: 10,
                  fontSize: 11,
                  background: "var(--bg3)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "9px 12px",
                  color: "var(--text2)",
                }}
              >
                Aggregation: <span style={{ color: "#60a5fa" }}>SUM(amount_usd)</span>
                {" · "}
                Group by: <span style={{ color: "#fbbf24" }}>calendar_month</span>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div
            style={{
              background: "var(--bg2)",
              border: "1px solid var(--border)",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--bg3)",
                borderBottom: "1px solid var(--border)",
                padding: "13px 16px",
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontSize: "12.5px",
                  fontWeight: 500,
                  color: "var(--text)",
                }}
              >
                Compiled output
              </span>
              <span
                className="marketing-mono"
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  color: active.badgeColor,
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: "3px 8px",
                  transition: "color 0.25s ease",
                }}
              >
                {active.badge}
              </span>
            </div>
            <div style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-inter), "Inter", sans-serif',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--text3)",
                  }}
                >
                  AUTO-GENERATED
                </span>
              </div>
              <div
                style={{
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: 7,
                  padding: "14px 16px",
                }}
              >
                <CompileOutputPanel
                  code={compiledCode}
                  format={compileFormat}
                  compileToken={compileToken}
                />
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      <div
        className="format-tabs-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 10,
          marginTop: 20,
        }}
      >
        {FORMAT_TABS.map((tab, i) => (
          <Reveal key={tab.name}>
            <button
              type="button"
              className={`format-tab${activeTab === i ? " is-active" : ""}`}
              onClick={() => handleTabChange(i)}
              aria-pressed={activeTab === i}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "var(--text3)",
                  marginBottom: 8,
                }}
              >
                FORMAT
              </span>
              <span
                className="format-tab-name"
                style={{
                  display: "block",
                  fontFamily: 'var(--font-jetbrains), "JetBrains Mono", ui-monospace, monospace',
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--text)",
                  marginBottom: 6,
                }}
              >
                {tab.name}
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: 'var(--font-inter), "Inter", sans-serif',
                  fontSize: "11.5px",
                  color: "var(--text2)",
                  lineHeight: 1.45,
                }}
              >
                {tab.desc}
              </span>
            </button>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
