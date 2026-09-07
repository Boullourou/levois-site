/** Bounded network requests. A successful HTTP status must still contain valid JSON. */
export async function requestJson<T=Record<string,unknown>>(url:string,options:RequestInit={},timeoutMs=30000):Promise<{response:Response;data:T}>{
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),timeoutMs);
 const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});
 try{const response=await fetch(url,{...options,signal:controller.signal});let data:T;try{data=await response.json() as T}catch{throw new Error('Le service a renvoyé une réponse inattendue. Réessayez dans un instant.')}
 return {response,data};}catch(error){if(controller.signal.aborted)throw new Error('Le service met trop de temps à répondre. Vos réponses sont conservées ; vous pouvez réessayer.');throw error;}
 finally{clearTimeout(timer);options.signal?.removeEventListener('abort',abort);}
}
