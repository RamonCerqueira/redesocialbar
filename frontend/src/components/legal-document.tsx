import Link from 'next/link';
import documents from '@/lib/legal-documents.json';
export function LegalDocument({ type }: { type: 'terms' | 'privacy' }) {
  const document = documents[type];
  return <article className="space-y-6 py-6 text-sm leading-relaxed text-stone-300">
    <h1 className="text-2xl font-bold text-white">{document.title}</h1>
    <p className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-amber-200">{documents.notice}</p>
    <dl className="space-y-2"><dt>Responsável fictício</dt><dd>{documents.operator}</dd><dd>{documents.taxId}</dd><dd>{documents.address}</dd><dd>{documents.contact}</dd><dd>Versão: {documents.version}</dd></dl>
    {document.sections.map(section => <section key={section.title} className="space-y-3"><h2 className="text-lg font-semibold text-white">{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</section>)}
    <Link href="/central-de-privacidade" className="block text-amber-400 underline">Central de privacidade e solicitações</Link>
  </article>;
}
