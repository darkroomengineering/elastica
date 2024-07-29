"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "vendor-chunks/nanoevents@9.0.0";
exports.ids = ["vendor-chunks/nanoevents@9.0.0"];
exports.modules = {

/***/ "(ssr)/../node_modules/.pnpm/nanoevents@9.0.0/node_modules/nanoevents/index.js":
/*!*******************************************************************************!*\
  !*** ../node_modules/.pnpm/nanoevents@9.0.0/node_modules/nanoevents/index.js ***!
  \*******************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createNanoEvents: () => (/* binding */ createNanoEvents)\n/* harmony export */ });\nlet createNanoEvents = () => ({\n  emit(event, ...args) {\n    for (\n      let i = 0,\n        callbacks = this.events[event] || [],\n        length = callbacks.length;\n      i < length;\n      i++\n    ) {\n      callbacks[i](...args)\n    }\n  },\n  events: {},\n  on(event, cb) {\n    ;(this.events[event] ||= []).push(cb)\n    return () => {\n      this.events[event] = this.events[event]?.filter(i => cb !== i)\n    }\n  }\n})\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi4vbm9kZV9tb2R1bGVzLy5wbnBtL25hbm9ldmVudHNAOS4wLjAvbm9kZV9tb2R1bGVzL25hbm9ldmVudHMvaW5kZXguanMiLCJtYXBwaW5ncyI6Ijs7OztBQUFPO0FBQ1A7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxHQUFHO0FBQ0gsWUFBWTtBQUNaO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL0BkYXJrcm9vbS5lbmdpbmVlcmluZy9zYXR1cy8uLi9ub2RlX21vZHVsZXMvLnBucG0vbmFub2V2ZW50c0A5LjAuMC9ub2RlX21vZHVsZXMvbmFub2V2ZW50cy9pbmRleC5qcz8xMmNhIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBsZXQgY3JlYXRlTmFub0V2ZW50cyA9ICgpID0+ICh7XG4gIGVtaXQoZXZlbnQsIC4uLmFyZ3MpIHtcbiAgICBmb3IgKFxuICAgICAgbGV0IGkgPSAwLFxuICAgICAgICBjYWxsYmFja3MgPSB0aGlzLmV2ZW50c1tldmVudF0gfHwgW10sXG4gICAgICAgIGxlbmd0aCA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICBpIDwgbGVuZ3RoO1xuICAgICAgaSsrXG4gICAgKSB7XG4gICAgICBjYWxsYmFja3NbaV0oLi4uYXJncylcbiAgICB9XG4gIH0sXG4gIGV2ZW50czoge30sXG4gIG9uKGV2ZW50LCBjYikge1xuICAgIDsodGhpcy5ldmVudHNbZXZlbnRdIHx8PSBbXSkucHVzaChjYilcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgdGhpcy5ldmVudHNbZXZlbnRdID0gdGhpcy5ldmVudHNbZXZlbnRdPy5maWx0ZXIoaSA9PiBjYiAhPT0gaSlcbiAgICB9XG4gIH1cbn0pXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(ssr)/../node_modules/.pnpm/nanoevents@9.0.0/node_modules/nanoevents/index.js\n");

/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/nanoevents@9.0.0/node_modules/nanoevents/index.js":
/*!******************************************************************************!*\
  !*** ./node_modules/.pnpm/nanoevents@9.0.0/node_modules/nanoevents/index.js ***!
  \******************************************************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   createNanoEvents: () => (/* binding */ createNanoEvents)\n/* harmony export */ });\nlet createNanoEvents = () => ({\n  emit(event, ...args) {\n    for (\n      let i = 0,\n        callbacks = this.events[event] || [],\n        length = callbacks.length;\n      i < length;\n      i++\n    ) {\n      callbacks[i](...args)\n    }\n  },\n  events: {},\n  on(event, cb) {\n    ;(this.events[event] ||= []).push(cb)\n    return () => {\n      this.events[event] = this.events[event]?.filter(i => cb !== i)\n    }\n  }\n})\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHNzcikvLi9ub2RlX21vZHVsZXMvLnBucG0vbmFub2V2ZW50c0A5LjAuMC9ub2RlX21vZHVsZXMvbmFub2V2ZW50cy9pbmRleC5qcyIsIm1hcHBpbmdzIjoiOzs7O0FBQU87QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLEdBQUc7QUFDSCxZQUFZO0FBQ1o7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQGRhcmtyb29tLmVuZ2luZWVyaW5nL3NhdHVzLy4vbm9kZV9tb2R1bGVzLy5wbnBtL25hbm9ldmVudHNAOS4wLjAvbm9kZV9tb2R1bGVzL25hbm9ldmVudHMvaW5kZXguanM/NTM1OCJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgbGV0IGNyZWF0ZU5hbm9FdmVudHMgPSAoKSA9PiAoe1xuICBlbWl0KGV2ZW50LCAuLi5hcmdzKSB7XG4gICAgZm9yIChcbiAgICAgIGxldCBpID0gMCxcbiAgICAgICAgY2FsbGJhY2tzID0gdGhpcy5ldmVudHNbZXZlbnRdIHx8IFtdLFxuICAgICAgICBsZW5ndGggPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgaSA8IGxlbmd0aDtcbiAgICAgIGkrK1xuICAgICkge1xuICAgICAgY2FsbGJhY2tzW2ldKC4uLmFyZ3MpXG4gICAgfVxuICB9LFxuICBldmVudHM6IHt9LFxuICBvbihldmVudCwgY2IpIHtcbiAgICA7KHRoaXMuZXZlbnRzW2V2ZW50XSB8fD0gW10pLnB1c2goY2IpXG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIHRoaXMuZXZlbnRzW2V2ZW50XSA9IHRoaXMuZXZlbnRzW2V2ZW50XT8uZmlsdGVyKGkgPT4gY2IgIT09IGkpXG4gICAgfVxuICB9XG59KVxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(ssr)/./node_modules/.pnpm/nanoevents@9.0.0/node_modules/nanoevents/index.js\n");

/***/ })

};
;