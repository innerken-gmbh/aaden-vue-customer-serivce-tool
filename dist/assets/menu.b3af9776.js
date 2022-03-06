var P=Object.defineProperty,I=Object.defineProperties;var M=Object.getOwnPropertyDescriptors;var D=Object.getOwnPropertySymbols;var T=Object.prototype.hasOwnProperty,L=Object.prototype.propertyIsEnumerable;var E=(u,n,a)=>n in u?P(u,n,{enumerable:!0,configurable:!0,writable:!0,value:a}):u[n]=a,B=(u,n)=>{for(var a in n||(n={}))T.call(n,a)&&E(u,a,n[a]);if(D)for(var a of D(n))L.call(n,a)&&E(u,a,n[a]);return u},U=(u,n)=>I(u,M(n));import{u as R,_ as O,t as j,v as q,w as $,p as J,x as K,y as H,q as V,m as z,n as G,r as Q}from"./index.d023bfa5.js";import{a as W,b as X,c as Y,e as Z}from"./table.18292b07.js";import{h as ee,r as h,i as y}from"./form.8ba9c808.js";import{d as ue,M as ne,a6 as ae,g as o,h as s,N as le,k as te,r as oe,o as re,q as se,a as i,w as F,bd as ie}from"./vendor.88197545.js";var w=ue({name:"Menu",setup(){let u="add",n=null;const a=W(),C=ne(),f=ae(),g=R(),d=o(null),r=o(null),_=X("menuUrl"),p=Y([{title:"\u83DC\u5355\u540D\u79F0",key:"menuName"},{title:"\u83DC\u5355\u5730\u5740",key:"menuUrl"},{title:"\u83DC\u5355\u56FE\u6807",key:"icon",render:e=>e.iconPrefix==="iconfont"?s(O,{prefix:e.iconPrefix?e.iconPrefix:"iconfont",name:e.icon?e.icon:"menu"}):s(le,null,{default:()=>s("svg",{"aria-hidden":!1},{default:()=>[s("use",{href:"#icon-menu"})]})})},{title:"\u662F\u5426\u7F13\u5B58",key:"cacheable",render:e=>s("div",null,{default:()=>e.cacheable?"\u662F":"\u5426"})},{title:"\u662F\u5426\u9690\u85CF",key:"hidden",render:e=>s("div",null,{default:()=>e.hidden?"\u662F":"\u5426"})},{title:"\u662F\u5426\u56FA\u5B9A\u6807\u9898\u680F",key:"affix",render:e=>s("div",null,{default:()=>e.affix?"\u662F":"\u5426"})},{title:"\u64CD\u4F5C",key:"actions",render:e=>Z([{label:"\u7F16\u8F91",onClick:N.bind(null,e)},{label:"\u5220\u9664",type:"error",onClick:k.bind(null,e)}])}],{align:"center"}),c=[{label:"\u4E0A\u7EA7\u83DC\u5355",key:"parentPath",value:o(null),validator:(e,l)=>e.value.value?!0:(l.error("\u8BF7\u9009\u62E9\u4E0A\u7EA7\u83DC\u5355"),!1),render:e=>ee(e.value,j(a.dataList,"menuName","menuUrl"),{showPath:!0})},{label:"\u83DC\u5355\u540D\u79F0",key:"menuName",required:!0,value:o(null),render:e=>h(e.value,{placeholder:"\u8BF7\u8F93\u5165\u83DC\u5355\u540D\u79F0"})},{label:"\u83DC\u5355\u5730\u5740",key:"menuUrl",required:!0,value:o(null),disabled:o(!1),render:e=>h(e.value,{placeholder:"\u8BF7\u8F93\u5165\u83DC\u5355\u5730\u5740",disabled:e.disabled.value}),reset:e=>{e.value.value=null,e.disabled.value=!1}},{label:"\u5916\u94FE\u5730\u5740",key:"outLink",value:o(null),render:e=>h(e.value,{placeholder:"\u8BF7\u8F93\u5165\u5916\u94FE\u5730\u5740"})},{label:"\u83DC\u5355\u56FE\u6807",key:"icon",value:o(null),render:e=>s(q,{defaultIcon:e.value.value,onUpdateIcon:l=>{e.value.value=l.name}})},{label:"\u662F\u5426\u7F13\u5B58",key:"cacheable",value:o(!1),render:e=>y(e.value)},{label:"\u662F\u5426\u9690\u85CF",key:"hidden",value:o(!1),render:e=>y(e.value)},{label:"\u662F\u5426\u56FA\u5B9A",key:"affix",value:o(!0),render:e=>y(e.value)}];function b(){J({url:K,data:{}}).then(a.handleSuccess).catch(console.log)}function x(){var e;u="add",(e=d.value)==null||e.show().then(()=>{var l;(l=r.value)==null||l.reset()})}function N(e){var m;u="edit",n=e,c.forEach(t=>{t.value.value=e[t.key]||null,t.key==="menuUrl"&&t.disabled&&($(e.menuUrl)&&(t.value.value=""),t.disabled.value=!0)});const l=c.find(t=>t.key==="redirect");$(e.menuUrl)&&(l.value.value=e.menuUrl),(m=d.value)==null||m.show()}function S(){var e,l,m,t;if(u==="add")((e=r.value)==null?void 0:e.validator())&&f.success("\u6A21\u62DF\u521B\u5EFA\u83DC\u5355\u6210\u529F, \u53C2\u6570\u4E3A:"+JSON.stringify((l=r.value)==null?void 0:l.generatorParams()));else if((m=r.value)==null?void 0:m.validator()){const A=(t=r.value)==null?void 0:t.generatorParams();if(n){const v=H(g.state.permissionRoutes,n.menuUrl);v&&v.meta&&v.meta.badge&&(v.meta.badge=A.badge||"")}f.success("\u6A21\u62DF\u4FEE\u6539\u83DC\u5355\u6210\u529F, \u53C2\u6570\u4E3A:"+JSON.stringify(A))}}function k(e){C.warning({title:"\u63D0\u793A",content:"\u662F\u5426\u8981\u5220\u9664\u6B64\u6570\u636E\uFF1F",positiveText:"\u5220\u9664",onPositiveClick:()=>{f.success("\u6A21\u62DF\u5220\u9664\u6210\u529F\uFF0C\u53C2\u6570\u4E3A\uFF1A"+JSON.stringify(e))}})}return te(b),U(B({rowKey:_,modalDialog:d,dataForm:r},a),{itemFormOptions:c,tableColumns:p,onAddItem:x,onDeleteItem:k,onConfirm:S})}});const de={class:"main-container"};function ce(u,n,a,C,f,g){const d=V,r=z,_=ie,p=G,c=oe("DataForm"),b=Q;return re(),se("div",de,[i(p,null,{header:F(()=>[i(r,{"show-filter":!1},{"top-right":F(()=>[i(d,{onAdd:u.onAddItem},null,8,["onAdd"])]),_:1})]),default:F(()=>[i(_,{loading:u.tableLoading,data:u.dataList,"row-key":u.rowKey,columns:u.tableColumns},null,8,["loading","data","row-key","columns"])]),_:1}),i(b,{ref:"modalDialog",onConfirm:u.onConfirm,"content-height":"50vh"},{content:F(()=>[i(c,{ref:"dataForm",options:u.itemFormOptions},null,8,["options"])]),_:1},8,["onConfirm"])])}w.render=ce;w.__scopeId="data-v-4df9945e";export{w as default};
