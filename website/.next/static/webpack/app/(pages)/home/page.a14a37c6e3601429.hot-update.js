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

/***/ "(app-pages-browser)/./app/(pages)/home/(componentes)/example/index.js":
/*!*********************************************************!*\
  !*** ./app/(pages)/home/(componentes)/example/index.js ***!
  \*********************************************************/
/***/ (function(__webpack_module__, __webpack_exports__, __webpack_require__) {

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Example: function() { return /* binding */ Example; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../packages/react/dist/elastic-collisions-react.mjs */ \"(app-pages-browser)/../packages/react/dist/elastic-collisions-react.mjs\");\n/* harmony import */ var _example_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./example.module.scss */ \"(app-pages-browser)/./app/(pages)/home/(componentes)/example/example.module.scss\");\n/* __next_internal_client_entry_do_not_use__ Example auto */ \nvar _s = $RefreshSig$(), _s1 = $RefreshSig$();\n\n\n\nconst data = [\n    {\n        name: \"Guido\"\n    },\n    {\n        name: \"Franco\"\n    },\n    {\n        name: \"Lea\"\n    },\n    {\n        name: \"Felix\"\n    },\n    {\n        name: \"Cl\\xe9ment\"\n    },\n    {\n        name: \"Fermin\"\n    }\n];\nfunction Example() {\n    _s();\n    const dragVelocity = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);\n    const stVels = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n        className: _example_module_scss__WEBPACK_IMPORTED_MODULE_3__.example,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n            initialConditions: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.initalConditionsPresets.random,\n            update: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.updatePresets.DragAndGravity,\n            children: data.map((param, index)=>{\n                let { name } = param;\n                return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Item, {\n                    name: name,\n                    index: index\n                }, index, false, {\n                    fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n                    lineNumber: 32,\n                    columnNumber: 11\n                }, this);\n            })\n        }, void 0, false, {\n            fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n            lineNumber: 27,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n        lineNumber: 26,\n        columnNumber: 5\n    }, this);\n}\n_s(Example, \"dKjxkkiZEGS7IfulonvZq5vI7hs=\");\n_c = Example;\nfunction Item(param) {\n    let { name, index } = param;\n    _s1();\n    const { elasticCollision } = (0,_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.useElasticCollision)();\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.CollisionBox, {\n        className: _example_module_scss__WEBPACK_IMPORTED_MODULE_3__.item,\n        onDragStop: (newDir, externalForces)=>{\n            let norm = newDir.map((pos)=>pos * pos).reduce((a, b)=>a + b);\n            norm = Math.sqrt(norm);\n            if (norm === 0) return;\n            externalForces = newDir.map((pos)=>pos / norm);\n        },\n        index: index,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            children: name\n        }, void 0, false, {\n            fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n            lineNumber: 55,\n            columnNumber: 7\n        }, this)\n    }, index, false, {\n        fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n        lineNumber: 43,\n        columnNumber: 5\n    }, this);\n}\n_s1(Item, \"eJKT6cIYs2JxgeF0GVbk6/vr5LE=\", false, function() {\n    return [\n        _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.useElasticCollision\n    ];\n});\n_c1 = Item;\nvar _c, _c1;\n$RefreshReg$(_c, \"Example\");\n$RefreshReg$(_c1, \"Item\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = __webpack_module__.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = __webpack_module__.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, __webpack_module__.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                __webpack_module__.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                __webpack_module__.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        __webpack_module__.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    __webpack_module__.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC8ocGFnZXMpL2hvbWUvKGNvbXBvbmVudGVzKS9leGFtcGxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFOEI7QUFNNkM7QUFDdEM7QUFFckMsTUFBTU8sT0FBTztJQUNYO1FBQUVDLE1BQU07SUFBUTtJQUNoQjtRQUFFQSxNQUFNO0lBQVM7SUFDakI7UUFBRUEsTUFBTTtJQUFNO0lBQ2Q7UUFBRUEsTUFBTTtJQUFRO0lBQ2hCO1FBQUVBLE1BQU07SUFBVTtJQUNsQjtRQUFFQSxNQUFNO0lBQVM7Q0FDbEI7QUFFTSxTQUFTQzs7SUFDZCxNQUFNQyxlQUFlViw2Q0FBTUEsQ0FBQyxFQUFFO0lBQzlCLE1BQU1XLFNBQVNYLDZDQUFNQSxDQUFDLEVBQUU7SUFFeEIscUJBQ0UsOERBQUNZO1FBQVFDLFdBQVdQLHlEQUFTO2tCQUMzQiw0RUFBQ0wseUZBQXFCQTtZQUNwQmMsbUJBQW1CWixzR0FBdUJBLENBQUNhLE1BQU07WUFDakRDLFFBQVFiLDRGQUFhQSxDQUFDYyxjQUFjO3NCQUVuQ1gsS0FBS1ksR0FBRyxDQUFDLFFBQVdDO29CQUFWLEVBQUVaLElBQUksRUFBRTtxQ0FDakIsOERBQUNhO29CQUFpQmIsTUFBTUE7b0JBQU1ZLE9BQU9BO21CQUExQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLckI7R0FoQmdCWDtLQUFBQTtBQWtCaEIsU0FBU1ksS0FBSyxLQUFlO1FBQWYsRUFBRWIsSUFBSSxFQUFFWSxLQUFLLEVBQUUsR0FBZjs7SUFDWixNQUFNLEVBQUVFLGdCQUFnQixFQUFFLEdBQUdqQixzR0FBbUJBO0lBRWhELHFCQUNFLDhEQUFDSCwyRkFBWUE7UUFFWFcsV0FBV1Asc0RBQU07UUFDakJrQixZQUFZLENBQUNDLFFBQVFDO1lBQ25CLElBQUlDLE9BQU9GLE9BQU9OLEdBQUcsQ0FBQyxDQUFDUyxNQUFRQSxNQUFNQSxLQUFLQyxNQUFNLENBQUMsQ0FBQ0MsR0FBR0MsSUFBTUQsSUFBSUM7WUFDL0RKLE9BQU9LLEtBQUtDLElBQUksQ0FBQ047WUFFakIsSUFBSUEsU0FBUyxHQUFHO1lBQ2hCRCxpQkFBaUJELE9BQU9OLEdBQUcsQ0FBQyxDQUFDUyxNQUFRQSxNQUFNRDtRQUM3QztRQUNBUCxPQUFPQTtrQkFFUCw0RUFBQ2M7c0JBQUsxQjs7Ozs7O09BWERZOzs7OztBQWNYO0lBbkJTQzs7UUFDc0JoQixrR0FBbUJBOzs7TUFEekNnQiIsInNvdXJjZXMiOlsid2VicGFjazovL19OX0UvLi9hcHAvKHBhZ2VzKS9ob21lLyhjb21wb25lbnRlcykvZXhhbXBsZS9pbmRleC5qcz9kM2Y1Il0sInNvdXJjZXNDb250ZW50IjpbIid1c2UgY2xpZW50J1xuXG5pbXBvcnQgeyB1c2VSZWYgfSBmcm9tICdyZWFjdCdcbmltcG9ydCBSZWFjdEVsYXN0aWNDb2xsaXNpb24sIHtcbiAgQ29sbGlzaW9uQm94LFxuICBpbml0YWxDb25kaXRpb25zUHJlc2V0cyxcbiAgdXBkYXRlUHJlc2V0cyxcbiAgdXNlRWxhc3RpY0NvbGxpc2lvbixcbn0gZnJvbSAnLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvcmVhY3QvZGlzdC9lbGFzdGljLWNvbGxpc2lvbnMtcmVhY3QubWpzJ1xuaW1wb3J0IHMgZnJvbSAnLi9leGFtcGxlLm1vZHVsZS5zY3NzJ1xuXG5jb25zdCBkYXRhID0gW1xuICB7IG5hbWU6ICdHdWlkbycgfSxcbiAgeyBuYW1lOiAnRnJhbmNvJyB9LFxuICB7IG5hbWU6ICdMZWEnIH0sXG4gIHsgbmFtZTogJ0ZlbGl4JyB9LFxuICB7IG5hbWU6ICdDbMOpbWVudCcgfSxcbiAgeyBuYW1lOiAnRmVybWluJyB9LFxuXVxuXG5leHBvcnQgZnVuY3Rpb24gRXhhbXBsZSgpIHtcbiAgY29uc3QgZHJhZ1ZlbG9jaXR5ID0gdXNlUmVmKFtdKVxuICBjb25zdCBzdFZlbHMgPSB1c2VSZWYoW10pXG5cbiAgcmV0dXJuIChcbiAgICA8c2VjdGlvbiBjbGFzc05hbWU9e3MuZXhhbXBsZX0+XG4gICAgICA8UmVhY3RFbGFzdGljQ29sbGlzaW9uXG4gICAgICAgIGluaXRpYWxDb25kaXRpb25zPXtpbml0YWxDb25kaXRpb25zUHJlc2V0cy5yYW5kb219XG4gICAgICAgIHVwZGF0ZT17dXBkYXRlUHJlc2V0cy5EcmFnQW5kR3Jhdml0eX1cbiAgICAgID5cbiAgICAgICAge2RhdGEubWFwKCh7IG5hbWUgfSwgaW5kZXgpID0+IChcbiAgICAgICAgICA8SXRlbSBrZXk9e2luZGV4fSBuYW1lPXtuYW1lfSBpbmRleD17aW5kZXh9IC8+XG4gICAgICAgICkpfVxuICAgICAgPC9SZWFjdEVsYXN0aWNDb2xsaXNpb24+XG4gICAgPC9zZWN0aW9uPlxuICApXG59XG5cbmZ1bmN0aW9uIEl0ZW0oeyBuYW1lLCBpbmRleCB9KSB7XG4gIGNvbnN0IHsgZWxhc3RpY0NvbGxpc2lvbiB9ID0gdXNlRWxhc3RpY0NvbGxpc2lvbigpXG5cbiAgcmV0dXJuIChcbiAgICA8Q29sbGlzaW9uQm94XG4gICAgICBrZXk9e2luZGV4fVxuICAgICAgY2xhc3NOYW1lPXtzLml0ZW19XG4gICAgICBvbkRyYWdTdG9wPXsobmV3RGlyLCBleHRlcm5hbEZvcmNlcykgPT4ge1xuICAgICAgICBsZXQgbm9ybSA9IG5ld0Rpci5tYXAoKHBvcykgPT4gcG9zICogcG9zKS5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiKVxuICAgICAgICBub3JtID0gTWF0aC5zcXJ0KG5vcm0pXG5cbiAgICAgICAgaWYgKG5vcm0gPT09IDApIHJldHVyblxuICAgICAgICBleHRlcm5hbEZvcmNlcyA9IG5ld0Rpci5tYXAoKHBvcykgPT4gcG9zIC8gbm9ybSlcbiAgICAgIH19XG4gICAgICBpbmRleD17aW5kZXh9XG4gICAgPlxuICAgICAgPGRpdj57bmFtZX08L2Rpdj5cbiAgICA8L0NvbGxpc2lvbkJveD5cbiAgKVxufVxuIl0sIm5hbWVzIjpbInVzZVJlZiIsIlJlYWN0RWxhc3RpY0NvbGxpc2lvbiIsIkNvbGxpc2lvbkJveCIsImluaXRhbENvbmRpdGlvbnNQcmVzZXRzIiwidXBkYXRlUHJlc2V0cyIsInVzZUVsYXN0aWNDb2xsaXNpb24iLCJzIiwiZGF0YSIsIm5hbWUiLCJFeGFtcGxlIiwiZHJhZ1ZlbG9jaXR5Iiwic3RWZWxzIiwic2VjdGlvbiIsImNsYXNzTmFtZSIsImV4YW1wbGUiLCJpbml0aWFsQ29uZGl0aW9ucyIsInJhbmRvbSIsInVwZGF0ZSIsIkRyYWdBbmRHcmF2aXR5IiwibWFwIiwiaW5kZXgiLCJJdGVtIiwiZWxhc3RpY0NvbGxpc2lvbiIsIml0ZW0iLCJvbkRyYWdTdG9wIiwibmV3RGlyIiwiZXh0ZXJuYWxGb3JjZXMiLCJub3JtIiwicG9zIiwicmVkdWNlIiwiYSIsImIiLCJNYXRoIiwic3FydCIsImRpdiJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/(pages)/home/(componentes)/example/index.js\n"));

/***/ })

});