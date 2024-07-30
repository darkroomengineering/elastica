import t,{useEffect as e,useState as i,useRef as n,useCallback as s,useContext as o,createContext as r}from"react";function _extends(){return _extends=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var n in i)({}).hasOwnProperty.call(i,n)&&(t[n]=i[n])}return t},_extends.apply(null,arguments)}var a="undefined"!=typeof window&&new class{constructor(){this.raf=t=>{requestAnimationFrame(this.raf);const e=t-this.now;this.now=t;for(let i=0;i<this.callbacks.length;i++)this.callbacks[i].callback(t,e)},this.callbacks=[],this.now=performance.now(),requestAnimationFrame(this.raf)}add(t,e=0){return this.callbacks.push({callback:t,priority:e}),this.callbacks.sort(((t,e)=>t.priority-e.priority)),()=>this.remove(t)}remove(t){this.callbacks=this.callbacks.filter((({callback:e})=>t!==e))}},c=function debounce(t,e,i){var n=null,s=null,clear=function(){n&&(clearTimeout(n),s=null,n=null)},debounceWrapper=function(){if(!e)return t.apply(this,arguments);var o=this,r=arguments,a=i&&!n;return clear(),s=function(){t.apply(o,r)},n=setTimeout((function(){if(n=null,!a){var t=s;return s=null,t()}}),e),a?s():void 0};return debounceWrapper.cancel=clear,debounceWrapper.flush=function(){var t=s;clear(),t&&t()},debounceWrapper};function p(){return p=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var n in i)Object.prototype.hasOwnProperty.call(i,n)&&(t[n]=i[n])}return t},p.apply(this,arguments)}function w(t){"sticky"===getComputedStyle(t).position&&(t.style.setProperty("position","relative"),t.dataset.sticky="true"),t.offsetParent&&w(t.offsetParent)}function b(t){var e;"true"===(null==t||null==(e=t.dataset)?void 0:e.sticky)&&(t.style.removeProperty("position"),delete t.dataset.sticky),t.parentNode&&b(t.parentNode)}function y(t,e=0){const i=e+t.offsetTop;return t.offsetParent?y(t.offsetParent,i):i}function z(t,e=0){const i=e+t.offsetLeft;return t.offsetParent?z(t.offsetParent,i):i}function E(t,e=0){var i;const n=e+(null!=(i=null==t?void 0:t.scrollTop)?i:0);return t.parentNode?E(t.parentNode,n):n+window.scrollY}function L(t,e=0){var i;const n=e+(null!=(i=null==t?void 0:t.scrollLeft)?i:0);return t.parentNode?L(t.parentNode,n):n+window.scrollX}const h={emit(t,...e){for(let i=0,n=this.events[t]||[],s=n.length;i<s;i++)n[i](...e)},events:{},on(t,e){return(this.events[t]||=[]).push(e),()=>{this.events[t]=this.events[t]?.filter((t=>e!==t))}}};function k({ignoreTransform:t=!1,ignoreSticky:o=!0,debounce:r=500,lazy:a=!1,callback:u}={}){const[l,d]=i(),v=n({}),[m,g]=i({}),_=s((({top:t,left:e,width:i,height:n,element:s})=>{var o,r,c,h,l;t=null!=(o=t)?o:v.current.top,e=null!=(r=e)?r:v.current.left,i=null!=(c=i)?c:v.current.width,n=null!=(h=n)?h:v.current.height,s=null!=(l=s)?l:v.current.element,t===v.current.top&&e===v.current.left&&i===v.current.width&&n===v.current.height&&s===v.current.element||(v.current.top=t,v.current.y=t,v.current.width=i,v.current.height=n,v.current.left=e,v.current.x=e,v.current.bottom=t+n,v.current.right=e+i,v.current.element=s,null==u||u(v.current),a||g(p({},v.current)))}),[a]);e((()=>{if(!l)return;const t=l.getBoundingClientRect();_({width:t.width,height:t.height});const e=c((([t])=>{_({width:t.borderBoxSize[0].inlineSize,height:t.borderBoxSize[0].blockSize})}),r),i=new ResizeObserver(e);return i.observe(l),()=>{i.disconnect(),e.cancel()}}),[l,r,_]);const[S,x]=i(),T=s((()=>{if(!l)return;let e,i;if(o&&w(l),t)e=y(l),i=z(l);else{const t=l.getBoundingClientRect();e=t.top+E(l),i=t.left+L(l)}o&&b(l),_({top:e,left:i,element:l})}),[t,o,l,_]);e((()=>{T();const t=c(T,r),e=new ResizeObserver(t);return e.observe(null!=S?S:document.body),()=>{e.disconnect(),t.cancel()}}),[S,r,T]);const O=s((()=>{if(!l)return;const t=l.getBoundingClientRect();_({width:t.width,height:t.height}),T()}),[l,T,_]);e((()=>(v.current.resize=O,a||g(p({},v.current)),h.on("resize",O))),[O,a]);const P=s((()=>v.current),[]);return[d,a?P:m,x]}k.resize=()=>{h.emit("resize")};const u={toVector:(t,e)=>(void 0===t&&(t=e),Array.isArray(t)?t:[t,t]),add:(t,e)=>[t[0]+e[0],t[1]+e[1]],sub:(t,e)=>[t[0]-e[0],t[1]-e[1]],addTo(t,e){t[0]+=e[0],t[1]+=e[1]},subTo(t,e){t[0]-=e[0],t[1]-=e[1]}};function rubberband(t,e,i){return 0===e||Math.abs(e)===1/0?Math.pow(t,5*i):t*e*i/(e+i*t)}function rubberbandIfOutOfBounds(t,e,i,n=.15){return 0===n?function clamp(t,e,i){return Math.max(e,Math.min(t,i))}(t,e,i):t<e?-rubberband(e-t,i-e,n)+e:t>i?+rubberband(t-i,i-e,n)+i:t}function _toPropertyKey(t){var e=function _toPrimitive(t,e){if("object"!=typeof t||null===t)return t;var i=t[Symbol.toPrimitive];if(void 0!==i){var n=i.call(t,e||"default");if("object"!=typeof n)return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return("string"===e?String:Number)(t)}(t,"string");return"symbol"==typeof e?e:String(e)}function _defineProperty(t,e,i){return(e=_toPropertyKey(e))in t?Object.defineProperty(t,e,{value:i,enumerable:!0,configurable:!0,writable:!0}):t[e]=i,t}function ownKeys(t,e){var i=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),i.push.apply(i,n)}return i}function _objectSpread2(t){for(var e=1;e<arguments.length;e++){var i=null!=arguments[e]?arguments[e]:{};e%2?ownKeys(Object(i),!0).forEach((function(e){_defineProperty(t,e,i[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(i)):ownKeys(Object(i)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(i,e))}))}return t}const l={pointer:{start:"down",change:"move",end:"up"},mouse:{start:"down",change:"move",end:"up"},touch:{start:"start",change:"move",end:"end"},gesture:{start:"start",change:"change",end:"end"}};function capitalize(t){return t?t[0].toUpperCase()+t.slice(1):""}const d=["enter","leave"];function toHandlerProp(t,e="",i=!1){const n=l[t],s=n&&n[e]||e;return"on"+capitalize(t)+capitalize(s)+(function hasCapture(t=!1,e){return t&&!d.includes(e)}(i,s)?"Capture":"")}const v=["gotpointercapture","lostpointercapture"];function parseProp(t){let e=t.substring(2).toLowerCase();const i=!!~e.indexOf("passive");i&&(e=e.replace("passive",""));const n=v.includes(e)?"capturecapture":"capture",s=!!~e.indexOf(n);return s&&(e=e.replace("capture","")),{device:e,capture:s,passive:i}}function isTouch(t){return"touches"in t}function getPointerType(t){return isTouch(t)?"touch":"pointerType"in t?t.pointerType:"mouse"}function getValueEvent(t){return isTouch(t)?function getTouchList(t){return"touchend"===t.type||"touchcancel"===t.type?t.changedTouches:t.targetTouches}(t)[0]:t}function touchIds(t){return function getCurrentTargetTouchList(t){return Array.from(t.touches).filter((e=>{var i,n;return e.target===t.currentTarget||(null===(i=t.currentTarget)||void 0===i||null===(n=i.contains)||void 0===n?void 0:n.call(i,e.target))}))}(t).map((t=>t.identifier))}function pointerId(t){const e=getValueEvent(t);return isTouch(t)?e.identifier:e.pointerId}function pointerValues(t){const e=getValueEvent(t);return[e.clientX,e.clientY]}function call(t,...e){return"function"==typeof t?t(...e):t}function noop(){}function chain(...t){return 0===t.length?noop:1===t.length?t[0]:function(){let e;for(const i of t)e=i.apply(this,arguments)||e;return e}}function assignDefault(t,e){return Object.assign({},e,t||{})}class Engine{constructor(t,e,i){this.ctrl=t,this.args=e,this.key=i,this.state||(this.state={},this.computeValues([0,0]),this.computeInitial(),this.init&&this.init(),this.reset())}get state(){return this.ctrl.state[this.key]}set state(t){this.ctrl.state[this.key]=t}get shared(){return this.ctrl.state.shared}get eventStore(){return this.ctrl.gestureEventStores[this.key]}get timeoutStore(){return this.ctrl.gestureTimeoutStores[this.key]}get config(){return this.ctrl.config[this.key]}get sharedConfig(){return this.ctrl.config.shared}get handler(){return this.ctrl.handlers[this.key]}reset(){const{state:t,shared:e,ingKey:i,args:n}=this;e[i]=t._active=t.active=t._blocked=t._force=!1,t._step=[!1,!1],t.intentional=!1,t._movement=[0,0],t._distance=[0,0],t._direction=[0,0],t._delta=[0,0],t._bounds=[[-1/0,1/0],[-1/0,1/0]],t.args=n,t.axis=void 0,t.memo=void 0,t.elapsedTime=t.timeDelta=0,t.direction=[0,0],t.distance=[0,0],t.overflow=[0,0],t._movementBound=[!1,!1],t.velocity=[0,0],t.movement=[0,0],t.delta=[0,0],t.timeStamp=0}start(t){const e=this.state,i=this.config;e._active||(this.reset(),this.computeInitial(),e._active=!0,e.target=t.target,e.currentTarget=t.currentTarget,e.lastOffset=i.from?call(i.from,e):e.offset,e.offset=e.lastOffset,e.startTime=e.timeStamp=t.timeStamp)}computeValues(t){const e=this.state;e._values=t,e.values=this.config.transform(t)}computeInitial(){const t=this.state;t._initial=t._values,t.initial=t.values}compute(t){const{state:e,config:i,shared:n}=this;e.args=this.args;let s=0;if(t&&(e.event=t,i.preventDefault&&t.cancelable&&e.event.preventDefault(),e.type=t.type,n.touches=this.ctrl.pointerIds.size||this.ctrl.touchIds.size,n.locked=!!document.pointerLockElement,Object.assign(n,function getEventDetails(t){const e={};if("buttons"in t&&(e.buttons=t.buttons),"shiftKey"in t){const{shiftKey:i,altKey:n,metaKey:s,ctrlKey:o}=t;Object.assign(e,{shiftKey:i,altKey:n,metaKey:s,ctrlKey:o})}return e}(t)),n.down=n.pressed=n.buttons%2==1||n.touches>0,s=t.timeStamp-e.timeStamp,e.timeStamp=t.timeStamp,e.elapsedTime=e.timeStamp-e.startTime),e._active){const t=e._delta.map(Math.abs);u.addTo(e._distance,t)}this.axisIntent&&this.axisIntent(t);const[o,r]=e._movement,[a,c]=i.threshold,{_step:h,values:l}=e;if(i.hasCustomTransform?(!1===h[0]&&(h[0]=Math.abs(o)>=a&&l[0]),!1===h[1]&&(h[1]=Math.abs(r)>=c&&l[1])):(!1===h[0]&&(h[0]=Math.abs(o)>=a&&Math.sign(o)*a),!1===h[1]&&(h[1]=Math.abs(r)>=c&&Math.sign(r)*c)),e.intentional=!1!==h[0]||!1!==h[1],!e.intentional)return;const d=[0,0];if(i.hasCustomTransform){const[t,e]=l;d[0]=!1!==h[0]?t-h[0]:0,d[1]=!1!==h[1]?e-h[1]:0}else d[0]=!1!==h[0]?o-h[0]:0,d[1]=!1!==h[1]?r-h[1]:0;this.restrictToAxis&&!e._blocked&&this.restrictToAxis(d);const v=e.offset,m=e._active&&!e._blocked||e.active;m&&(e.first=e._active&&!e.active,e.last=!e._active&&e.active,e.active=n[this.ingKey]=e._active,t&&(e.first&&("bounds"in i&&(e._bounds=call(i.bounds,e)),this.setup&&this.setup()),e.movement=d,this.computeOffset()));const[g,_]=e.offset,[[S,x],[T,O]]=e._bounds;e.overflow=[g<S?-1:g>x?1:0,_<T?-1:_>O?1:0],e._movementBound[0]=!!e.overflow[0]&&(!1===e._movementBound[0]?e._movement[0]:e._movementBound[0]),e._movementBound[1]=!!e.overflow[1]&&(!1===e._movementBound[1]?e._movement[1]:e._movementBound[1]);const P=e._active&&i.rubberband||[0,0];if(e.offset=function computeRubberband(t,[e,i],[n,s]){const[[o,r],[a,c]]=t;return[rubberbandIfOutOfBounds(e,o,r,n),rubberbandIfOutOfBounds(i,a,c,s)]}(e._bounds,e.offset,P),e.delta=u.sub(e.offset,v),this.computeMovement(),m&&(!e.last||s>32)){e.delta=u.sub(e.offset,v);const t=e.delta.map(Math.abs);u.addTo(e.distance,t),e.direction=e.delta.map(Math.sign),e._direction=e._delta.map(Math.sign),!e.first&&s>0&&(e.velocity=[t[0]/s,t[1]/s],e.timeDelta=s)}}emit(){const t=this.state,e=this.shared,i=this.config;if(t._active||this.clean(),(t._blocked||!t.intentional)&&!t._force&&!i.triggerAllEvents)return;const n=this.handler(_objectSpread2(_objectSpread2(_objectSpread2({},e),t),{},{[this.aliasKey]:t.values}));void 0!==n&&(t.memo=n)}clean(){this.eventStore.clean(),this.timeoutStore.clean()}}class CoordinatesEngine extends Engine{constructor(...t){super(...t),_defineProperty(this,"aliasKey","xy")}reset(){super.reset(),this.state.axis=void 0}init(){this.state.offset=[0,0],this.state.lastOffset=[0,0]}computeOffset(){this.state.offset=u.add(this.state.lastOffset,this.state.movement)}computeMovement(){this.state.movement=u.sub(this.state.offset,this.state.lastOffset)}axisIntent(t){const e=this.state,i=this.config;if(!e.axis&&t){const n="object"==typeof i.axisThreshold?i.axisThreshold[getPointerType(t)]:i.axisThreshold;e.axis=function selectAxis([t,e],i){const n=Math.abs(t),s=Math.abs(e);return n>s&&n>i?"x":s>n&&s>i?"y":void 0}(e._movement,n)}e._blocked=(i.lockDirection||!!i.axis)&&!e.axis||!!i.axis&&i.axis!==e.axis}restrictToAxis(t){if(this.config.axis||this.config.lockDirection)switch(this.state.axis){case"x":t[1]=0;break;case"y":t[0]=0}}}const identity=t=>t,m={enabled:(t=!0)=>t,eventOptions:(t,e,i)=>_objectSpread2(_objectSpread2({},i.shared.eventOptions),t),preventDefault:(t=!1)=>t,triggerAllEvents:(t=!1)=>t,rubberband(t=0){switch(t){case!0:return[.15,.15];case!1:return[0,0];default:return u.toVector(t)}},from:t=>"function"==typeof t?t:null!=t?u.toVector(t):void 0,transform(t,e,i){const n=t||i.shared.transform;if(this.hasCustomTransform=!!n,"development"===process.env.NODE_ENV){const t=n||identity;return e=>{const i=t(e);return isFinite(i[0])&&isFinite(i[1])||console.warn(`[@use-gesture]: config.transform() must produce a valid result, but it was: [${i[0]},${[1]}]`),i}}return n||identity},threshold:t=>u.toVector(t,0)};"development"===process.env.NODE_ENV&&Object.assign(m,{domTarget(t){if(void 0!==t)throw Error("[@use-gesture]: `domTarget` option has been renamed to `target`.");return NaN},lockDirection(t){if(void 0!==t)throw Error("[@use-gesture]: `lockDirection` option has been merged with `axis`. Use it as in `{ axis: 'lock' }`");return NaN},initial(t){if(void 0!==t)throw Error("[@use-gesture]: `initial` option has been renamed to `from`.");return NaN}});const g=_objectSpread2(_objectSpread2({},m),{},{axis(t,e,{axis:i}){if(this.lockDirection="lock"===i,!this.lockDirection)return i},axisThreshold:(t=0)=>t,bounds(t={}){if("function"==typeof t)return e=>g.bounds(t(e));if("current"in t)return()=>t.current;if("function"==typeof HTMLElement&&t instanceof HTMLElement)return t;const{left:e=-1/0,right:i=1/0,top:n=-1/0,bottom:s=1/0}=t;return[[e,i],[n,s]]}}),_={ArrowRight:(t,e=1)=>[t*e,0],ArrowLeft:(t,e=1)=>[-1*t*e,0],ArrowUp:(t,e=1)=>[0,-1*t*e],ArrowDown:(t,e=1)=>[0,t*e]};const S="undefined"!=typeof window&&window.document&&window.document.createElement;function supportsTouchEvents(){return S&&"ontouchstart"in window}const x={isBrowser:S,gesture:function supportsGestureEvents(){try{return"constructor"in GestureEvent}catch(t){return!1}}(),touch:supportsTouchEvents(),touchscreen:function isTouchScreen(){return supportsTouchEvents()||S&&window.navigator.maxTouchPoints>1}(),pointer:function supportsPointerEvents(){return S&&"onpointerdown"in window}(),pointerLock:function supportsPointerLock(){return S&&"exitPointerLock"in window.document}()},T={mouse:0,touch:0,pen:8},O=_objectSpread2(_objectSpread2({},g),{},{device(t,e,{pointer:{touch:i=!1,lock:n=!1,mouse:s=!1}={}}){return this.pointerLock=n&&x.pointerLock,x.touch&&i?"touch":this.pointerLock?"mouse":x.pointer&&!s?"pointer":x.touch?"touch":"mouse"},preventScrollAxis(t,e,{preventScroll:i}){if(this.preventScrollDelay="number"==typeof i?i:i||void 0===i&&t?250:void 0,x.touchscreen&&!1!==i)return t||(void 0!==i?"y":void 0)},pointerCapture(t,e,{pointer:{capture:i=!0,buttons:n=1,keys:s=!0}={}}){return this.pointerButtons=n,this.keys=s,!this.pointerLock&&"pointer"===this.device&&i},threshold(t,e,{filterTaps:i=!1,tapsThreshold:n=3,axis:s}){const o=u.toVector(t,i?n:s?1:0);return this.filterTaps=i,this.tapsThreshold=n,o},swipe({velocity:t=.5,distance:e=50,duration:i=250}={}){return{velocity:this.transform(u.toVector(t)),distance:this.transform(u.toVector(e)),duration:i}},delay(t=0){switch(t){case!0:return 180;case!1:return 0;default:return t}},axisThreshold:t=>t?_objectSpread2(_objectSpread2({},T),t):T,keyboardDisplacement:(t=10)=>t});"development"===process.env.NODE_ENV&&Object.assign(O,{useTouch(t){if(void 0!==t)throw Error("[@use-gesture]: `useTouch` option has been renamed to `pointer.touch`. Use it as in `{ pointer: { touch: true } }`.");return NaN},experimental_preventWindowScrollY(t){if(void 0!==t)throw Error("[@use-gesture]: `experimental_preventWindowScrollY` option has been renamed to `preventScroll`.");return NaN},swipeVelocity(t){if(void 0!==t)throw Error("[@use-gesture]: `swipeVelocity` option has been renamed to `swipe.velocity`. Use it as in `{ swipe: { velocity: 0.5 } }`.");return NaN},swipeDistance(t){if(void 0!==t)throw Error("[@use-gesture]: `swipeDistance` option has been renamed to `swipe.distance`. Use it as in `{ swipe: { distance: 50 } }`.");return NaN},swipeDuration(t){if(void 0!==t)throw Error("[@use-gesture]: `swipeDuration` option has been renamed to `swipe.duration`. Use it as in `{ swipe: { duration: 250 } }`.");return NaN}}),_objectSpread2(_objectSpread2({},m),{},{device(t,e,{shared:i,pointer:{touch:n=!1}={}}){if(i.target&&!x.touch&&x.gesture)return"gesture";if(x.touch&&n)return"touch";if(x.touchscreen){if(x.pointer)return"pointer";if(x.touch)return"touch"}},bounds(t,e,{scaleBounds:i={},angleBounds:n={}}){const _scaleBounds=t=>{const e=assignDefault(call(i,t),{min:-1/0,max:1/0});return[e.min,e.max]},_angleBounds=t=>{const e=assignDefault(call(n,t),{min:-1/0,max:1/0});return[e.min,e.max]};return"function"!=typeof i&&"function"!=typeof n?[_scaleBounds(),_angleBounds()]:t=>[_scaleBounds(t),_angleBounds(t)]},threshold(t,e,i){this.lockDirection="lock"===i.axis;return u.toVector(t,this.lockDirection?[.1,3]:0)},modifierKey:t=>void 0===t?"ctrlKey":t,pinchOnWheel:(t=!0)=>t}),_objectSpread2(_objectSpread2({},g),{},{mouseOnly:(t=!0)=>t}),_objectSpread2(_objectSpread2({},g),{},{mouseOnly:(t=!0)=>t});const P=new Map,D=new Map;const C={key:"drag",engine:class DragEngine extends CoordinatesEngine{constructor(...t){super(...t),_defineProperty(this,"ingKey","dragging")}reset(){super.reset();const t=this.state;t._pointerId=void 0,t._pointerActive=!1,t._keyboardActive=!1,t._preventScroll=!1,t._delayed=!1,t.swipe=[0,0],t.tap=!1,t.canceled=!1,t.cancel=this.cancel.bind(this)}setup(){const t=this.state;if(t._bounds instanceof HTMLElement){const e=t._bounds.getBoundingClientRect(),i=t.currentTarget.getBoundingClientRect(),n={left:e.left-i.left+t.offset[0],right:e.right-i.right+t.offset[0],top:e.top-i.top+t.offset[1],bottom:e.bottom-i.bottom+t.offset[1]};t._bounds=g.bounds(n)}}cancel(){const t=this.state;t.canceled||(t.canceled=!0,t._active=!1,setTimeout((()=>{this.compute(),this.emit()}),0))}setActive(){this.state._active=this.state._pointerActive||this.state._keyboardActive}clean(){this.pointerClean(),this.state._pointerActive=!1,this.state._keyboardActive=!1,super.clean()}pointerDown(t){const e=this.config,i=this.state;if(null!=t.buttons&&(Array.isArray(e.pointerButtons)?!e.pointerButtons.includes(t.buttons):-1!==e.pointerButtons&&e.pointerButtons!==t.buttons))return;const n=this.ctrl.setEventIds(t);e.pointerCapture&&t.target.setPointerCapture(t.pointerId),n&&n.size>1&&i._pointerActive||(this.start(t),this.setupPointer(t),i._pointerId=pointerId(t),i._pointerActive=!0,this.computeValues(pointerValues(t)),this.computeInitial(),e.preventScrollAxis&&"mouse"!==getPointerType(t)?(i._active=!1,this.setupScrollPrevention(t)):e.delay>0?(this.setupDelayTrigger(t),e.triggerAllEvents&&(this.compute(t),this.emit())):this.startPointerDrag(t))}startPointerDrag(t){const e=this.state;e._active=!0,e._preventScroll=!0,e._delayed=!1,this.compute(t),this.emit()}pointerMove(t){const e=this.state,i=this.config;if(!e._pointerActive)return;const n=pointerId(t);if(void 0!==e._pointerId&&n!==e._pointerId)return;const s=pointerValues(t);return document.pointerLockElement===t.target?e._delta=[t.movementX,t.movementY]:(e._delta=u.sub(s,e._values),this.computeValues(s)),u.addTo(e._movement,e._delta),this.compute(t),e._delayed&&e.intentional?(this.timeoutStore.remove("dragDelay"),e.active=!1,void this.startPointerDrag(t)):i.preventScrollAxis&&!e._preventScroll?e.axis?e.axis===i.preventScrollAxis||"xy"===i.preventScrollAxis?(e._active=!1,void this.clean()):(this.timeoutStore.remove("startPointerDrag"),void this.startPointerDrag(t)):void 0:void this.emit()}pointerUp(t){this.ctrl.setEventIds(t);try{this.config.pointerCapture&&t.target.hasPointerCapture(t.pointerId)&&t.target.releasePointerCapture(t.pointerId)}catch(t){"development"===process.env.NODE_ENV&&console.warn("[@use-gesture]: If you see this message, it's likely that you're using an outdated version of `@react-three/fiber`. \n\nPlease upgrade to the latest version.")}const e=this.state,i=this.config;if(!e._active||!e._pointerActive)return;const n=pointerId(t);if(void 0!==e._pointerId&&n!==e._pointerId)return;this.state._pointerActive=!1,this.setActive(),this.compute(t);const[s,o]=e._distance;if(e.tap=s<=i.tapsThreshold&&o<=i.tapsThreshold,e.tap&&i.filterTaps)e._force=!0;else{const[t,n]=e._delta,[s,o]=e._movement,[r,a]=i.swipe.velocity,[c,h]=i.swipe.distance,u=i.swipe.duration;if(e.elapsedTime<u){const i=Math.abs(t/e.timeDelta),u=Math.abs(n/e.timeDelta);i>r&&Math.abs(s)>c&&(e.swipe[0]=Math.sign(t)),u>a&&Math.abs(o)>h&&(e.swipe[1]=Math.sign(n))}}this.emit()}pointerClick(t){!this.state.tap&&t.detail>0&&(t.preventDefault(),t.stopPropagation())}setupPointer(t){const e=this.config,i=e.device;if("development"===process.env.NODE_ENV)try{if("pointer"===i&&void 0===e.preventScrollDelay){const e="uv"in t?t.sourceEvent.currentTarget:t.currentTarget;"auto"===window.getComputedStyle(e).touchAction&&console.warn("[@use-gesture]: The drag target has its `touch-action` style property set to `auto`. It is recommended to add `touch-action: 'none'` so that the drag gesture behaves correctly on touch-enabled devices. For more information read this: https://use-gesture.netlify.app/docs/extras/#touch-action.\n\nThis message will only show in development mode. It won't appear in production. If this is intended, you can ignore it.",e)}}catch(t){}e.pointerLock&&t.currentTarget.requestPointerLock(),e.pointerCapture||(this.eventStore.add(this.sharedConfig.window,i,"change",this.pointerMove.bind(this)),this.eventStore.add(this.sharedConfig.window,i,"end",this.pointerUp.bind(this)),this.eventStore.add(this.sharedConfig.window,i,"cancel",this.pointerUp.bind(this)))}pointerClean(){this.config.pointerLock&&document.pointerLockElement===this.state.currentTarget&&document.exitPointerLock()}preventScroll(t){this.state._preventScroll&&t.cancelable&&t.preventDefault()}setupScrollPrevention(t){this.state._preventScroll=!1,function persistEvent(t){"persist"in t&&"function"==typeof t.persist&&t.persist()}(t);const e=this.eventStore.add(this.sharedConfig.window,"touch","change",this.preventScroll.bind(this),{passive:!1});this.eventStore.add(this.sharedConfig.window,"touch","end",e),this.eventStore.add(this.sharedConfig.window,"touch","cancel",e),this.timeoutStore.add("startPointerDrag",this.startPointerDrag.bind(this),this.config.preventScrollDelay,t)}setupDelayTrigger(t){this.state._delayed=!0,this.timeoutStore.add("dragDelay",(()=>{this.state._step=[0,0],this.startPointerDrag(t)}),this.config.delay)}keyDown(t){const e=_[t.key];if(e){const i=this.state,n=t.shiftKey?10:t.altKey?.1:1;this.start(t),i._delta=e(this.config.keyboardDisplacement,n),i._keyboardActive=!0,u.addTo(i._movement,i._delta),this.compute(t),this.emit()}}keyUp(t){t.key in _&&(this.state._keyboardActive=!1,this.setActive(),this.compute(t),this.emit())}bind(t){const e=this.config.device;t(e,"start",this.pointerDown.bind(this)),this.config.pointerCapture&&(t(e,"change",this.pointerMove.bind(this)),t(e,"end",this.pointerUp.bind(this)),t(e,"cancel",this.pointerUp.bind(this)),t("lostPointerCapture","",this.pointerUp.bind(this))),this.config.keys&&(t("key","down",this.keyDown.bind(this)),t("key","up",this.keyUp.bind(this))),this.config.filterTaps&&t("click","",this.pointerClick.bind(this),{capture:!0,passive:!1})}},resolver:O};function _objectWithoutProperties(t,e){if(null==t)return{};var i,n,s=function _objectWithoutPropertiesLoose(t,e){if(null==t)return{};var i,n,s={},o=Object.keys(t);for(n=0;n<o.length;n++)i=o[n],e.indexOf(i)>=0||(s[i]=t[i]);return s}(t,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(n=0;n<o.length;n++)i=o[n],e.indexOf(i)>=0||Object.prototype.propertyIsEnumerable.call(t,i)&&(s[i]=t[i])}return s}const j={target(t){if(t)return()=>"current"in t?t.current:t},enabled:(t=!0)=>t,window:(t=(x.isBrowser?window:void 0))=>t,eventOptions:({passive:t=!0,capture:e=!1}={})=>({passive:t,capture:e}),transform:t=>t},M=["target","eventOptions","window","enabled","transform"];function resolveWith(t={},e){const i={};for(const[n,s]of Object.entries(e))switch(typeof s){case"function":if("development"===process.env.NODE_ENV){const e=s.call(i,t[n],n,t);Number.isNaN(e)||(i[n]=e)}else i[n]=s.call(i,t[n],n,t);break;case"object":i[n]=resolveWith(t[n],s);break;case"boolean":s&&(i[n]=t[n])}return i}class EventStore{constructor(t,e){_defineProperty(this,"_listeners",new Set),this._ctrl=t,this._gestureKey=e}add(t,e,i,n,s){const o=this._listeners,r=function toDomEventType(t,e=""){const i=l[t];return t+(i&&i[e]||e)}(e,i),a=_objectSpread2(_objectSpread2({},this._gestureKey?this._ctrl.config[this._gestureKey].eventOptions:{}),s);t.addEventListener(r,n,a);const remove=()=>{t.removeEventListener(r,n,a),o.delete(remove)};return o.add(remove),remove}clean(){this._listeners.forEach((t=>t())),this._listeners.clear()}}class TimeoutStore{constructor(){_defineProperty(this,"_timeouts",new Map)}add(t,e,i=140,...n){this.remove(t),this._timeouts.set(t,window.setTimeout(e,i,...n))}remove(t){const e=this._timeouts.get(t);e&&window.clearTimeout(e)}clean(){this._timeouts.forEach((t=>{window.clearTimeout(t)})),this._timeouts.clear()}}class Controller{constructor(t){_defineProperty(this,"gestures",new Set),_defineProperty(this,"_targetEventStore",new EventStore(this)),_defineProperty(this,"gestureEventStores",{}),_defineProperty(this,"gestureTimeoutStores",{}),_defineProperty(this,"handlers",{}),_defineProperty(this,"config",{}),_defineProperty(this,"pointerIds",new Set),_defineProperty(this,"touchIds",new Set),_defineProperty(this,"state",{shared:{shiftKey:!1,metaKey:!1,ctrlKey:!1,altKey:!1}}),function resolveGestures(t,e){e.drag&&setupGesture(t,"drag");e.wheel&&setupGesture(t,"wheel");e.scroll&&setupGesture(t,"scroll");e.move&&setupGesture(t,"move");e.pinch&&setupGesture(t,"pinch");e.hover&&setupGesture(t,"hover")}(this,t)}setEventIds(t){return isTouch(t)?(this.touchIds=new Set(touchIds(t)),this.touchIds):"pointerId"in t?("pointerup"===t.type||"pointercancel"===t.type?this.pointerIds.delete(t.pointerId):"pointerdown"===t.type&&this.pointerIds.add(t.pointerId),this.pointerIds):void 0}applyHandlers(t,e){this.handlers=t,this.nativeHandlers=e}applyConfig(t,e){this.config=function parse(t,e,i={}){const n=t,{target:s,eventOptions:o,window:r,enabled:a,transform:c}=n,h=_objectWithoutProperties(n,M);if(i.shared=resolveWith({target:s,eventOptions:o,window:r,enabled:a,transform:c},j),e){const t=D.get(e);i[e]=resolveWith(_objectSpread2({shared:i.shared},h),t)}else for(const t in h){const e=D.get(t);if(e)i[t]=resolveWith(_objectSpread2({shared:i.shared},h[t]),e);else if("development"===process.env.NODE_ENV&&!["drag","pinch","scroll","wheel","move","hover"].includes(t)){if("domTarget"===t)throw Error("[@use-gesture]: `domTarget` option has been renamed to `target`.");console.warn(`[@use-gesture]: Unknown config key \`${t}\` was used. Please read the documentation for further information.`)}}return i}(t,e,this.config)}clean(){this._targetEventStore.clean();for(const t of this.gestures)this.gestureEventStores[t].clean(),this.gestureTimeoutStores[t].clean()}effect(){return this.config.shared.target&&this.bind(),()=>this._targetEventStore.clean()}bind(...t){const e=this.config.shared,i={};let n;if(!e.target||(n=e.target(),n)){if(e.enabled){for(const e of this.gestures){const s=this.config[e],o=bindToProps(i,s.eventOptions,!!n);if(s.enabled){new(P.get(e))(this,t,e).bind(o)}}const s=bindToProps(i,e.eventOptions,!!n);for(const e in this.nativeHandlers)s(e,"",(i=>this.nativeHandlers[e](_objectSpread2(_objectSpread2({},this.state.shared),{},{event:i,args:t}))),void 0,!0)}for(const t in i)i[t]=chain(...i[t]);if(!n)return i;for(const t in i){const{device:e,capture:s,passive:o}=parseProp(t);this._targetEventStore.add(n,e,"",i[t],{capture:s,passive:o})}}}}function setupGesture(t,e){t.gestures.add(e),t.gestureEventStores[e]=new EventStore(t,e),t.gestureTimeoutStores[e]=new TimeoutStore}const bindToProps=(t,e,i)=>(n,s,o,r={},a=!1)=>{var c,h;const u=null!==(c=r.capture)&&void 0!==c?c:e.capture,l=null!==(h=r.passive)&&void 0!==h?h:e.passive;let d=a?n:toHandlerProp(n,s,u);i&&l&&(d+="Passive"),t[d]=t[d]||[],t[d].push(o)};function useDrag(e,i){return function registerAction(t){P.set(t.key,t.engine),D.set(t.key,t.resolver)}(C),function useRecognizers(e,i={},n,s){const o=t.useMemo((()=>new Controller(e)),[]);if(o.applyHandlers(e,s),o.applyConfig(i,n),t.useEffect(o.effect.bind(o)),t.useEffect((()=>o.clean.bind(o)),[]),void 0===i.target)return o.bind.bind(o)}({drag:e},{},"drag")}class ElasticCollision{constructor({gridSize:t=4,containerOffsets:e={top:0,bottom:0,left:0,right:0},collisions:i=!0,borders:n="rigid"}={}){this.calculatecCollisions=i,this.calculateBorders=n,this.gridSize=t,this.containerOffsets=e,this.positions=[],this.velocities=[],this.externalForces=[],this.dimensions=[],this.bounced=[],this.hash=[],this.container={},this.collisionsList=[]}initialConditions(t,e,i=()=>{}){this.container=e,this.dimensions=t.map(((t,e)=>{if(!t)return[0,0];this.externalForces[e]=[0,0],this.bounced[e]=0;const{rect:i}=t;return[i.width/2,i.height/2]})),i(this),this.positions.forEach(((e,i)=>{this.hash[i]=Math.floor(this.gridSize*(e[0]/this.container.width))+Math.floor(this.gridSize*(e[1]/this.container.height))*this.gridSize,this.setPosition(t[i]?.element,{x:e[0],y:e[1]})}))}polarCoordinates(t){return{speed:Math.sqrt(t[0]*t[0]+t[1]*t[1]),angle:Math.atan2(t[1],t[0])}}cartesianCoordinates(t,e){return[t*Math.cos(e),t*Math.sin(e)]}hasBounced(t){return this.bounced[t]+=1}setPosition(t,{x:e=0,y:i=0,z:n=0}){t&&(t.style.cssText=`transform: translate3d(${e}px, ${i}px, ${n}px);`)}rigidBorders(t){if("rigid"!==this.calculateBorders)return;const e=this.containerOffsets.top,i=this.containerOffsets.left,n=this.containerOffsets.right+1,s=this.containerOffsets.bottom+1;for(let o=0;o<t.length;o++){const t=this.dimensions[o];let r=this.velocities[o],a=this.positions[o];a[1]<t[1]+this.container.height*e&&(this.hasBounced(o),this.velocities[o][1]=-r[1],this.positions[o][1]=t[1]+this.container.height*e),a[0]<t[0]+this.container.width*i&&(this.hasBounced(o),this.velocities[o][0]=-r[0],this.positions[o][0]=t[0]+this.container.width*i),a[1]>this.container.height*s-t[1]&&(this.hasBounced(o),this.velocities[o][1]=-r[1],this.positions[o][1]=this.container.height*s-t[1]),a[0]>this.container.width*n-t[0]&&(this.hasBounced(o),this.velocities[o][0]=-r[0],this.positions[o][0]=this.container.width*n-t[0])}}periodicBorders(t){if("periodic"!==this.calculateBorders)return;const e=this.containerOffsets.top,i=this.containerOffsets.left,n=this.containerOffsets.right+1,s=this.containerOffsets.bottom+1;for(let o=0;o<t.length;o++){const t=this.dimensions[o];let r=this.positions[o],a=this.velocities[o].map((t=>Math.sign(t)));-1===a[1]&&r[1]<t[1]+this.container.height*e&&(this.positions[o][1]=t[1]+this.container.height*s),1===a[1]&&r[1]>this.container.height*s-t[1]&&(this.positions[o][1]=this.container.height*e-t[1]),-1===a[0]&&r[0]<t[0]+this.container.width*i&&(this.positions[o][0]=t[0]+this.container.width*n),1===a[0]&&r[0]>this.container.width*n-t[0]&&(this.positions[o][0]=this.container.width*i-t[0])}}isNeighboor(t,e){const i=this.hash[e];let n=this.hash[t],s=!1;for(let t=-1;t<2;t++)for(let e=-1;e<2;e++){let o=n+this.gridSize*t+e;if(!(o<0||o>this.gridSize*this.gridSize)&&o===i){s=!0;break}}return s}axisAlignedBoundaryBoxes(t,e){const i=this.dimensions[t],n=this.positions[t],s=this.dimensions[e],o=this.positions[e];return n.map(((t,e)=>Math.abs(t-o[e])<i[e]+s[e])).every((t=>t))}calculateSuperposition(t,e){const i=this.positions[t],n=this.dimensions[t],s=this.positions[e],o=this.dimensions[e],r=i.map(((t,e)=>n[e]+o[e]-Math.abs(t-s[e]))),a=i.map(((t,e)=>-Math.sign(t-s[e])));return r.map(((t,e)=>a[e]*Math.max(1/t,.1)))}collisions(t){if(this.calculatecCollisions){this.collisionsList=[];for(let e=0;e<t.length;e++){let t=this.velocities[e];this.hash.forEach(((i,n)=>{if(n===e)return;let s=this.velocities[n];if(this.collisionsList.some((({loop:t,inHash:i})=>t===n&&i===e)))return;if(!this.isNeighboor(e,n))return;if(!this.axisAlignedBoundaryBoxes(e,n))return;this.collisionsList.push({loop:e,inHash:n});const o=.5*(t.reduce(((t,e)=>t+e*e),0)+s.reduce(((t,e)=>t+e*e),0));let r=this.calculateSuperposition(e,n),a=t.map(((t,e)=>t+r[e])),c=s.map(((t,e)=>t-r[e]));const h=.5*(a.reduce(((t,e)=>t+e*e),0)+c.reduce(((t,e)=>t+e*e),0));if(0!==h){const t=Math.sqrt(o/h);a=a.map((e=>e*t)),c=c.map((e=>e*t))}this.velocities[e]=c,this.velocities[n]=a}))}}}update(t,e){this.rigidBorders(t),this.periodicBorders(t),this.collisions(t),e(this),this.positions.forEach(((t,e)=>{this.hash[e]=Math.floor(this.gridSize*t[0]/this.container.width)+Math.floor(this.gridSize*t[1]/this.container.height)*this.gridSize}))}}const A={random:function randomInitialConditions({boxes:t,positions:e,velocities:i,container:n}){t.forEach(((t,s)=>{e[s]=[Math.random()*n.width,Math.random()*n.height],i[s]=[.5*(Math.random()-.5),.5*(Math.random()-.5)]}))}};const B={dvdAnimation:function dvdAnimation({boxes:t,positions:e,velocities:i,deltaTime:n}){t.forEach(((t,s)=>{e[s]=e[s].map(((t,e)=>t+i[s][e]*n))}))},DragAndGravity:function DragAndGravity({boxes:t,positions:e,velocities:i,deltaTime:n,externalForces:s}){t.forEach(((t,o)=>{let r=i[o],a=e[o],c=s[o];const h=[0,-.1];r=r.map(((t,e)=>t+-.001*n*(t-4*c[e]+h[e]))),a=a.map(((t,e)=>t+r[e]*n)),e[o]=a,i[o]=r,s[o]=[0,0]}))},rightFlow:function rightFlow({boxes:t,positions:e,velocities:i,externalForces:n,deltaTime:s}){t.forEach(((t,o)=>{let r=i[o],a=e[o],c=n[o];const h=[.5*(Math.random()-.5),.05*(Math.random()-.5)];r=r.map(((t,e)=>t+-.001*s*(t-4*c[e]+h[e]))),e[o]=a=a.map(((t,e)=>t+r[e]*s)),e[o]=a,i[o]=r,n[o]=[0,0]}))}};const I={default:function dragForce(t,e,i){let n=t.map((t=>t*t)).reduce(((t,e)=>t+e));n=Math.sqrt(n),0!==n&&(e[i]=t.map((t=>t/n)))}};const N=r({});function useElasticCollision(){return o(N)}function ReactElasticCollision({children:o,className:r,config:c={gridSize:8,collisions:!0,borders:"rigid",containerOffsets:{top:0,bottom:0,left:0,right:0}},initialConditions:h=()=>{},update:u=()=>{}}){const l=n(new Map),[d,v]=k(),[m]=i((()=>new ElasticCollision(c))),g=s(((t,e)=>{l.current.set(t,e)}),[]),_=s((t=>{l.current.delete(t)}),[]);return e((()=>{const t=[...l.current.values()];(function isEmptyArray(t){return!t||Array.isArray(t)&&0===t.length})(t)||t.some((({rect:t})=>!t))||m.initialConditions(t,v,(e=>h({boxes:t,...e})))}),[m,v]),function f(t,i=0){e((()=>{if(t)return a.add(t,i),()=>a.remove(t)}),[t,i])}(((t,e)=>{const i=[...l.current.values()];m.update(i,(t=>{u({boxes:i,...t,deltaTime:e}),i.forEach(((e,i)=>{const n=t.positions[i],s=t.dimensions[i];t?.setPosition(e?.element,{x:n[0]-s[0],y:n[1]})}))}))})),t.createElement("div",{className:r,ref:d,style:{position:"relative",width:"100%",height:"100%"}},t.createElement(N.Provider,{value:{addBox:g,removeBox:_,elasticCollision:m}},o))}function CollisionBox({className:i,children:s,onDragStop:o=null,index:r=0,...a}){const{addBox:c,removeBox:h,elasticCollision:u}=useElasticCollision(),[l,d]=k(),v=n();e((()=>{if(v.current)return c(v.current,{element:v.current,rect:d}),()=>{h(v.current)}}),[d,c,h]);const m=useDrag((({down:t,movement:[e,i]})=>{t&&o&&o([e,i],u.externalForces,r)}));return t.createElement("div",_extends({ref:t=>{v.current=t,l(t)},className:i},a),t.createElement("div",m(),s))}export{CollisionBox,ReactElasticCollision as default,I as dragForcePresetsLib,A as initalConditionsPresets,B as updatePresets,useElasticCollision};
//# sourceMappingURL=elastic-collisions-react.mjs.map
