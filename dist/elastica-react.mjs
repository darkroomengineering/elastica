import t,{useEffect as i,useState as e,useRef as n,useCallback as s,useContext as o,createContext as r}from"react";function _extends(){return _extends=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var e=arguments[i];for(var n in e)({}).hasOwnProperty.call(e,n)&&(t[n]=e[n])}return t},_extends.apply(null,arguments)}var a="undefined"!=typeof window&&new class{constructor(){this.raf=t=>{requestAnimationFrame(this.raf);const i=t-this.now;this.now=t;for(let e=0;e<this.callbacks.length;e++)this.callbacks[e].callback(t,i)},this.callbacks=[],this.now=performance.now(),requestAnimationFrame(this.raf)}add(t,i=0){return this.callbacks.push({callback:t,priority:i}),this.callbacks.sort(((t,i)=>t.priority-i.priority)),()=>this.remove(t)}remove(t){this.callbacks=this.callbacks.filter((({callback:i})=>t!==i))}},c=function debounce(t,i,e){var n=null,s=null,clear=function(){n&&(clearTimeout(n),s=null,n=null)},debounceWrapper=function(){if(!i)return t.apply(this,arguments);var o=this,r=arguments,a=e&&!n;return clear(),s=function(){t.apply(o,r)},n=setTimeout((function(){if(n=null,!a){var t=s;return s=null,t()}}),i),a?s():void 0};return debounceWrapper.cancel=clear,debounceWrapper.flush=function(){var t=s;clear(),t&&t()},debounceWrapper};function p(){return p=Object.assign?Object.assign.bind():function(t){for(var i=1;i<arguments.length;i++){var e=arguments[i];for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&(t[n]=e[n])}return t},p.apply(this,arguments)}function w(t){"sticky"===getComputedStyle(t).position&&(t.style.setProperty("position","relative"),t.dataset.sticky="true"),t.offsetParent&&w(t.offsetParent)}function b(t){var i;"true"===(null==t||null==(i=t.dataset)?void 0:i.sticky)&&(t.style.removeProperty("position"),delete t.dataset.sticky),t.parentNode&&b(t.parentNode)}function y(t,i=0){const e=i+t.offsetTop;return t.offsetParent?y(t.offsetParent,e):e}function z(t,i=0){const e=i+t.offsetLeft;return t.offsetParent?z(t.offsetParent,e):e}function E(t,i=0){var e;const n=i+(null!=(e=null==t?void 0:t.scrollTop)?e:0);return t.parentNode?E(t.parentNode,n):n+window.scrollY}function L(t,i=0){var e;const n=i+(null!=(e=null==t?void 0:t.scrollLeft)?e:0);return t.parentNode?L(t.parentNode,n):n+window.scrollX}const h={emit(t,...i){for(let e=0,n=this.events[t]||[],s=n.length;e<s;e++)n[e](...i)},events:{},on(t,i){return(this.events[t]||=[]).push(i),()=>{this.events[t]=this.events[t]?.filter((t=>i!==t))}}};function k({ignoreTransform:t=!1,ignoreSticky:o=!0,debounce:r=500,lazy:a=!1,callback:l}={}){const[u,d]=e(),m=n({}),[g,v]=e({}),x=s((({top:t,left:i,width:e,height:n,element:s})=>{var o,r,c,h,u;t=null!=(o=t)?o:m.current.top,i=null!=(r=i)?r:m.current.left,e=null!=(c=e)?c:m.current.width,n=null!=(h=n)?h:m.current.height,s=null!=(u=s)?u:m.current.element,t===m.current.top&&i===m.current.left&&e===m.current.width&&n===m.current.height&&s===m.current.element||(m.current.top=t,m.current.y=t,m.current.width=e,m.current.height=n,m.current.left=i,m.current.x=i,m.current.bottom=t+n,m.current.right=i+e,m.current.element=s,null==l||l(m.current),a||v(p({},m.current)))}),[a]);i((()=>{if(!u)return;const t=u.getBoundingClientRect();x({width:t.width,height:t.height});const i=c((([t])=>{x({width:t.borderBoxSize[0].inlineSize,height:t.borderBoxSize[0].blockSize})}),r),e=new ResizeObserver(i);return e.observe(u),()=>{e.disconnect(),i.cancel()}}),[u,r,x]);const[B,M]=e(),O=s((()=>{if(!u)return;let i,e;if(o&&w(u),t)i=y(u),e=z(u);else{const t=u.getBoundingClientRect();i=t.top+E(u),e=t.left+L(u)}o&&b(u),x({top:i,left:e,element:u})}),[t,o,u,x]);i((()=>{O();const t=c(O,r),i=new ResizeObserver(t);return i.observe(null!=B?B:document.body),()=>{i.disconnect(),t.cancel()}}),[B,r,O]);const S=s((()=>{if(!u)return;const t=u.getBoundingClientRect();x({width:t.width,height:t.height}),O()}),[u,O,x]);i((()=>(m.current.resize=S,a||v(p({},m.current)),h.on("resize",S))),[S,a]);const A=s((()=>m.current),[]);return[d,a?A:g,M]}k.resize=()=>{h.emit("resize")};class Elastica{constructor({gridSize:t=4,containerOffsets:i={top:0,bottom:0,left:0,right:0},collisions:e=!0,borders:n="rigid"}={}){this.calculatecCollisions=e,this.calculateBorders=n,this.gridSize=t,this.containerOffsets=i,this.positions=[],this.velocities=[],this.externalForces=[],this.dimensions=[],this.bounced=[],this.hash=[],this.container={},this.collisionsList=[]}initialCondition(t,i,e=()=>{}){this.container=i,this.dimensions=t.map(((t,i)=>{if(!t)return[0,0];this.externalForces[i]=[0,0],this.bounced[i]=0;const{rect:e}=t;return[e.width/2,e.height/2]})),e(this),this.positions.forEach(((i,e)=>{this.hash[e]=Math.floor(this.gridSize*(i[0]/this.container.width))+Math.floor(this.gridSize*(i[1]/this.container.height))*this.gridSize,this.setPosition(t[e]?.element,{x:i[0],y:i[1]})}))}polarCoordinates(t){return{speed:Math.sqrt(t[0]*t[0]+t[1]*t[1]),angle:Math.atan2(t[1],t[0])}}cartesianCoordinates(t,i){return[t*Math.cos(i),t*Math.sin(i)]}hasBounced(t){return this.bounced[t]+=1}setPosition(t,{x:i=0,y:e=0,z:n=0}){t&&(t.style.cssText=`transform: translate3d(${i}px, ${e}px, ${n}px);`)}rigidBorders(t){if("rigid"!==this.calculateBorders)return;const i=this.containerOffsets.top,e=this.containerOffsets.left,n=this.containerOffsets.right+1,s=this.containerOffsets.bottom+1;for(let o=0;o<t.length;o++){const t=this.dimensions[o];let r=this.velocities[o],a=this.positions[o];a[1]<t[1]+this.container.height*i&&(this.hasBounced(o),this.velocities[o][1]=-r[1],this.positions[o][1]=t[1]+this.container.height*i),a[0]<t[0]+this.container.width*e&&(this.hasBounced(o),this.velocities[o][0]=-r[0],this.positions[o][0]=t[0]+this.container.width*e),a[1]>this.container.height*s-t[1]&&(this.hasBounced(o),this.velocities[o][1]=-r[1],this.positions[o][1]=this.container.height*s-t[1]),a[0]>this.container.width*n-t[0]&&(this.hasBounced(o),this.velocities[o][0]=-r[0],this.positions[o][0]=this.container.width*n-t[0])}}periodicBorders(t){if("periodic"!==this.calculateBorders)return;const i=this.containerOffsets.top,e=this.containerOffsets.left,n=this.containerOffsets.right+1,s=this.containerOffsets.bottom+1;for(let o=0;o<t.length;o++){const t=this.dimensions[o];let r=this.positions[o],a=this.velocities[o].map((t=>Math.sign(t)));-1===a[1]&&r[1]<t[1]+this.container.height*i&&(this.positions[o][1]=t[1]+this.container.height*s),1===a[1]&&r[1]>this.container.height*s-t[1]&&(this.positions[o][1]=this.container.height*i-t[1]),-1===a[0]&&r[0]<t[0]+this.container.width*e&&(this.positions[o][0]=t[0]+this.container.width*n),1===a[0]&&r[0]>this.container.width*n-t[0]&&(this.positions[o][0]=this.container.width*e-t[0])}}isNeighboor(t,i){const e=this.hash[i];let n=this.hash[t],s=!1;for(let t=-1;t<2;t++)for(let i=-1;i<2;i++){let o=n+this.gridSize*t+i;if(!(o<0||o>this.gridSize*this.gridSize)&&o===e){s=!0;break}}return s}axisAlignedBoundaryBoxes(t,i){const e=this.dimensions[t],n=this.positions[t],s=this.dimensions[i],o=this.positions[i];return n.map(((t,i)=>Math.abs(t-o[i])<e[i]+s[i])).every((t=>t))}calculateSuperposition(t,i){const e=this.positions[t],n=this.dimensions[t],s=this.positions[i],o=this.dimensions[i],r=e.map(((t,i)=>n[i]+o[i]-Math.abs(t-s[i]))),a=e.map(((t,i)=>-Math.sign(t-s[i])));return r.map(((t,i)=>a[i]*Math.max(1/t,.1)))}collisions(t){if(this.calculatecCollisions){this.collisionsList=[];for(let i=0;i<t.length;i++){let t=this.velocities[i];this.hash.forEach(((e,n)=>{if(n===i)return;let s=this.velocities[n];if(this.collisionsList.some((({loop:t,inHash:e})=>t===n&&e===i)))return;if(!this.isNeighboor(i,n))return;if(!this.axisAlignedBoundaryBoxes(i,n))return;this.collisionsList.push({loop:i,inHash:n});const o=.5*(t.reduce(((t,i)=>t+i*i),0)+s.reduce(((t,i)=>t+i*i),0));let r=this.calculateSuperposition(i,n),a=t.map(((t,i)=>t+r[i])),c=s.map(((t,i)=>t-r[i]));const h=.5*(a.reduce(((t,i)=>t+i*i),0)+c.reduce(((t,i)=>t+i*i),0));if(0!==h){const t=Math.sqrt(o/h);a=a.map((i=>i*t)),c=c.map((i=>i*t))}this.velocities[i]=c,this.velocities[n]=a}))}}}update(t,i){this.rigidBorders(t),this.periodicBorders(t),this.collisions(t),i(this),this.positions.forEach(((t,i)=>{this.hash[i]=Math.floor(this.gridSize*t[0]/this.container.width)+Math.floor(this.gridSize*t[1]/this.container.height)*this.gridSize}))}}const l={random:function randominitialCondition({boxes:t,positions:i,velocities:e,container:n}){t.forEach(((t,s)=>{i[s]=[Math.random()*n.width,Math.random()*n.height],e[s]=[.5*(Math.random()-.5),.5*(Math.random()-.5)]}))}};const u={dvdAnimation:function dvdAnimation({boxes:t,positions:i,velocities:e,deltaTime:n}){t.forEach(((t,s)=>{i[s]=i[s].map(((t,i)=>t+e[s][i]*n))}))},DragAndGravity:function DragAndGravity({boxes:t,positions:i,velocities:e,deltaTime:n,externalForces:s}){t.forEach(((t,o)=>{let r=e[o],a=i[o],c=s[o];const h=[0,-.1];r=r.map(((t,i)=>t+-.001*n*(t-4*c[i]+h[i]))),a=a.map(((t,i)=>t+r[i]*n)),i[o]=a,e[o]=r,s[o]=[0,0]}))},rightFlow:function rightFlow({boxes:t,positions:i,velocities:e,externalForces:n,deltaTime:s}){t.forEach(((t,o)=>{let r=e[o],a=i[o],c=n[o];const h=[.5*(Math.random()-.5),.05*(Math.random()-.5)];r=r.map(((t,i)=>t+-.001*s*(t-4*c[i]+h[i]))),i[o]=a=a.map(((t,i)=>t+r[i]*s)),i[o]=a,e[o]=r,n[o]=[0,0]}))}};const d={default:function dragForce(t,i,e){let n=t.map((t=>t*t)).reduce(((t,i)=>t+i));n=Math.sqrt(n),0!==n&&(i[e]=t.map((t=>t/n)))}};const m=r({});function useElastica(){return o(m)}function ReactElastica({children:o,className:r,config:c={gridSize:8,collisions:!0,borders:"rigid",containerOffsets:{top:0,bottom:0,left:0,right:0}},initialCondition:h=()=>{},update:l=()=>{}}){const u=n(new Map),[d,g]=k(),[v]=e((()=>new Elastica(c))),x=s(((t,i)=>{u.current.set(t,i)}),[]),B=s((t=>{u.current.delete(t)}),[]);return i((()=>{const t=[...u.current.values()];(function isEmptyArray(t){return!t||Array.isArray(t)&&0===t.length})(t)||t.some((({rect:t})=>!t))||v.initialCondition(t,g,(i=>h({boxes:t,...i})))}),[v,g]),function f(t,e=0){i((()=>{if(t)return a.add(t,e),()=>a.remove(t)}),[t,e])}(((t,i)=>{const e=[...u.current.values()];v.update(e,(t=>{l({boxes:e,...t,deltaTime:i}),e.forEach(((i,e)=>{const n=t.positions[e],s=t.dimensions[e];t?.setPosition(i?.element,{x:n[0]-s[0],y:n[1]})}))}))})),t.createElement("div",{className:r,ref:d,style:{position:"relative",width:"100%",height:"100%"}},t.createElement(m.Provider,{value:{addBox:x,removeBox:B,elastica:v}},o))}function AxisAlignedBoundaryBox({className:e,children:s,...o}){const{addBox:r,removeBox:a,elastica:c}=useElastica(),[h,l]=k(),u=n();return i((()=>{if(u.current)return r(u.current,{element:u.current,rect:l}),()=>{a(u.current)}}),[l,r,a]),t.createElement("div",_extends({ref:t=>{u.current=t,h(t)},className:e},o,{style:{willChange:"transform"}}),s)}export{AxisAlignedBoundaryBox,ReactElastica as default,d as dragForcePresetsLib,l as initalConditionsPresets,u as updatePresets,useElastica};
//# sourceMappingURL=elastica-react.mjs.map
