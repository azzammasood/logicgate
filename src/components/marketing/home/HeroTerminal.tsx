export function HeroTerminal() {
  return (
    <div
      className="hero-fade-up hero-fade-up-4"
      style={{
        marginTop: 60,
        maxWidth: 800,
        width: "100%",
        background: "#12151e",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        overflow: "hidden",
        boxShadow:
          "0 32px 72px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)",
        textAlign: "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          background: "#181c27",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          padding: "11px 16px",
          position: "relative",
        }}
      >
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff5f57" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#febc2e" }} />
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#28c840" }} />
        <span
          className="marketing-mono"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 11,
            color: "#4a5268",
            whiteSpace: "nowrap",
          }}
        >
          monthly_active_revenue — compiled output
        </span>
      </div>
      <pre
        className="marketing-mono"
        style={{
          margin: 0,
          padding: "22px 26px",
          fontSize: "12.5px",
          lineHeight: 2,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <code>
          <span style={{ color: "#4a5268" }}>
            -- Auto-compiled by LogicGate · v4.2 · Owner: Ayesha R.
            {"\n"}
          </span>
          <span style={{ color: "#4ade80" }}>DEFINE </span>
          <span style={{ color: "#60a5fa" }}>monthly_active_revenue</span>
          <span style={{ color: "#eef0f6" }}>(</span>
          <span style={{ color: "#fbbf24" }}>month</span>
          <span style={{ color: "#eef0f6" }}>):</span>
          {"\n  "}
          <span style={{ color: "#4ade80" }}>FROM </span>
          <span style={{ color: "#eef0f6" }}>transactions</span>
          {"\n  "}
          <span style={{ color: "#4ade80" }}>WHERE</span>
          {"\n    "}
          <span style={{ color: "#eef0f6" }}>status = </span>
          <span style={{ color: "#fbbf24" }}>&quot;completed&quot;</span>
          {"\n    "}
          <span style={{ color: "#4ade80" }}>AND </span>
          <span style={{ color: "#eef0f6" }}>type </span>
          <span style={{ color: "#4ade80" }}>NOT IN </span>
          <span style={{ color: "#fbbf24" }}>[&quot;refund&quot;, &quot;chargeback&quot;]</span>
          {"\n    "}
          <span style={{ color: "#4ade80" }}>AND </span>
          <span style={{ color: "#eef0f6" }}>is_internal = </span>
          <span style={{ color: "#a78bfa" }}>false</span>
          {"\n    "}
          <span style={{ color: "#4ade80" }}>AND </span>
          <span style={{ color: "#eef0f6" }}>amount_usd &gt; </span>
          <span style={{ color: "#a78bfa" }}>0</span>
          {"\n  "}
          <span style={{ color: "#4ade80" }}>RETURN </span>
          <span style={{ color: "#60a5fa" }}>SUM</span>
          <span style={{ color: "#eef0f6" }}>(amount_usd) </span>
          <span style={{ color: "#4ade80" }}>GROUP BY </span>
          <span style={{ color: "#fbbf24" }}>calendar_month</span>
          {"\n  "}
          <span style={{ color: "#8892a4" }}>
            → Updated by Ayesha R. · Approved by Dawood L.
          </span>
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 13,
              marginLeft: 2,
              verticalAlign: "text-bottom",
              background: "#4ade80",
              animation: "marketing-blink 1s step-end infinite",
            }}
            aria-hidden
          />
        </code>
      </pre>
    </div>
  );
}
