import {useEffect,useRef,useState} from 'react';
import {ArrowDown,RefreshCw} from 'lucide-react';
import {PullGesture} from '../pull';

export function PullToRefresh({enabled,onRefresh}:{enabled:boolean;onRefresh:()=>Promise<void>}){
  const [distance,setDistance]=useState(0),[refreshing,setRefreshing]=useState(false);
  const current=useRef({enabled,onRefresh}),busy=useRef(false);
  current.current={enabled,onRefresh};
  useEffect(()=>{
    const gesture=new PullGesture();
    const reset=()=>{gesture.cancel();setDistance(0);};
    const blocked=()=>!current.current.enabled||busy.current||!!document.querySelector('dialog[open],.sidebar.open');
    const start=(event:TouchEvent)=>{
      reset();
      if(blocked()||event.touches.length!==1||window.scrollY>0)return;
      const target=event.target instanceof Element?event.target:null;
      if(!target||!target.closest('.main-content,.topbar')||target.closest('button,a,input,textarea,select,[contenteditable],.tiptap'))return;
      // Leave scrolling inside editors, menus and other nested panels alone.
      for(let el:Element|null=target;el&&el!==document.body;el=el.parentElement){
        if(el.scrollHeight>el.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(el).overflowY))return;
      }
      gesture.begin(event.touches[0].clientX,event.touches[0].clientY);
    };
    const move=(event:TouchEvent)=>{
      if(blocked()||event.touches.length!==1||window.scrollY>0){reset();return;}
      const next=gesture.move(event.touches[0].clientX,event.touches[0].clientY);
      if(next>0){if(!event.cancelable){reset();return;}event.preventDefault();}
      setDistance(next);
    };
    const end=()=>{
      const ready=gesture.end();setDistance(0);
      if(!ready||blocked())return;
      busy.current=true;setRefreshing(true);
      void current.current.onRefresh().finally(()=>{busy.current=false;setRefreshing(false);});
    };
    document.addEventListener('touchstart',start,{passive:true});
    document.addEventListener('touchmove',move,{passive:false});
    document.addEventListener('touchend',end);
    document.addEventListener('touchcancel',reset);
    return()=>{document.removeEventListener('touchstart',start);document.removeEventListener('touchmove',move);document.removeEventListener('touchend',end);document.removeEventListener('touchcancel',reset);};
  },[]);
  if(!distance&&!refreshing)return null;
  return <div className="pull-refresh" role="status" style={{top:refreshing?80:Math.min(100,distance)}}>
    {refreshing?<RefreshCw size={19} className="spin"/>:<ArrowDown size={19} style={{transform:`rotate(${distance>=72?180:0}deg)`}}/>}
    <span>{refreshing?'جاري التحديث…':distance>=72?'اتركي للتحديث':'اسحبي للأسفل للتحديث'}</span>
  </div>;
}
