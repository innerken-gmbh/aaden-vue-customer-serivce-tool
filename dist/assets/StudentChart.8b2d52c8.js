import{d as h,L as m,u as i}from"./useEcharts.5a9cb742.js";import{d as f,g as d,k as y,$ as g,aE as b,o as a,c as o,w as c,q as l,f as v,bb as x,G as k}from"./vendor.88197545.js";var p=f({name:"StudentChart",setup(){const e=d(!0),t=d(null),s=()=>{const r={grid:{left:"2%",right:"5%",top:"5%",bottom:"3%",containLabel:!0},tooltip:{trigger:"axis"},yAxis:{type:"category",data:["\u4E00\u6708","\u4E8C\u6708","\u4E09\u6708","\u56DB\u6708","\u4E94\u6708","\u516D\u6708"],boundaryGap:0,axisTick:{show:!1}},xAxis:{type:"value",boundaryGap:0},series:[{data:[480,289,711,618,393,571,470],type:"bar",smooth:!0,showSymbol:!1,barWidth:"auto",itemStyle:{borderRadius:[0,15,15,0],opacity:.8,color:new m(1,0,0,1,[{offset:0,color:"rgba(12, 124, 182)"},{offset:1,color:"rgba(244, 187, 236)"}])}}]};setTimeout(()=>{e.value=!1,b(()=>{i(t.value).setOption(r)})},1e3)},n=()=>{i(t.value).resize()};return y(s),g(()=>{h(t.value)}),{loading:e,updateChart:n,studentChart:t}}});const C={key:1,class:"text-sm"},E={class:"chart-item-container"},w={key:1,ref:"studentChart",class:"chart-item"};function B(e,t,s,n,r,$){const u=x,_=k;return a(),o(_,{"content-style":{padding:"10px"},"header-style":{padding:"10px"},segmented:!0},{header:c(()=>[e.loading?(a(),o(u,{key:0,text:"",style:{width:"50%"}})):(a(),l("div",C," \u534A\u5E74\u62DB\u751F\u5BF9\u6BD4\u56FE\uFF08\u5355\u4F4D\uFF1A\u4EBA\uFF09 "))]),default:c(()=>[v("div",E,[e.loading?(a(),o(u,{key:0,text:"",repeat:4})):(a(),l("div",w,null,512))])]),_:1})}p.render=B;p.__scopeId="data-v-46eedeb7";export{p as default};
