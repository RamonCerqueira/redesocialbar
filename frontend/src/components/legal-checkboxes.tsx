'use client';
import Link from 'next/link';
export type LegalChoices = { termsAccepted: boolean; privacyAcknowledged: boolean; adultConfirmed: boolean };
export const emptyLegalChoices: LegalChoices = { termsAccepted: false, privacyAcknowledged: false, adultConfirmed: false };
export function LegalCheckboxes({ value, onChange }: { value: LegalChoices; onChange: (value: LegalChoices) => void }) {
  const labels = { termsAccepted: <>Li e aceito os <Link className="text-amber-400 underline" href="/termos" target="_blank">termos de demonstração</Link>.</>, privacyAcknowledged: <>Li a <Link className="text-amber-400 underline" href="/privacidade" target="_blank">política de privacidade de demonstração</Link>. Esta ciência não autoriza qualquer uso dos meus dados.</>, adultConfirmed: <>Declaro ter 18 anos ou mais.</> };
  return <fieldset className="space-y-3 text-sm"><legend className="mb-3 font-semibold">Revisão dos documentos de demonstração</legend>{(Object.keys(labels) as (keyof LegalChoices)[]).map(key => <label key={key} className="flex items-start gap-3"><input type="checkbox" required checked={value[key]} onChange={e => onChange({ ...value, [key]: e.target.checked })} className="mt-1 h-4 w-4 shrink-0 accent-amber-400" /><span>{labels[key]}</span></label>)}</fieldset>;
}
