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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Example: function() { return /* binding */ Example; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../packages/react/dist/elastic-collisions-react.mjs */ \"(app-pages-browser)/../packages/react/dist/elastic-collisions-react.mjs\");\n/* harmony import */ var _example_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./example.module.scss */ \"(app-pages-browser)/./app/(pages)/home/(componentes)/example/example.module.scss\");\n/* __next_internal_client_entry_do_not_use__ Example auto */ \nvar _s = $RefreshSig$();\n\n\n\nconst data = [\n    {\n        name: \"Guido\"\n    },\n    {\n        name: \"Franco\"\n    },\n    {\n        name: \"Lea\"\n    },\n    {\n        name: \"Felix\"\n    },\n    {\n        name: \"Cl\\xe9ment\"\n    },\n    {\n        name: \"Fermin\"\n    }\n];\nfunction Example() {\n    _s();\n    const dragVelocity = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);\n    const stVels = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n        className: _example_module_scss__WEBPACK_IMPORTED_MODULE_3__.example,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n            initialConditions: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.initalConditionsPresets.random,\n            update: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.updatePresets.dvdAnimation,\n            children: data.map((param, index)=>{\n                let { name } = param;\n                return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.CollisionBox, {\n                    className: _example_module_scss__WEBPACK_IMPORTED_MODULE_3__.item,\n                    onDragStop: (newDir)=>{\n                        let norm = newDir.map((pos)=>pos * pos).reduce((a, b)=>a + b);\n                        norm = Math.sqrt(norm);\n                        if (norm === 0) return;\n                        dragVelocity.current[index] = newDir.map((pos)=>pos / norm);\n                    },\n                    children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n                        children: name\n                    }, void 0, false, {\n                        fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n                        lineNumber: 42,\n                        columnNumber: 13\n                    }, this)\n                }, index, false, {\n                    fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n                    lineNumber: 31,\n                    columnNumber: 11\n                }, this);\n            })\n        }, void 0, false, {\n            fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n            lineNumber: 26,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n        lineNumber: 25,\n        columnNumber: 5\n    }, this);\n}\n_s(Example, \"dKjxkkiZEGS7IfulonvZq5vI7hs=\");\n_c = Example;\nvar _c;\n$RefreshReg$(_c, \"Example\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = __webpack_module__.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = __webpack_module__.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, __webpack_module__.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                __webpack_module__.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                __webpack_module__.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        __webpack_module__.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    __webpack_module__.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC8ocGFnZXMpL2hvbWUvKGNvbXBvbmVudGVzKS9leGFtcGxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFOEI7QUFLNkM7QUFDdEM7QUFFckMsTUFBTU0sT0FBTztJQUNYO1FBQUVDLE1BQU07SUFBUTtJQUNoQjtRQUFFQSxNQUFNO0lBQVM7SUFDakI7UUFBRUEsTUFBTTtJQUFNO0lBQ2Q7UUFBRUEsTUFBTTtJQUFRO0lBQ2hCO1FBQUVBLE1BQU07SUFBVTtJQUNsQjtRQUFFQSxNQUFNO0lBQVM7Q0FDbEI7QUFFTSxTQUFTQzs7SUFDZCxNQUFNQyxlQUFlVCw2Q0FBTUEsQ0FBQyxFQUFFO0lBQzlCLE1BQU1VLFNBQVNWLDZDQUFNQSxDQUFDLEVBQUU7SUFFeEIscUJBQ0UsOERBQUNXO1FBQVFDLFdBQVdQLHlEQUFTO2tCQUMzQiw0RUFBQ0oseUZBQXFCQTtZQUNwQmEsbUJBQW1CWCxzR0FBdUJBLENBQUNZLE1BQU07WUFDakRDLFFBQVFaLDRGQUFhQSxDQUFDYSxZQUFZO3NCQUVqQ1gsS0FBS1ksR0FBRyxDQUFDLFFBQVdDO29CQUFWLEVBQUVaLElBQUksRUFBRTtxQ0FDakIsOERBQUNMLDJGQUFZQTtvQkFFWFUsV0FBV1Asc0RBQU07b0JBQ2pCZ0IsWUFBWSxDQUFDQzt3QkFDWCxJQUFJQyxPQUFPRCxPQUFPSixHQUFHLENBQUMsQ0FBQ00sTUFBUUEsTUFBTUEsS0FBS0MsTUFBTSxDQUFDLENBQUNDLEdBQUdDLElBQU1ELElBQUlDO3dCQUMvREosT0FBT0ssS0FBS0MsSUFBSSxDQUFDTjt3QkFFakIsSUFBSUEsU0FBUyxHQUFHO3dCQUNoQmQsYUFBYXFCLE9BQU8sQ0FBQ1gsTUFBTSxHQUFHRyxPQUFPSixHQUFHLENBQUMsQ0FBQ00sTUFBUUEsTUFBTUQ7b0JBQzFEOzhCQUVBLDRFQUFDUTtrQ0FBS3hCOzs7Ozs7bUJBVkRZOzs7Ozs7Ozs7Ozs7Ozs7O0FBZ0JqQjtHQTVCZ0JYO0tBQUFBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vX05fRS8uL2FwcC8ocGFnZXMpL2hvbWUvKGNvbXBvbmVudGVzKS9leGFtcGxlL2luZGV4LmpzP2QzZjUiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBjbGllbnQnXG5cbmltcG9ydCB7IHVzZVJlZiB9IGZyb20gJ3JlYWN0J1xuaW1wb3J0IFJlYWN0RWxhc3RpY0NvbGxpc2lvbiwge1xuICBDb2xsaXNpb25Cb3gsXG4gIGluaXRhbENvbmRpdGlvbnNQcmVzZXRzLFxuICB1cGRhdGVQcmVzZXRzLFxufSBmcm9tICcuLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9yZWFjdC9kaXN0L2VsYXN0aWMtY29sbGlzaW9ucy1yZWFjdC5tanMnXG5pbXBvcnQgcyBmcm9tICcuL2V4YW1wbGUubW9kdWxlLnNjc3MnXG5cbmNvbnN0IGRhdGEgPSBbXG4gIHsgbmFtZTogJ0d1aWRvJyB9LFxuICB7IG5hbWU6ICdGcmFuY28nIH0sXG4gIHsgbmFtZTogJ0xlYScgfSxcbiAgeyBuYW1lOiAnRmVsaXgnIH0sXG4gIHsgbmFtZTogJ0Nsw6ltZW50JyB9LFxuICB7IG5hbWU6ICdGZXJtaW4nIH0sXG5dXG5cbmV4cG9ydCBmdW5jdGlvbiBFeGFtcGxlKCkge1xuICBjb25zdCBkcmFnVmVsb2NpdHkgPSB1c2VSZWYoW10pXG4gIGNvbnN0IHN0VmVscyA9IHVzZVJlZihbXSlcblxuICByZXR1cm4gKFxuICAgIDxzZWN0aW9uIGNsYXNzTmFtZT17cy5leGFtcGxlfT5cbiAgICAgIDxSZWFjdEVsYXN0aWNDb2xsaXNpb25cbiAgICAgICAgaW5pdGlhbENvbmRpdGlvbnM9e2luaXRhbENvbmRpdGlvbnNQcmVzZXRzLnJhbmRvbX1cbiAgICAgICAgdXBkYXRlPXt1cGRhdGVQcmVzZXRzLmR2ZEFuaW1hdGlvbn1cbiAgICAgID5cbiAgICAgICAge2RhdGEubWFwKCh7IG5hbWUgfSwgaW5kZXgpID0+IChcbiAgICAgICAgICA8Q29sbGlzaW9uQm94XG4gICAgICAgICAgICBrZXk9e2luZGV4fVxuICAgICAgICAgICAgY2xhc3NOYW1lPXtzLml0ZW19XG4gICAgICAgICAgICBvbkRyYWdTdG9wPXsobmV3RGlyKSA9PiB7XG4gICAgICAgICAgICAgIGxldCBub3JtID0gbmV3RGlyLm1hcCgocG9zKSA9PiBwb3MgKiBwb3MpLnJlZHVjZSgoYSwgYikgPT4gYSArIGIpXG4gICAgICAgICAgICAgIG5vcm0gPSBNYXRoLnNxcnQobm9ybSlcblxuICAgICAgICAgICAgICBpZiAobm9ybSA9PT0gMCkgcmV0dXJuXG4gICAgICAgICAgICAgIGRyYWdWZWxvY2l0eS5jdXJyZW50W2luZGV4XSA9IG5ld0Rpci5tYXAoKHBvcykgPT4gcG9zIC8gbm9ybSlcbiAgICAgICAgICAgIH19XG4gICAgICAgICAgPlxuICAgICAgICAgICAgPGRpdj57bmFtZX08L2Rpdj5cbiAgICAgICAgICA8L0NvbGxpc2lvbkJveD5cbiAgICAgICAgKSl9XG4gICAgICA8L1JlYWN0RWxhc3RpY0NvbGxpc2lvbj5cbiAgICA8L3NlY3Rpb24+XG4gIClcbn1cbiJdLCJuYW1lcyI6WyJ1c2VSZWYiLCJSZWFjdEVsYXN0aWNDb2xsaXNpb24iLCJDb2xsaXNpb25Cb3giLCJpbml0YWxDb25kaXRpb25zUHJlc2V0cyIsInVwZGF0ZVByZXNldHMiLCJzIiwiZGF0YSIsIm5hbWUiLCJFeGFtcGxlIiwiZHJhZ1ZlbG9jaXR5Iiwic3RWZWxzIiwic2VjdGlvbiIsImNsYXNzTmFtZSIsImV4YW1wbGUiLCJpbml0aWFsQ29uZGl0aW9ucyIsInJhbmRvbSIsInVwZGF0ZSIsImR2ZEFuaW1hdGlvbiIsIm1hcCIsImluZGV4IiwiaXRlbSIsIm9uRHJhZ1N0b3AiLCJuZXdEaXIiLCJub3JtIiwicG9zIiwicmVkdWNlIiwiYSIsImIiLCJNYXRoIiwic3FydCIsImN1cnJlbnQiLCJkaXYiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/(pages)/home/(componentes)/example/index.js\n"));

/***/ })

});