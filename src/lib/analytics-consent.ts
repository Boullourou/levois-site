export const ANALYTICS_CONSENT_KEY='levois.analytics.v1';
export type AnalyticsChoice='accepted'|'refused';
const MAX_AGE=180*24*60*60*1000;
export function readAnalyticsChoice(raw:string|null,now=Date.now()):AnalyticsChoice|null{
 try{const v=JSON.parse(raw||'null');return v&&(v.choice==='accepted'||v.choice==='refused')&&Number.isFinite(v.at)&&v.at<=now&&now-v.at<MAX_AGE?v.choice:null}catch{return null}
}
export function writeAnalyticsChoice(choice:AnalyticsChoice,now=Date.now()){return JSON.stringify({choice,at:now})}
