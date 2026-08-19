function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export interface EmailDetailRow {
  label: string;
  value: string;
}

function detailsTable(rows: EmailDetailRow[]) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:20px 0;">
      ${rows
        .map(
          (row, i) => `
        <tr>
          <td style="padding:10px 0;border-top:${i === 0 ? "none" : "1px solid #ece3d8"};color:#8a7360;font-size:13px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;width:110px;vertical-align:top;">${escapeHtml(row.label)}</td>
          <td style="padding:10px 0;border-top:${i === 0 ? "none" : "1px solid #ece3d8"};color:#3a2d22;font-size:14px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-weight:600;text-align:right;">${escapeHtml(row.value)}</td>
        </tr>`
        )
        .join("")}
    </table>
  `;
}

export function renderEmailShell(options: { preheader: string; heading: string; intro: string; rows: EmailDetailRow[]; footerNote: string }) {
  const { preheader, heading, intro, rows, footerNote } = options;
  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(heading)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5efe7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f5efe7;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5efe7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #ece3d8;">
            <tr>
              <td style="background-color:#5c3b23;padding:24px 28px;">
                <span style="color:#f5efe7;font-size:18px;font-weight:700;letter-spacing:-0.2px;">☕ BeansleyCoffee</span>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 8px;font-size:20px;color:#2b2117;">${escapeHtml(heading)}</h1>
                <p style="margin:0;font-size:14px;color:#6b5a4a;line-height:1.5;">${intro}</p>
                ${detailsTable(rows)}
                <p style="margin:0;font-size:12px;color:#9c8a76;line-height:1.5;">${escapeHtml(footerNote)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

export function renderEmailShellText(options: { heading: string; intro: string; rows: EmailDetailRow[]; footerNote: string }) {
  const { heading, intro, rows, footerNote } = options;
  return [heading, "", intro, "", ...rows.map((r) => `${r.label}: ${r.value}`), "", footerNote].join("\n");
}
