function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inline(value: string): string {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" rel="noopener noreferrer">$1</a>',
    );
}

export function renderBlogBody(markdown: string): string {
  const blocks = markdown.replace(/\r\n/g, '\n').trim().split(/\n{2,}/);
  const html: string[] = [];

  for (const raw of blocks) {
    const block = raw.trim();
    if (!block) continue;

    if (block.startsWith('### ')) {
      html.push(`<h3>${inline(block.slice(4))}</h3>`);
      continue;
    }
    if (block.startsWith('## ')) {
      html.push(`<h2>${inline(block.slice(3))}</h2>`);
      continue;
    }

    const lines = block.split('\n');
    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      const items = lines
        .map((line) => `<li>${inline(line.replace(/^\s*[-*]\s+/, ''))}</li>`)
        .join('');
      html.push(`<ul>${items}</ul>`);
      continue;
    }
    if (lines.every((line) => /^\s*\d+\.\s+/.test(line))) {
      const items = lines
        .map((line) => `<li>${inline(line.replace(/^\s*\d+\.\s+/, ''))}</li>`)
        .join('');
      html.push(`<ol>${items}</ol>`);
      continue;
    }

    html.push(`<p>${inline(lines.join(' '))}</p>`);
  }

  return html.join('\n');
}
