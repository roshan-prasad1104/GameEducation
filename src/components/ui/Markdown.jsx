import { Fragment } from 'react';

/**
 * Renders the small Markdown subset used by lesson content:
 * ## / ### headings, paragraphs, "- " and "1. " lists, **bold** and `code`.
 * Builds React elements (no dangerouslySetInnerHTML), so content cannot inject HTML.
 */
const inline = (text, keyPrefix) => {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    const key = `${keyPrefix}-${i}`;
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={key} className="font-semibold text-slate-900 dark:text-white">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) {
      return <code key={key} className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono text-[0.85em] text-brand-700 dark:text-brand-300">{p.slice(1, -1)}</code>;
    }
    return <Fragment key={key}>{p}</Fragment>;
  });
};

export const Markdown = ({ source }) => {
  const blocks = [];
  const lines = (source ?? '').replace(/\r\n/g, '\n').split('\n');
  let para = [];
  let list = null;

  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if (line.startsWith('### ')) { flushPara(); flushList(); blocks.push({ type: 'h3', text: line.slice(4) }); continue; }
    if (line.startsWith('## ')) { flushPara(); flushList(); blocks.push({ type: 'h2', text: line.slice(3) }); continue; }
    if (line.startsWith('# ')) { flushPara(); flushList(); blocks.push({ type: 'h2', text: line.slice(2) }); continue; }
    if (bullet || numbered) {
      flushPara();
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.type !== type) { flushList(); list = { type, items: [] }; }
      list.items.push((bullet ?? numbered)[1]);
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();

  return (
    <div className="space-y-4 text-[15px] leading-7 text-slate-700 dark:text-slate-300">
      {blocks.map((b, i) => {
        if (b.type === 'h2') return <h2 key={i} className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white pt-2">{inline(b.text, i)}</h2>;
        if (b.type === 'h3') return <h3 key={i} className="text-base font-semibold text-slate-900 dark:text-white pt-1">{inline(b.text, i)}</h3>;
        if (b.type === 'ul') return <ul key={i} className="list-disc pl-5 space-y-1.5 marker:text-brand-400">{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ul>;
        if (b.type === 'ol') return <ol key={i} className="list-decimal pl-5 space-y-1.5 marker:text-brand-500 marker:font-medium">{b.items.map((it, j) => <li key={j}>{inline(it, `${i}-${j}`)}</li>)}</ol>;
        return <p key={i}>{inline(b.text, i)}</p>;
      })}
    </div>
  );
};
