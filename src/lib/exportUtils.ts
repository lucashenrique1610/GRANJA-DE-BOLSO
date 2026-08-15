export function downloadFile(fileName: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function sanitizeSpreadsheetCell(value: string) {
  const trimmedStart = value.trimStart();
  if (/^[=+\-@]/.test(trimmedStart)) {
    return `'${value}`;
  }
  return value;
}

function safeText(value: string | undefined | null) {
  return escapeHtml(String(value ?? ''));
}

function safeSpreadsheetText(value: string | undefined | null) {
  return escapeHtml(sanitizeSpreadsheetCell(String(value ?? '')));
}

export function exportRowsToExcel(fileName: string, headers: string[], rows: string[][]) {
  const table = `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${safeText(header)}</th>`).join('')}</tr>
      </thead>
      <tbody>
        ${rows.map((row) => `<tr>${row.map((cell) => `<td>${safeSpreadsheetText(cell)}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>
  `;

  const html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 16px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background: #eff6ff; }
        </style>
      </head>
      <body>${table}</body>
    </html>
  `;

  downloadFile(`${fileName}.xls`, html, 'application/vnd.ms-excel;charset=utf-8;');
}

export function exportRowsToPdf(title: string, headers: string[], rows: string[][]) {
  const popup = window.open('', '_blank', 'width=1200,height=800');
  if (!popup) {
    window.alert('Não foi possível abrir a janela de impressão para gerar o PDF.');
    return;
  }

  popup.document.write(`
    <html>
      <head>
        <title>${safeText(title)}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
          h1 { font-size: 22px; margin-bottom: 8px; }
          p { color: #6b7280; margin-bottom: 24px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; font-size: 12px; }
          th { background: #eff6ff; }
        </style>
      </head>
      <body>
        <h1>${safeText(title)}</h1>
        <p>Exportado em ${safeText(new Date().toLocaleString('pt-BR'))}</p>
        <table>
          <thead><tr>${headers.map((header) => `<th>${safeText(header)}</th>`).join('')}</tr></thead>
          <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${safeText(cell)}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
      </body>
    </html>
  `);
  popup.document.close();
  popup.focus();
  popup.print();
}
