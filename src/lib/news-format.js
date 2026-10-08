// Converts post bodies between the stored block list and the plain-text format admins type
// in the dashboard editor. Shared by the editor (client) and the API (server).
//
//   ## Heading            ### Sub-heading         > Quote
//   - bullet item         1. numbered item
//   ```Bash               | Col A | Col B |        ![alt text](/news/photo.jpg "Caption")
//   code here             | ----- | ----- |
//   ```                   | a     | b     |
//                         Table: optional caption (line right after the table)
// Blank lines separate blocks. Inline: **bold**, *italic*, `code`, [label](url)

const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/;
const tableRow = (line) => line.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function textToBlocks(text = '') {
  const lines = String(text).replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('```')) {
      flush();
      const code = [];
      for (i++; i < lines.length && !lines[i].trim().startsWith('```'); i++) code.push(lines[i]);
      blocks.push({ type: 'code', lang: line.slice(3).trim(), code: code.join('\n') });
      continue;
    }
    if (!line) { flush(); continue; }
    if (line.startsWith('### ')) { flush(); blocks.push({ type: 'h3', text: line.slice(4).trim() }); continue; }
    if (line.startsWith('## ')) { flush(); blocks.push({ type: 'h2', text: line.slice(3).trim() }); continue; }
    if (line.startsWith('> ')) { flush(); blocks.push({ type: 'quote', text: line.slice(2).trim() }); continue; }

    const image = line.match(IMAGE);
    if (image) { flush(); blocks.push({ type: 'image', alt: image[1], src: image[2], ...(image[3] && { caption: image[3] }) }); continue; }

    const listMatch = line.match(/^([-*]|\d+\.)\s+(.*)$/);
    if (listMatch) {
      flush();
      const type = /\d/.test(listMatch[1]) ? 'ol' : 'ul';
      const items = [listMatch[2]];
      while (i + 1 < lines.length) {
        const next = lines[i + 1].trim().match(/^([-*]|\d+\.)\s+(.*)$/);
        if (!next || /\d/.test(next[1]) !== (type === 'ol')) break;
        items.push(next[2]);
        i++;
      }
      blocks.push({ type, items });
      continue;
    }

    if (line.startsWith('|')) {
      flush();
      const rows = [];
      for (; i < lines.length && lines[i].trim().startsWith('|'); i++) {
        const cells = tableRow(lines[i].trim());
        if (!cells.every((c) => /^:?-{2,}:?$/.test(c))) rows.push(cells);
      }
      const [headers = [], ...body] = rows;
      const block = { type: 'table', headers, rows: body };
      if (i < lines.length && /^table:/i.test(lines[i].trim())) block.caption = lines[i].trim().slice(6).trim();
      else i--;
      blocks.push(block);
      continue;
    }

    para.push(line);
  }
  flush();
  return blocks;
}

export function blocksToText(blocks = []) {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'h2': return `## ${b.text}`;
        case 'h3': return `### ${b.text}`;
        case 'quote': return `> ${b.text}`;
        case 'ul': return (b.items || []).map((item) => `- ${item}`).join('\n');
        case 'ol': return (b.items || []).map((item, n) => `${n + 1}. ${item}`).join('\n');
        case 'code': return `\`\`\`${b.lang || ''}\n${b.code || ''}\n\`\`\``;
        case 'image': return `![${b.alt || ''}](${b.src}${b.caption ? ` "${b.caption}"` : ''})`;
        case 'table': {
          const row = (cells) => `| ${cells.join(' | ')} |`;
          const lines = [row(b.headers || []), row((b.headers || []).map(() => '---')), ...(b.rows || []).map(row)];
          if (b.caption) lines.push(`Table: ${b.caption}`);
          return lines.join('\n');
        }
        default: return b.text || '';
      }
    })
    .join('\n\n');
}

// Event guests ⇄ one line per person: "Group | Name | Title"
export function textToGuests(text = '') {
  const groups = [];
  for (const line of String(text).split('\n')) {
    const [group, name, title = ''] = line.split('|').map((s) => s.trim());
    if (!group || !name) continue;
    let entry = groups.find((g) => g.group === group);
    if (!entry) groups.push((entry = { group, people: [] }));
    entry.people.push({ name, title });
  }
  return groups;
}

export function guestsToText(guests = []) {
  return guests.flatMap((g) => g.people.map((p) => [g.group, p.name, p.title].filter((v, i) => v || i < 2).join(' | '))).join('\n');
}
