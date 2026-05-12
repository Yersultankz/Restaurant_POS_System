import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const CUR = "₸";
const CATS = ["All","Starters","Mains","Drinks","Desserts"];
const CICO = {All:"🍽️",Starters:"🥗",Mains:"🍖",Drinks:"🥤",Desserts:"🍰"};
const CC = {Starters:"#10b981",Mains:"#f59e0b",Drinks:"#3b82f6",Desserts:"#ec4899",All:"#8b5cf6"};
const NTABLES = 12;

const MENU = [
  {id:1,name:"Caesar Salad",cat:"Starters",price:850,emoji:"🥗",avail:true},
  {id:2,name:"Bruschetta",cat:"Starters",price:700,emoji:"🍞",avail:true},
  {id:3,name:"Tomato Soup",cat:"Starters",price:650,emoji:"🍲",avail:true},
  {id:4,name:"Grilled Chicken",cat:"Mains",price:2200,emoji:"🍗",avail:true},
  {id:5,name:"Beef Burger",cat:"Mains",price:1800,emoji:"🍔",avail:true},
  {id:6,name:"Margherita Pizza",cat:"Mains",price:2500,emoji:"🍕",avail:true},
  {id:7,name:"Pasta Carbonara",cat:"Mains",price:1900,emoji:"🍝",avail:true},
  {id:8,name:"Lamb Shashlik",cat:"Mains",price:2800,emoji:"🥩",avail:true},
  {id:9,name:"Americano",cat:"Drinks",price:400,emoji:"☕",avail:true},
  {id:10,name:"Latte",cat:"Drinks",price:550,emoji:"🧋",avail:true},
  {id:11,name:"Fresh OJ",cat:"Drinks",price:600,emoji:"🍊",avail:true},
  {id:12,name:"Ayran",cat:"Drinks",price:350,emoji:"🥛",avail:true},
  {id:13,name:"Lava Cake",cat:"Desserts",price:900,emoji:"🍫",avail:true},
  {id:14,name:"Ice Cream",cat:"Desserts",price:700,emoji:"🍨",avail:true},
];

const T = Date.now();
const INIT_ORDERS = [
  {id:"ORD-001",type:"dine-in",table:2,customer:"",items:[{id:4,name:"Grilled Chicken",price:2200,qty:2,emoji:"🍗"},{id:9,name:"Americano",price:400,qty:2,emoji:"☕"}],status:"active",at:T-900000},
  {id:"ORD-002",type:"dine-in",table:5,customer:"",items:[{id:6,name:"Margherita Pizza",price:2500,qty:1,emoji:"🍕"},{id:11,name:"Fresh OJ",price:600,qty:2,emoji:"🍊"}],status:"ready",at:T-1500000},
  {id:"ORD-003",type:"takeaway",table:null,customer:"Aigerim",items:[{id:5,name:"Beef Burger",price:1800,qty:1,emoji:"🍔"},{id:10,name:"Latte",price:550,qty:1,emoji:"🧋"}],status:"active",at:T-300000},
];
const INIT_PAID = [
  {id:"ORD-P01",total:5800,paidAt:T-3600000,items:[{name:"Pasta Carbonara",qty:2},{name:"Latte",qty:2}]},
  {id:"ORD-P02",total:3200,paidAt:T-7200000,items:[{name:"Caesar Salad",qty:1},{name:"Beef Burger",qty:1}]},
  {id:"ORD-P03",total:7100,paidAt:T-10800000,items:[{name:"Lamb Shashlik",qty:2},{name:"Ayran",qty:2},{name:"Lava Cake",qty:1}]},
  {id:"ORD-P04",total:2400,paidAt:T-14400000,items:[{name:"Americano",qty:2},{name:"Ice Cream",qty:2}]},
];

const tot = items => items.reduce((s,i)=>s+i.price*i.qty,0);
const fmt = n => n.toLocaleString();
const elapsed = ts => { const m=Math.floor((Date.now()-ts)/60000); return m<60?`${m}m ago`:`${Math.floor(m/60)}h ago`; };
const sColor = s => ({active:"#f59e0b",ready:"#10b981",free:"#334155"}[s]||"#6b7280");

const C = {
  bg:"#0a0f1e",
  surface:"#111827",
  card:"#1a2235",
  border:"#1f2d45",
  accent:"#f59e0b",
  text:"#f1f5f9",
  muted:"#64748b",
  dim:"#374151",
};

const S = {
  pill:(active,color="#f59e0b")=>({
    background:active?color+"25":"transparent",
    color:active?color:C.muted,
    border:`1px solid ${active?color:C.border}`,
    borderRadius:99,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",
  }),
  btn:(color="#f59e0b",size="md")=>({
    background:color,color:"#fff",border:"none",
    borderRadius:10,padding:size==="sm"?"6px 14px":"11px 18px",
    fontWeight:700,fontSize:size==="sm"?12:14,cursor:"pointer",
  }),
  ghost:{background:"transparent",color:C.muted,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 16px",fontWeight:600,fontSize:13,cursor:"pointer"},
  inp:{background:C.bg,border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"},
  row:{display:"flex",alignItems:"center",gap:8},
  bw:{display:"flex",alignItems:"center",justifyContent:"space-between"},
  card:{background:C.card,borderRadius:14,border:`1px solid ${C.border}`},
};

function Badge({s}) {
  const map={active:["#f59e0b","Preparing"],ready:["#10b981","Ready ✓"],free:["#334155","Free"]};
  const [c,l]=map[s]||["#475569",s];
  return <span style={{background:c+"22",color:c,padding:"3px 10px",borderRadius:99,fontSize:11,fontWeight:700}}>{l}</span>;
}

export default function POS() {
  const [tab,setTab]=useState("orders");
  const [menu,setMenu]=useState(MENU);
  const [orders,setOrders]=useState(INIT_ORDERS);
  const [paid,setPaid]=useState(INIT_PAID);
  const [mIdx,setMIdx]=useState(15);
  const [oIdx,setOIdx]=useState(4);

  const updOrd=(id,patch)=>setOrders(os=>os.map(o=>o.id===id?{...o,...patch}:o));
  const markPaid=(ord,disc,method)=>{
    const total=Math.round(tot(ord.items)*(1-disc/100));
    setPaid(p=>[{id:ord.id,total,paidAt:Date.now(),items:ord.items,method},...p]);
    setOrders(os=>os.filter(o=>o.id!==ord.id));
  };

  const NAV=[
    {id:"orders",icon:"🛒",label:"Orders",badge:orders.filter(o=>o.status==="active").length,bc:"#f59e0b"},
    {id:"kitchen",icon:"👨‍🍳",label:"Kitchen",badge:orders.filter(o=>o.status==="active").length,bc:"#ef4444"},
    {id:"billing",icon:"🧾",label:"Billing",badge:orders.filter(o=>["active","ready"].includes(o.status)).length,bc:"#10b981"},
    {id:"menu",icon:"🍽️",label:"Menu",badge:0,bc:""},
    {id:"dashboard",icon:"📊",label:"Dashboard",badge:0,bc:""},
  ];

  return (
    <div style={{display:"flex",height:"100vh",background:C.bg,color:C.text,fontFamily:"'Inter',system-ui,sans-serif",overflow:"hidden"}}>
      <div style={{width:72,background:C.surface,display:"flex",flexDirection:"column",alignItems:"center",paddingTop:16,borderRight:`1px solid ${C.border}`,flexShrink:0,gap:4}}>
        <div style={{fontSize:24,marginBottom:16}}>🍴</div>
        {NAV.map(n=>{
          const act=tab===n.id;
          return (
            <div key={n.id} onClick={()=>setTab(n.id)} title={n.label} style={{position:"relative",width:48,height:48,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,cursor:"pointer",background:act?C.accent+"22":"transparent",color:act?C.accent:"#475569",border:act?`1px solid ${C.accent}33`:"1px solid transparent",marginBottom:2}}>
              {n.icon}
              {n.badge>0&&<span style={{position:"absolute",top:4,right:4,background:n.bc,color:"#fff",borderRadius:99,fontSize:9,fontWeight:800,width:14,height:14,display:"flex",alignItems:"center",justifyContent:"center"}}>{n.badge}</span>}
            </div>
          );
        })}
        <div style={{marginTop:"auto",marginBottom:14,fontSize:10,color:"#1f2d45",transform:"rotate(-90deg)",letterSpacing:2,whiteSpace:"nowrap"}}>RSTO POS</div>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {tab==="orders"&&<OrdersMod menu={menu} orders={orders} setOrders={setOrders} oIdx={oIdx} setOIdx={setOIdx}/>}
        {tab==="kitchen"&&<KitchenMod orders={orders} markReady={id=>updOrd(id,{status:"ready"})}/>}
        {tab==="billing"&&<BillingMod orders={orders.filter(o=>["active","ready"].includes(o.status))} markPaid={markPaid}/>}
        {tab==="menu"&&<MenuMod menu={menu} setMenu={setMenu} mIdx={mIdx} setMIdx={setMIdx}/>}
        {tab==="dashboard"&&<DashMod paid={paid} orders={orders}/>}
      </div>
    </div>
  );
}

function Header({title,sub,right}) {
  return (
    <div style={{padding:"16px 20px",background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
      <div>
        <div style={{fontWeight:800,fontSize:18,letterSpacing:-.3}}>{title}</div>
        {sub&&<div style={{fontSize:12,color:C.muted,marginTop:2}}>{sub}</div>}
      </div>
      {right&&<div style={{display:"flex",gap:8,alignItems:"center"}}>{right}</div>}
    </div>
  );
}

function OrdersMod({menu,orders,setOrders,oIdx,setOIdx}) {
  const [mode,setMode]=useState("dine-in");
  const [step,setStep]=useState("tables");
  const [selTbl,setSelTbl]=useState(null);
  const [custName,setCustName]=useState("");
  const [cat,setCat]=useState("All");
  const [cart,setCart]=useState([]);
  const [editId,setEditId]=useState(null);

  const getTblOrd=t=>orders.find(o=>o.type==="dine-in"&&o.table===t&&["active","ready"].includes(o.status));
  const tblSt=t=>{const o=getTblOrd(t);return o?o.status:"free";};

  const pickTable=t=>{
    const ex=getTblOrd(t);
    setSelTbl(t);
    setCart(ex?ex.items.map(i=>({...i})):[]);
    setEditId(ex?ex.id:null);
    setStep("pos");
  };
  const startTO=()=>{setCart([]);setEditId(null);setStep("pos");};
  const goBack=()=>{setStep("tables");setSelTbl(null);setCart([]);setEditId(null);setCustName("");};

  const addItem=it=>setCart(c=>{
    const ex=c.find(i=>i.id===it.id);
    return ex?c.map(i=>i.id===it.id?{...i,qty:i.qty+1}:i):[...c,{...it,qty:1}];
  });
  const adj=(id,d)=>setCart(c=>c.map(i=>i.id===id?{...i,qty:Math.max(1,i.qty+d)}:i));
  const rm=id=>setCart(c=>c.filter(i=>i.id!==id));
  const cartTot=tot(cart);

  const send=()=>{
    if(!cart.length)return;
    if(editId){setOrders(os=>os.map(o=>o.id===editId?{...o,items:cart,status:"active"}:o));}
    else{
      const id=`ORD-${String(oIdx).padStart(3,"0")}`;
      setOrders(os=>[...os,{id,type:mode,table:mode==="dine-in"?selTbl:null,customer:mode==="takeaway"?custName:"",items:cart,status:"active",at:Date.now()}]);
      setOIdx(i=>i+1);
    }
    goBack();
  };

  const fMenu=(cat==="All"?menu:menu.filter(i=>i.cat===cat)).filter(i=>i.avail);

  if(step==="tables") return (
    <>
      <Header title="Order Taking" sub={`${orders.filter(o=>o.status==="active").length} in kitchen · ${orders.filter(o=>o.status==="ready").length} ready`} right={<>{[["dine-in","🪑 Dine-in"],["takeaway","🥡 Takeaway"]].map(([m,l])=>(<button key={m} onClick={()=>setMode(m)} style={S.pill(mode===m)}>{l}</button>))}</>}/>
      <div style={{flex:1,overflow:"auto",padding:20}}>
        {mode==="dine-in"?(<>
          <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:16,letterSpacing:1.5}}>SELECT TABLE TO BEGIN ORDER</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:12,maxWidth:720}}>
            {Array.from({length:NTABLES},(_,i)=>i+1).map(t=>{
              const o=getTblOrd(t);const s=tblSt(t);
              const sc=sColor(s);
              return (
                <div key={t} onClick={()=>pickTable(t)} style={{...S.card,padding:16,cursor:"pointer",borderColor:s!=="free"?sc:C.border,textAlign:"center",transition:"all .15s"}}>
                  <div style={{fontSize:32,marginBottom:8}}>🪑</div>
                  <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>T{t}</div>
                  <Badge s={s}/>
                  {o&&<div style={{fontSize:11,color:C.accent,marginTop:8,fontWeight:700}}>{CUR}{fmt(tot(o.items))}</div>}
                  {o&&<div style={{fontSize:10,color:C.muted}}>{o.items.length} items</div>}
                </div>
              );
            })}
          </div>
        </>):(
          <div style={{display:"flex",gap:16}}>
            <div style={{...S.card,padding:20,width:280}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:14}}>New Takeaway Order</div>
              <div style={{fontSize:12,color:C.muted,marginBottom:6}}>Customer Name</div>
              <input style={{...S.inp,marginBottom:14}} value={custName} onChange={e=>setCustName(e.target.value)} placeholder="Optional"/>
              <button style={{...S.btn("#10b981"),width:"100%",padding:12}} onClick={startTO}>+ Start Order</button>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,fontWeight:700,color:C.muted,marginBottom:10,letterSpacing:1.5}}>ACTIVE TAKEAWAY</div>
              {orders.filter(o=>o.type==="takeaway"&&["active","ready"].includes(o.status)).map(o=>(
                <div key={o.id} onClick={()=>{setCart(o.items.map(i=>({...i})));setEditId(o.id);setCustName(o.customer);setStep("pos");}} style={{...S.card,padding:14,marginBottom:8,cursor:"pointer",borderLeft:`3px solid ${sColor(o.status)}`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontWeight:700}}>{o.customer||"Walk-in"}</span><Badge s={o.status}/></div>
                  <div style={{fontSize:12,color:C.muted,marginTop:4}}>{o.id} · {o.items.length} items · {CUR}{fmt(tot(o.items))}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>
      <div style={{padding:"12px 16px",background:C.surface,borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
        <button onClick={goBack} style={{...S.ghost,padding:"8px 14px",fontSize:13}}>← Back</button>
        <div style={{width:1,height:28,background:C.border}}/>
        <div>
          <div style={{fontWeight:800,fontSize:15}}>{mode==="dine-in"?`Table ${selTbl}${editId?" · Add Items":" · New Order"}`:`Takeaway${custName?` · ${custName}`:""}`}</div>
          <div style={{fontSize:11,color:C.muted}}>{cart.length} items · {CUR}{fmt(cartTot)}</div>
        </div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:90,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 8px",gap:6,overflow:"auto",flexShrink:0}}>
          {CATS.map(c=>{const act=cat===c;return(<div key={c} onClick={()=>setCat(c)} style={{width:"100%",padding:"10px 4px",borderRadius:12,cursor:"pointer",textAlign:"center",background:act?CC[c]+"22":"transparent",border:`1px solid ${act?CC[c]:"transparent"}`}}><div style={{fontSize:22,marginBottom:3}}>{CICO[c]}</div><div style={{fontSize:10,fontWeight:700,color:act?CC[c]:C.muted,lineHeight:1.2}}>{c}</div></div>);})}
        </div>
        <div style={{flex:1,overflow:"auto",padding:16,background:C.bg}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:10}}>
            {fMenu.map(it=>{const inCart=cart.find(i=>i.id===it.id);return(<div key={it.id} onClick={()=>addItem(it)} style={{...S.card,padding:0,cursor:"pointer",overflow:"hidden",border:`1px solid ${inCart?CC[it.cat]:C.border}`,position:"relative"}}>{inCart&&<div style={{position:"absolute",top:8,right:8,background:CC[it.cat],color:"#fff",borderRadius:99,fontSize:10,fontWeight:800,width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center"}}>{inCart.qty}</div>}<div style={{background:CC[it.cat]+"15",display:"flex",alignItems:"center",justifyContent:"center",height:90,fontSize:44}}>{it.emoji}</div><div style={{padding:"10px 12px 12px"}}><div style={{fontWeight:700,fontSize:13,marginBottom:6,lineHeight:1.3}}>{it.name}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{color:C.accent,fontWeight:800,fontSize:15}}>{CUR}{fmt(it.price)}</span><span style={{background:C.accent,color:"#000",borderRadius:8,width:26,height:26,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:18}}>+</span></div></div></div>);})}
          </div>
        </div>
        <div style={{width:260,flexShrink:0,display:"flex",flexDirection:"column",background:C.surface,borderLeft:`1px solid ${C.border}`}}>
          <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`}}><div style={{fontWeight:800,fontSize:14,marginBottom:2}}>Current Order</div></div>
          <div style={{flex:1,overflow:"auto",padding:"12px 16px"}}>
            {cart.map(it=>(<div key={it.id} style={{marginBottom:14,paddingBottom:14,borderBottom:`1px solid ${C.border}`}}><div style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:8}}><span style={{fontSize:20}}>{it.emoji||"🍽️"}</span><div style={{flex:1}}><div style={{fontSize:13,fontWeight:600}}>{it.name}</div><div style={{fontSize:12,color:C.accent,fontWeight:700,marginTop:2}}>{CUR}{fmt(it.price)}</div></div></div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:6}}><button onClick={()=>adj(it.id,-1)} style={{...S.btn(C.dim,"sm"),color:C.text,width:26,height:26,padding:0,fontSize:16}}>−</button><span style={{fontWeight:800,width:22,textAlign:"center"}}>{it.qty}</span><button onClick={()=>adj(it.id,1)} style={{...S.btn(C.dim,"sm"),color:C.text,width:26,height:26,padding:0,fontSize:16}}>+</button></div><span style={{fontWeight:700,fontSize:13}}>{CUR}{fmt(it.price*it.qty)}</span></div></div>))}
          </div>
          <div style={{padding:"14px 16px",borderTop:`1px solid ${C.border}`}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><div><div style={{fontSize:11,color:C.muted}}>Total</div><div style={{fontWeight:900,fontSize:24,color:C.accent}}>{CUR}{fmt(cartTot)}</div></div></div><button style={{...S.btn("#10b981"),width:"100%",padding:14,fontSize:15}} onClick={send}>🍳 Send to Kitchen</button></div>
        </div>
      </div>
    </div>
  );
}

function KitchenMod({orders,markReady}) {
  const active=orders.filter(o=>o.status==="active").sort((a,b)=>a.at-b.at);
  const ready=orders.filter(o=>o.status==="ready");
  return (
    <>
      <Header title="Kitchen Display" sub={`${active.length} preparing · ${ready.length} ready`}/>
      <div style={{flex:1,overflow:"auto",padding:20,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#f59e0b",marginBottom:12}}>🔥 PREPARING</div>
          {active.map(o=>(<div key={o.id} style={{...S.card,marginBottom:12,borderLeft:`3px solid #f59e0b`,padding:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><div style={{fontWeight:800,fontSize:16}}>{o.type==="dine-in"?`Table ${o.table}`:o.customer||"Walk-in"}</div><span>⏱ {elapsed(o.at)}</span></div>{o.items.map((it,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",background:C.bg,borderRadius:8,padding:"8px 12px",marginBottom:6}}><span>{it.emoji} {it.name}</span><span style={{fontWeight:800,color:"#f59e0b"}}>×{it.qty}</span></div>))}<button style={{...S.btn("#10b981"),width:"100%",marginTop:10}} onClick={()=>markReady(o.id)}>✓ Mark as Ready</button></div>))}
        </div>
        <div>
          <div style={{fontSize:11,fontWeight:700,color:"#10b981",marginBottom:12}}>✅ READY TO SERVE</div>
          {ready.map(o=>(<div key={o.id} style={{...S.card,marginBottom:10,borderLeft:"3px solid #10b981",padding:14}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700}}>{o.type==="dine-in"?`Table ${o.table}`:o.customer||"Walk-in"}</span><span>{elapsed(o.at)}</span></div></div>))}
        </div>
      </div>
    </>
  );
}

function BillingMod({orders,markPaid}) {
  const [sel,setSel]=useState(null);
  const [disc,setDisc]=useState(0);
  const selOrd=orders.find(o=>o.id===sel);
  const sub=selOrd?tot(selOrd.items):0;
  return (
    <>
      <Header title="Billing & Receipts" sub={`${orders.length} orders pending`}/>
      <div style={{flex:1,display:"flex",overflow:"hidden"}}>
        <div style={{width:280,borderRight:`1px solid ${C.border}`,overflow:"auto",padding:16}}>{orders.map(o=>(<div key={o.id} onClick={()=>{setSel(o.id);setDisc(0);}} style={{...S.card,marginBottom:8,padding:14,cursor:"pointer",border:`1px solid ${sel===o.id?C.accent:C.border}`}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{fontWeight:700}}>{o.type==="dine-in"?`Table ${o.table}`:o.customer||"Walk-in"}</span><Badge s={o.status}/></div><div style={{fontWeight:800,color:C.accent,fontSize:17}}>{CUR}{fmt(tot(o.items))}</div></div>))}</div>
        {selOrd?(<div style={{flex:1,overflow:"auto",padding:20}}><div style={{...S.card,maxWidth:460,padding:24}}><div style={{fontWeight:800,fontSize:18}}>{selOrd.type==="dine-in"?`Table ${selOrd.table}`:selOrd.customer||"Walk-in"}</div>{selOrd.items.map((it,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}><span>{it.emoji} {it.name} × {it.qty}</span><span style={{fontWeight:700}}>{CUR}{fmt(it.price*it.qty)}</span></div>))}<button style={{...S.btn("#10b981"),width:"100%",marginTop:20,padding:14}} onClick={()=>{markPaid(selOrd,disc,"Cash");setSel(null);}}>✓ Complete Payment</button></div></div>):null}
      </div>
    </>
  );
}

function MenuMod({menu,setMenu}) {
  const [cat,setCat]=useState("All");
  const shown=cat==="All"?menu:menu.filter(i=>i.cat===cat);
  return (
    <>
      <Header title="Menu Management" sub={`${menu.length} items total`}/>
      <div style={{flex:1,overflow:"auto",padding:20}}>
        <div style={{display:"flex",gap:8,marginBottom:18}}>{CATS.map(c=>(<button key={c} onClick={()=>setCat(c)} style={S.pill(cat===c,CC[c])}>{CICO[c]} {c}</button>))}</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:12}}>{shown.map(it=>(<div key={it.id} style={{...S.card,padding:14}}><div style={{fontSize:42,textAlign:"center",marginBottom:10}}>{it.emoji}</div><div style={{fontWeight:700}}>{it.name}</div><div style={{color:C.accent,fontWeight:800}}>{CUR}{fmt(it.price)}</div></div>))}</div>
      </div>
    </>
  );
}

function DashMod({paid,orders}) {
  const rev=paid.reduce((s,o)=>s+o.total,0);
  return (
    <>
      <Header title="Sales Dashboard" sub="System analytics"/>
      <div style={{flex:1,overflow:"auto",padding:20}}><div style={{...S.card,padding:24}}><div style={{fontSize:12,color:C.muted}}>Total Revenue</div><div style={{fontSize:44,fontWeight:900,color:C.accent}}>{CUR}{fmt(rev)}</div></div></div>
    </>
  );
}
