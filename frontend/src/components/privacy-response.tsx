'use client';
import {useState} from 'react';
import {apiRequest} from '@/lib/api';
export function PrivacyResponse({id,onSaved}:{id:string;onSaved:()=>Promise<void>}) {
 const [response,setResponse]=useState(''),[status,setStatus]=useState('IN_PROGRESS'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="mt-3 space-y-3" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await apiRequest('/legal/admin/requests/'+id,{method:'PATCH',body:JSON.stringify({status,response})});setResponse('');await onSaved();}catch(err){setError(err instanceof Error?err.message:'Não foi possível responder.');}finally{setBusy(false);}}}>
 <select aria-label="Situação do protocolo" value={status} onChange={e=>setStatus(e.target.value)} className="w-full rounded-xl bg-stone-900 p-3"><option value="IN_PROGRESS">Em análise</option><option value="COMPLETED">Concluído</option><option value="REJECTED">Pedido não atendido — explicar motivo</option></select>
 <textarea required maxLength={3000} aria-label="Resposta ao solicitante" placeholder="Informe as providências tomadas e os próximos passos." value={response} onChange={e=>setResponse(e.target.value)} className="w-full rounded-xl bg-stone-900 p-3" />
 <button disabled={busy||!response.trim()} className="rounded-xl bg-amber-400 p-3 font-bold text-black">{busy?'Salvando…':'Registrar resposta e notificar'}</button><p role="alert">{error}</p>
 </form>;
}
