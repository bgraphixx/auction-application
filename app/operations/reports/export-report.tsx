"use client";

export default function ExportReport({ rows }: { rows: (string | number)[][] }) {
  function download() {
    const escape = (value: string | number) => {
      const text = String(value);
      const safe = typeof value === "string" && /^[=+@\-\t\r]/.test(text) ? `'${text}` : text;
      return `"${safe.replaceAll('"', '""')}"`;
    };
    const url = URL.createObjectURL(new Blob(["\uFEFF", rows.map(row => row.map(escape).join(",")).join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "fewchore-disposal-report.csv"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <button className="primary-button" onClick={download}>Export report</button>;
}
