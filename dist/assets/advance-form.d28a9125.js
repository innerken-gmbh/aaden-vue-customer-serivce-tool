import{d as U,g as v,a6 as L,o as V,q as $,f as B,a as e,w as l,H as t,am as E,al as O,aU as q,be as A,bf as D,bg as z,aS as G,G as P,ac as R,ad as S,aT as H,aJ as J,ab as K,bh as Q,bi as W,bj as X,ae as Y,aa as Z}from"./vendor.88197545.js";var T=U({name:"AdvanceForm",setup(){const a=v(null),n=v({name:null,isOnLine:null,joinType:null,address:null,remark:null}),g={name:{required:!0,message:"\u8BF7\u8F93\u5165\u5B66\u6821\u540D\u79F0",trigger:"blur"},isOnLine:{required:!0,message:"\u8BF7\u9009\u62E9\u7EBF\u4E0A\u7EBF\u4E0B",trigger:"change"},joinType:{required:!0,message:"\u8BF7\u9009\u62E9\u52A0\u76DF\u65B9\u5F0F",trigger:"change"},address:{required:!0,message:"\u8BF7\u8F93\u5165\u5B66\u6821\u5730\u5740",trigger:"blur"}},p=L();function h(){var i;(i=a.value)==null||i.validate(u=>{u?p.error("\u9A8C\u8BC1\u5931\u8D25"):p.success("\u9A8C\u8BC1\u6210\u529F")})}const y=v(2);return{verifyForm:a,baseInfoModel:n,rules:g,onVerifyForm:h,cols:y}}});const x={class:"main-container"},ee=t("\u9A8C\u8BC1"),le=t("\u7EBF\u4E0B"),ae=t("\u7EBF\u4E0A"),ne=t("\u666E\u901A"),oe=t("\u72EC\u5BB6"),te=t("\u4EE3\u7406"),se=t("\u666E\u901A"),ue=t("\u72EC\u5BB6"),de=t("\u4EE3\u7406"),_e={class:"mt-2"},ie=t("\u7EBF\u4E0B"),re=t("\u7EBF\u4E0A"),pe=t("\u666E\u901A"),fe=t("\u72EC\u5BB6"),me=t("\u4EE3\u7406");function ce(a,n,g,p,h,y){const i=E,u=O,s=q,r=A,f=D,m=z,c=G,b=P,F=R,w=S,d=H,_=J,I=K,M=Q,k=W,j=X,C=Y,N=Z;return V(),$("div",x,[B("div",null,[e(b,{title:"\u8868\u5355\u9A8C\u8BC1","header-style":{padding:"10px"},segmented:!0},{"header-extra":l(()=>[e(i,{size:"small",type:"primary",onClick:a.onVerifyForm},{default:l(()=>[ee]),_:1},8,["onClick"])]),default:l(()=>[e(c,{ref:"verifyForm",model:a.baseInfoModel,rules:a.rules,"label-width":"80px",class:"form-wrapper","label-align":"left"},{default:l(()=>[e(s,{label:"\u5B66\u6821\u540D\u79F0",path:"name"},{default:l(()=>[e(u,{value:a.baseInfoModel.name,"onUpdate:value":n[0]||(n[0]=o=>a.baseInfoModel.name=o),placeholder:"\u8BF7\u8F93\u5165\u5B66\u6821\u540D\u79F0"},null,8,["value"])]),_:1}),e(s,{label:"\u5728\u7EBF\u72B6\u6001",path:"isOnLine"},{default:l(()=>[e(f,{value:a.baseInfoModel.isOnLine,"onUpdate:value":n[1]||(n[1]=o=>a.baseInfoModel.isOnLine=o),name:"isOnLine"},{default:l(()=>[e(r,{value:"onLine"},{default:l(()=>[le]),_:1}),e(r,{value:"offLine"},{default:l(()=>[ae]),_:1})]),_:1},8,["value"])]),_:1}),e(s,{label:"\u52A0\u76DF\u65B9\u5F0F",path:"joinType"},{default:l(()=>[e(f,{value:a.baseInfoModel.joinType,"onUpdate:value":n[2]||(n[2]=o=>a.baseInfoModel.joinType=o),name:"joinType"},{default:l(()=>[e(m,{value:"normal"},{default:l(()=>[ne]),_:1}),e(m,{value:"single"},{default:l(()=>[oe]),_:1}),e(m,{value:"proxy"},{default:l(()=>[te]),_:1})]),_:1},8,["value"])]),_:1}),e(s,{label:"\u5B66\u6821\u5730\u5740",path:"address"},{default:l(()=>[e(u,{value:a.baseInfoModel.address,"onUpdate:value":n[3]||(n[3]=o=>a.baseInfoModel.address=o),placeholder:"\u8BF7\u8F93\u5165\u5B66\u6821\u5730\u5740"},null,8,["value"])]),_:1}),e(s,{label:"\u5B66\u6821\u5907\u6CE8",path:"remark"},{default:l(()=>[e(u,{value:a.baseInfoModel.remark,"onUpdate:value":n[4]||(n[4]=o=>a.baseInfoModel.remark=o),placeholder:"\u8BF7\u8F93\u5165\u5B66\u6821\u5907\u6CE8",type:"textarea",rows:3},null,8,["value"])]),_:1})]),_:1},8,["model","rules"])]),_:1})]),e(b,{title:"\u6805\u683C\u5316\u8868\u5355"+a.cols+"\u5217","header-style":{padding:"10px"},class:"mt-2",segmented:!0},{"header-extra":l(()=>[e(F,{value:a.cols,"onUpdate:value":n[5]||(n[5]=o=>a.cols=o),max:4,min:2},null,8,["value"])]),default:l(()=>[e(c,{"label-width":"80",size:"small","label-placement":"left"},{default:l(()=>[e(N,{cols:a.cols,"x-gap":"20","y-gap":"10"},{default:l(()=>[e(d,{label:"\u4E0B\u62C9\u9009\u62E9"},{default:l(()=>[e(w,{placeholder:"\u8BF7\u9009\u62E9\u4E00\u4E2A\u5427",options:[{label:"\u9009\u9879\u4E00",value:1},{label:"\u9009\u9879\u4E8C",value:2},{label:"\u9009\u9879\u4E09",value:3},{label:"\u9009\u9879\u56DB",value:4}]})]),_:1}),e(d,{label:"\u52A0\u51CF\u6570\u91CF"},{default:l(()=>[e(F,{style:{width:"100%"}})]),_:1}),e(d,{label:"\u8F93\u5165\u6846"},{default:l(()=>[e(u)]),_:1}),e(d,{label:"\u590D\u9009\u6846"},{default:l(()=>[e(M,null,{default:l(()=>[e(I,null,{default:l(()=>[e(_,{value:"1"},{default:l(()=>[se]),_:1}),e(_,{value:"2"},{default:l(()=>[ue]),_:1}),e(_,{value:"3"},{default:l(()=>[de]),_:1})]),_:1})]),_:1})]),_:1}),e(d,{label:"\u9009\u62E9\u65E5\u671F"},{default:l(()=>[e(k,{style:{width:"100%"}})]),_:1}),e(d,{label:"\u65E5\u671F\u8303\u56F4"},{default:l(()=>[e(k,{type:"daterange",style:{width:"100%"}})]),_:1}),e(d,{label:"\u9009\u62E9\u65F6\u95F4"},{default:l(()=>[e(j,{style:{width:"100%"}})]),_:1}),e(d,{label:"\u5F00\u5173\u6309\u94AE"},{default:l(()=>[e(C)]),_:1})]),_:1},8,["cols"])]),_:1})]),_:1},8,["title"]),B("div",_e,[e(b,{title:"\u884C\u5185\u8868\u5355","header-style":{padding:"10px"},segmented:!0},{default:l(()=>[e(c,{inline:"","label-width":"80",size:"small","label-align":"left"},{default:l(()=>[e(s,{label:"\u8F93\u5165\u6846",style:{width:"20%"}},{default:l(()=>[e(u,{value:a.baseInfoModel.name,"onUpdate:value":n[6]||(n[6]=o=>a.baseInfoModel.name=o),placeholder:"\u8BF7\u8F93\u5165\u4E00\u5B9A\u5185\u5BB9"},null,8,["value"])]),_:1}),e(s,{label:"\u5355\u9009\u7EC4",style:{width:"20%"}},{default:l(()=>[e(f,null,{default:l(()=>[e(r,{label:0},{default:l(()=>[ie]),_:1}),e(r,{label:1},{default:l(()=>[re]),_:1})]),_:1})]),_:1}),e(s,{label:"\u4E0B\u62C9\u9009\u62E9",style:{width:"20%"}},{default:l(()=>[e(w,{options:[{label:"\u9009\u9879\u4E00",value:1},{label:"\u9009\u9879\u4E8C",value:2},{label:"\u9009\u9879\u4E09",value:3}]})]),_:1}),e(s,{label:"\u591A\u9009\u7EC4",style:{width:"20%"}},{default:l(()=>[e(M,{modelValue:a.baseInfoModel.joinType,"onUpdate:modelValue":n[7]||(n[7]=o=>a.baseInfoModel.joinType=o)},{default:l(()=>[e(I,null,{default:l(()=>[e(_,{value:"1"},{default:l(()=>[pe]),_:1}),e(_,{value:"2"},{default:l(()=>[fe]),_:1}),e(_,{value:"3"},{default:l(()=>[me]),_:1})]),_:1})]),_:1},8,["modelValue"])]),_:1}),e(s,{label:"\u591A\u884C\u8F93\u5165",style:{width:"20%"}},{default:l(()=>[e(u,{placeholder:"\u8BF7\u8F93\u5165\u591A\u884C\u8F93\u5165",type:"textarea",rows:3})]),_:1})]),_:1})]),_:1})])])}T.render=ce;T.__scopeId="data-v-5cd787fb";export{T as default};
