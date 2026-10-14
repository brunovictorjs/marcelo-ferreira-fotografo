const escape = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

export interface EmailContent {
  heading: string;
  paragraphs: string[];
  rows?: [label: string, value: string][];
  button?: { label: string; url: string };
  footnote?: string;
}

/** Template único dos e-mails, na identidade visual do site (preto + prata). */
export function renderEmail(content: EmailContent): { html: string; text: string } {
  const rows = (content.rows ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 0;color:#a6a6a6;font-size:11px;letter-spacing:2px;text-transform:uppercase;width:140px;vertical-align:top">${escape(label)}</td><td style="padding:8px 0;color:#f2f2f2;font-size:15px;white-space:pre-line">${escape(value)}</td></tr>`,
    )
    .join('');
  const button = content.button
    ? `<p style="margin:32px 0"><a href="${escape(content.button.url)}" style="background:#f2f2f2;color:#0a0a0a;text-decoration:none;font-weight:700;letter-spacing:1px;padding:14px 22px;border-radius:4px;display:inline-block">${escape(content.button.label)}</a></p>`
    : '';
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#0a0a0a;font-family:Montserrat,Helvetica,Arial,sans-serif">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;color:#f2f2f2">
<p style="margin:0 0 32px;font-size:11px;letter-spacing:4px;color:#a6a6a6">MARCELO FERREIRA FOTOGRAFIA</p>
<h1 style="margin:0 0 24px;font-size:26px;line-height:1.2">${escape(content.heading)}</h1>
${content.paragraphs.map((p) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#d4d4d4">${escape(p)}</p>`).join('')}
${rows ? `<table style="width:100%;border-top:1px solid #3a3a3a;border-bottom:1px solid #3a3a3a;margin:24px 0">${rows}</table>` : ''}
${button}
${content.footnote ? `<p style="margin:32px 0 0;font-size:12px;color:#7a7a7a">${escape(content.footnote)}</p>` : ''}
</div></body></html>`;

  const text = [
    content.heading,
    '',
    ...content.paragraphs,
    ...(content.rows ?? []).map(([l, v]) => `${l}: ${v}`),
    ...(content.button ? ['', `${content.button.label}: ${content.button.url}`] : []),
    ...(content.footnote ? ['', content.footnote] : []),
  ].join('\n');

  return { html, text };
}
