import{useRect as i,useFrame as t}from"@darkroom.engineering/hamo";import{useDrag as s}from"@use-gesture/react";import e,{useContext as o,useRef as n,useState as r,useCallback as h,useEffect as a,createContext as c}from"react";function _extends(){return _extends=Object.assign?Object.assign.bind():function(i){for(var t=1;t<arguments.length;t++){var s=arguments[t];for(var e in s)({}).hasOwnProperty.call(s,e)&&(i[e]=s[e])}return i},_extends.apply(null,arguments)}class ElasticCollision{constructor({gridSize:i=4,containerOffsets:t={top:0,bottom:0,left:0,right:0},collisions:s=!0,borders:e="rigid",collisionRandomness:o=0}={}){this.calculatecCollisions=s,this.calculateBorders=e,this.collisionRandomness=o,this.gridSize=i,this.containerOffsets=t,this.positions=[],this.velocities=[],this.externalForces=[],this.dimensions=[],this.bounced=[],this.hash=[],this.container={},this.collisionsList=[]}initialConditions(i,t,s=()=>{}){this.container=t,this.dimensions=i.map(((i,t)=>{if(!i)return[0,0];this.externalForces[t]=[0,0];const{rect:s}=i;return[s.width/2,s.height/2]})),s(this),this.positions.forEach(((t,s)=>{this.hash[s]=Math.floor(this.gridSize*(t[0]/this.container.width))+Math.floor(this.gridSize*(t[1]/this.container.height))*this.gridSize,this.setPosition(i[s]?.element,{x:t[0],y:t[1]})}))}polarCoordinates(i){return{speed:Math.sqrt(i[0]*i[0]+i[1]*i[1]),angle:Math.atan2(i[1],i[0])}}cartesianCoordinates(i,t){return[i*Math.cos(t),i*Math.sin(t)]}hasBounced(i){return this.bounced[i]+=1}setPosition(i,{x:t=0,y:s=0,z:e=0}){i&&(i.style.cssText=`transform: translate3d(${t}px, ${s}px, ${e}px);`)}rigidBorders(i){if("rigid"!==this.calculateBorders)return;const t=this.containerOffsets.top,s=this.containerOffsets.left,e=this.containerOffsets.right+1,o=this.containerOffsets.bottom+1;for(let n=0;n<i.length;n++){const i=this.dimensions[n];let r=this.velocities[n],h=this.positions[n];h[1]<i[1]+this.container.height*t&&(this.hasBounced(n),this.velocities[n][1]=-r[1],this.positions[n][1]=i[1]+this.container.height*t),h[0]<i[0]+this.container.width*s&&(this.hasBounced(n),this.velocities[n][0]=-r[0],this.positions[n][0]=i[0]+this.container.width*s),h[1]>this.container.height*o-i[1]&&(this.hasBounced(n),this.velocities[n][1]=-r[1],this.positions[n][1]=this.container.height*o-i[1]),h[0]>this.container.width*e-i[0]&&(this.hasBounced(n),this.velocities[n][0]=-r[0],this.positions[n][0]=this.container.width*e-i[0])}}periodicBorders(i){if("periodic"!==this.calculateBorders)return;const t=this.containerOffsets.top,s=this.containerOffsets.left,e=this.containerOffsets.right+1,o=this.containerOffsets.bottom+1;for(let n=0;n<i.length;n++){const i=this.dimensions[n];let r=this.positions[n],h=this.velocities[n].map((i=>Math.sign(i)));-1===h[1]&&r[1]<i[1]+this.container.height*t&&(this.positions[n][1]=i[1]+this.container.height*o),1===h[1]&&r[1]>this.container.height*o-i[1]&&(this.positions[n][1]=this.container.height*t-i[1]),-1===h[0]&&r[0]<i[0]+this.container.width*s&&(this.positions[n][0]=i[0]+this.container.width*e),1===h[0]&&r[0]>this.container.width*e-i[0]&&(this.positions[n][0]=this.container.width*s-i[0])}}isNeighboor(i,t){const s=this.hash[t];let e=this.hash[i],o=!1;for(let i=-1;i<2;i++)for(let t=-1;t<2;t++){let n=e+this.gridSize*i+t;if(!(n<0||n>this.gridSize*this.gridSize)&&n===s){o=!0;break}}return o}axisAlignedBoundaryBoxes(i,t){const s=this.dimensions[i],e=this.positions[i],o=this.dimensions[t],n=this.positions[t];return e.map(((i,t)=>Math.abs(i-n[t])<s[t]+o[t])).every((i=>i))}calculateSuperposition(i,t){let s=[0,0];const e=this.positions[i],o=this.dimensions[i],n=this.positions[t],r=this.dimensions[t],h=e.map(((i,t)=>o[t]+r[t]-Math.abs(i-n[t])));return h[0]<h[1]?e[0]<n[0]?s[0]=h[0]:s[0]=-h[0]:e[1]<n[1]?s[1]=h[1]:s[1]=-h[1],s.map((i=>i+Math.random()*this.collisionRandomness))}collisions(i){if(this.calculatecCollisions){this.collisionsList=[];for(let t=0;t<i.length;t++){let i=this.velocities[t];this.hash.forEach(((s,e)=>{if(e===t)return;let o=this.velocities[e];if(this.collisionsList.some((({loop:i,inHash:s})=>i===e&&s===t)))return;if(!this.isNeighboor(t,e))return;if(!this.axisAlignedBoundaryBoxes(t,e))return;this.collisionsList.push({loop:t,inHash:e});const n=.5*(i.reduce(((i,t)=>i+t*t),0)+o.reduce(((i,t)=>i+t*t),0)),r=this.calculateSuperposition(t,e);let h=i.map(((i,t)=>i+r[t])),a=o.map(((i,t)=>i-r[t]));const c=.5*(h.reduce(((i,t)=>i+t*t),0)+a.reduce(((i,t)=>i+t*t),0));if(0!==c){const i=Math.sqrt(n/c);h=h.map((t=>t*i)),a=a.map((t=>t*i))}this.velocities[t]=a,this.velocities[e]=h}))}}}update(i,t){this.rigidBorders(i),this.periodicBorders(i),this.collisions(i),t(this),this.positions.forEach(((i,t)=>{this.hash[t]=Math.floor(this.gridSize*i[0]/this.container.width)+Math.floor(this.gridSize*i[1]/this.container.height)*this.gridSize}))}}const l={random:function randomInitialConditions({boxes:i,positions:t,velocities:s,container:e}){i.forEach(((i,o)=>{t[o]=[Math.random()*e.width,Math.random()*e.height],s[o]=[.5*(Math.random()-.5),.5*(Math.random()-.5)]}))}};const d={dvdAnimation:function dvdAnimation({boxes:i,positions:t,velocities:s,deltaTime:e}){i.forEach(((i,o)=>{t[o]=t[o].map(((i,t)=>i+s[o][t]*e))}))},DragAndGravity:function DragAndGravity({boxes:i,positions:t,velocities:s,deltaTime:e,externalForces:o}){i.forEach(((i,n)=>{let r=s[n],h=t[n],a=o[n];const c=[0,-.1];r=r.map(((i,t)=>i+-.001*e*(i-4*a[t]+c[t]))),h=h.map(((i,t)=>i+r[t]*e)),t[n]=h,s[n]=r,o[n]=[0,0]}))},rightFlow:function rightFlow({boxes:i,positions:t,velocities:s,externalForces:e,deltaTime:o}){i.forEach(((i,n)=>{let r=s[n],h=t[n],a=e[n];const c=[.05,0];r=r.map(((i,t)=>i+-.001*o*(i-4*a[t]+c[t]))),t[n]=h=h.map(((i,t)=>i+r[t]*o)),t[n]=h,s[n]=r,e[n]=[0,0]}))}};const u={default:function dragForce(i,t,s){let e=i.map((i=>i*i)).reduce(((i,t)=>i+t));e=Math.sqrt(e),0!==e&&(t[s]=i.map((i=>i/e)))}};const f=c({});function useElasticCollision(){return o(f)}function ReactElasticCollision({children:s,className:o,config:c={gridSize:8,collisions:!0,borders:"rigid",containerOffsets:{top:0,bottom:0,left:0,right:0}},initialConditions:l=()=>{},update:d=()=>{}}){const u=n(new Map),[m,p]=i(),[g]=r((()=>new ElasticCollision(c))),v=h(((i,t)=>{u.current.set(i,t)}),[]),x=h((i=>{u.current.delete(i)}),[]);return a((()=>{const i=[...u.current.values()];(function isEmptyArray(i){return!i||Array.isArray(i)&&0===i.length})(i)||i.some((({rect:i})=>!i))||g.initialConditions(i,p,(t=>l({boxes:i,...t})))}),[g,p]),t(((i,t)=>{const s=[...u.current.values()];g.update(s,(i=>{d({boxes:s,...i,deltaTime:t}),s.forEach(((t,s)=>{const e=i.positions[s],o=i.dimensions[s];i?.setPosition(t?.element,{x:e[0]-o[0],y:e[1]})}))}))})),e.createElement("div",{className:o,ref:m,style:{position:"relative",width:"100%",height:"100%"}},e.createElement(f.Provider,{value:{addBox:v,removeBox:x,elasticCollision:g}},s))}function CollisionBox({className:t,children:o,onDragStop:r=null,index:h=0,...c}){const{addBox:l,removeBox:d,elasticCollision:u}=useElasticCollision(),[f,m]=i(),p=n();a((()=>{if(p.current)return l(p.current,{element:p.current,rect:m}),()=>{d(p.current)}}),[m,l,d]);const g=s((({down:i,movement:[t,s]})=>{i&&r([t,s],u.externalForces,h)}));return e.createElement("div",_extends({ref:i=>{p.current=i,f(i)},className:t,style:{touchAction:"none"}},c),e.createElement("div",g(),o))}export{CollisionBox,ReactElasticCollision as default,u as dragForcePresetsLib,l as initalConditionsPresets,d as updatePresets,useElasticCollision};
//# sourceMappingURL=elastic-collisions-react.mjs.map