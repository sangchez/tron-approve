import{E as e,I as t,S as n,c as r,d as i,et as a,f as o,g as s,h as c,k as l,l as u,m as d,u as f}from"./vue.runtime.esm-bundler-ngPGXZWx.js";import{t as p}from"./button-D9FKjmKN.js";import{t as m}from"./message-CmoRGDYD.js";import{Xt as h,Zt as g}from"./index-CVv7IZu9.js";var _=g.extend({name:`progressspinner`,style:`
    .p-progressspinner {
        position: relative;
        margin: 0 auto;
        width: 100px;
        height: 100px;
        display: inline-block;
    }

    .p-progressspinner::before {
        content: '';
        display: block;
        padding-top: 100%;
    }

    .p-progressspinner-spin {
        height: 100%;
        transform-origin: center center;
        width: 100%;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        margin: auto;
        animation: p-progressspinner-rotate 2s linear infinite;
    }

    .p-progressspinner-circle {
        stroke-dasharray: 89, 200;
        stroke-dashoffset: 0;
        stroke: dt('progressspinner.colorOne');
        animation:
            p-progressspinner-dash 1.5s ease-in-out infinite,
            p-progressspinner-color 6s ease-in-out infinite;
        stroke-linecap: round;
    }

    @keyframes p-progressspinner-rotate {
        100% {
            transform: rotate(360deg);
        }
    }
    @keyframes p-progressspinner-dash {
        0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
        }
        50% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -35px;
        }
        100% {
            stroke-dasharray: 89, 200;
            stroke-dashoffset: -124px;
        }
    }
    @keyframes p-progressspinner-color {
        100%,
        0% {
            stroke: dt('progressspinner.color.one');
        }
        40% {
            stroke: dt('progressspinner.color.two');
        }
        66% {
            stroke: dt('progressspinner.color.three');
        }
        80%,
        90% {
            stroke: dt('progressspinner.color.four');
        }
    }
`,classes:{root:`p-progressspinner`,spin:`p-progressspinner-spin`,circle:`p-progressspinner-circle`}}),v={name:`ProgressSpinner`,extends:{name:`BaseProgressSpinner`,extends:h,props:{strokeWidth:{type:String,default:`2`},fill:{type:String,default:`none`},animationDuration:{type:String,default:`2s`}},style:_,provide:function(){return{$pcProgressSpinner:this,$parentInstance:this}}},inheritAttrs:!1,computed:{svgStyle:function(){return{"animation-duration":this.animationDuration}}}},y=[`fill`,`stroke-width`];function b(t,r,i,a,s,c){return e(),o(`div`,n({class:t.cx(`root`),role:`progressbar`},t.ptmi(`root`)),[(e(),o(`svg`,n({class:t.cx(`spin`),viewBox:`25 25 50 50`,style:c.svgStyle},t.ptm(`spin`)),[u(`circle`,n({class:t.cx(`circle`),cx:`50`,cy:`50`,r:`20`,fill:t.fill,"stroke-width":t.strokeWidth,strokeMiterlimit:`10`},t.ptm(`circle`)),null,16,y)],16))],16)}v.render=b;var x={LOADING:`loading`,NORMAL:`normal`,EMPTY:`empty`,ERROR:`error`},S={class:`flex flex-col items-center justify-center py-12`},C=s({__name:`BaseEmptyState`,props:{emptyText:{default:`暂无数据`}},setup(n){let r=n;return(n,i)=>{let s=m;return e(),o(`div`,S,[c(s,{severity:`secondary`,closable:!1},{default:t(()=>[d(a(r.emptyText),1)]),_:1})])}}}),w={class:`flex flex-col items-center justify-center gap-4 py-12`},T={class:`font-medium`},E={class:`mt-1 text-sm`},D=s({__name:`BaseErrorState`,props:{errorText:{default:`加载失败`},errorDescription:{default:`请检查网络后重试`},showRetry:{type:Boolean,default:!0}},emits:[`retry`],setup(n,{emit:r}){let s=n,l=r;return(n,r)=>{let d=m,h=p;return e(),o(`div`,w,[c(d,{severity:`error`,closable:!1},{default:t(()=>[u(`div`,T,a(s.errorText),1),u(`div`,E,a(s.errorDescription),1)]),_:1}),s.showRetry?(e(),f(h,{key:0,label:`重试`,icon:`pi pi-refresh`,onClick:r[0]||=e=>l(`retry`)})):i(``,!0)])}}}),O={class:`flex flex-col items-center justify-center gap-3 py-12`},k={class:`text-sm text-surface-500`},A=s({__name:`BaseLoadingState`,props:{loadingText:{default:`加载中...`}},setup(t){let n=t;return(t,r)=>{let i=v;return e(),o(`div`,O,[c(i),u(`span`,k,a(n.loadingText),1)])}}}),j=s({__name:`BaseStateContainer`,props:{state:{default:`normal`},loadingText:{default:`加载中...`},emptyText:{default:`暂无数据`},errorText:{default:`加载失败`},errorDescription:{default:`请检查网络后重试`}},emits:[`retry`],setup(e,{emit:t}){let n=e,a=t,o=r(()=>n.state===`loading`),s=r(()=>n.state===`empty`),u=r(()=>n.state===`error`),d=r(()=>n.state===`normal`);return(t,n)=>o.value?l(t.$slots,`loading`,{key:0},()=>[c(A,{"loading-text":e.loadingText},null,8,[`loading-text`])]):s.value?l(t.$slots,`empty`,{key:1},()=>[c(C,{"empty-text":e.emptyText},null,8,[`empty-text`])]):u.value?l(t.$slots,`error`,{key:2,onRetry:()=>a(`retry`)},()=>[c(D,{"error-text":e.errorText,"error-description":e.errorDescription,onRetry:n[0]||=e=>a(`retry`)},null,8,[`error-text`,`error-description`])]):d.value?l(t.$slots,`default`,{key:3}):i(``,!0)}});export{x as n,j as t};