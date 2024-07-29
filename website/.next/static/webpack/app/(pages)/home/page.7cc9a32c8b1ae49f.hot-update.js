"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
self["webpackHotUpdate_N_E"]("app/(pages)/home/page",{

/***/ "(app-pages-browser)/../packages/react/dist/elastic-collisions-react.mjs":
/*!***********************************************************!*\
  !*** ../packages/react/dist/elastic-collisions-react.mjs ***!
  \***********************************************************/
/***/ (function(__webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   CollisionBox: function() { return /* binding */ CollisionBox; },
/* harmony export */   "default": function() { return /* binding */ ReactElasticCollision; },
/* harmony export */   useElasticCollision: function() { return /* binding */ useElasticCollision; }
/* harmony export */ });
/* harmony import */ var _darkroom_engineering_hamo__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @darkroom.engineering/hamo */ "(app-pages-browser)/../node_modules/.pnpm/@darkroom.engineering+hamo@0.6.45_react-dom@18.3.1_react@18.3.1__react@18.3.1/node_modules/@darkroom.engineering/hamo/dist/hamo.modern.mjs");
/* harmony import */ var _use_gesture_react__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @use-gesture/react */ "(app-pages-browser)/../node_modules/.pnpm/@use-gesture+react@10.3.1_react@18.3.1/node_modules/@use-gesture/react/dist/use-gesture-react.esm.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/index.js");
var _s = $RefreshSig$();



function _extends() {
    return _extends = Object.assign ? Object.assign.bind() : function(t) {
        for(var i = 1; i < arguments.length; i++){
            var s = arguments[i];
            for(var e in s)({}).hasOwnProperty.call(s, e) && (t[e] = s[e]);
        }
        return t;
    }, _extends.apply(null, arguments);
}
class ElasticCollision {
    initialConditions(t, i) {
        let s = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ()=>{};
        this.container = i, this.dimensions = t.map((t)=>{
            if (!t) return [
                0,
                0
            ];
            const { rect: i } = t;
            return [
                i.width / 2,
                i.height / 2
            ];
        }), s(this), this.positions.forEach((i, s)=>{
            var _t_s;
            this.hash[s] = Math.floor(this.gridSize * (i[0] / this.container.width)) + Math.floor(this.gridSize * (i[1] / this.container.height)) * this.gridSize, this.setPosition((_t_s = t[s]) === null || _t_s === void 0 ? void 0 : _t_s.element, {
                x: i[0],
                y: i[1]
            });
        });
    }
    polarCoordinates(t) {
        return {
            speed: Math.sqrt(t[0] * t[0] + t[1] * t[1]),
            angle: Math.atan2(t[1], t[0])
        };
    }
    cartesianCoordinates(t, i) {
        return [
            t * Math.cos(i),
            t * Math.sin(i)
        ];
    }
    hasBounced(t) {
        return this.bounced[t] += 1;
    }
    setPosition(t, param) {
        let { x: i = 0, y: s = 0, z: e = 0 } = param;
        t && (t.style.cssText = "transform: translate3d(".concat(i, "px, ").concat(s, "px, ").concat(e, "px);"));
    }
    rigidBorders(t) {
        if ("rigid" === this.calculateBorders) for(let i = 0; i < t.length; i++){
            const t = this.dimensions[i];
            let s = this.velocities[i], e = this.positions[i];
            e[1] < t[1] + this.container.height * this.containerOffsets.top && (this.hasBounced(i), this.velocities[i][1] = -s[1], this.positions[i][1] = t[1] + this.container.height * this.containerOffsets.top), e[0] < t[0] + this.container.width * this.containerOffsets.left && (this.hasBounced(i), this.velocities[i][0] = -s[0], this.positions[i][0] = t[0] + this.container.width * this.containerOffsets.left), e[1] > this.container.height * (this.containerOffsets.bottom + 1) - t[1] && (this.hasBounced(i), this.velocities[i][1] = -s[1], this.positions[i][1] = this.container.height * (this.containerOffsets.bottom + 1) - t[1]), e[0] > this.container.width * (this.containerOffsets.right + 1) - t[0] && (this.hasBounced(i), this.velocities[i][0] = -s[0], this.positions[i][0] = this.container.width * (this.containerOffsets.right + 1) - t[0]);
        }
    }
    periodicBorders(t) {
        if ("periodic" === this.calculateBorders) for(let i = 0; i < t.length; i++){
            const t = this.dimensions[i];
            let s = this.positions[i], e = this.velocities[i].map((t)=>Math.sign(t));
            -1 === e[1] && s[1] < t[1] + this.container.height * this.containerOffsets.top && (this.positions[i][1] = t[1] + this.container.height * this.containerOffsets.bottom), 1 === e[1] && s[1] > this.container.height * this.containerOffsets.bottom - t[1] && (this.positions[i][1] = this.container.height * this.containerOffsets.top - t[1]), -1 === e[0] && s[0] < t[0] + this.container.width * this.containerOffsets.left && (this.positions[i][0] = t[0] + this.container.width * this.containerOffsets.right), 1 === e[0] && s[0] > this.container.width * this.containerOffsets.right - t[0] && (this.positions[i][0] = this.container.width * this.containerOffsets.left - t[0]);
        }
    }
    isNeighboor(t, i) {
        const s = this.hash[i];
        let e = this.hash[t], o = !1;
        for(let t = -1; t < 2; t++)for(let i = -1; i < 2; i++){
            let n = e + this.gridSize * t + i;
            if (!(n < 0 || n > this.gridSize * this.gridSize) && n === s) {
                o = !0;
                break;
            }
        }
        return o;
    }
    axisAlignedBoundaryBoxes(t, i) {
        const s = this.dimensions[t], e = this.positions[t], o = this.dimensions[i], n = this.positions[i];
        return e.map((t, i)=>Math.abs(t - n[i]) < s[i] + o[i]).every((t)=>t);
    }
    calculateSuperposition(t, i) {
        let s = [
            0,
            0
        ];
        const e = this.positions[t], o = this.dimensions[t], n = this.positions[i], r = this.dimensions[i], h = e.map((t, i)=>o[i] + r[i] - Math.abs(t - n[i]));
        return h[0] < h[1] ? e[0] < n[0] ? s[0] = h[0] : s[0] = -h[0] : e[1] < n[1] ? s[1] = h[1] : s[1] = -h[1], s.map((t)=>t + Math.random() * this.collisionRandomness);
    }
    collisions(t) {
        if (this.calculatecCollisions) {
            this.collisionsList = [];
            for(let i = 0; i < t.length; i++){
                let t = this.velocities[i];
                this.hash.forEach((s, e)=>{
                    if (e === i) return;
                    let o = this.velocities[e];
                    if (this.collisionsList.some((param)=>{
                        let { loop: t, inHash: s } = param;
                        return t === e && s === i;
                    })) return;
                    if (!this.isNeighboor(i, e)) return;
                    if (!this.axisAlignedBoundaryBoxes(i, e)) return;
                    this.collisionsList.push({
                        loop: i,
                        inHash: e
                    });
                    const n = .5 * (t.reduce((t, i)=>t + i * i, 0) + o.reduce((t, i)=>t + i * i, 0)), r = this.calculateSuperposition(i, e);
                    let h = t.map((t, i)=>t + r[i]), a = o.map((t, i)=>t - r[i]);
                    const c = .5 * (h.reduce((t, i)=>t + i * i, 0) + a.reduce((t, i)=>t + i * i, 0));
                    if (0 !== c) {
                        const t = Math.sqrt(n / c);
                        h = h.map((i)=>i * t), a = a.map((i)=>i * t);
                    }
                    this.velocities[i] = a, this.velocities[e] = h;
                });
            }
        }
    }
    update(t, i) {
        this.rigidBorders(t), this.periodicBorders(t), this.collisions(t), i(this), this.positions.forEach((t, i)=>{
            this.hash[i] = Math.floor(this.gridSize * t[0] / this.container.width) + Math.floor(this.gridSize * t[1] / this.container.height) * this.gridSize;
        });
    }
    constructor({ gridSize: t = 4, containerOffsets: i = {
        top: 0,
        bottom: 1,
        left: 0,
        right: 1
    }, collisions: s = !0, borders: e = "rigid", collisionRandomness: o = 0 } = {}){
        this.calculatecCollisions = s, this.calculateBorders = e, this.collisionRandomness = o, this.gridSize = t, this.containerOffsets = i, this.positions = [], this.velocities = [], this.dimensions = [], this.bounced = [], this.hash = [], this.container = {}, this.collisionsList = [];
    }
}
const l = {
    random: function randominitialConditions(param) {
        let { boxes: t, positions: i, velocities: s, container: e } = param;
        t.forEach((t, o)=>{
            i[o] = [
                Math.random() * e.width,
                Math.random() * e.height
            ], s[o] = [
                .5 * (Math.random() - .5),
                .5 * (Math.random() - .5)
            ];
        });
    }
};
const d = /*#__PURE__*/ (0,react__WEBPACK_IMPORTED_MODULE_0__.createContext)({});
function useElasticCollision() {
    return (0,react__WEBPACK_IMPORTED_MODULE_0__.useContext)(d);
}
function ReactElasticCollision(param) {
    let { children: s, className: o, config: c = {
        gridSize: 8,
        collisions: !1,
        borders: "rigid",
        containerOffsets: {
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
        }
    }, presets: f = {
        initialConditions: null,
        update: null
    }, initialConditions: u = ()=>{}, update: p = ()=>{} } = param;
    const m = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(new Map), [g, v] = (0,_darkroom_engineering_hamo__WEBPACK_IMPORTED_MODULE_1__.useRect)(), [x] = (0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(()=>new ElasticCollision(c)), S = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((t, i)=>{
        m.current.set(t, i);
    }, []), B = (0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((t)=>{
        m.current.delete(t);
    }, []);
    return (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        let t = u;
        const i = [
            ...m.current.values()
        ];
        if (!function isEmptyArray(t) {
            return !t || Array.isArray(t) && 0 === t.length;
        }(i) && !i.some((param)=>{
            let { rect: t } = param;
            return !t;
        })) {
            if (f.initialConditions && (t = l[f.initialConditions], !t)) throw t = l.random, new Error("No setup preset found for ".concat(f.initialConditions, " defaulting to random"));
            x.initialConditions(i, v, (s)=>t({
                    boxes: i,
                    ...s
                }));
        }
    }, [
        x,
        v,
        u
    ]), (0,_darkroom_engineering_hamo__WEBPACK_IMPORTED_MODULE_1__.useFrame)((t, i)=>{
        const s = [
            ...m.current.values()
        ];
        x.update(s, (t)=>{
            p({
                boxes: s,
                ...t,
                deltaTime: i
            }), s.forEach((i, s)=>{
                const e = t.positions[s], o = t.dimensions[s];
                t === null || t === void 0 ? void 0 : t.setPosition(i === null || i === void 0 ? void 0 : i.element, {
                    x: e[0] - o[0],
                    y: e[1]
                });
            });
        });
    }), /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", {
        className: o,
        ref: g,
        style: {
            position: "relative",
            width: "100%",
            height: "100%"
        }
    }, /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement(d.Provider, {
        value: {
            addBox: S,
            removeBox: B
        }
    }, s));
}
_c = ReactElasticCollision;
function CollisionBox(param) {
    let { className: i, children: o, onDragStop: r = ()=>{}, ...h } = param;
    _s();
    const { addBox: c, removeBox: l } = useElasticCollision(), [d, f] = (0,_darkroom_engineering_hamo__WEBPACK_IMPORTED_MODULE_1__.useRect)(), u = (0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)();
    (0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)(()=>{
        if (u.current) return c(u.current, {
            element: u.current,
            rect: f
        }), ()=>{
            l(u.current);
        };
    }, [
        f,
        c,
        l
    ]);
    const p = (0,_use_gesture_react__WEBPACK_IMPORTED_MODULE_2__.useDrag)((param)=>{
        let { down: t, movement: [i, s] } = param;
        t && r([
            i,
            s
        ]);
    });
    return /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", _extends({
        ref: (t)=>{
            u.current = t, d(t);
        },
        className: i
    }, h), /*#__PURE__*/ react__WEBPACK_IMPORTED_MODULE_0__.createElement("div", p(), o));
}
_s(CollisionBox, "6CmlvcLHWPJxczwlJYyGQTZayS0=", false, function() {
    return [
        useElasticCollision,
        useElasticCollision,
        useElasticCollision
    ];
});
_c1 = CollisionBox;
 //# sourceMappingURL=elastic-collisions-react.mjs.map
var _c, _c1;
$RefreshReg$(_c, "ReactElasticCollision");
$RefreshReg$(_c1, "CollisionBox");


;
    // Wrapped in an IIFE to avoid polluting the global scope
    ;
    (function () {
        var _a, _b;
        // Legacy CSS implementations will `eval` browser code in a Node.js context
        // to extract CSS. For backwards compatibility, we need to check we're in a
        // browser context before continuing.
        if (typeof self !== 'undefined' &&
            // AMP / No-JS mode does not inject these helpers:
            '$RefreshHelpers$' in self) {
            // @ts-ignore __webpack_module__ is global
            var currentExports = __webpack_module__.exports;
            // @ts-ignore __webpack_module__ is global
            var prevSignature = (_b = (_a = __webpack_module__.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;
            // This cannot happen in MainTemplate because the exports mismatch between
            // templating and execution.
            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, __webpack_module__.id);
            // A module can be accepted automatically based on its exports, e.g. when
            // it is a Refresh Boundary.
            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {
                // Save the previous exports signature on update so we can compare the boundary
                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)
                __webpack_module__.hot.dispose(function (data) {
                    data.prevSignature =
                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);
                });
                // Unconditionally accept an update to this module, we'll check if it's
                // still a Refresh Boundary later.
                // @ts-ignore importMeta is replaced in the loader
                __webpack_module__.hot.accept();
                // This field is set when the previous version of this module was a
                // Refresh Boundary, letting us know we need to check for invalidation or
                // enqueue an update.
                if (prevSignature !== null) {
                    // A boundary can become ineligible if its exports are incompatible
                    // with the previous exports.
                    //
                    // For example, if you add/remove/change exports, we'll want to
                    // re-execute the importing modules, and force those components to
                    // re-render. Similarly, if you convert a class component to a
                    // function, we want to invalidate the boundary.
                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {
                        __webpack_module__.hot.invalidate();
                    }
                    else {
                        self.$RefreshHelpers$.scheduleUpdate();
                    }
                }
            }
            else {
                // Since we just executed the code for the module, it's possible that the
                // new exports made it ineligible for being a boundary.
                // We only care about the case when we were _previously_ a boundary,
                // because we already accepted this update (accidental side effect).
                var isNoLongerABoundary = prevSignature !== null;
                if (isNoLongerABoundary) {
                    __webpack_module__.hot.invalidate();
                }
            }
        }
    })();


/***/ })

});