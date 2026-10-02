'use client';
import {RefObject,useEffect} from 'react';
import {apiRequest} from './api';
export function useAdImpression(id:string|undefined,root:RefObject<HTMLElement|null>) {
 useEffect(()=>{
  const el=root.current;if(!id||!el)return;
  const key='piramba-ad-view:'+id;
  try{if(sessionStorage.getItem(key))return;}catch{}
  let timer:ReturnType<typeof setTimeout>|undefined,visible=false,sent=false;
  const cancel=()=>{if(timer)clearTimeout(timer);timer=undefined;};
  const check=()=>{cancel();if(!visible||document.hidden||sent)return;timer=setTimeout(()=>{sent=true;void apiRequest('/ads/'+id+'/impression',{method:'POST'}).then(()=>{try{sessionStorage.setItem(key,'1');}catch{}}).catch(()=>{sent=false;});},1000);};
  const observer=new IntersectionObserver(([entry])=>{visible=entry.intersectionRatio>=.5;check();},{threshold:[.5]});observer.observe(el);document.addEventListener('visibilitychange',check);
  return()=>{cancel();observer.disconnect();document.removeEventListener('visibilitychange',check);};
 },[id,root]);
}
