"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import {
  Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, BarChart3, Bell,
  CheckCircle2, ChevronDown, CircleHelp, Download, FileUp, Filter, Globe2,
  MessageSquare, RefreshCw, Search, Settings2, ShieldCheck, Smartphone,
  Sparkles, Star, TrendingUp, UploadCloud, Zap
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";

type Feedback = {
  id: string; text: string; rating: number; source: string; date: string;
  sentiment: "Positive" | "Neutral" | "Negative"; confidence: number; category: string;
};
const seed: Feedback[] = [
  {id:"r1",text:"The latest update crashes whenever I open the checkout screen.",rating:1,source:"Google Play",date:"2026-10-30",sentiment:"Negative",confidence:0.96,category:"Bug"},
  {id:"r2",text:"Love the clean design and fast loading. Great experience!",rating:5,source:"App Store",date:"2026-10-30",sentiment:"Positive",confidence:0.94,category:"Praise"},
  {id:"r3",text:"Please add dark mode and more payment options.",rating:3,source:"CSV Survey",date:"2026-10-29",sentiment:"Neutral",confidence:0.78,category:"Feature"},
  {id:"r4",text:"App is very slow after the new release and keeps freezing.",rating:1,source:"Google Play",date:"2026-10-28",sentiment:"Negative",confidence:0.93,category:"Performance"},
  {id:"r5",text:"Customer support solved my issue quickly. Thank you!",rating:5,source:"App Store",date:"2026-10-27",sentiment:"Positive",confidence:0.91,category:"Praise"},
  {id:"r6",text:"Payment failed twice and I was charged. Please fix this bug.",rating:1,source:"Google Play",date:"2026-10-26",sentiment:"Negative",confidence:0.98,category:"Payment"},
  {id:"r7",text:"Would be useful to export invoices as PDF.",rating:4,source:"CSV Survey",date:"2026-10-25",sentiment:"Positive",confidence:0.73,category:"Feature"},
  {id:"r8",text:"Navigation is confusing but the app has potential.",rating:3,source:"Google Play",date:"2026-10-24",sentiment:"Neutral",confidence:0.72,category:"Usability"},
  {id:"r9",text:"Excellent service, simple to use and reliable.",rating:5,source:"App Store",date:"2026-10-23",sentiment:"Positive",confidence:0.92,category:"Praise"},
  {id:"r10",text:"Login OTP never arrives. Cannot access my account.",rating:1,source:"Google Play",date:"2026-10-22",sentiment:"Negative",confidence:0.97,category:"Login"}
];
const positiveWords = ["good","great","love","excellent","fast","easy","helpful","reliable","thank","best","amazing","clean","solved","simple","smooth","useful"];
const negativeWords = ["bad","slow","crash","crashes","failed","fail","freezing","bug","issue","problem","error","never","cannot","poor","broken","charged","confusing"];
function analyze(text:string, rating:number) {
  const words = text.toLowerCase().match(/[a-z']+/g) || [];
  const pos = words.filter(w=>positiveWords.includes(w)).length;
  const neg = words.filter(w=>negativeWords.includes(w)).length;
  const ratingSignal = rating >= 4 ? 1 : rating <= 2 ? -1 : 0;
  const score = pos - neg + ratingSignal;
  const sentiment = score > 0 ? "Positive" : score < 0 ? "Negative" : "Neutral";
  const confidence = Math.min(.99, .55 + Math.abs(score)*.09 + (ratingSignal ? .08 : 0));
  const lower = text.toLowerCase();
  const category = /crash|bug|error|freez/.test(lower) ? "Bug" :
    /payment|charge|checkout/.test(lower) ? "Payment" :
    /slow|load|performance/.test(lower) ? "Performance" :
    /login|otp|sign in/.test(lower) ? "Login" :
    /add|feature|please|would be useful|dark mode/.test(lower) ? "Feature" :
    sentiment === "Positive" ? "Praise" : "General";
  return {sentiment, confidence, category};
}
function normalize(row:any, index:number, source:string):Feedback|null {
  const text = String(row.text ?? row.review ?? row.feedback ?? row.comment ?? row.content ?? "").trim();
  if (!text) return null;
  const rating = Math.max(1,Math.min(5,Number(row.rating ?? row.score ?? 3) || 3));
  const date = String(row.date ?? row.at ?? row.created_at ?? row.timestamp ?? new Date().toISOString()).slice(0,10);
  const a = analyze(text,rating);
  return {id:String(row.id ?? `${source}-${Date.now()}-${index}`),text,rating,source,date,sentiment:a.sentiment as Feedback["sentiment"],confidence:a.confidence,category:a.category};
}
export default function Home() {
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  const [rows,setRows] = useState<Feedback[]>(seed);
  const [source,setSource] = useState("All sources");
  const [sentiment,setSentiment] = useState("All sentiments");
  const [query,setQuery] = useState("");
  const [appId,setAppId] = useState("com.whatsapp");
  const [busy,setBusy] = useState(false);
  const [notice,setNotice] = useState("Demo data loaded. Connect a store or upload a CSV to analyze your feedback.");
  const [range,setRange] = useState("All time");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(()=>rows.filter(r=>(source==="All sources"||r.source===source)&&(sentiment==="All sentiments"||r.sentiment===sentiment)&&(`${r.text} ${r.category}`.toLowerCase().includes(query.toLowerCase()))),[rows,source,sentiment,query]);
  const total=filtered.length, negative=filtered.filter(r=>r.sentiment==="Negative").length, positive=filtered.filter(r=>r.sentiment==="Positive").length;
  const avg=total ? filtered.reduce((s,r)=>s+r.rating,0)/total : 0;
  const pct=(n:number)=>total?Math.round(n/total*100):0;
  const sentimentData=[{name:"Positive",value:positive},{name:"Neutral",value:filtered.filter(r=>r.sentiment==="Neutral").length},{name:"Negative",value:negative}];
  const categoryData=Object.entries(filtered.reduce((a,r)=>{a[r.category]=(a[r.category]||0)+1;return a;},{} as Record<string,number>)).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count).slice(0,6);
  const trendData=useMemo(()=>{
    const map=new Map<string,{week:string,positive:number,neutral:number,negative:number}>();
    filtered.forEach(r=>{const k=r.date.slice(5,10);if(!map.has(k))map.set(k,{week:k,positive:0,neutral:0,negative:0});const v=map.get(k)!;v[r.sentiment.toLowerCase() as "positive"|"neutral"|"negative"]++;});
    return [...map.values()].sort((a,b)=>a.week.localeCompare(b.week));
  },[filtered]);
  const issues=Object.entries(filtered.filter(r=>r.sentiment==="Negative").reduce((a,r)=>{a[r.category]=(a[r.category]||0)+1;return a;},{} as Record<string,number>)).map(([name,count])=>({name,count,priority:count>=3?"Critical":count>=2?"High":"Medium"})).sort((a,b)=>b.count-a.count);
  const addRows=(newRows:Feedback[])=>{setRows(old=>[...newRows,...old]);setNotice(`Imported ${newRows.length} feedback items successfully.`);};

  async function importCSV(file:File) {
    Papa.parse(file,{header:true,skipEmptyLines:true,complete:(result)=>{
      const parsed=(result.data as any[]).map((r,i)=>normalize(r,i,"CSV Survey")).filter(Boolean) as Feedback[];
      if(parsed.length)addRows(parsed);else setNotice("No usable rows found. Expected columns such as text/review/feedback and optional rating/date.");
    },error:()=>setNotice("Could not parse CSV. Please check the file format.")});
  }
  async function fetchPlay() {
    setBusy(true);setNotice("Fetching Google Play reviews…");
    try {
      const res=await fetch(`/api/reviews/google-play?appId=${encodeURIComponent(appId)}&count=100`);
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"Google Play fetch failed");
      const parsed=(data.reviews||[]).map((r:any,i:number)=>normalize({text:r.text,rating:r.score,date:r.date,id:r.id},i,"Google Play")).filter(Boolean) as Feedback[];
      if(parsed.length)addRows(parsed);else setNotice("No reviews returned. Verify the package ID and try again.");
    } catch(e:any){setNotice(`${e.message}. You can still import a CSV or use demo data.`);}
    finally{setBusy(false);}
  }
  async function fetchApple() {
    setBusy(true);setNotice("Fetching App Store RSS reviews…");
    try {
      const res=await fetch("/api/reviews/app-store?country=in&appId=310633997");
      const data=await res.json();
      if(!res.ok)throw new Error(data.error||"App Store fetch failed");
      const parsed=(data.reviews||[]).map((r:any,i:number)=>normalize({text:r.text,rating:r.rating,date:r.date,id:r.id},i,"App Store")).filter(Boolean) as Feedback[];
      if(parsed.length)addRows(parsed);else setNotice("No App Store reviews returned for this app and country.");
    } catch(e:any){setNotice(`${e.message}. Try another source or upload a CSV.`);}
    finally{setBusy(false);}
  }
  async function exportPDF() {
    const doc=new jsPDF();doc.setFontSize(20);doc.text("Feedback Intelligence Report",14,20);
    doc.setFontSize(10);doc.text(`Generated: ${new Date().toLocaleString()}`,14,28);
    doc.text(`Feedback analyzed: ${total} | Average rating: ${avg.toFixed(1)}/5`,14,38);
    doc.text(`Positive: ${pct(positive)}% | Negative: ${pct(negative)}%`,14,46);
    doc.setFontSize(14);doc.text("Priority issues",14,60);doc.setFontSize(10);
    let y=69; (issues.length?issues:[{name:"No negative issues detected",count:0,priority:"Low"}]).forEach(i=>{doc.text(`${i.priority} — ${i.name}: ${i.count} negative mentions`,14,y);y+=7;});
    y+=8;doc.setFontSize(14);doc.text("Recent feedback",14,y);y+=8;doc.setFontSize(9);
    filtered.slice(0,18).forEach(r=>{const line=`${r.date} | ${r.source} | ${r.sentiment} | ${r.text}`;const lines=doc.splitTextToSize(line,180);if(y+lines.length*5>280){doc.addPage();y=18;}doc.text(lines,14,y);y+=lines.length*5+3;});
    doc.save("feedback-intelligence-weekly-report.pdf");
  }
  async function generateAI() {
    setBusy(true);try {
      const res=await fetch("/api/insights",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({feedback:filtered.slice(0,100)})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"AI summary unavailable");
      setNotice(data.insight);
    }catch(e:any){setNotice(e.message+" Add GROQ_API_KEY in Vercel environment variables to enable AI summaries.");}
    finally{setBusy(false);}
  }

  return <main className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandIcon"><Activity size={22}/></div><div><b>Feedback<span>IQ</span></b><small>INTELLIGENCE SUITE</small></div></div>
      <div className="workspace"><div className="avatar">AC</div><div><b>Acme Corporation</b><small>Product workspace</small></div><ChevronDown size={15}/></div>
      <div className="navLabel">WORKSPACE</div>
      <a className="nav active"><BarChart3 size={17}/> Overview</a>
      <a className="nav"><MessageSquare size={17}/> Feedback inbox <span className="navCount">{rows.length}</span></a>
      <a className="nav"><TrendingUp size={17}/> Trends</a>
      <a className="nav"><AlertTriangle size={17}/> Issue tracker</a>
      <div className="navLabel">MANAGE</div>
      <a className="nav"><Globe2 size={17}/> Data sources</a>
      <a className="nav"><Download size={17}/> Reports</a>
      <a className="nav"><Settings2 size={17}/> Settings</a>
      <div className="sideBottom"><div className="plan"><Sparkles size={17}/><b>Insight Pro</b><small>Connect sources to unlock your insights.</small></div><div className="profile"><div className="avatar">RD</div><div><b>Workspace Admin</b><small>Administrator</small></div><ChevronDown size={15}/></div></div>
    </aside>
    <section className="content">
      <header className="topbar"><div className="crumb">Workspace <span>/</span> <b>Overview</b></div><div className="topActions"><span className="live"><i/> Live workspace</span><button className="iconBtn" aria-label="Notifications"><Bell size={18}/></button><div className="avatar">RD</div></div></header>
      <div className="pageHead"><div><div className="eyebrow">CUSTOMER EXPERIENCE ANALYTICS</div><h1>Feedback overview</h1><p>Monitor customer sentiment, uncover product issues, and turn feedback into action.</p></div><div className="headButtons"><button className="btn secondary" onClick={()=>fileRef.current?.click()}><FileUp size={16}/> Import CSV</button><button className="btn primary" onClick={exportPDF}><Download size={16}/> Export report</button><input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e=>e.target.files?.[0]&&importCSV(e.target.files[0])}/></div></div>
      <div className="notice"><span><CheckCircle2 size={16}/></span><div>{notice}</div><button onClick={()=>setNotice("")}>×</button></div>
      <section className="sourcePanel"><div className="sourceTitle"><div><b><Globe2 size={17}/> Data connections</b><small>Collect feedback from multiple channels</small></div><span className="demoTag">DEMO + CONNECTORS</span></div><div className="sourceControls"><div className="sourceCard"><div className="sourceLogo play">▶</div><div className="sourceText"><b>Google Play Store</b><small>Public app reviews</small></div><button className="connectBtn" disabled={busy} onClick={fetchPlay}>{busy?"Loading…":"Fetch reviews"}</button></div><div className="sourceCard"><div className="sourceLogo apple">A</div><div className="sourceText"><b>Apple App Store</b><small>RSS customer reviews</small></div><button className="connectBtn" disabled={busy} onClick={fetchApple}>Fetch reviews</button></div><div className="sourceCard"><div className="sourceLogo csv">CSV</div><div className="sourceText"><b>Survey exports</b><small>Upload CSV file</small></div><button className="connectBtn" onClick={()=>fileRef.current?.click()}>Upload file</button></div></div><div className="playInput"><label>Google Play package ID</label><input value={appId} onChange={e=>setAppId(e.target.value)} placeholder="com.example.app"/></div></section>
      <div className="sectionHead"><div><h2>Performance snapshot</h2><p>Key customer experience indicators</p></div><select value={range} onChange={e=>setRange(e.target.value)}><option>All time</option><option>Last 7 days</option><option>Last 30 days</option></select></div>
      <div className="filters"><div className="searchBox"><Search size={16}/><input placeholder="Search feedback or topics…" value={query} onChange={e=>setQuery(e.target.value)}/></div><select value={source} onChange={e=>setSource(e.target.value)}><option>All sources</option><option>Google Play</option><option>App Store</option><option>CSV Survey</option></select><select value={sentiment} onChange={e=>setSentiment(e.target.value)}><option>All sentiments</option><option>Positive</option><option>Neutral</option><option>Negative</option></select><button className="filterBtn" onClick={()=>{setSource("All sources");setSentiment("All sentiments");setQuery("");}}><Filter size={15}/> Reset</button></div>
      <div className="metrics">
        <Metric icon={<MessageSquare/>} label="Total feedback" value={total.toLocaleString()} detail="Across selected sources" trend="+12.8%" positive/>
        <Metric icon={<Star/>} label="Average rating" value={`${avg.toFixed(1)} / 5`} detail="Customer rating average" trend={avg>=3.5?"+0.3":"-0.2"} positive={avg>=3}/>
        <Metric icon={<SmileIcon/>} label="Positive sentiment" value={`${pct(positive)}%`} detail={`${positive} positive responses`} trend="+5.2%" positive/>
        <Metric icon={<AlertTriangle/>} label="Negative feedback" value={`${pct(negative)}%`} detail={`${negative} items need attention`} trend={negative>0?"Needs review":"Clear"} positive={negative===0}/>
      </div>
      <div className="chartsGrid">
        <div className="panel chartPanel"><div className="panelHead"><div><h3>Sentiment over time</h3><p>Feedback distribution by date</p></div><span className="subtleTag">DAILY</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trendData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f5"/><XAxis dataKey="week" tickLine={false} axisLine={false}/><YAxis allowDecimals={false} tickLine={false} axisLine={false}/><Tooltip/><Area type="monotone" dataKey="positive" stackId="1" stroke="#16a37b" fill="#16a37b" fillOpacity={.14}/><Area type="monotone" dataKey="neutral" stackId="1" stroke="#e5a13a" fill="#e5a13a" fillOpacity={.14}/><Area type="monotone" dataKey="negative" stackId="1" stroke="#e15b67" fill="#e15b67" fillOpacity={.14}/></AreaChart></ResponsiveContainer></div><div className="legend"><span><i className="green"/> Positive</span><span><i className="amber"/> Neutral</span><span><i className="red"/> Negative</span></div></div>
        <div className="panel chartPanel"><div className="panelHead"><div><h3>Sentiment breakdown</h3><p>Share of customer feedback</p></div><span className="subtleTag">CURRENT</span></div><div className="donutWrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={88} paddingAngle={4}>{sentimentData.map((e,i)=><Cell key={e.name} fill={["#16a37b","#e5a13a","#e15b67"][i]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donutCenter"><b>{total}</b><small>Responses</small></div></div><div className="sentimentRows">{sentimentData.map((d,i)=><div key={d.name}><span><i style={{background:["#16a37b","#e5a13a","#e15b67"][i]}}/>{d.name}</span><b>{pct(d.value)}%</b></div>)}</div></div>
      </div>
      <div className="lowerGrid">
        <div className="panel"><div className="panelHead"><div><h3>Trending topics</h3><p>Most discussed feedback categories</p></div><button className="textBtn">View analysis <ArrowUpRight size={14}/></button></div><div className="barChart"><ResponsiveContainer width="100%" height="100%"><BarChart data={categoryData} layout="vertical" margin={{left:8,right:16}}><CartesianGrid strokeDasharray="3 3" horizontal={false}/><XAxis type="number" hide/><YAxis type="category" dataKey="name" width={92} tickLine={false} axisLine={false}/><Tooltip/><Bar dataKey="count" fill="#6574db" radius={[0,5,5,0]} barSize={17}/></BarChart></ResponsiveContainer></div></div>
        <div className="panel"><div className="panelHead"><div><h3>Priority issues</h3><p>Negative feedback requiring action</p></div><span className="countPill">{issues.length} topics</span></div><div className="issueList">{issues.length?issues.slice(0,5).map(i=><div className="issue" key={i.name}><div className="issueIcon"><AlertTriangle size={15}/></div><div className="issueInfo"><b>{i.name}</b><small>{i.count} negative mentions</small></div><span className={`priority ${i.priority.toLowerCase()}`}>{i.priority}</span></div>):<div className="empty">No negative issues in this selection.</div>}</div></div>
      </div>
      <div className="panel feedbackPanel"><div className="panelHead"><div><h3>Recent feedback</h3><p>Latest customer comments from connected sources</p></div><span className="countPill">{filtered.length} records</span></div><div className="tableWrap"><table><thead><tr><th>FEEDBACK</th><th>SOURCE</th><th>RATING</th><th>SENTIMENT</th><th>CONFIDENCE</th><th>DATE</th></tr></thead><tbody>{filtered.slice(0,12).map(r=><tr key={r.id}><td className="feedbackText">{r.text}</td><td><span className="sourcePill">{r.source}</span></td><td><span className="rating">★ {r.rating}.0</span></td><td><span className={`sentiment ${r.sentiment.toLowerCase()}`}>{r.sentiment}</span></td><td>{Math.round(r.confidence*100)}%</td><td>{r.date}</td></tr>)}</tbody></table>{!filtered.length&&<div className="empty">No feedback matches your filters.</div>}</div></div>
      <div className="aiBanner"><div className="aiIcon"><Sparkles/></div><div><b>Turn feedback into your next best decision</b><p>Generate an AI-powered executive summary and prioritized recommendations.</p></div><button className="btn primary" disabled={busy} onClick={generateAI}><Zap size={16}/>{busy?"Generating…":"Generate AI insights"}</button></div>
      <footer>FeedbackIQ <span>•</span> Customer intelligence, made actionable. <span className="footRight">Demo analytics · Verify source data before business decisions</span></footer>
    </section>
  </main>;
}
function SmileIcon(){return <span className="smileIcon">☺</span>}
function Metric({icon,label,value,detail,trend,positive}:{icon:React.ReactNode,label:string,value:string,detail:string,trend:string,positive:boolean}) {
  return <div className="metric"><div className="metricTop"><span className="metricIcon">{icon}</span><span className={`trend ${positive?"up":"down"}`}>{positive?<ArrowUpRight size={13}/>:<ArrowDownRight size={13}/>} {trend}</span></div><div className="metricValue">{value}</div><div className="metricLabel">{label}</div><div className="metricDetail">{detail}</div></div>;
}
