import{d as C,bt as m,M as B,a6 as D,bu as k,r as y,o as A,q as v,a as e,w as n,f as w,H as t,N as $,bv as b,ab as N,G as M,a9 as x,am as T,aa as z}from"./vendor.88197545.js";var h=C({name:"Badge",components:{Desktop:m},setup(){const o=B(),u=D(),l=k();function c(a){switch(a){case"warning":o.warning({title:"\u8B66\u544A",content:"\u4F60\u786E\u5B9A\u8981\u79BB\u5F00\u6211\uFF1F",positiveText:"\u786E\u5B9A",negativeText:"\u4E0D\u786E\u5B9A",onPositiveClick:()=>{u.success("\u786E\u5B9A")},onNegativeClick:()=>{u.error("\u4E0D\u786E\u5B9A")}});break;case"success":o.success({title:"\u6210\u529F",content:"\u5C0F\u54E5\u54E5\u4F60\u592A\u68D2\u4E86~~",positiveText:"\u54C7\u54E6~"});break;case"error":o.error({title:"\u9519\u8BEF",content:"\u77E5\u9053\u9519\u4E86\u5417\uFF0C\u4E0B\u6B21\u6539\u4E86",positiveText:"\u5FEB\u54ED\u4E86",onPositiveClick:()=>{u.success("\u6211\u77E5\u9053\u4E86")}});break}}function _(a){switch(a){case"info":u.info("\u5728\u5FC3\u788E\u4E2D\u8BA4\u6E05\u9057\u61BE \u751F\u547D\u6F2B\u957F\u4E5F\u77ED\u6682\u8DF3\u52A8\u5FC3\u810F\u957F\u51FA\u85E4\u8513");break;case"error":u.error("\u613F\u4E3A\u9669\u800C\u6218 \u8DCC\u5165\u7070\u6697\u5760\u5165\u6DF1\u6E0A");break;case"warning":u.warning("\u6CBE\u6EE1\u6CE5\u571F\u7684\u8138 \u6CA1\u6709\u795E\u7684\u5149\u73AF");break;case"success":u.success("\u63E1\u7D27\u624B\u4E2D\u7684\u5E73\u51E1 \u6B64\u5FC3\u81EA\u79F0\u65E0\u61BE\u751F\u547D\u7684\u706B\u5DF2\u70B9\u71C3");break;case"loading":u.loading("\u6709\u4E00\u5929\u4E5F\u8BB8\u4F1A\u8D70\u8FDC \u4E5F\u8BB8\u8FD8\u80FD\u518D\u76F8\u89C1");break}}function E(a){switch(a){case"info":l.info({content:"\u5728\u5FC3\u788E\u4E2D\u8BA4\u6E05\u9057\u61BE \u751F\u547D\u6F2B\u957F\u4E5F\u77ED\u6682\u8DF3\u52A8\u5FC3\u810F\u957F\u51FA\u85E4\u8513",meta:"\u53EA\u8981\u5E73\u51E1"});break;case"error":l.error({content:"\u613F\u4E3A\u9669\u800C\u6218 \u8DCC\u5165\u7070\u6697\u5760\u5165\u6DF1\u6E0A",meta:"\u53EA\u8981\u5E73\u51E1"});break;case"warning":l.warning({content:"\u6CBE\u6EE1\u6CE5\u571F\u7684\u8138 \u6CA1\u6709\u795E\u7684\u5149\u73AF",meta:"\u53EA\u8981\u5E73\u51E1"});break;case"success":l.success({content:"\u63E1\u7D27\u624B\u4E2D\u7684\u5E73\u51E1 \u6B64\u5FC3\u81EA\u79F0\u65E0\u61BE\u751F\u547D\u7684\u706B\u5DF2\u70B9\u71C3",meta:"\u53EA\u8981\u5E73\u51E1"});break}}return{openConfirm:c,openMessage:_,openNotification:E}}});const V=t(" \u65E0\u8BBA\u9047\u5230\u4EC0\u4E48\u56F0\u96BE\uFF0C\u751F\u6D3B\u603B\u662F\u8981\u7EE7\u7EED~ "),I=t(" \u4E07\u4E8B\u5F00\u5934\u96BE\uFF0C\u53EA\u80FD\u4E00\u76F4\u52AA\u529B\uFF01\uFF01\uFF01 "),P=t(" \u6210\u529F\u5C31\u662F\u773C\u524D\uFF0C\u8FC7\u4E86\u9ED1\u591C\u5C31\u662F\u767D\u5929\uFF0C\u52A0\u6CB9~~ "),j=t(" \u60F3\u60F3\u6628\u5929\uFF0C\u770B\u770B\u4ECA\u5929\uFF0C\u671B\u671B\u660E\u5929\uFF1B\u4E00\u5207\u90FD\u4F1A\u597D\u8D77\u6765 "),q=t(" \u6709\u4EBA\u6B3A\u8D1F\u4EBA\uFF0C\u8BF7\u4E0D\u72B9\u8C6B\uFF0C\u8BF7\u8FD8\u56DE\u53BB "),G={class:"padding"},H=t("\u8B66\u544A"),S=t("\u6210\u529F"),W=t("\u9519\u8BEF"),J=t(" \u4FE1\u606F "),K=t(" \u9519\u8BEF "),L=t(" \u8B66\u544A "),O=t(" \u6210\u529F "),Q=t(" \u52A0\u8F7D\u4E2D "),R=t(" \u4FE1\u606F "),U=t(" \u9519\u8BEF "),X=t(" \u8B66\u544A "),Y=t(" \u6210\u529F ");function Z(o,u,l,c,_,E){const a=y("Desktop"),F=$,r=b,p=N,d=M,f=x,s=T,g=z;return A(),v("div",null,[e(g,{cols:2,"x-gap":10,"y-gap":10},{default:n(()=>[e(f,null,{default:n(()=>[e(d,{title:"\u8B66\u544A\u4FE1\u606Falert","content-style":{padding:"10px"},"header-style":{padding:"10px"}},{default:n(()=>[e(p,{vertical:"",size:12},{default:n(()=>[e(r,{title:"\u9ED8\u8BA4\u7C7B\u578B",type:"default"},{icon:n(()=>[e(F,null,{default:n(()=>[e(a)]),_:1})]),default:n(()=>[V]),_:1}),e(r,{title:"Info \u7C7B\u578B",type:"info"},{default:n(()=>[I]),_:1}),e(r,{title:"Success \u7C7B\u578B",type:"success"},{default:n(()=>[P]),_:1}),e(r,{title:"Warning \u7C7B\u578B",type:"warning"},{default:n(()=>[j]),_:1}),e(r,{title:"Error \u7C7B\u578B",type:"error"},{default:n(()=>[q]),_:1})]),_:1})]),_:1})]),_:1}),e(f,null,{default:n(()=>[e(d,{title:"\u5BF9\u8BDD\u6846Dialog","content-style":{padding:"10px"},"header-style":{padding:"10px"}},{default:n(()=>[w("div",G,[e(p,null,{default:n(()=>[e(s,{size:"small",type:"primary",onClick:u[0]||(u[0]=i=>o.openConfirm("warning"))},{default:n(()=>[H]),_:1}),e(s,{size:"small",type:"warning",onClick:u[1]||(u[1]=i=>o.openConfirm("success"))},{default:n(()=>[S]),_:1}),e(s,{size:"small",type:"info",onClick:u[2]||(u[2]=i=>o.openConfirm("error"))},{default:n(()=>[W]),_:1})]),_:1})])]),_:1}),e(d,{class:"mt-2",title:"\u4FE1\u606FMessage","content-style":{padding:"10px"},"header-style":{padding:"10px"}},{default:n(()=>[e(p,null,{default:n(()=>[e(s,{type:"info",onClick:u[3]||(u[3]=i=>o.openMessage("info"))},{default:n(()=>[J]),_:1}),e(s,{type:"error",onClick:u[4]||(u[4]=i=>o.openMessage("error"))},{default:n(()=>[K]),_:1}),e(s,{type:"warning",onClick:u[5]||(u[5]=i=>o.openMessage("warning"))},{default:n(()=>[L]),_:1}),e(s,{type:"success",onClick:u[6]||(u[6]=i=>o.openMessage("success"))},{default:n(()=>[O]),_:1}),e(s,{type:"primary",onClick:u[7]||(u[7]=i=>o.openMessage("loading"))},{default:n(()=>[Q]),_:1})]),_:1})]),_:1}),e(d,{class:"mt-2",title:"\u901A\u77E5Notification","content-style":{padding:"10px"},"header-style":{padding:"10px"}},{default:n(()=>[e(p,null,{default:n(()=>[e(s,{type:"info",onClick:u[8]||(u[8]=i=>o.openNotification("info"))},{default:n(()=>[R]),_:1}),e(s,{type:"error",onClick:u[9]||(u[9]=i=>o.openNotification("error"))},{default:n(()=>[U]),_:1}),e(s,{type:"warning",onClick:u[10]||(u[10]=i=>o.openNotification("warning"))},{default:n(()=>[X]),_:1}),e(s,{type:"success",onClick:u[11]||(u[11]=i=>o.openNotification("success"))},{default:n(()=>[Y]),_:1})]),_:1})]),_:1})]),_:1})]),_:1})])}h.render=Z;export{h as default};
