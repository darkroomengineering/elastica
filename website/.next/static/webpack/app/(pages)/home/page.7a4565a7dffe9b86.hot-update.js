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

eval(__webpack_require__.ts("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   Example: function() { return /* binding */ Example; }\n/* harmony export */ });\n/* harmony import */ var react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react/jsx-dev-runtime */ \"(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/jsx-dev-runtime.js\");\n/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! react */ \"(app-pages-browser)/./node_modules/.pnpm/next@14.2.4_@babel+core@7.24.9_react-dom@18.3.1_react@18.3.1__react@18.3.1_sass@1.77.8/node_modules/next/dist/compiled/react/index.js\");\n/* harmony import */ var _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../../../../../../packages/react/dist/elastic-collisions-react.mjs */ \"(app-pages-browser)/../packages/react/dist/elastic-collisions-react.mjs\");\n/* harmony import */ var _example_module_scss__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./example.module.scss */ \"(app-pages-browser)/./app/(pages)/home/(componentes)/example/example.module.scss\");\n/* __next_internal_client_entry_do_not_use__ Example auto */ \nvar _s = $RefreshSig$();\n\n\n\nconst data = [\n    {\n        name: \"Guido\"\n    },\n    {\n        name: \"Franco\"\n    },\n    {\n        name: \"Lea\"\n    },\n    {\n        name: \"Felix\"\n    },\n    {\n        name: \"Cl\\xe9ment\"\n    },\n    {\n        name: \"Fermin\"\n    }\n];\nfunction Example() {\n    _s();\n    const dragVelocity = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);\n    const stVels = (0,react__WEBPACK_IMPORTED_MODULE_1__.useRef)([]);\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"section\", {\n        className: _example_module_scss__WEBPACK_IMPORTED_MODULE_3__.example,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__[\"default\"], {\n            initialConditions: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.initalConditionsPresets.random,\n            update: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.updatePresets.DragAndGravity,\n            children: data.map((param, index)=>{\n                let { name } = param;\n                return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(Item, {\n                    name: name,\n                    index: index\n                }, index, false, {\n                    fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n                    lineNumber: 32,\n                    columnNumber: 11\n                }, this);\n            })\n        }, void 0, false, {\n            fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n            lineNumber: 27,\n            columnNumber: 7\n        }, this)\n    }, void 0, false, {\n        fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n        lineNumber: 26,\n        columnNumber: 5\n    }, this);\n}\n_s(Example, \"dKjxkkiZEGS7IfulonvZq5vI7hs=\");\n_c = Example;\nfunction Item(param) {\n    let { name, index } = param;\n    return /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(_packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.CollisionBox, {\n        className: _example_module_scss__WEBPACK_IMPORTED_MODULE_3__.item,\n        onDragStop: _packages_react_dist_elastic_collisions_react_mjs__WEBPACK_IMPORTED_MODULE_2__.dragForcePresetsLib.default,\n        index: index,\n        children: /*#__PURE__*/ (0,react_jsx_dev_runtime__WEBPACK_IMPORTED_MODULE_0__.jsxDEV)(\"div\", {\n            children: name\n        }, void 0, false, {\n            fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n            lineNumber: 47,\n            columnNumber: 7\n        }, this)\n    }, index, false, {\n        fileName: \"/Users/Darkroom/tools/elastic-collision/website/app/(pages)/home/(componentes)/example/index.js\",\n        lineNumber: 41,\n        columnNumber: 5\n    }, this);\n}\n_c1 = Item;\nvar _c, _c1;\n$RefreshReg$(_c, \"Example\");\n$RefreshReg$(_c1, \"Item\");\n\n\n;\n    // Wrapped in an IIFE to avoid polluting the global scope\n    ;\n    (function () {\n        var _a, _b;\n        // Legacy CSS implementations will `eval` browser code in a Node.js context\n        // to extract CSS. For backwards compatibility, we need to check we're in a\n        // browser context before continuing.\n        if (typeof self !== 'undefined' &&\n            // AMP / No-JS mode does not inject these helpers:\n            '$RefreshHelpers$' in self) {\n            // @ts-ignore __webpack_module__ is global\n            var currentExports = __webpack_module__.exports;\n            // @ts-ignore __webpack_module__ is global\n            var prevSignature = (_b = (_a = __webpack_module__.hot.data) === null || _a === void 0 ? void 0 : _a.prevSignature) !== null && _b !== void 0 ? _b : null;\n            // This cannot happen in MainTemplate because the exports mismatch between\n            // templating and execution.\n            self.$RefreshHelpers$.registerExportsForReactRefresh(currentExports, __webpack_module__.id);\n            // A module can be accepted automatically based on its exports, e.g. when\n            // it is a Refresh Boundary.\n            if (self.$RefreshHelpers$.isReactRefreshBoundary(currentExports)) {\n                // Save the previous exports signature on update so we can compare the boundary\n                // signatures. We avoid saving exports themselves since it causes memory leaks (https://github.com/vercel/next.js/pull/53797)\n                __webpack_module__.hot.dispose(function (data) {\n                    data.prevSignature =\n                        self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports);\n                });\n                // Unconditionally accept an update to this module, we'll check if it's\n                // still a Refresh Boundary later.\n                // @ts-ignore importMeta is replaced in the loader\n                __webpack_module__.hot.accept();\n                // This field is set when the previous version of this module was a\n                // Refresh Boundary, letting us know we need to check for invalidation or\n                // enqueue an update.\n                if (prevSignature !== null) {\n                    // A boundary can become ineligible if its exports are incompatible\n                    // with the previous exports.\n                    //\n                    // For example, if you add/remove/change exports, we'll want to\n                    // re-execute the importing modules, and force those components to\n                    // re-render. Similarly, if you convert a class component to a\n                    // function, we want to invalidate the boundary.\n                    if (self.$RefreshHelpers$.shouldInvalidateReactRefreshBoundary(prevSignature, self.$RefreshHelpers$.getRefreshBoundarySignature(currentExports))) {\n                        __webpack_module__.hot.invalidate();\n                    }\n                    else {\n                        self.$RefreshHelpers$.scheduleUpdate();\n                    }\n                }\n            }\n            else {\n                // Since we just executed the code for the module, it's possible that the\n                // new exports made it ineligible for being a boundary.\n                // We only care about the case when we were _previously_ a boundary,\n                // because we already accepted this update (accidental side effect).\n                var isNoLongerABoundary = prevSignature !== null;\n                if (isNoLongerABoundary) {\n                    __webpack_module__.hot.invalidate();\n                }\n            }\n        }\n    })();\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGFwcC1wYWdlcy1icm93c2VyKS8uL2FwcC8ocGFnZXMpL2hvbWUvKGNvbXBvbmVudGVzKS9leGFtcGxlL2luZGV4LmpzIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFFOEI7QUFNNkM7QUFDdEM7QUFFckMsTUFBTU8sT0FBTztJQUNYO1FBQUVDLE1BQU07SUFBUTtJQUNoQjtRQUFFQSxNQUFNO0lBQVM7SUFDakI7UUFBRUEsTUFBTTtJQUFNO0lBQ2Q7UUFBRUEsTUFBTTtJQUFRO0lBQ2hCO1FBQUVBLE1BQU07SUFBVTtJQUNsQjtRQUFFQSxNQUFNO0lBQVM7Q0FDbEI7QUFFTSxTQUFTQzs7SUFDZCxNQUFNQyxlQUFlViw2Q0FBTUEsQ0FBQyxFQUFFO0lBQzlCLE1BQU1XLFNBQVNYLDZDQUFNQSxDQUFDLEVBQUU7SUFFeEIscUJBQ0UsOERBQUNZO1FBQVFDLFdBQVdQLHlEQUFTO2tCQUMzQiw0RUFBQ0wseUZBQXFCQTtZQUNwQmMsbUJBQW1CWCxzR0FBdUJBLENBQUNZLE1BQU07WUFDakRDLFFBQVFaLDRGQUFhQSxDQUFDYSxjQUFjO3NCQUVuQ1gsS0FBS1ksR0FBRyxDQUFDLFFBQVdDO29CQUFWLEVBQUVaLElBQUksRUFBRTtxQ0FDakIsOERBQUNhO29CQUFpQmIsTUFBTUE7b0JBQU1ZLE9BQU9BO21CQUExQkE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLckI7R0FoQmdCWDtLQUFBQTtBQWtCaEIsU0FBU1ksS0FBSyxLQUFlO1FBQWYsRUFBRWIsSUFBSSxFQUFFWSxLQUFLLEVBQUUsR0FBZjtJQUNaLHFCQUNFLDhEQUFDbEIsMkZBQVlBO1FBRVhXLFdBQVdQLHNEQUFNO1FBQ2pCaUIsWUFBWXBCLGtHQUFtQkEsQ0FBQ3FCLE9BQU87UUFDdkNKLE9BQU9BO2tCQUVQLDRFQUFDSztzQkFBS2pCOzs7Ozs7T0FMRFk7Ozs7O0FBUVg7TUFYU0MiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9fTl9FLy4vYXBwLyhwYWdlcykvaG9tZS8oY29tcG9uZW50ZXMpL2V4YW1wbGUvaW5kZXguanM/ZDNmNSJdLCJzb3VyY2VzQ29udGVudCI6WyIndXNlIGNsaWVudCdcblxuaW1wb3J0IHsgdXNlUmVmIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgUmVhY3RFbGFzdGljQ29sbGlzaW9uLCB7XG4gIENvbGxpc2lvbkJveCxcbiAgZHJhZ0ZvcmNlUHJlc2V0c0xpYixcbiAgaW5pdGFsQ29uZGl0aW9uc1ByZXNldHMsXG4gIHVwZGF0ZVByZXNldHMsXG59IGZyb20gJy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL3JlYWN0L2Rpc3QvZWxhc3RpYy1jb2xsaXNpb25zLXJlYWN0Lm1qcydcbmltcG9ydCBzIGZyb20gJy4vZXhhbXBsZS5tb2R1bGUuc2NzcydcblxuY29uc3QgZGF0YSA9IFtcbiAgeyBuYW1lOiAnR3VpZG8nIH0sXG4gIHsgbmFtZTogJ0ZyYW5jbycgfSxcbiAgeyBuYW1lOiAnTGVhJyB9LFxuICB7IG5hbWU6ICdGZWxpeCcgfSxcbiAgeyBuYW1lOiAnQ2zDqW1lbnQnIH0sXG4gIHsgbmFtZTogJ0Zlcm1pbicgfSxcbl1cblxuZXhwb3J0IGZ1bmN0aW9uIEV4YW1wbGUoKSB7XG4gIGNvbnN0IGRyYWdWZWxvY2l0eSA9IHVzZVJlZihbXSlcbiAgY29uc3Qgc3RWZWxzID0gdXNlUmVmKFtdKVxuXG4gIHJldHVybiAoXG4gICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtzLmV4YW1wbGV9PlxuICAgICAgPFJlYWN0RWxhc3RpY0NvbGxpc2lvblxuICAgICAgICBpbml0aWFsQ29uZGl0aW9ucz17aW5pdGFsQ29uZGl0aW9uc1ByZXNldHMucmFuZG9tfVxuICAgICAgICB1cGRhdGU9e3VwZGF0ZVByZXNldHMuRHJhZ0FuZEdyYXZpdHl9XG4gICAgICA+XG4gICAgICAgIHtkYXRhLm1hcCgoeyBuYW1lIH0sIGluZGV4KSA9PiAoXG4gICAgICAgICAgPEl0ZW0ga2V5PXtpbmRleH0gbmFtZT17bmFtZX0gaW5kZXg9e2luZGV4fSAvPlxuICAgICAgICApKX1cbiAgICAgIDwvUmVhY3RFbGFzdGljQ29sbGlzaW9uPlxuICAgIDwvc2VjdGlvbj5cbiAgKVxufVxuXG5mdW5jdGlvbiBJdGVtKHsgbmFtZSwgaW5kZXggfSkge1xuICByZXR1cm4gKFxuICAgIDxDb2xsaXNpb25Cb3hcbiAgICAgIGtleT17aW5kZXh9XG4gICAgICBjbGFzc05hbWU9e3MuaXRlbX1cbiAgICAgIG9uRHJhZ1N0b3A9e2RyYWdGb3JjZVByZXNldHNMaWIuZGVmYXVsdH1cbiAgICAgIGluZGV4PXtpbmRleH1cbiAgICA+XG4gICAgICA8ZGl2PntuYW1lfTwvZGl2PlxuICAgIDwvQ29sbGlzaW9uQm94PlxuICApXG59XG4iXSwibmFtZXMiOlsidXNlUmVmIiwiUmVhY3RFbGFzdGljQ29sbGlzaW9uIiwiQ29sbGlzaW9uQm94IiwiZHJhZ0ZvcmNlUHJlc2V0c0xpYiIsImluaXRhbENvbmRpdGlvbnNQcmVzZXRzIiwidXBkYXRlUHJlc2V0cyIsInMiLCJkYXRhIiwibmFtZSIsIkV4YW1wbGUiLCJkcmFnVmVsb2NpdHkiLCJzdFZlbHMiLCJzZWN0aW9uIiwiY2xhc3NOYW1lIiwiZXhhbXBsZSIsImluaXRpYWxDb25kaXRpb25zIiwicmFuZG9tIiwidXBkYXRlIiwiRHJhZ0FuZEdyYXZpdHkiLCJtYXAiLCJpbmRleCIsIkl0ZW0iLCJpdGVtIiwib25EcmFnU3RvcCIsImRlZmF1bHQiLCJkaXYiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(app-pages-browser)/./app/(pages)/home/(componentes)/example/index.js\n"));

/***/ })

});