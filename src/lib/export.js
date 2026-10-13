// Table downloads for the dashboard (browser only): CSV, Excel (.xlsx) and PDF (print dialog → "Save as PDF").
//   exportTable('xlsx', { filename: 'club-members', title: 'Club members', columns: [['Name', (r) => r.name], …], rows })
// Getters that return numbers become number cells in Excel.

const today = () => new Date().toISOString().slice(0, 10);

function save(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const cells = (columns, rows) => rows.map((r) => columns.map(([, get]) => get(r) ?? ''));

// ---------- CSV ----------

function toCsv({ columns, rows }) {
  const cell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [columns.map(([h]) => cell(h)).join(','), ...cells(columns, rows).map((r) => r.map(cell).join(','))];
  return new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
}

// ---------- XLSX (a minimal Office Open XML workbook in an uncompressed zip) ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function zip(files, type) {
  const enc = new TextEncoder();
  const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1 Jan 1980
  const parts = [];
  const central = [];
  let offset = 0;
  for (const file of files) {
    const name = enc.encode(file.name);
    const data = enc.encode(file.data);
    const crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(12, DOS_DATE, true);
    local.setUint32(14, crc, true);
    local.setUint32(18, data.length, true);
    local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local, name, data);

    const entry = new DataView(new ArrayBuffer(46));
    entry.setUint32(0, 0x02014b50, true);
    entry.setUint16(4, 20, true);
    entry.setUint16(6, 20, true);
    entry.setUint16(8, 0x0800, true);
    entry.setUint16(14, DOS_DATE, true);
    entry.setUint32(16, crc, true);
    entry.setUint32(20, data.length, true);
    entry.setUint32(24, data.length, true);
    entry.setUint16(28, name.length, true);
    entry.setUint32(42, offset, true);
    central.push(entry, name);
    offset += 30 + name.length + data.length;
  }
  const size = central.reduce((n, p) => n + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, size, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type });
}

// Strips characters XML can't hold, then escapes
const xml = (v) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function colName(i) {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function toXlsx({ columns, rows, title }) {
  const body = cells(columns, rows);
  const cell = (v, r, c, style = 0) => {
    const ref = `${colName(c)}${r + 1}`;
    const s = style ? ` s="${style}"` : '';
    if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  };
  const sheetRows = [
    `<row r="1">${columns.map(([h], c) => cell(h, 0, c, 1)).join('')}</row>`,
    ...body.map((r, i) => `<row r="${i + 2}">${r.map((v, c) => cell(v, i + 1, c)).join('')}</row>`),
  ];
  const widths = columns.map(([h], c) => Math.min(60, Math.max(String(h).length, ...body.slice(0, 500).map((r) => String(r[c] ?? '').length)) + 2));
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  const REL = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const head = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const sheetName = xml(String(title || 'Sheet1').replace(/[[\]:*?/\\]/g, ' ').slice(0, 31));
  return zip(
    [
      {
        name: '[Content_Types].xml',
        data: `${head}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
      },
      { name: '_rels/.rels', data: `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
      { name: 'xl/workbook.xml', data: `${head}<workbook xmlns="${NS}" xmlns:r="${REL}"><sheets><sheet name="${sheetName}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
      {
        name: 'xl/_rels/workbook.xml.rels',
        data: `${head}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/></Relationships>`,
      },
      {
        name: 'xl/styles.xml',
        data: `${head}<styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
      },
      {
        name: 'xl/worksheets/sheet1.xml',
        data: `${head}<worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols><sheetData>${sheetRows.join('')}</sheetData></worksheet>`,
      },
    ],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
}

// ---------- PDF (printable page; the browser's print dialog saves it as PDF) ----------

// `win`: a window opened earlier inside the click handler (pop-up blockers refuse window.open after an await)
function printPdf({ columns, rows, title, win = window.open('', '_blank') }) {
  if (!win) throw new Error('Allow pop-ups for this site to create the PDF.');
  const body = cells(columns, rows);
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${xml(title)} — ${today()}</title><style>
    @page { size: A4 landscape; margin: 12mm; }
    body { font: 10px/1.35 system-ui, -apple-system, 'Segoe UI', sans-serif; color: #111; margin: 0; }
    h1 { font-size: 16px; margin: 0 0 2px; } p { margin: 0 0 10px; color: #555; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 4px 5px; text-align: left; vertical-align: top; word-break: break-word; }
    th { background: #f3f3f3; font-weight: 600; } tr:nth-child(even) td { background: #fafafa; }
    thead { display: table-header-group; } tr { page-break-inside: avoid; }
  </style></head><body><h1>${xml(title)}</h1><p>${rows.length} record${rows.length === 1 ? '' : 's'} · exported ${new Date().toLocaleString('en-GB')}</p>
  <table><thead><tr>${columns.map(([h]) => `<th>${xml(h)}</th>`).join('')}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((v) => `<td>${xml(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  <script>window.onload = () => { window.focus(); window.print(); };</script></body></html>`);
  win.document.close();
}

export const EXPORT_FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel' },
  { value: 'pdf', label: 'PDF' },
];

export function exportTable(format, { filename, title, columns, rows, win }) {
  const name = `${filename}-${today()}`;
  if (format === 'pdf') return printPdf({ columns, rows, title, ...(win && { win }) });
  if (format === 'xlsx') return save(toXlsx({ columns, rows, title }), `${name}.xlsx`);
  return save(toCsv({ columns, rows }), `${name}.csv`);
}
