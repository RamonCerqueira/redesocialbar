'use client';
import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/api';
export interface Advertisement { id:string;title:string;description?:string;imageUrl:string;targetUrl?:string;buttonText:string;type:string;sponsorName:string; }
export function SponsoredCard({ placement = 'SPONSORED_POST' }: {placement?:string}) {
  const [ads,setAds]=useState<Advertisement[]>([]);
  useEffect(()=>{let active=true;apiRequest<Advertisement[]>('/ads/restaurant/pirambeira').then(rows=>{if(active)setAds(rows.filter(a=>a.type===placement));}).catch(()=>{if(active)setAds([]);});return()=>{active=false;};},[placement]);
  return <>{ads.map(ad=><article key={ad.id} className="rounded-3xl overflow-hidden border border-white/10 bg-[#16130f] my-4">
    <img src={ad.imageUrl} alt={ad.title} className="w-full max-h-72 object-cover"/>
    <div className="p-4"><span className="text-[10px] uppercase text-amber-400">{ad.sponsorName}</span><h3 className="font-bold text-lg mt-1">{ad.title}</h3>{ad.description&&<p className="text-sm text-stone-400 my-2">{ad.description}</p>}
      {ad.targetUrl&&<a href={ad.targetUrl} target="_blank" rel="noopener noreferrer" onClick={()=>{void apiRequest('/ads/'+ad.id+'/click',{method:'POST'}).catch(()=>undefined);}} className="inline-flex px-4 py-2 bg-amber-400 text-black rounded-xl font-bold text-sm mt-2">{ad.buttonText}</a>}
    </div>
  </article>)}</>;
}
