import{d as r,b as n,t as c,v as m,o as p,c as _,a as t,G as s,i as l}from"./vendor.2777dd0c.js";var d=r({name:"TodoItem",props:{item:{type:Object}},setup(e){return{firstChar:n(()=>e.item.content.substring(0,1)),headerStyle:{backgroundColor:e.item.bgColor}}}});const h=l();c("data-v-5d323dd9");const u={class:"wating-item-action"},v={class:"flex items-center item-header-wrapper"},f={class:"flex-1 item-time"},y={class:"mt-4 item-content"};m();const I=h((e,i,g,C,S,b)=>{var o,a;return p(),_("div",u,[t("div",v,[t("div",{class:"flex items-center justify-center item-header",style:e.headerStyle},s(e.firstChar),5),t("div",f,s((o=e.item)==null?void 0:o.time),1)]),t("div",y,s((a=e.item)==null?void 0:a.content),1)])});d.render=I;d.__scopeId="data-v-5d323dd9";export{d as default};