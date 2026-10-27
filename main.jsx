import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Line, Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  Filler, Tooltip, Legend, ArcElement, BarElement
} from 'chart.js'
import {
  Activity, BatteryCharging, BatteryFull, Bluetooth, ChartNoAxesCombined,
  CircleHelp, Download, FileUp, Headphones, Plus, Smartphone, Trash2,
  Zap, RotateCcw, Clock3, ChevronRight, X, ShieldCheck, Waves, Cpu, Menu
} from 'lucide-react'
import './styles.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend, ArcElement, BarElement)

const STORAGE = 'battery-lab-v1'
const nowISO = () => new Date().toISOString()
const fmtTime = (iso) => new Date(iso).toLocaleString('fr-CH', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-CH', { day:'2-digit', month:'short', year:'numeric' })
const uid = () => Math.random().toString(36).slice(2, 10)
const demoData = () => {
  const t = Date.now()
  const ago = (h) => new Date(t - h*3600000).toISOString()
  return {
    demo: true,
    devices: [
      {id:'iphone', name:'iPhone XR', kind:'Téléphone', model:'Apple iPhone XR', color:'cyan', capacity:'2942 mAh', mode:'Manuel', createdAt:ago(40)},
      {id:'sony', name:'Casque Sony', kind:'Casque audio', model:'Sony · modèle à préciser', color:'violet', capacity:'À préciser', mode:'Manuel', createdAt:ago(31)}
    ],
    cycles: [
      {id:'cy1', deviceId:'iphone', startAt:ago(18), startPct:100, endAt:null, endPct:null, note:'Cycle de démonstration'},
      {id:'cy2', deviceId:'sony', startAt:ago(20), startPct:100, endAt:null, endPct:null, note:'Cycle de démonstration'}
    ],
    readings: [
      {id:'r1', deviceId:'iphone', cycleId:'cy1', at:ago(18), pct:100, activity:'Recharge complète', note:'Exemple fictif'},
      {id:'r2', deviceId:'iphone', cycleId:'cy1', at:ago(15), pct:91, activity:'Messages et navigation', note:'Exemple fictif'},
      {id:'r3', deviceId:'iphone', cycleId:'cy1', at:ago(11), pct:78, activity:'Réseaux sociaux', note:'Exemple fictif'},
      {id:'r4', deviceId:'iphone', cycleId:'cy1', at:ago(6), pct:61, activity:'Vidéo et musique', note:'Exemple fictif'},
      {id:'r5', deviceId:'iphone', cycleId:'cy1', at:ago(2), pct:48, activity:'Utilisation mixte', note:'Exemple fictif'},
      {id:'r6', deviceId:'sony', cycleId:'cy2', at:ago(20), pct:100, activity:'Recharge complète', note:'Exemple fictif'},
      {id:'r7', deviceId:'sony', cycleId:'cy2', at:ago(16), pct:92, activity:'Écoute musicale', note:'Exemple fictif'},
      {id:'r8', deviceId:'sony', cycleId:'cy2', at:ago(12), pct:83, activity:'Musique + réduction de bruit', note:'Exemple fictif'},
      {id:'r9', deviceId:'sony', cycleId:'cy2', at:ago(7), pct:71, activity:'Écoute musicale', note:'Exemple fictif'}
    ]
  }
}
const emptyData = () => ({demo:false, devices:[], cycles:[], readings:[]})
function loadData() {
  try { const raw = localStorage.getItem(STORAGE); if(raw) return JSON.parse(raw) } catch {}
  return demoData()
}
function drainStats(readings) {
  const sorted = [...readings].sort((a,b)=>new Date(a.at)-new Date(b.at))
  if(sorted.length < 2) return {drain:0, hours:0, rate:0}
  const first=sorted[0], last=sorted[sorted.length-1]
  const hours=Math.max(0,(new Date(last.at)-new Date(first.at))/3600000)
  const drain=Math.max(0,first.pct-last.pct)
  return {drain, hours, rate:hours ? drain/hours : 0}
}
function App() {
  const [data,setData] = useState(loadData)
  const [page,setPage] = useState('overview')
  const [activeDevice,setActiveDevice] = useState('all')
  const [modal,setModal] = useState('')
  const [toast,setToast] = useState('')
  const [showSample,setShowSample] = useState(true)
  const fileRef=useRef(null)
  const [readingForm,setReadingForm]=useState({deviceId:'',pct:'',activity:'',note:''})
  const [deviceForm,setDeviceForm]=useState({name:'',kind:'Casque audio',model:'',capacity:''})
  const [cycleForm,setCycleForm]=useState({deviceId:'',pct:'100',note:''})
  useEffect(()=>{ try{localStorage.setItem(STORAGE,JSON.stringify(data))}catch{} },[data])
  useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),3000);return()=>clearTimeout(t)}},[toast])
  const devices=data.devices
  const visibleReadings=useMemo(()=>data.readings.filter(r=>activeDevice==='all'||r.deviceId===activeDevice),[data,activeDevice])
  const activeCycles=data.cycles.filter(c=>!c.endAt)
  const totalDrain=devices.reduce((sum,d)=>{const rs=data.readings.filter(r=>r.deviceId===d.id).sort((a,b)=>new Date(a.at)-new Date(b.at));return sum+(rs.length>1?Math.max(0,rs[0].pct-rs[rs.length-1].pct):0)},0)
  const latestFor=(id)=>data.readings.filter(r=>r.deviceId===id).sort((a,b)=>new Date(b.at)-new Date(a.at))[0]
  const statsFor=(id)=>drainStats(data.readings.filter(r=>r.deviceId===id))
  const currentPct=(id)=>latestFor(id)?.pct ?? null
  const update=(fn)=>setData(prev=>fn(prev))
  function addReading(e){
    e.preventDefault()
    const pct=Number(readingForm.pct), device=devices.find(d=>d.id===readingForm.deviceId)
    if(!device||!Number.isFinite(pct)||pct<0||pct>100){setToast('Choisis un appareil et un niveau entre 0 et 100 %.');return}
    let cycle=data.cycles.filter(c=>c.deviceId===device.id&&!c.endAt).sort((a,b)=>new Date(b.startAt)-new Date(a.startAt))[0]
    if(!cycle){cycle={id:uid(),deviceId:device.id,startAt:nowISO(),startPct:pct,endAt:null,endPct:null,note:'Cycle créé automatiquement'};update(p=>({...p,cycles:[...p.cycles,cycle]}))}
    const item={id:uid(),deviceId:device.id,cycleId:cycle.id,at:nowISO(),pct,activity:readingForm.activity.trim()||'Utilisation non précisée',note:readingForm.note.trim()}
    update(p=>({...p,readings:[...p.readings,item],demo:false}))
    setReadingForm({deviceId:device.id,pct:'',activity:'',note:''});setModal('');setToast('Relevé enregistré ✓')
  }
  function addDevice(e){
    e.preventDefault()
    if(!deviceForm.name.trim()){setToast('Donne un nom à ton appareil.');return}
    const d={id:uid(),name:deviceForm.name.trim(),kind:deviceForm.kind,model:deviceForm.model.trim()||'Modèle non précisé',capacity:deviceForm.capacity.trim()||'À préciser',color:deviceForm.kind==='Téléphone'?'cyan':'violet',mode:'Manuel',createdAt:nowISO()}
    update(p=>({...p,devices:[...p.devices,d],demo:false}))
    setDeviceForm({name:'',kind:'Casque audio',model:'',capacity:''});setModal('');setToast('Appareil ajouté ✓')
  }
  function startCycle(e){
    e.preventDefault()
    const d=devices.find(x=>x.id===cycleForm.deviceId), pct=Number(cycleForm.pct)
    if(!d||pct<0||pct>100||!Number.isFinite(pct)){setToast('Vérifie l’appareil et le pourcentage.');return}
    update(p=>{
      const cycles=p.cycles.map(c=>c.deviceId===d.id&&!c.endAt?({...c,endAt:nowISO(),endPct:p.readings.filter(r=>r.cycleId===c.id).sort((a,b)=>new Date(b.at)-new Date(a.at))[0]?.pct??c.startPct}):c)
      const c={id:uid(),deviceId:d.id,startAt:nowISO(),startPct:pct,endAt:null,endPct:null,note:cycleForm.note.trim()}
      return {...p,cycles:[...cycles,c],readings:[...p.readings,{id:uid(),deviceId:d.id,cycleId:c.id,at:nowISO(),pct,activity:'Début de cycle / recharge',note:'Nouveau cycle'}],demo:false}
    })
    setModal('');setToast('Nouveau cycle démarré. L’historique est conservé.')
  }
  function deleteReading(id){update(p=>({...p,readings:p.readings.filter(r=>r.id!==id),demo:false}));setToast('Relevé supprimé.')}
  function resetDemo(){if(confirm('Supprimer les données actuelles et démarrer avec un espace vide ? Pense à exporter une sauvegarde.')){setData(emptyData());setToast('Espace réinitialisé. Aucun relevé fictif conservé.')}}
  function exportJSON(){
    const blob=new Blob([JSON.stringify({...data,exportedAt:nowISO(),format:'battery-lab-backup-v1'},null,2)],{type:'application/json'})
    downloadBlob(blob,'battery-lab-backup.json')
  }
  function exportCSV(){
    const rows=[['Appareil','Type','Date','Batterie %','Activité','Note','Cycle'],...data.readings.map(r=>[devices.find(d=>d.id===r.deviceId)?.name||'Appareil supprimé',devices.find(d=>d.id===r.deviceId)?.kind||'',r.at,r.pct,r.activity||'',r.note||'',r.cycleId])]
    const csv=rows.map(row=>row.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(';')).join('\r\n')
    downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),'battery-lab-releves.csv')
  }
  function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
  function importJSON(e){
    const file=e.target.files?.[0]; if(!file)return
    const reader=new FileReader()
    reader.onload=()=>{try{const parsed=JSON.parse(reader.result);if(!Array.isArray(parsed.devices)||!Array.isArray(parsed.cycles)||!Array.isArray(parsed.readings))throw new Error();if(confirm('Remplacer les données actuelles par cette sauvegarde ?')){setData({...parsed,demo:false});setToast('Sauvegarde restaurée ✓')}}catch{setToast('Fichier de sauvegarde non reconnu.')} e.target.value=''}
    reader.readAsText(file)
  }
  const chartReadings=visibleReadings.slice().sort((a,b)=>new Date(a.at)-new Date(b.at)).slice(-12)
  const lineData={labels:chartReadings.map(r=>new Date(r.at).toLocaleTimeString('fr-CH',{hour:'2-digit',minute:'2-digit'})),datasets:[{label:'Batterie restante',data:chartReadings.map(r=>r.pct),borderColor:'#5ff7e7',backgroundColor:'rgba(95,247,231,.10)',fill:true,tension:.38,pointRadius:3,pointBackgroundColor:'#d7fffa',borderWidth:2}]}
  const lineOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{backgroundColor:'#111525',borderColor:'#26334a',borderWidth:1,displayColors:false,callbacks:{label:c=>`${c.parsed.y}% de batterie`}}},scales:{x:{grid:{display:false},ticks:{color:'#75829e',maxTicksLimit:5},border:{display:false}},y:{min:0,max:100,grid:{color:'rgba(125,145,180,.10)'},ticks:{color:'#75829e',callback:v=>v+'%'},border:{display:false}}}}
  const barData={labels:devices.map(d=>d.name),datasets:[{label:'Baisse observée (points)',data:devices.map(d=>statsFor(d.id).drain),backgroundColor:devices.map(d=>d.color==='cyan'?'rgba(95,247,231,.8)':'rgba(174,126,255,.8)'),borderRadius:7,borderSkipped:false}]}
  const barOptions={responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{ticks:{color:'#a5b0c9'},grid:{display:false},border:{display:false}},y:{beginAtZero:true,max:100,ticks:{color:'#75829e',callback:v=>v+' pts'},grid:{color:'rgba(125,145,180,.10)'},border:{display:false}}}}
  const titleMap={overview:'Vue d’ensemble',devices:'Mes appareils',cycles:'Cycles de charge',analytics:'Analyse énergétique',settings:'Réglages'}
  const nav=[['overview','Vue d’ensemble',Activity],['devices','Appareils',Cpu],['cycles','Cycles',RotateCcw],['analytics','Analyses',ChartNoAxesCombined],['settings','Réglages',Menu]]
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Zap size={22}/></div><div><div className="brand-name">BATTERY<span>LAB</span></div><div className="brand-sub">NEON ENERGY OBSERVATORY</div></div></div>
      <div className="side-label">LABORATOIRE</div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={`nav-item ${page===id?'active':''}`} onClick={()=>setPage(id)}><Icon size={18}/><span>{label}</span>{page===id&&<span className="nav-pip"/>}</button>)}</nav>
      <div className="side-device-head"><span>APPAREILS</span><button title="Ajouter un appareil" onClick={()=>setModal('device')}><Plus size={15}/></button></div>
      {devices.map(d=><button className={`device-mini ${activeDevice===d.id?'selected':''}`} key={d.id} onClick={()=>{setActiveDevice(d.id);setPage('devices')}}><span className={`device-dot ${d.color}`}/><span>{d.name}</span><b>{currentPct(d.id)===null?'—':currentPct(d.id)+'%'}</b></button>)}
      <div className="sidebar-bottom"><div className="privacy-dot"/><span>Données locales · privées</span></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><Zap size={18}/></div><span>BATTERY<span>LAB</span></span></div><div className="breadcrumb"><span>LAB /</span> {titleMap[page]}</div><div className="top-actions"><span className="live-pill"><i/> LOCAL MODE</span><button className="icon-button" title="Ajouter un relevé" onClick={()=>{setReadingForm(f=>({...f,deviceId:activeDevice==='all'?(devices[0]?.id||''):activeDevice}));setModal('reading')}}><Plus size={18}/></button></div></header>
      {data.demo&&showSample&&<div className="demo-banner"><span className="demo-symbol">i</span><div><b>DONNÉES DE DÉMONSTRATION</b><p>Les graphiques incluent des relevés fictifs pour montrer le fonctionnement. Ils ne proviennent pas de tes appareils.</p></div><button onClick={()=>setShowSample(false)} aria-label="Fermer"><X size={16}/></button></div>}
      <div className="page-heading"><div><div className="eyebrow"><span className="eyebrow-line"/> PERSONAL ENERGY INTELLIGENCE</div><h1>{titleMap[page]}<span className="heading-period">.</span></h1><p>{page==='overview'?'Mesure. Compare. Comprends ce que tes appareils consomment.':page==='devices'?'Tous tes appareils, leurs relevés et leur état de suivi.':page==='cycles'?'Chaque recharge ouvre un nouveau chapitre, sans effacer les précédents.':page==='analytics'?'Transforme les relevés en tendances et en estimations lisibles.':'Préserve tes données et configure ton observatoire.'}</p></div><button className="primary-button" onClick={()=>{setReadingForm(f=>({...f,deviceId:activeDevice==='all'?(devices[0]?.id||''):activeDevice}));setModal('reading')}}><Plus size={17}/> Ajouter un relevé</button></div>
      {page==='overview'&&<><section className="metric-grid">
        <Metric icon={BatteryCharging} label="APPAREILS SUIVIS" value={devices.length} suffix="unités" foot="Dans ton observatoire" tone="cyan"/>
        <Metric icon={Activity} label="BAISSE OBSERVÉE" value={totalDrain} suffix="pts" foot="Somme indicative par appareil" tone="violet"/>
        <Metric icon={RotateCcw} label="CYCLES EN COURS" value={activeCycles.length} suffix="actifs" foot="L’historique reste conservé" tone="pink"/>
        <Metric icon={Clock3} label="RELEVÉS ENREGISTRÉS" value={data.readings.length} suffix="points" foot="Saisis ou importés" tone="amber"/>
      </section>
      <section className="dashboard-grid">
        <div className="panel chart-panel"><PanelTitle kicker="LIVE TELEMETRY" title="Niveau de batterie" extra={activeDevice==='all'?'Tous appareils':devices.find(d=>d.id===activeDevice)?.name}/><div className="chart-wrap"><Line data={lineData} options={lineOptions}/></div><div className="chart-foot"><span><i className="legend-dot cyan"/> Batterie restante</span><span>Derniers {chartReadings.length} relevés visibles</span></div></div>
        <div className="panel device-panel"><PanelTitle kicker="DEVICE STATUS" title="État des appareils"/>{devices.length===0?<Empty title="Aucun appareil" text="Ajoute ton premier appareil pour commencer."/>:devices.map(d=><DeviceCard key={d.id} device={d} pct={currentPct(d.id)} stats={statsFor(d.id)} onClick={()=>{setActiveDevice(d.id);setPage('devices')}}/>)}<button className="subtle-action" onClick={()=>setModal('device')}><Plus size={15}/> Ajouter un appareil</button></div>
      </section>
      <section className="lower-grid"><div className="panel"><PanelTitle kicker="COMPARATIVE DRAIN" title="Baisse observée par appareil"/><div className="chart-wrap small"><Bar data={barData} options={barOptions}/></div><p className="micro-note">Points de pourcentage entre le premier et le dernier relevé disponible. Ce n’est pas une mesure en Wh.</p></div><div className="panel"><PanelTitle kicker="RECENT ACTIVITY" title="Derniers relevés"/><ReadingsList readings={visibleReadings.slice().sort((a,b)=>new Date(b.at)-new Date(a.at)).slice(0,5)} devices={devices} onDelete={deleteReading}/>{visibleReadings.length===0&&<Empty title="Pas encore de relevés" text="Ajoute un relevé pour lancer les analyses."/>}<button className="subtle-action" onClick={()=>setPage('analytics')}>Voir les analyses <ChevronRight size={15}/></button></div></section></>}
      {page==='devices'&&<section className="page-section"><div className="section-toolbar"><div><h2>Inventaire des appareils</h2><p>Les valeurs sont issues des relevés enregistrés.</p></div><button className="secondary-button" onClick={()=>setModal('device')}><Plus size={16}/> Ajouter</button></div>{devices.length===0?<Empty title="Ton labo est prêt" text="Ajoute un téléphone, un casque ou n’importe quel appareil à batterie."/>:<div className="device-grid">{devices.map(d=><div className="panel full-device" key={d.id}><DeviceCard device={d} pct={currentPct(d.id)} stats={statsFor(d.id)} onClick={()=>setActiveDevice(d.id)}/><div className="device-details"><span>MODÈLE <b>{d.model}</b></span><span>CAPACITÉ <b>{d.capacity}</b></span><span>SUIVI <b>Manuel / hybride limité</b></span></div><button className="secondary-button wide" onClick={()=>{setReadingForm(f=>({...f,deviceId:d.id}));setModal('reading')}}><Plus size={15}/> Ajouter un relevé pour cet appareil</button></div>)}</div>}</section>}
      {page==='cycles'&&<section className="page-section"><div className="section-toolbar"><div><h2>Historique des cycles</h2><p>Démarre un cycle après une recharge. Les cycles précédents ne sont jamais écrasés.</p></div><button className="primary-button" onClick={()=>{setCycleForm(f=>({...f,deviceId:activeDevice==='all'?(devices[0]?.id||''):activeDevice}));setModal('cycle')}}><RotateCcw size={16}/> Nouveau cycle</button></div>{data.cycles.length===0?<Empty title="Aucun cycle pour l’instant" text="Démarre un cycle pour commencer à suivre une nouvelle période."/>:<div className="cycle-list">{data.cycles.slice().sort((a,b)=>new Date(b.startAt)-new Date(a.startAt)).filter(c=>activeDevice==='all'||c.deviceId===activeDevice).map(c=>{const d=devices.find(x=>x.id===c.deviceId),rs=data.readings.filter(r=>r.cycleId===c.id).sort((a,b)=>new Date(a.at)-new Date(b.at)),first=rs[0],last=rs[rs.length-1],drain=first&&last?Math.max(0,first.pct-last.pct):0;return <div className="panel cycle-card" key={c.id}><div className="cycle-icon"><RotateCcw size={20}/></div><div className="cycle-main"><div className="cycle-top"><b>{d?.name||'Appareil supprimé'}</b><span className={c.endAt?'status-ended':'status-active'}>{c.endAt?'TERMINÉ':'EN COURS'}</span></div><p>{fmtDate(c.startAt)} · Départ {c.startPct}%{c.endAt?` · Fin ${c.endPct??'—'}%`:''}</p><div className="cycle-progress"><span style={{width:`${Math.max(2,100-(last?.pct??c.startPct))}%`}}/></div><small>{rs.length} relevés · {drain} pts de baisse observée {c.note?`· ${c.note}`:''}</small></div><div className="cycle-drain"><strong>{drain}%</strong><span>BAISSE</span></div></div>})}</div>}</section>}
      {page==='analytics'&&<section className="page-section"><div className="section-toolbar"><div><h2>Analyse des tendances</h2><p>Estimations basées uniquement sur les points enregistrés.</p></div><button className="secondary-button" onClick={exportCSV}><Download size={15}/> Export CSV</button></div><div className="metric-grid"><Metric icon={Waves} label="TAUX MOYEN OBSERVÉ" value={devices.length?Number((devices.reduce((s,d)=>s+statsFor(d.id).rate,0)/devices.length).toFixed(1)):0} suffix="pts/h" foot="Moyenne simple des appareils" tone="cyan"/><Metric icon={BatteryFull} label="APPAREILS AVEC RELEVÉS" value={devices.filter(d=>data.readings.some(r=>r.deviceId===d.id)).length} suffix={`/ ${devices.length}`} foot="Au moins un point de mesure" tone="violet"/><Metric icon={Clock3} label="POINTS DE MESURE" value={data.readings.length} suffix="relevés" foot="Données disponibles localement" tone="pink"/></div><div className="lower-grid"><div className="panel"><PanelTitle kicker="DRAIN RATE" title="Baisse par heure"/><div className="chart-wrap small"><Bar data={{...barData,datasets:[{...barData.datasets[0],data:devices.map(d=>Number(statsFor(d.id).rate.toFixed(2)))}]}} options={{...barOptions,scales:{...barOptions.scales,y:{...barOptions.scales.y,ticks:{...barOptions.scales.y.ticks,callback:v=>v+' pts/h'}}}}}/></div></div><div className="panel"><PanelTitle kicker="ESTIMATED AUTONOMY" title="Autonomie estimée"/>{devices.map(d=>{const s=statsFor(d.id),pct=currentPct(d.id),hours=s.rate>0&&pct!==null?pct/s.rate:null;return <div className="estimate-row" key={d.id}><div><b>{d.name}</b><small>{s.rate>0?'Projection au rythme moyen observé':'Données insuffisantes pour estimer'}</small></div><strong>{hours!==null&&Number.isFinite(hours)?hours<24?`${hours.toFixed(1)} h`:`${(hours/24).toFixed(1)} j`:'—'}</strong></div>})}<p className="micro-note">Projection indicative, pas une promesse d’autonomie. L’usage et les conditions changent le résultat.</p></div></div><div className="panel methodology"><ShieldCheck size={20}/><div><b>Comment lire ces chiffres</b><p>Le taux est calculé entre le premier et le dernier relevé du jeu de données. La batterie peut se décharger de façon non linéaire. Les points de pourcentage ne correspondent pas directement à des Wh ni à une consommation électrique comparable entre appareils.</p></div></div></section>}
      {page==='settings'&&<section className="page-section"><div className="settings-grid"><div className="panel settings-card"><PanelTitle kicker="DATA MANAGEMENT" title="Tes données"/><p>Les relevés sont stockés dans le navigateur de cet appareil. Ils ne se synchronisent pas automatiquement avec d’autres appareils.</p><div className="settings-actions"><button className="secondary-button" onClick={exportJSON}><Download size={16}/> Sauvegarde JSON</button><button className="secondary-button" onClick={()=>fileRef.current?.click()}><FileUp size={16}/> Restaurer une sauvegarde</button><input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={importJSON}/><button className="secondary-button" onClick={exportCSV}><Download size={16}/> Export CSV</button></div></div><div className="panel settings-card"><PanelTitle kicker="DATA HYGIENE" title="Espace de travail"/><p>Les données d’exemple sont signalées. Tu peux démarrer avec une base vide sans perdre la possibilité d’importer une sauvegarde plus tard.</p><div className="settings-actions"><button className="secondary-button" onClick={()=>{if(confirm('Charger les données fictives de démonstration ? Cela remplacera les données actuelles.')){setData(demoData());setToast('Démo chargée. Les données sont fictives.')}}}><Activity size={16}/> Charger la démo</button><button className="danger-button" onClick={resetDemo}><Trash2 size={16}/> Effacer et recommencer</button></div></div><div className="panel settings-card"><PanelTitle kicker="AUTOMATION STATUS" title="Limites d’accès"/><div className="limit-item"><Smartphone size={18}/><div><b>iPhone / iOS</b><p>Safari ne fournit pas l’historique de batterie iOS ni la consommation détaillée par application à une page web ordinaire.</p></div></div><div className="limit-item"><Bluetooth size={18}/><div><b>Casque Bluetooth Sony</b><p>La page web ne peut pas lire arbitrairement la batterie interne du casque. Utilise les relevés visibles dans le téléphone ou l’application Sony.</p></div></div><div className="limit-item"><ShieldCheck size={18}/><div><b>Confidentialité</b><p>Aucun compte ni serveur n’est utilisé par cette version. Effacer les données du navigateur peut effacer l’historique local : exporte une sauvegarde.</p></div></div></div></div></section>}
      <footer className="footer"><span><span className="footer-mark">✳</span> BATTERY LAB <span className="footer-muted">/ Personal energy intelligence</span></span><span>LOCAL-FIRST · v1.0.0</span></footer>
    </main>
    {modal&&<div className="modal-backdrop" onClick={()=>setModal('')}><div className="modal-card" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><div className="eyebrow">LAB INPUT</div><h2>{modal==='reading'?'Nouveau relevé':modal==='device'?'Ajouter un appareil':'Démarrer un cycle'}</h2></div><button className="icon-button" onClick={()=>setModal('')}><X size={18}/></button></div>
      {modal==='reading'&&<form onSubmit={addReading} className="modal-form"><label>Appareil<select required value={readingForm.deviceId} onChange={e=>setReadingForm({...readingForm,deviceId:e.target.value})}><option value="">Choisir un appareil…</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label>Niveau de batterie (%)<div className="range-input"><input required type="number" min="0" max="100" value={readingForm.pct} onChange={e=>setReadingForm({...readingForm,pct:e.target.value})} placeholder="Ex. 76"/><span>%</span></div></label><label>Usage au moment du relevé<input value={readingForm.activity} onChange={e=>setReadingForm({...readingForm,activity:e.target.value})} placeholder="Ex. musique avec réduction de bruit"/></label><label>Note (facultatif)<textarea rows="2" value={readingForm.note} onChange={e=>setReadingForm({...readingForm,note:e.target.value})} placeholder="Volume, ANC, luminosité…"/></label><p className="form-hint"><Clock3 size={14}/> Date et heure enregistrées automatiquement.</p><button className="primary-button full" type="submit">Enregistrer le relevé <ChevronRight size={16}/></button></form>}
      {modal==='device'&&<form onSubmit={addDevice} className="modal-form"><label>Nom affiché<input required value={deviceForm.name} onChange={e=>setDeviceForm({...deviceForm,name:e.target.value})} placeholder="Ex. WH-1000XM5"/></label><label>Catégorie<select value={deviceForm.kind} onChange={e=>setDeviceForm({...deviceForm,kind:e.target.value})}><option>Téléphone</option><option>Casque audio</option><option>Écouteurs</option><option>Montre connectée</option><option>Tablette</option><option>Autre</option></select></label><label>Modèle<input value={deviceForm.model} onChange={e=>setDeviceForm({...deviceForm,model:e.target.value})} placeholder="Ex. Sony WH-1000XM5"/></label><label>Capacité (si connue)<input value={deviceForm.capacity} onChange={e=>setDeviceForm({...deviceForm,capacity:e.target.value})} placeholder="Ex. 500 mAh"/></label><p className="form-hint"><CircleHelp size={14}/> La capacité est facultative. Ne la devine pas si tu ne la connais pas.</p><button className="primary-button full" type="submit">Ajouter à mon labo <ChevronRight size={16}/></button></form>}
      {modal==='cycle'&&<form onSubmit={startCycle} className="modal-form"><label>Appareil<select required value={cycleForm.deviceId} onChange={e=>setCycleForm({...cycleForm,deviceId:e.target.value})}><option value="">Choisir un appareil…</option>{devices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label><label>Niveau après recharge (%)<input required type="number" min="0" max="100" value={cycleForm.pct} onChange={e=>setCycleForm({...cycleForm,pct:e.target.value})}/></label><label>Note du cycle (facultatif)<input value={cycleForm.note} onChange={e=>setCycleForm({...cycleForm,note:e.target.value})} placeholder="Ex. recharge complète"/></label><div className="cycle-warning"><RotateCcw size={16}/> Le cycle actif précédent sera clôturé avec son dernier relevé. Tous les relevés historiques seront conservés.</div><button className="primary-button full" type="submit">Démarrer le nouveau cycle <ChevronRight size={16}/></button></form>}
    </div></div>}
    {toast&&<div className="toast"><span>✦</span>{toast}</div>}
  </div>
}
function Metric({icon:Icon,label,value,suffix,foot,tone}){return <div className={`metric-card tone-${tone}`}><div className="metric-top"><div className="metric-icon"><Icon size={18}/></div><span className="metric-spark">↗</span></div><div className="metric-label">{label}</div><div className="metric-value">{value}<small>{suffix}</small></div><div className="metric-foot">{foot}</div></div>}
function PanelTitle({kicker,title,extra}){return <div className="panel-title"><div><div className="panel-kicker">{kicker}</div><h3>{title}</h3></div>{extra&&<span className="panel-extra">{extra}</span>}</div>}
function DeviceCard({device,pct,stats,onClick}){return <button className="device-card" onClick={onClick}><div className={`device-icon ${device.color}`}>{device.kind==='Téléphone'?<Smartphone size={21}/>:<Headphones size={21}/>}</div><div className="device-info"><b>{device.name}</b><span>{device.model}</span><div className="battery-track"><span className={device.color} style={{width:`${pct??0}%`}}/></div><small>{pct===null?'Aucun relevé':`${pct}% restant`} <i>·</i> {stats.rate>0?`${stats.rate.toFixed(1)} pts/h observés`:'Taux en attente'}</small></div><div className="device-pct">{pct===null?'—':`${pct}%`}<small>{pct===null?'PAS DE DONNÉE':'BATTERIE'}</small></div></button>}
function ReadingsList({readings,devices,onDelete}){if(!readings.length)return null;return <div className="readings-list">{readings.map(r=><div className="reading-row" key={r.id}><div className="reading-bullet"/><div className="reading-content"><b>{devices.find(d=>d.id===r.deviceId)?.name||'Appareil'}</b><span>{r.activity||'Utilisation non précisée'} · {fmtTime(r.at)}</span>{r.note&&<small>{r.note}</small>}</div><strong>{r.pct}%</strong><button className="delete-reading" title="Supprimer ce relevé" onClick={()=>onDelete(r.id)}><Trash2 size={14}/></button></div>)}</div>}
function Empty({title,text}){return <div className="empty-state"><div className="empty-icon"><Activity size={22}/></div><b>{title}</b><p>{text}</p></div>}
createRoot(document.getElementById('root')).render(<App/>)
