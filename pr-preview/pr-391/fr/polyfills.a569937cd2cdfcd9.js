(self.webpackChunkstudio_web=self.webpackChunkstudio_web||[]).push([[429],{38:(ke,Se,Re)=>{"use strict";let Ee,He=window.AudioContext||window.webkitAudioContext,ve=Q=>{let p=new Event("error");return p.data=new Error("Wrong state for "+Q),p};class he{constructor(p,se=null){this.stream=p,this.config=se,this.state="inactive",this.em=document.createDocumentFragment(),this.encoder=(Q=>{let p=Q.toString().replace(/^(\(\)\s*=>|function\s*\(\))\s*{/,"").replace(/}$/,""),se=new Blob([p]);return new Worker(URL.createObjectURL(se))})(he.encoder);let ee=this;this.encoder.addEventListener("message",N=>{let ae=new Event("dataavailable");ae.data=new Blob([N.data],{type:ee.mimeType}),ee.em.dispatchEvent(ae),"inactive"===ee.state&&ee.em.dispatchEvent(new Event("stop"))})}start(p){if("inactive"!==this.state)return this.em.dispatchEvent(ve("start"));this.state="recording",Ee||(Ee=new He(this.config)),this.clone=this.stream.clone(),this.input=Ee.createMediaStreamSource(this.clone),this.processor=Ee.createScriptProcessor(2048,1,1),this.encoder.postMessage(["init",Ee.sampleRate]),this.processor.onaudioprocess=se=>{"recording"===this.state&&this.encoder.postMessage(["encode",se.inputBuffer.getChannelData(0)])},this.input.connect(this.processor),this.processor.connect(Ee.destination),this.em.dispatchEvent(new Event("start")),p&&(this.slicing=setInterval(()=>{"recording"===this.state&&this.requestData()},p))}stop(){return"inactive"===this.state?this.em.dispatchEvent(ve("stop")):(this.requestData(),this.state="inactive",this.clone.getTracks().forEach(p=>{p.stop()}),this.processor.disconnect(),this.input.disconnect(),clearInterval(this.slicing))}pause(){return"recording"!==this.state?this.em.dispatchEvent(ve("pause")):(this.state="paused",this.em.dispatchEvent(new Event("pause")))}resume(){return"paused"!==this.state?this.em.dispatchEvent(ve("resume")):(this.state="recording",this.em.dispatchEvent(new Event("resume")))}requestData(){return"inactive"===this.state?this.em.dispatchEvent(ve("requestData")):this.encoder.postMessage(["dump",Ee.sampleRate])}addEventListener(...p){this.em.addEventListener(...p)}removeEventListener(...p){this.em.removeEventListener(...p)}dispatchEvent(...p){this.em.dispatchEvent(...p)}}he.prototype.mimeType="audio/wav",he.isTypeSupported=Q=>he.prototype.mimeType===Q,he.notSupported=!navigator.mediaDevices||!He,he.encoder=()=>{let p=[];onmessage=N=>{"encode"===N.data[0]?function se(N){let ae=N.length,le=new Uint8Array(2*ae);for(let ue=0;ue<ae;ue++){let z=2*ue,L=N[ue];L>1?L=1:L<-1&&(L=-1),L*=32768,le[z]=L,le[z+1]=L>>8}p.push(le)}(N.data[1]):"dump"===N.data[0]&&function ee(N){let ae=p.length?p[0].length:0,le=p.length*ae,ue=new Uint8Array(44+le),z=new DataView(ue.buffer);z.setUint32(0,1380533830,!1),z.setUint32(4,36+le,!0),z.setUint32(8,1463899717,!1),z.setUint32(12,1718449184,!1),z.setUint32(16,16,!0),z.setUint16(20,1,!0),z.setUint16(22,1,!0),z.setUint32(24,N,!0),z.setUint32(28,2*N,!0),z.setUint16(32,2,!0),z.setUint16(34,16,!0),z.setUint32(36,1684108385,!1),z.setUint32(40,le,!0);for(let L=0;L<p.length;L++)ue.set(p[L],L*ae+44);p=[],postMessage(ue.buffer,[ue.buffer])}(N.data[1])}};const ce=he;Re(6551),Re(765),ce.encoder=()=>{importScripts("https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js");let ee,N=new Int8Array;function ae(L,fe){if(0===fe.length)return L;let de=new Int8Array(L.length+fe.length);return de.set(L),de.set(fe,L.length),de}onmessage=L=>{"init"===L.data[0]?function le(L){ee=new lamejs.Mp3Encoder(1,L||44100,128)}(L.data[1]):"encode"===L.data[0]?function ue(L){for(let de=0;de<L.length;de++)L[de]=32767.5*L[de];let fe=ee.encodeBuffer(L);N=ae(N,fe)}(L.data[1]):function z(){let L=ee.flush();N=ae(N,L);let fe=N.buffer;N=new Int8Array,postMessage(fe,[fe])}()}},ce.prototype.mimeType="audio/mpeg",window.MediaRecorder=ce},6551:()=>{"use strict";!function(t){const n=t.performance;function i(H){n&&n.mark&&n.mark(H)}function o(H,T){n&&n.measure&&n.measure(H,T)}i("Zone");const c=t.__Zone_symbol_prefix||"__zone_symbol__";function a(H){return c+H}const m=!0===t[a("forceDuplicateZoneCheck")];if(t.Zone){if(m||"function"!=typeof t.Zone.__symbol__)throw new Error("Zone already loaded.");return t.Zone}let d=(()=>{class H{static{this.__symbol__=a}static assertZonePatched(){if(t.Promise!==ge.ZoneAwarePromise)throw new Error("Zone.js has detected that ZoneAwarePromise `(window|global).Promise` has been overwritten.\nMost likely cause is that a Promise polyfill has been loaded after Zone.js (Polyfilling Promise api is not necessary when zone.js is loaded. If you must load one, do so before loading zone.js.)")}static get root(){let e=H.current;for(;e.parent;)e=e.parent;return e}static get current(){return q.zone}static get currentTask(){return me}static __load_patch(e,r,v=!1){if(ge.hasOwnProperty(e)){if(!v&&m)throw Error("Already loaded patch: "+e)}else if(!t["__Zone_disable_"+e]){const S="Zone:"+e;i(S),ge[e]=r(t,H,J),o(S,S)}}get parent(){return this._parent}get name(){return this._name}constructor(e,r){this._parent=e,this._name=r?r.name||"unnamed":"<root>",this._properties=r&&r.properties||{},this._zoneDelegate=new b(this,this._parent&&this._parent._zoneDelegate,r)}get(e){const r=this.getZoneWith(e);if(r)return r._properties[e]}getZoneWith(e){let r=this;for(;r;){if(r._properties.hasOwnProperty(e))return r;r=r._parent}return null}fork(e){if(!e)throw new Error("ZoneSpec required!");return this._zoneDelegate.fork(this,e)}wrap(e,r){if("function"!=typeof e)throw new Error("Expecting function got: "+e);const v=this._zoneDelegate.intercept(this,e,r),S=this;return function(){return S.runGuarded(v,this,arguments,r)}}run(e,r,v,S){q={parent:q,zone:this};try{return this._zoneDelegate.invoke(this,e,r,v,S)}finally{q=q.parent}}runGuarded(e,r=null,v,S){q={parent:q,zone:this};try{try{return this._zoneDelegate.invoke(this,e,r,v,S)}catch(K){if(this._zoneDelegate.handleError(this,K))throw K}}finally{q=q.parent}}runTask(e,r,v){if(e.zone!=this)throw new Error("A task can only be run in the zone of creation! (Creation: "+(e.zone||te).name+"; Execution: "+this.name+")");if(e.state===V&&(e.type===re||e.type===P))return;const S=e.state!=E;S&&e._transitionTo(E,U),e.runCount++;const K=me;me=e,q={parent:q,zone:this};try{e.type==P&&e.data&&!e.data.isPeriodic&&(e.cancelFn=void 0);try{return this._zoneDelegate.invokeTask(this,e,r,v)}catch(u){if(this._zoneDelegate.handleError(this,u))throw u}}finally{e.state!==V&&e.state!==h&&(e.type==re||e.data&&e.data.isPeriodic?S&&e._transitionTo(U,E):(e.runCount=0,this._updateTaskCount(e,-1),S&&e._transitionTo(V,E,V))),q=q.parent,me=K}}scheduleTask(e){if(e.zone&&e.zone!==this){let v=this;for(;v;){if(v===e.zone)throw Error(`can not reschedule task to ${this.name} which is descendants of the original zone ${e.zone.name}`);v=v.parent}}e._transitionTo($,V);const r=[];e._zoneDelegates=r,e._zone=this;try{e=this._zoneDelegate.scheduleTask(this,e)}catch(v){throw e._transitionTo(h,$,V),this._zoneDelegate.handleError(this,v),v}return e._zoneDelegates===r&&this._updateTaskCount(e,1),e.state==$&&e._transitionTo(U,$),e}scheduleMicroTask(e,r,v,S){return this.scheduleTask(new g(A,e,r,v,S,void 0))}scheduleMacroTask(e,r,v,S,K){return this.scheduleTask(new g(P,e,r,v,S,K))}scheduleEventTask(e,r,v,S,K){return this.scheduleTask(new g(re,e,r,v,S,K))}cancelTask(e){if(e.zone!=this)throw new Error("A task can only be cancelled in the zone of creation! (Creation: "+(e.zone||te).name+"; Execution: "+this.name+")");if(e.state===U||e.state===E){e._transitionTo(B,U,E);try{this._zoneDelegate.cancelTask(this,e)}catch(r){throw e._transitionTo(h,B),this._zoneDelegate.handleError(this,r),r}return this._updateTaskCount(e,-1),e._transitionTo(V,B),e.runCount=0,e}}_updateTaskCount(e,r){const v=e._zoneDelegates;-1==r&&(e._zoneDelegates=null);for(let S=0;S<v.length;S++)v[S]._updateTaskCount(e.type,r)}}return H})();const w={name:"",onHasTask:(H,T,e,r)=>H.hasTask(e,r),onScheduleTask:(H,T,e,r)=>H.scheduleTask(e,r),onInvokeTask:(H,T,e,r,v,S)=>H.invokeTask(e,r,v,S),onCancelTask:(H,T,e,r)=>H.cancelTask(e,r)};class b{constructor(T,e,r){this._taskCounts={microTask:0,macroTask:0,eventTask:0},this.zone=T,this._parentDelegate=e,this._forkZS=r&&(r&&r.onFork?r:e._forkZS),this._forkDlgt=r&&(r.onFork?e:e._forkDlgt),this._forkCurrZone=r&&(r.onFork?this.zone:e._forkCurrZone),this._interceptZS=r&&(r.onIntercept?r:e._interceptZS),this._interceptDlgt=r&&(r.onIntercept?e:e._interceptDlgt),this._interceptCurrZone=r&&(r.onIntercept?this.zone:e._interceptCurrZone),this._invokeZS=r&&(r.onInvoke?r:e._invokeZS),this._invokeDlgt=r&&(r.onInvoke?e:e._invokeDlgt),this._invokeCurrZone=r&&(r.onInvoke?this.zone:e._invokeCurrZone),this._handleErrorZS=r&&(r.onHandleError?r:e._handleErrorZS),this._handleErrorDlgt=r&&(r.onHandleError?e:e._handleErrorDlgt),this._handleErrorCurrZone=r&&(r.onHandleError?this.zone:e._handleErrorCurrZone),this._scheduleTaskZS=r&&(r.onScheduleTask?r:e._scheduleTaskZS),this._scheduleTaskDlgt=r&&(r.onScheduleTask?e:e._scheduleTaskDlgt),this._scheduleTaskCurrZone=r&&(r.onScheduleTask?this.zone:e._scheduleTaskCurrZone),this._invokeTaskZS=r&&(r.onInvokeTask?r:e._invokeTaskZS),this._invokeTaskDlgt=r&&(r.onInvokeTask?e:e._invokeTaskDlgt),this._invokeTaskCurrZone=r&&(r.onInvokeTask?this.zone:e._invokeTaskCurrZone),this._cancelTaskZS=r&&(r.onCancelTask?r:e._cancelTaskZS),this._cancelTaskDlgt=r&&(r.onCancelTask?e:e._cancelTaskDlgt),this._cancelTaskCurrZone=r&&(r.onCancelTask?this.zone:e._cancelTaskCurrZone),this._hasTaskZS=null,this._hasTaskDlgt=null,this._hasTaskDlgtOwner=null,this._hasTaskCurrZone=null;const v=r&&r.onHasTask;(v||e&&e._hasTaskZS)&&(this._hasTaskZS=v?r:w,this._hasTaskDlgt=e,this._hasTaskDlgtOwner=this,this._hasTaskCurrZone=T,r.onScheduleTask||(this._scheduleTaskZS=w,this._scheduleTaskDlgt=e,this._scheduleTaskCurrZone=this.zone),r.onInvokeTask||(this._invokeTaskZS=w,this._invokeTaskDlgt=e,this._invokeTaskCurrZone=this.zone),r.onCancelTask||(this._cancelTaskZS=w,this._cancelTaskDlgt=e,this._cancelTaskCurrZone=this.zone))}fork(T,e){return this._forkZS?this._forkZS.onFork(this._forkDlgt,this.zone,T,e):new d(T,e)}intercept(T,e,r){return this._interceptZS?this._interceptZS.onIntercept(this._interceptDlgt,this._interceptCurrZone,T,e,r):e}invoke(T,e,r,v,S){return this._invokeZS?this._invokeZS.onInvoke(this._invokeDlgt,this._invokeCurrZone,T,e,r,v,S):e.apply(r,v)}handleError(T,e){return!this._handleErrorZS||this._handleErrorZS.onHandleError(this._handleErrorDlgt,this._handleErrorCurrZone,T,e)}scheduleTask(T,e){let r=e;if(this._scheduleTaskZS)this._hasTaskZS&&r._zoneDelegates.push(this._hasTaskDlgtOwner),r=this._scheduleTaskZS.onScheduleTask(this._scheduleTaskDlgt,this._scheduleTaskCurrZone,T,e),r||(r=e);else if(e.scheduleFn)e.scheduleFn(e);else{if(e.type!=A)throw new Error("Task is missing scheduleFn.");C(e)}return r}invokeTask(T,e,r,v){return this._invokeTaskZS?this._invokeTaskZS.onInvokeTask(this._invokeTaskDlgt,this._invokeTaskCurrZone,T,e,r,v):e.callback.apply(r,v)}cancelTask(T,e){let r;if(this._cancelTaskZS)r=this._cancelTaskZS.onCancelTask(this._cancelTaskDlgt,this._cancelTaskCurrZone,T,e);else{if(!e.cancelFn)throw Error("Task is not cancelable");r=e.cancelFn(e)}return r}hasTask(T,e){try{this._hasTaskZS&&this._hasTaskZS.onHasTask(this._hasTaskDlgt,this._hasTaskCurrZone,T,e)}catch(r){this.handleError(T,r)}}_updateTaskCount(T,e){const r=this._taskCounts,v=r[T],S=r[T]=v+e;if(S<0)throw new Error("More tasks executed then were scheduled.");0!=v&&0!=S||this.hasTask(this.zone,{microTask:r.microTask>0,macroTask:r.macroTask>0,eventTask:r.eventTask>0,change:T})}}class g{constructor(T,e,r,v,S,K){if(this._zone=null,this.runCount=0,this._zoneDelegates=null,this._state="notScheduled",this.type=T,this.source=e,this.data=v,this.scheduleFn=S,this.cancelFn=K,!r)throw new Error("callback is not defined");this.callback=r;const u=this;this.invoke=T===re&&v&&v.useG?g.invokeTask:function(){return g.invokeTask.call(t,u,this,arguments)}}static invokeTask(T,e,r){T||(T=this),ie++;try{return T.runCount++,T.zone.runTask(T,e,r)}finally{1==ie&&_(),ie--}}get zone(){return this._zone}get state(){return this._state}cancelScheduleRequest(){this._transitionTo(V,$)}_transitionTo(T,e,r){if(this._state!==e&&this._state!==r)throw new Error(`${this.type} '${this.source}': can not transition to '${T}', expecting state '${e}'${r?" or '"+r+"'":""}, was '${this._state}'.`);this._state=T,T==V&&(this._zoneDelegates=null)}toString(){return this.data&&typeof this.data.handleId<"u"?this.data.handleId.toString():Object.prototype.toString.call(this)}toJSON(){return{type:this.type,state:this.state,source:this.source,zone:this.zone.name,runCount:this.runCount}}}const j=a("setTimeout"),I=a("Promise"),M=a("then");let ne,W=[],x=!1;function Y(H){if(ne||t[I]&&(ne=t[I].resolve(0)),ne){let T=ne[M];T||(T=ne.then),T.call(ne,H)}else t[j](H,0)}function C(H){0===ie&&0===W.length&&Y(_),H&&W.push(H)}function _(){if(!x){for(x=!0;W.length;){const H=W;W=[];for(let T=0;T<H.length;T++){const e=H[T];try{e.zone.runTask(e,null,null)}catch(r){J.onUnhandledError(r)}}}J.microtaskDrainDone(),x=!1}}const te={name:"NO ZONE"},V="notScheduled",$="scheduling",U="scheduled",E="running",B="canceling",h="unknown",A="microTask",P="macroTask",re="eventTask",ge={},J={symbol:a,currentZoneFrame:()=>q,onUnhandledError:X,microtaskDrainDone:X,scheduleMicroTask:C,showUncaughtError:()=>!d[a("ignoreConsoleErrorUncaughtError")],patchEventTarget:()=>[],patchOnProperties:X,patchMethod:()=>X,bindArguments:()=>[],patchThen:()=>X,patchMacroTask:()=>X,patchEventPrototype:()=>X,isIEOrEdge:()=>!1,getGlobalObjects:()=>{},ObjectDefineProperty:()=>X,ObjectGetOwnPropertyDescriptor:()=>{},ObjectCreate:()=>{},ArraySlice:()=>[],patchClass:()=>X,wrapWithCurrentZone:()=>X,filterProperties:()=>[],attachOriginToPatched:()=>X,_redefineProperty:()=>X,patchCallbacks:()=>X,nativeScheduleMicroTask:Y};let q={parent:null,zone:new d(null,null)},me=null,ie=0;function X(){}o("Zone","Zone"),t.Zone=d}(globalThis);const ke=Object.getOwnPropertyDescriptor,Se=Object.defineProperty,Re=Object.getPrototypeOf,Ie=Object.create,He=Array.prototype.slice,Le="addEventListener",ve="removeEventListener",Ee=Zone.__symbol__(Le),he=Zone.__symbol__(ve),ce="true",Te="false",De=Zone.__symbol__("");function Ue(t,n){return Zone.current.wrap(t,n)}function Q(t,n,i,o,c){return Zone.current.scheduleMacroTask(t,n,i,o,c)}const p=Zone.__symbol__,se=typeof window<"u",ee=se?window:void 0,N=se&&ee||globalThis,ae="removeAttribute";function le(t,n){for(let i=t.length-1;i>=0;i--)"function"==typeof t[i]&&(t[i]=Ue(t[i],n+"_"+i));return t}function z(t){return!t||!1!==t.writable&&!("function"==typeof t.get&&typeof t.set>"u")}const L=typeof WorkerGlobalScope<"u"&&self instanceof WorkerGlobalScope,fe=!("nw"in N)&&typeof N.process<"u"&&"[object process]"==={}.toString.call(N.process),de=!fe&&!L&&!(!se||!ee.HTMLElement),Xe=typeof N.process<"u"&&"[object process]"==={}.toString.call(N.process)&&!L&&!(!se||!ee.HTMLElement),xe={},ze=function(t){if(!(t=t||N.event))return;let n=xe[t.type];n||(n=xe[t.type]=p("ON_PROPERTY"+t.type));const i=this||t.target||N,o=i[n];let c;return de&&i===ee&&"error"===t.type?(c=o&&o.call(this,t.message,t.filename,t.lineno,t.colno,t.error),!0===c&&t.preventDefault()):(c=o&&o.apply(this,arguments),null!=c&&!c&&t.preventDefault()),c};function Ye(t,n,i){let o=ke(t,n);if(!o&&i&&ke(i,n)&&(o={enumerable:!0,configurable:!0}),!o||!o.configurable)return;const c=p("on"+n+"patched");if(t.hasOwnProperty(c)&&t[c])return;delete o.writable,delete o.value;const a=o.get,m=o.set,d=n.slice(2);let w=xe[d];w||(w=xe[d]=p("ON_PROPERTY"+d)),o.set=function(b){let g=this;!g&&t===N&&(g=N),g&&("function"==typeof g[w]&&g.removeEventListener(d,ze),m&&m.call(g,null),g[w]=b,"function"==typeof b&&g.addEventListener(d,ze,!1))},o.get=function(){let b=this;if(!b&&t===N&&(b=N),!b)return null;const g=b[w];if(g)return g;if(a){let j=a.call(this);if(j)return o.set.call(this,j),"function"==typeof b[ae]&&b.removeAttribute(n),j}return null},Se(t,n,o),t[c]=!0}function $e(t,n,i){if(n)for(let o=0;o<n.length;o++)Ye(t,"on"+n[o],i);else{const o=[];for(const c in t)"on"==c.slice(0,2)&&o.push(c);for(let c=0;c<o.length;c++)Ye(t,o[c],i)}}const pe=p("originalInstance");function Me(t){const n=N[t];if(!n)return;N[p(t)]=n,N[t]=function(){const c=le(arguments,t);switch(c.length){case 0:this[pe]=new n;break;case 1:this[pe]=new n(c[0]);break;case 2:this[pe]=new n(c[0],c[1]);break;case 3:this[pe]=new n(c[0],c[1],c[2]);break;case 4:this[pe]=new n(c[0],c[1],c[2],c[3]);break;default:throw new Error("Arg list too long.")}},we(N[t],n);const i=new n(function(){});let o;for(o in i)"XMLHttpRequest"===t&&"responseBlob"===o||function(c){"function"==typeof i[c]?N[t].prototype[c]=function(){return this[pe][c].apply(this[pe],arguments)}:Se(N[t].prototype,c,{set:function(a){"function"==typeof a?(this[pe][c]=Ue(a,t+"."+c),we(this[pe][c],a)):this[pe][c]=a},get:function(){return this[pe][c]}})}(o);for(o in n)"prototype"!==o&&n.hasOwnProperty(o)&&(N[t][o]=n[o])}function be(t,n,i){let o=t;for(;o&&!o.hasOwnProperty(n);)o=Re(o);!o&&t[n]&&(o=t);const c=p(n);let a=null;if(o&&(!(a=o[c])||!o.hasOwnProperty(c))&&(a=o[c]=o[n],z(o&&ke(o,n)))){const d=i(a,c,n);o[n]=function(){return d(this,arguments)},we(o[n],a)}return a}function ut(t,n,i){let o=null;function c(a){const m=a.data;return m.args[m.cbIdx]=function(){a.invoke.apply(this,arguments)},o.apply(m.target,m.args),a}o=be(t,n,a=>function(m,d){const w=i(m,d);return w.cbIdx>=0&&"function"==typeof d[w.cbIdx]?Q(w.name,d[w.cbIdx],w,c):a.apply(m,d)})}function we(t,n){t[p("OriginalDelegate")]=n}let Je=!1,Ge=!1;function ht(){if(Je)return Ge;Je=!0;try{const t=ee.navigator.userAgent;(-1!==t.indexOf("MSIE ")||-1!==t.indexOf("Trident/")||-1!==t.indexOf("Edge/"))&&(Ge=!0)}catch{}return Ge}Zone.__load_patch("ZoneAwarePromise",(t,n,i)=>{const o=Object.getOwnPropertyDescriptor,c=Object.defineProperty,m=i.symbol,d=[],w=!1!==t[m("DISABLE_WRAPPING_UNCAUGHT_PROMISE_REJECTION")],b=m("Promise"),g=m("then"),j="__creationTrace__";i.onUnhandledError=u=>{if(i.showUncaughtError()){const l=u&&u.rejection;l?console.error("Unhandled Promise rejection:",l instanceof Error?l.message:l,"; Zone:",u.zone.name,"; Task:",u.task&&u.task.source,"; Value:",l,l instanceof Error?l.stack:void 0):console.error(u)}},i.microtaskDrainDone=()=>{for(;d.length;){const u=d.shift();try{u.zone.runGuarded(()=>{throw u.throwOriginal?u.rejection:u})}catch(l){M(l)}}};const I=m("unhandledPromiseRejectionHandler");function M(u){i.onUnhandledError(u);try{const l=n[I];"function"==typeof l&&l.call(this,u)}catch{}}function W(u){return u&&u.then}function x(u){return u}function ne(u){return e.reject(u)}const Y=m("state"),C=m("value"),_=m("finally"),te=m("parentPromiseValue"),V=m("parentPromiseState"),$="Promise.then",U=null,E=!0,B=!1,h=0;function A(u,l){return s=>{try{J(u,l,s)}catch(f){J(u,!1,f)}}}const P=function(){let u=!1;return function(s){return function(){u||(u=!0,s.apply(null,arguments))}}},re="Promise resolved with itself",ge=m("currentTaskTrace");function J(u,l,s){const f=P();if(u===s)throw new TypeError(re);if(u[Y]===U){let k=null;try{("object"==typeof s||"function"==typeof s)&&(k=s&&s.then)}catch(R){return f(()=>{J(u,!1,R)})(),u}if(l!==B&&s instanceof e&&s.hasOwnProperty(Y)&&s.hasOwnProperty(C)&&s[Y]!==U)me(s),J(u,s[Y],s[C]);else if(l!==B&&"function"==typeof k)try{k.call(s,f(A(u,l)),f(A(u,!1)))}catch(R){f(()=>{J(u,!1,R)})()}else{u[Y]=l;const R=u[C];if(u[C]=s,u[_]===_&&l===E&&(u[Y]=u[V],u[C]=u[te]),l===B&&s instanceof Error){const y=n.currentTask&&n.currentTask.data&&n.currentTask.data[j];y&&c(s,ge,{configurable:!0,enumerable:!1,writable:!0,value:y})}for(let y=0;y<R.length;)ie(u,R[y++],R[y++],R[y++],R[y++]);if(0==R.length&&l==B){u[Y]=h;let y=s;try{throw new Error("Uncaught (in promise): "+function a(u){return u&&u.toString===Object.prototype.toString?(u.constructor&&u.constructor.name||"")+": "+JSON.stringify(u):u?u.toString():Object.prototype.toString.call(u)}(s)+(s&&s.stack?"\n"+s.stack:""))}catch(D){y=D}w&&(y.throwOriginal=!0),y.rejection=s,y.promise=u,y.zone=n.current,y.task=n.currentTask,d.push(y),i.scheduleMicroTask()}}}return u}const q=m("rejectionHandledHandler");function me(u){if(u[Y]===h){try{const l=n[q];l&&"function"==typeof l&&l.call(this,{rejection:u[C],promise:u})}catch{}u[Y]=B;for(let l=0;l<d.length;l++)u===d[l].promise&&d.splice(l,1)}}function ie(u,l,s,f,k){me(u);const R=u[Y],y=R?"function"==typeof f?f:x:"function"==typeof k?k:ne;l.scheduleMicroTask($,()=>{try{const D=u[C],Z=!!s&&_===s[_];Z&&(s[te]=D,s[V]=R);const O=l.run(y,void 0,Z&&y!==ne&&y!==x?[]:[D]);J(s,!0,O)}catch(D){J(s,!1,D)}},s)}const H=function(){},T=t.AggregateError;class e{static toString(){return"function ZoneAwarePromise() { [native code] }"}static resolve(l){return l instanceof e?l:J(new this(null),E,l)}static reject(l){return J(new this(null),B,l)}static withResolvers(){const l={};return l.promise=new e((s,f)=>{l.resolve=s,l.reject=f}),l}static any(l){if(!l||"function"!=typeof l[Symbol.iterator])return Promise.reject(new T([],"All promises were rejected"));const s=[];let f=0;try{for(let y of l)f++,s.push(e.resolve(y))}catch{return Promise.reject(new T([],"All promises were rejected"))}if(0===f)return Promise.reject(new T([],"All promises were rejected"));let k=!1;const R=[];return new e((y,D)=>{for(let Z=0;Z<s.length;Z++)s[Z].then(O=>{k||(k=!0,y(O))},O=>{R.push(O),f--,0===f&&(k=!0,D(new T(R,"All promises were rejected")))})})}static race(l){let s,f,k=new this((D,Z)=>{s=D,f=Z});function R(D){s(D)}function y(D){f(D)}for(let D of l)W(D)||(D=this.resolve(D)),D.then(R,y);return k}static all(l){return e.allWithCallback(l)}static allSettled(l){return(this&&this.prototype instanceof e?this:e).allWithCallback(l,{thenCallback:f=>({status:"fulfilled",value:f}),errorCallback:f=>({status:"rejected",reason:f})})}static allWithCallback(l,s){let f,k,R=new this((O,G)=>{f=O,k=G}),y=2,D=0;const Z=[];for(let O of l){W(O)||(O=this.resolve(O));const G=D;try{O.then(F=>{Z[G]=s?s.thenCallback(F):F,y--,0===y&&f(Z)},F=>{s?(Z[G]=s.errorCallback(F),y--,0===y&&f(Z)):k(F)})}catch(F){k(F)}y++,D++}return y-=2,0===y&&f(Z),R}constructor(l){const s=this;if(!(s instanceof e))throw new Error("Must be an instanceof Promise.");s[Y]=U,s[C]=[];try{const f=P();l&&l(f(A(s,E)),f(A(s,B)))}catch(f){J(s,!1,f)}}get[Symbol.toStringTag](){return"Promise"}get[Symbol.species](){return e}then(l,s){let f=this.constructor?.[Symbol.species];(!f||"function"!=typeof f)&&(f=this.constructor||e);const k=new f(H),R=n.current;return this[Y]==U?this[C].push(R,k,l,s):ie(this,R,k,l,s),k}catch(l){return this.then(null,l)}finally(l){let s=this.constructor?.[Symbol.species];(!s||"function"!=typeof s)&&(s=e);const f=new s(H);f[_]=_;const k=n.current;return this[Y]==U?this[C].push(k,f,l,l):ie(this,k,f,l,l),f}}e.resolve=e.resolve,e.reject=e.reject,e.race=e.race,e.all=e.all;const r=t[b]=t.Promise;t.Promise=e;const v=m("thenPatched");function S(u){const l=u.prototype,s=o(l,"then");if(s&&(!1===s.writable||!s.configurable))return;const f=l.then;l[g]=f,u.prototype.then=function(k,R){return new e((D,Z)=>{f.call(this,D,Z)}).then(k,R)},u[v]=!0}return i.patchThen=S,r&&(S(r),be(t,"fetch",u=>function K(u){return function(l,s){let f=u.apply(l,s);if(f instanceof e)return f;let k=f.constructor;return k[v]||S(k),f}}(u))),Promise[n.__symbol__("uncaughtPromiseErrors")]=d,e}),Zone.__load_patch("toString",t=>{const n=Function.prototype.toString,i=p("OriginalDelegate"),o=p("Promise"),c=p("Error"),a=function(){if("function"==typeof this){const b=this[i];if(b)return"function"==typeof b?n.call(b):Object.prototype.toString.call(b);if(this===Promise){const g=t[o];if(g)return n.call(g)}if(this===Error){const g=t[c];if(g)return n.call(g)}}return n.call(this)};a[i]=n,Function.prototype.toString=a;const m=Object.prototype.toString;Object.prototype.toString=function(){return"function"==typeof Promise&&this instanceof Promise?"[object Promise]":m.call(this)}});let Ze=!1;if(typeof window<"u")try{const t=Object.defineProperty({},"passive",{get:function(){Ze=!0}});window.addEventListener("test",t,t),window.removeEventListener("test",t,t)}catch{Ze=!1}const dt={useG:!0},_e={},Ke={},Qe=new RegExp("^"+De+"(\\w+)(true|false)$"),et=p("propagationStopped");function tt(t,n){const i=(n?n(t):t)+Te,o=(n?n(t):t)+ce,c=De+i,a=De+o;_e[t]={},_e[t][Te]=c,_e[t][ce]=a}function _t(t,n,i,o){const c=o&&o.add||Le,a=o&&o.rm||ve,m=o&&o.listeners||"eventListeners",d=o&&o.rmAll||"removeAllListeners",w=p(c),b="."+c+":",g="prependListener",j="."+g+":",I=function(C,_,te){if(C.isRemoved)return;const V=C.callback;let $;"object"==typeof V&&V.handleEvent&&(C.callback=E=>V.handleEvent(E),C.originalDelegate=V);try{C.invoke(C,_,[te])}catch(E){$=E}const U=C.options;return U&&"object"==typeof U&&U.once&&_[a].call(_,te.type,C.originalDelegate?C.originalDelegate:C.callback,U),$};function M(C,_,te){if(!(_=_||t.event))return;const V=C||_.target||t,$=V[_e[_.type][te?ce:Te]];if($){const U=[];if(1===$.length){const E=I($[0],V,_);E&&U.push(E)}else{const E=$.slice();for(let B=0;B<E.length&&(!_||!0!==_[et]);B++){const h=I(E[B],V,_);h&&U.push(h)}}if(1===U.length)throw U[0];for(let E=0;E<U.length;E++){const B=U[E];n.nativeScheduleMicroTask(()=>{throw B})}}}const W=function(C){return M(this,C,!1)},x=function(C){return M(this,C,!0)};function ne(C,_){if(!C)return!1;let te=!0;_&&void 0!==_.useG&&(te=_.useG);const V=_&&_.vh;let $=!0;_&&void 0!==_.chkDup&&($=_.chkDup);let U=!1;_&&void 0!==_.rt&&(U=_.rt);let E=C;for(;E&&!E.hasOwnProperty(c);)E=Re(E);if(!E&&C[c]&&(E=C),!E||E[w])return!1;const B=_&&_.eventNameToString,h={},A=E[w]=E[c],P=E[p(a)]=E[a],re=E[p(m)]=E[m],ge=E[p(d)]=E[d];let J;_&&_.prepend&&(J=E[p(_.prepend)]=E[_.prepend]);const e=te?function(s){if(!h.isExisting)return A.call(h.target,h.eventName,h.capture?x:W,h.options)}:function(s){return A.call(h.target,h.eventName,s.invoke,h.options)},r=te?function(s){if(!s.isRemoved){const f=_e[s.eventName];let k;f&&(k=f[s.capture?ce:Te]);const R=k&&s.target[k];if(R)for(let y=0;y<R.length;y++)if(R[y]===s){R.splice(y,1),s.isRemoved=!0,0===R.length&&(s.allRemoved=!0,s.target[k]=null);break}}if(s.allRemoved)return P.call(s.target,s.eventName,s.capture?x:W,s.options)}:function(s){return P.call(s.target,s.eventName,s.invoke,s.options)},S=_&&_.diff?_.diff:function(s,f){const k=typeof f;return"function"===k&&s.callback===f||"object"===k&&s.originalDelegate===f},K=Zone[p("UNPATCHED_EVENTS")],u=t[p("PASSIVE_EVENTS")],l=function(s,f,k,R,y=!1,D=!1){return function(){const Z=this||t;let O=arguments[0];_&&_.transferEventName&&(O=_.transferEventName(O));let G=arguments[1];if(!G)return s.apply(this,arguments);if(fe&&"uncaughtException"===O)return s.apply(this,arguments);let F=!1;if("function"!=typeof G){if(!G.handleEvent)return s.apply(this,arguments);F=!0}if(V&&!V(s,G,Z,arguments))return;const Pe=Ze&&!!u&&-1!==u.indexOf(O),oe=function q(s,f){return!Ze&&"object"==typeof s&&s?!!s.capture:Ze&&f?"boolean"==typeof s?{capture:s,passive:!0}:s?"object"==typeof s&&!1!==s.passive?{...s,passive:!0}:s:{passive:!0}:s}(arguments[2],Pe),Ae=oe&&"object"==typeof oe&&oe.signal&&"object"==typeof oe.signal?oe.signal:void 0;if(Ae?.aborted)return;if(K)for(let Ce=0;Ce<K.length;Ce++)if(O===K[Ce])return Pe?s.call(Z,O,G,oe):s.apply(this,arguments);const We=!!oe&&("boolean"==typeof oe||oe.capture),st=!(!oe||"object"!=typeof oe)&&oe.once,vt=Zone.current;let qe=_e[O];qe||(tt(O,B),qe=_e[O]);const it=qe[We?ce:Te];let Be,Ne=Z[it],ct=!1;if(Ne){if(ct=!0,$)for(let Ce=0;Ce<Ne.length;Ce++)if(S(Ne[Ce],G))return}else Ne=Z[it]=[];const at=Z.constructor.name,lt=Ke[at];lt&&(Be=lt[O]),Be||(Be=at+f+(B?B(O):O)),h.options=oe,st&&(h.options.once=!1),h.target=Z,h.capture=We,h.eventName=O,h.isExisting=ct;const je=te?dt:void 0;je&&(je.taskData=h),Ae&&(h.options.signal=void 0);const ye=vt.scheduleEventTask(Be,G,je,k,R);return Ae&&(h.options.signal=Ae,s.call(Ae,"abort",()=>{ye.zone.cancelTask(ye)},{once:!0})),h.target=null,je&&(je.taskData=null),st&&(oe.once=!0),!Ze&&"boolean"==typeof ye.options||(ye.options=oe),ye.target=Z,ye.capture=We,ye.eventName=O,F&&(ye.originalDelegate=G),D?Ne.unshift(ye):Ne.push(ye),y?Z:void 0}};return E[c]=l(A,b,e,r,U),J&&(E[g]=l(J,j,function(s){return J.call(h.target,h.eventName,s.invoke,h.options)},r,U,!0)),E[a]=function(){const s=this||t;let f=arguments[0];_&&_.transferEventName&&(f=_.transferEventName(f));const k=arguments[2],R=!!k&&("boolean"==typeof k||k.capture),y=arguments[1];if(!y)return P.apply(this,arguments);if(V&&!V(P,y,s,arguments))return;const D=_e[f];let Z;D&&(Z=D[R?ce:Te]);const O=Z&&s[Z];if(O)for(let G=0;G<O.length;G++){const F=O[G];if(S(F,y))return O.splice(G,1),F.isRemoved=!0,0===O.length&&(F.allRemoved=!0,s[Z]=null,"string"==typeof f)&&(s[De+"ON_PROPERTY"+f]=null),F.zone.cancelTask(F),U?s:void 0}return P.apply(this,arguments)},E[m]=function(){const s=this||t;let f=arguments[0];_&&_.transferEventName&&(f=_.transferEventName(f));const k=[],R=nt(s,B?B(f):f);for(let y=0;y<R.length;y++){const D=R[y];k.push(D.originalDelegate?D.originalDelegate:D.callback)}return k},E[d]=function(){const s=this||t;let f=arguments[0];if(f){_&&_.transferEventName&&(f=_.transferEventName(f));const k=_e[f];if(k){const D=s[k[Te]],Z=s[k[ce]];if(D){const O=D.slice();for(let G=0;G<O.length;G++){const F=O[G];this[a].call(this,f,F.originalDelegate?F.originalDelegate:F.callback,F.options)}}if(Z){const O=Z.slice();for(let G=0;G<O.length;G++){const F=O[G];this[a].call(this,f,F.originalDelegate?F.originalDelegate:F.callback,F.options)}}}}else{const k=Object.keys(s);for(let R=0;R<k.length;R++){const D=Qe.exec(k[R]);let Z=D&&D[1];Z&&"removeListener"!==Z&&this[d].call(this,Z)}this[d].call(this,"removeListener")}if(U)return this},we(E[c],A),we(E[a],P),ge&&we(E[d],ge),re&&we(E[m],re),!0}let Y=[];for(let C=0;C<i.length;C++)Y[C]=ne(i[C],o);return Y}function nt(t,n){if(!n){const a=[];for(let m in t){const d=Qe.exec(m);let w=d&&d[1];if(w&&(!n||w===n)){const b=t[m];if(b)for(let g=0;g<b.length;g++)a.push(b[g])}}return a}let i=_e[n];i||(tt(n),i=_e[n]);const o=t[i[Te]],c=t[i[ce]];return o?c?o.concat(c):o.slice():c?c.slice():[]}function Et(t,n){const i=t.Event;i&&i.prototype&&n.patchMethod(i.prototype,"stopImmediatePropagation",o=>function(c,a){c[et]=!0,o&&o.apply(c,a)})}function Tt(t,n,i,o,c){const a=Zone.__symbol__(o);if(n[a])return;const m=n[a]=n[o];n[o]=function(d,w,b){return w&&w.prototype&&c.forEach(function(g){const j=`${i}.${o}::`+g,I=w.prototype;try{if(I.hasOwnProperty(g)){const M=t.ObjectGetOwnPropertyDescriptor(I,g);M&&M.value?(M.value=t.wrapWithCurrentZone(M.value,j),t._redefineProperty(w.prototype,g,M)):I[g]&&(I[g]=t.wrapWithCurrentZone(I[g],j))}else I[g]&&(I[g]=t.wrapWithCurrentZone(I[g],j))}catch{}}),m.call(n,d,w,b)},t.attachOriginToPatched(n[o],m)}function rt(t,n,i){if(!i||0===i.length)return n;const o=i.filter(a=>a.target===t);if(!o||0===o.length)return n;const c=o[0].ignoreProperties;return n.filter(a=>-1===c.indexOf(a))}function ot(t,n,i,o){t&&$e(t,rt(t,n,i),o)}function Fe(t){return Object.getOwnPropertyNames(t).filter(n=>n.startsWith("on")&&n.length>2).map(n=>n.substring(2))}Zone.__load_patch("util",(t,n,i)=>{const o=Fe(t);i.patchOnProperties=$e,i.patchMethod=be,i.bindArguments=le,i.patchMacroTask=ut;const c=n.__symbol__("BLACK_LISTED_EVENTS"),a=n.__symbol__("UNPATCHED_EVENTS");t[a]&&(t[c]=t[a]),t[c]&&(n[c]=n[a]=t[c]),i.patchEventPrototype=Et,i.patchEventTarget=_t,i.isIEOrEdge=ht,i.ObjectDefineProperty=Se,i.ObjectGetOwnPropertyDescriptor=ke,i.ObjectCreate=Ie,i.ArraySlice=He,i.patchClass=Me,i.wrapWithCurrentZone=Ue,i.filterProperties=rt,i.attachOriginToPatched=we,i._redefineProperty=Object.defineProperty,i.patchCallbacks=Tt,i.getGlobalObjects=()=>({globalSources:Ke,zoneSymbolEventNames:_e,eventNames:o,isBrowser:de,isMix:Xe,isNode:fe,TRUE_STR:ce,FALSE_STR:Te,ZONE_SYMBOL_PREFIX:De,ADD_EVENT_LISTENER_STR:Le,REMOVE_EVENT_LISTENER_STR:ve})});const Ve=p("zoneTask");function Oe(t,n,i,o){let c=null,a=null;i+=o;const m={};function d(b){const g=b.data;return g.args[0]=function(){return b.invoke.apply(this,arguments)},g.handleId=c.apply(t,g.args),b}function w(b){return a.call(t,b.data.handleId)}c=be(t,n+=o,b=>function(g,j){if("function"==typeof j[0]){const I={isPeriodic:"Interval"===o,delay:"Timeout"===o||"Interval"===o?j[1]||0:void 0,args:j},M=j[0];j[0]=function(){try{return M.apply(this,arguments)}finally{I.isPeriodic||("number"==typeof I.handleId?delete m[I.handleId]:I.handleId&&(I.handleId[Ve]=null))}};const W=Q(n,j[0],I,d,w);if(!W)return W;const x=W.data.handleId;return"number"==typeof x?m[x]=W:x&&(x[Ve]=W),x&&x.ref&&x.unref&&"function"==typeof x.ref&&"function"==typeof x.unref&&(W.ref=x.ref.bind(x),W.unref=x.unref.bind(x)),"number"==typeof x||x?x:W}return b.apply(t,j)}),a=be(t,i,b=>function(g,j){const I=j[0];let M;"number"==typeof I?M=m[I]:(M=I&&I[Ve],M||(M=I)),M&&"string"==typeof M.type?"notScheduled"!==M.state&&(M.cancelFn&&M.data.isPeriodic||0===M.runCount)&&("number"==typeof I?delete m[I]:I&&(I[Ve]=null),M.zone.cancelTask(M)):b.apply(t,j)})}Zone.__load_patch("legacy",t=>{const n=t[Zone.__symbol__("legacyPatch")];n&&n()}),Zone.__load_patch("timers",t=>{const n="set",i="clear";Oe(t,n,i,"Timeout"),Oe(t,n,i,"Interval"),Oe(t,n,i,"Immediate")}),Zone.__load_patch("requestAnimationFrame",t=>{Oe(t,"request","cancel","AnimationFrame"),Oe(t,"mozRequest","mozCancel","AnimationFrame"),Oe(t,"webkitRequest","webkitCancel","AnimationFrame")}),Zone.__load_patch("blocking",(t,n)=>{const i=["alert","prompt","confirm"];for(let o=0;o<i.length;o++)be(t,i[o],(a,m,d)=>function(w,b){return n.current.run(a,t,b,d)})}),Zone.__load_patch("EventTarget",(t,n,i)=>{(function kt(t,n){n.patchEventPrototype(t,n)})(t,i),function yt(t,n){if(Zone[n.symbol("patchEventTarget")])return;const{eventNames:i,zoneSymbolEventNames:o,TRUE_STR:c,FALSE_STR:a,ZONE_SYMBOL_PREFIX:m}=n.getGlobalObjects();for(let w=0;w<i.length;w++){const b=i[w],I=m+(b+a),M=m+(b+c);o[b]={},o[b][a]=I,o[b][c]=M}const d=t.EventTarget;d&&d.prototype&&n.patchEventTarget(t,n,[d&&d.prototype])}(t,i);const o=t.XMLHttpRequestEventTarget;o&&o.prototype&&i.patchEventTarget(t,i,[o.prototype])}),Zone.__load_patch("MutationObserver",(t,n,i)=>{Me("MutationObserver"),Me("WebKitMutationObserver")}),Zone.__load_patch("IntersectionObserver",(t,n,i)=>{Me("IntersectionObserver")}),Zone.__load_patch("FileReader",(t,n,i)=>{Me("FileReader")}),Zone.__load_patch("on_property",(t,n,i)=>{!function pt(t,n){if(fe&&!Xe||Zone[t.symbol("patchEvents")])return;const i=n.__Zone_ignore_on_properties;let o=[];if(de){const c=window;o=o.concat(["Document","SVGElement","Element","HTMLElement","HTMLBodyElement","HTMLMediaElement","HTMLFrameSetElement","HTMLFrameElement","HTMLIFrameElement","HTMLMarqueeElement","Worker"]);const a=function ft(){try{const t=ee.navigator.userAgent;if(-1!==t.indexOf("MSIE ")||-1!==t.indexOf("Trident/"))return!0}catch{}return!1}()?[{target:c,ignoreProperties:["error"]}]:[];ot(c,Fe(c),i&&i.concat(a),Re(c))}o=o.concat(["XMLHttpRequest","XMLHttpRequestEventTarget","IDBIndex","IDBRequest","IDBOpenDBRequest","IDBDatabase","IDBTransaction","IDBCursor","WebSocket"]);for(let c=0;c<o.length;c++){const a=n[o[c]];a&&a.prototype&&ot(a.prototype,Fe(a.prototype),i)}}(i,t)}),Zone.__load_patch("customElements",(t,n,i)=>{!function gt(t,n){const{isBrowser:i,isMix:o}=n.getGlobalObjects();(i||o)&&t.customElements&&"customElements"in t&&n.patchCallbacks(n,t.customElements,"customElements","define",["connectedCallback","disconnectedCallback","adoptedCallback","attributeChangedCallback","formAssociatedCallback","formDisabledCallback","formResetCallback","formStateRestoreCallback"])}(t,i)}),Zone.__load_patch("XHR",(t,n)=>{!function w(b){const g=b.XMLHttpRequest;if(!g)return;const j=g.prototype;let M=j[Ee],W=j[he];if(!M){const h=b.XMLHttpRequestEventTarget;if(h){const A=h.prototype;M=A[Ee],W=A[he]}}const x="readystatechange",ne="scheduled";function Y(h){const A=h.data,P=A.target;P[a]=!1,P[d]=!1;const re=P[c];M||(M=P[Ee],W=P[he]),re&&W.call(P,x,re);const ge=P[c]=()=>{if(P.readyState===P.DONE)if(!A.aborted&&P[a]&&h.state===ne){const q=P[n.__symbol__("loadfalse")];if(0!==P.status&&q&&q.length>0){const me=h.invoke;h.invoke=function(){const ie=P[n.__symbol__("loadfalse")];for(let X=0;X<ie.length;X++)ie[X]===h&&ie.splice(X,1);!A.aborted&&h.state===ne&&me.call(h)},q.push(h)}else h.invoke()}else!A.aborted&&!1===P[a]&&(P[d]=!0)};return M.call(P,x,ge),P[i]||(P[i]=h),E.apply(P,A.args),P[a]=!0,h}function C(){}function _(h){const A=h.data;return A.aborted=!0,B.apply(A.target,A.args)}const te=be(j,"open",()=>function(h,A){return h[o]=0==A[2],h[m]=A[1],te.apply(h,A)}),$=p("fetchTaskAborting"),U=p("fetchTaskScheduling"),E=be(j,"send",()=>function(h,A){if(!0===n.current[U]||h[o])return E.apply(h,A);{const P={target:h,url:h[m],isPeriodic:!1,args:A,aborted:!1},re=Q("XMLHttpRequest.send",C,P,Y,_);h&&!0===h[d]&&!P.aborted&&re.state===ne&&re.invoke()}}),B=be(j,"abort",()=>function(h,A){const P=function I(h){return h[i]}(h);if(P&&"string"==typeof P.type){if(null==P.cancelFn||P.data&&P.data.aborted)return;P.zone.cancelTask(P)}else if(!0===n.current[$])return B.apply(h,A)})}(t);const i=p("xhrTask"),o=p("xhrSync"),c=p("xhrListener"),a=p("xhrScheduled"),m=p("xhrURL"),d=p("xhrErrorBeforeScheduled")}),Zone.__load_patch("geolocation",t=>{t.navigator&&t.navigator.geolocation&&function ue(t,n){const i=t.constructor.name;for(let o=0;o<n.length;o++){const c=n[o],a=t[c];if(a){if(!z(ke(t,c)))continue;t[c]=(d=>{const w=function(){return d.apply(this,le(arguments,i+"."+c))};return we(w,d),w})(a)}}}(t.navigator.geolocation,["getCurrentPosition","watchPosition"])}),Zone.__load_patch("PromiseRejectionEvent",(t,n)=>{function i(o){return function(c){nt(t,o).forEach(m=>{const d=t.PromiseRejectionEvent;if(d){const w=new d(o,{promise:c.promise,reason:c.rejection});m.invoke(w)}})}}t.PromiseRejectionEvent&&(n[p("unhandledPromiseRejectionHandler")]=i("unhandledrejection"),n[p("rejectionHandledHandler")]=i("rejectionhandled"))}),Zone.__load_patch("queueMicrotask",(t,n,i)=>{!function mt(t,n){n.patchMethod(t,"queueMicrotask",i=>function(o,c){Zone.current.scheduleMicroTask("queueMicrotask",c[0])})}(t,i)})},765:()=>{}},ke=>{ke(ke.s=38)}]);