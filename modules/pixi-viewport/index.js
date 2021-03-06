import "core-js/modules/es.symbol";
import "core-js/modules/es.symbol.description";
import "core-js/modules/es.symbol.iterator";
import "core-js/modules/es.array.includes";
import "core-js/modules/es.array.index-of";
import "core-js/modules/es.array.iterator";
import "core-js/modules/es.array.reverse";
import "core-js/modules/es.array.sort";
import "core-js/modules/es.array.splice";
import "core-js/modules/es.object.assign";
import "core-js/modules/es.object.create";
import "core-js/modules/es.object.define-property";
import "core-js/modules/es.object.get-own-property-descriptor";
import "core-js/modules/es.object.get-prototype-of";
import "core-js/modules/es.object.set-prototype-of";
import "core-js/modules/es.object.to-string";
import "core-js/modules/es.parse-int";
import "core-js/modules/es.reflect.get";
import "core-js/modules/es.regexp.exec";
import "core-js/modules/es.string.includes";
import "core-js/modules/es.string.iterator";
import "core-js/modules/web.dom-collections.iterator";

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

import * as PIXI from 'pixi.js';
import { Rectangle, Point, Container, VERSION } from 'pixi.js';
/**
 * @typedef ViewportTouch
 * @property {number} id
 * @property {PIXI.Point} last
*/

/**
 * handles all input for Viewport
 * @private
 */

var InputManager =
/*#__PURE__*/
function () {
  function InputManager(viewport) {
    _classCallCheck(this, InputManager);

    this.viewport = viewport;
    /**
     * list of active touches on viewport
     * @type {ViewportTouch[]}
     */

    this.touches = [];
    this.addListeners();
  }
  /**
   * add input listeners
   * @private
   */


  _createClass(InputManager, [{
    key: "addListeners",
    value: function addListeners() {
      var _this = this;

      this.viewport.interactive = true;

      if (!this.viewport.forceHitArea) {
        this.viewport.hitArea = new Rectangle(0, 0, this.viewport.worldWidth, this.viewport.worldHeight);
      }

      this.viewport.on('pointerdown', this.down, this);
      this.viewport.on('pointermove', this.move, this);
      this.viewport.on('pointerup', this.up, this);
      this.viewport.on('pointerupoutside', this.up, this);
      this.viewport.on('pointercancel', this.up, this);
      this.viewport.on('pointerout', this.up, this);

      this.wheelFunction = function (e) {
        return _this.handleWheel(e);
      };

      this.viewport.options.divWheel.addEventListener('wheel', this.wheelFunction, {
        passive: this.viewport.options.passiveWheel
      });
      this.isMouseDown = false;
    }
    /**
     * removes all event listeners from viewport
     * (useful for cleanup of wheel when removing viewport)
     */

  }, {
    key: "destroy",
    value: function destroy() {
      this.viewport.options.divWheel.removeEventListener('wheel', this.wheelFunction);
    }
    /**
     * handle down events for viewport
     * @param {PIXI.interaction.InteractionEvent} event
     */

  }, {
    key: "down",
    value: function down(event) {
      if (this.viewport.pause || !this.viewport.worldVisible) {
        return;
      }

      if (event.data.pointerType === 'mouse') {
        this.isMouseDown = true;
      } else if (!this.get(event.data.pointerId)) {
        this.touches.push({
          id: event.data.pointerId,
          last: null
        });
      }

      if (this.count() === 1) {
        this.last = event.data.global.clone(); // clicked event does not fire if viewport is decelerating or bouncing

        var decelerate = this.viewport.plugins.get('decelerate');
        var bounce = this.viewport.plugins.get('bounce');

        if ((!decelerate || !decelerate.isActive()) && (!bounce || !bounce.isActive())) {
          this.clickedAvailable = true;
        } else {
          this.clickedAvailable = false;
        }
      } else {
        this.clickedAvailable = false;
      }

      var stop = this.viewport.plugins.down(event);

      if (stop && this.viewport.options.stopPropagation) {
        event.stopPropagation();
      }
    }
    /**
     * @param {number} change
     * @returns whether change exceeds threshold
     */

  }, {
    key: "checkThreshold",
    value: function checkThreshold(change) {
      if (Math.abs(change) >= this.viewport.threshold) {
        return true;
      }

      return false;
    }
    /**
     * handle move events for viewport
     * @param {PIXI.interaction.InteractionEvent} event
     */

  }, {
    key: "move",
    value: function move(event) {
      if (this.viewport.pause || !this.viewport.worldVisible) {
        return;
      }

      var stop = this.viewport.plugins.move(event);

      if (this.clickedAvailable) {
        var distX = event.data.global.x - this.last.x;
        var distY = event.data.global.y - this.last.y;

        if (this.checkThreshold(distX) || this.checkThreshold(distY)) {
          this.clickedAvailable = false;
        }
      }

      if (stop && this.viewport.options.stopPropagation) {
        event.stopPropagation();
      }
    }
    /**
     * handle up events for viewport
     * @param {PIXI.interaction.InteractionEvent} event
     */

  }, {
    key: "up",
    value: function up(event) {
      if (this.viewport.pause || !this.viewport.worldVisible) {
        return;
      }

      if (event.data.pointerType === 'mouse') {
        this.isMouseDown = false;
      }

      if (event.data.pointerType !== 'mouse') {
        this.remove(event.data.pointerId);
      }

      var stop = this.viewport.plugins.up(event);

      if (this.clickedAvailable && this.count() === 0) {
        this.viewport.emit('clicked', {
          screen: this.last,
          world: this.viewport.toWorld(this.last),
          viewport: this
        });
        this.clickedAvailable = false;
      }

      if (stop && this.viewport.options.stopPropagation) {
        event.stopPropagation();
      }
    }
    /**
     * gets pointer position if this.interaction is set
     * @param {WheelEvent} event
     * @return {PIXI.Point}
     */

  }, {
    key: "getPointerPosition",
    value: function getPointerPosition(event) {
      var point = new Point();

      if (this.viewport.options.interaction) {
        this.viewport.options.interaction.mapPositionToPoint(point, event.clientX, event.clientY);
      } else {
        point.x = event.clientX;
        point.y = event.clientY;
      }

      return point;
    }
    /**
     * handle wheel events
     * @param {WheelEvent} event
     */

  }, {
    key: "handleWheel",
    value: function handleWheel(event) {
      if (this.viewport.pause || !this.viewport.worldVisible) {
        return;
      } // only handle wheel events where the mouse is over the viewport


      var point = this.viewport.toLocal(this.getPointerPosition(event));

      if (this.viewport.left <= point.x && point.x <= this.viewport.right && this.viewport.top <= point.y && point.y <= this.viewport.bottom) {
        var stop = this.viewport.plugins.wheel(event);

        if (stop) {
          event.preventDefault();
        }
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      this.touches = [];
      this.isMouseDown = false;
    }
    /**
     * get touch by id
     * @param {number} id
     * @return {ViewportTouch}
     */

  }, {
    key: "get",
    value: function get(id) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.touches[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var touch = _step.value;

          if (touch.id === id) {
            return touch;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return null;
    }
    /**
     * remove touch by number
     * @param {number} id
     */

  }, {
    key: "remove",
    value: function remove(id) {
      for (var i = 0; i < this.touches.length; i++) {
        if (this.touches[i].id === id) {
          this.touches.splice(i, 1);
          return;
        }
      }
    }
    /**
     * @returns {number} count of mouse/touch pointers that are down on the viewport
     */

  }, {
    key: "count",
    value: function count() {
      return (this.isMouseDown ? 1 : 0) + this.touches.length;
    }
  }]);

  return InputManager;
}();

var PLUGIN_ORDER = ['drag', 'pinch', 'wheel', 'follow', 'mouse-edges', 'decelerate', 'bounce', 'snap-zoom', 'clamp-zoom', 'snap', 'clamp'];
/**
 * Use this to access current plugins or add user-defined plugins
 */

var PluginManager =
/*#__PURE__*/
function () {
  /**
   * instantiated by Viewport
   * @param {Viewport} viewport
   */
  function PluginManager(viewport) {
    _classCallCheck(this, PluginManager);

    this.viewport = viewport;
    this.list = [];
    this.plugins = {};
  }
  /**
   * Inserts a named plugin or a user plugin into the viewport
   * default plugin order: 'drag', 'pinch', 'wheel', 'follow', 'mouse-edges', 'decelerate', 'bounce', 'snap-zoom', 'clamp-zoom', 'snap', 'clamp'
   * @param {string} name of plugin
   * @param {Plugin} plugin - instantiated Plugin class
   * @param {number} index to insert userPlugin (otherwise inserts it at the end)
   */


  _createClass(PluginManager, [{
    key: "add",
    value: function add(name, plugin) {
      var index = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : PLUGIN_ORDER.length;
      this.plugins[name] = plugin;
      var current = PLUGIN_ORDER.indexOf(name);

      if (current !== -1) {
        PLUGIN_ORDER.splice(current, 1);
      }

      PLUGIN_ORDER.splice(index, 0, name);
      this.sort();
    }
    /**
     * get plugin
     * @param {string} name of plugin
     * @return {Plugin}
     */

  }, {
    key: "get",
    value: function get(name) {
      return this.plugins[name];
    }
    /**
     * update all active plugins
     * @private
     * @param {number} elapsed type in milliseconds since last update
     */

  }, {
    key: "update",
    value: function update(elapsed) {
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = this.list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var plugin = _step2.value;
          plugin.update(elapsed);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }
    }
    /**
     * resize all active plugins
     * @private
     */

  }, {
    key: "resize",
    value: function resize() {
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = this.list[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var plugin = _step3.value;
          plugin.resize();
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
    /**
     * clamps and resets bounce and decelerate (as needed) after manually moving viewport
     */

  }, {
    key: "reset",
    value: function reset() {
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.list[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var plugin = _step4.value;
          plugin.reset();
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
            _iterator4["return"]();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }
    }
    /**
     * removes installed plugin
     * @param {string} name of plugin (e.g., 'drag', 'pinch')
     */

  }, {
    key: "remove",
    value: function remove(name) {
      if (this.plugins[name]) {
        this.plugins[name] = null;
        this.viewport.emit(name + '-remove');
        this.sort();
      }
    }
    /**
     * pause plugin
     * @param {string} name of plugin (e.g., 'drag', 'pinch')
     */

  }, {
    key: "pause",
    value: function pause(name) {
      if (this.plugins[name]) {
        this.plugins[name].pause();
      }
    }
    /**
     * resume plugin
     * @param {string} name of plugin (e.g., 'drag', 'pinch')
     */

  }, {
    key: "resume",
    value: function resume(name) {
      if (this.plugins[name]) {
        this.plugins[name].resume();
      }
    }
    /**
     * sort plugins according to PLUGIN_ORDER
     * @private
     */

  }, {
    key: "sort",
    value: function sort() {
      this.list = [];
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = PLUGIN_ORDER[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var plugin = _step5.value;

          if (this.plugins[plugin]) {
            this.list.push(this.plugins[plugin]);
          }
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
            _iterator5["return"]();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }
    }
    /**
     * handle down for all plugins
     * @private
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "down",
    value: function down(event) {
      var stop = false;
      var _iteratorNormalCompletion6 = true;
      var _didIteratorError6 = false;
      var _iteratorError6 = undefined;

      try {
        for (var _iterator6 = this.list[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
          var plugin = _step6.value;

          if (plugin.down(event)) {
            stop = true;
          }
        }
      } catch (err) {
        _didIteratorError6 = true;
        _iteratorError6 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
            _iterator6["return"]();
          }
        } finally {
          if (_didIteratorError6) {
            throw _iteratorError6;
          }
        }
      }

      return stop;
    }
    /**
     * handle move for all plugins
     * @private
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "move",
    value: function move(event) {
      var stop = false;
      var _iteratorNormalCompletion7 = true;
      var _didIteratorError7 = false;
      var _iteratorError7 = undefined;

      try {
        for (var _iterator7 = this.viewport.plugins.list[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
          var plugin = _step7.value;

          if (plugin.move(event)) {
            stop = true;
          }
        }
      } catch (err) {
        _didIteratorError7 = true;
        _iteratorError7 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion7 && _iterator7["return"] != null) {
            _iterator7["return"]();
          }
        } finally {
          if (_didIteratorError7) {
            throw _iteratorError7;
          }
        }
      }

      return stop;
    }
    /**
     * handle up for all plugins
     * @private
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "up",
    value: function up(event) {
      var stop = false;
      var _iteratorNormalCompletion8 = true;
      var _didIteratorError8 = false;
      var _iteratorError8 = undefined;

      try {
        for (var _iterator8 = this.list[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
          var plugin = _step8.value;

          if (plugin.up(event)) {
            stop = true;
          }
        }
      } catch (err) {
        _didIteratorError8 = true;
        _iteratorError8 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion8 && _iterator8["return"] != null) {
            _iterator8["return"]();
          }
        } finally {
          if (_didIteratorError8) {
            throw _iteratorError8;
          }
        }
      }

      return stop;
    }
    /**
     * handle wheel event for all plugins
     * @private
     * @param {WheelEvent} event
     * @returns {boolean}
     */

  }, {
    key: "wheel",
    value: function wheel(e) {
      var result = false;
      var _iteratorNormalCompletion9 = true;
      var _didIteratorError9 = false;
      var _iteratorError9 = undefined;

      try {
        for (var _iterator9 = this.list[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
          var plugin = _step9.value;

          if (plugin.wheel(e)) {
            result = true;
          }
        }
      } catch (err) {
        _didIteratorError9 = true;
        _iteratorError9 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion9 && _iterator9["return"] != null) {
            _iterator9["return"]();
          }
        } finally {
          if (_didIteratorError9) {
            throw _iteratorError9;
          }
        }
      }

      return result;
    }
  }]);

  return PluginManager;
}();
/**
 * derive this class to create user-defined plugins
 */


var Plugin =
/*#__PURE__*/
function () {
  /**
   * @param {Viewport} parent
   */
  function Plugin(parent) {
    _classCallCheck(this, Plugin);

    this.parent = parent;
    this.paused = false;
  }
  /** called when plugin is removed */


  _createClass(Plugin, [{
    key: "destroy",
    value: function destroy() {}
    /**
     * handler for pointerdown PIXI event
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "down",
    value: function down() {
      return false;
    }
    /**
     * handler for pointermove PIXI event
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "move",
    value: function move() {
      return false;
    }
    /**
     * handler for pointerup PIXI event
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "up",
    value: function up() {
      return false;
    }
    /**
     * handler for wheel event on div
     * @param {WheelEvent} event
     * @returns {boolean}
     */

  }, {
    key: "wheel",
    value: function wheel() {
      return false;
    }
    /**
     * called on each tick
     * @param {number} elapsed time in millisecond since last update
     */

  }, {
    key: "update",
    value: function update() {}
    /** called when the viewport is resized */

  }, {
    key: "resize",
    value: function resize() {}
    /** called when the viewport is manually moved */

  }, {
    key: "reset",
    value: function reset() {}
    /** pause the plugin */

  }, {
    key: "pause",
    value: function pause() {
      this.paused = true;
    }
    /** un-pause the plugin */

  }, {
    key: "resume",
    value: function resume() {
      this.paused = false;
    }
  }]);

  return Plugin;
}();
/**
 * @typedef {object} LastDrag
 * @property {number} x
 * @property {number} y
 * @property {PIXI.Point} parent
 */

/**
 * @typedef DragOptions
 * @property {string} [direction=all] direction to drag
 * @property {boolean} [wheel=true] use wheel to scroll in y direction(unless wheel plugin is active)
 * @property {number} [wheelScroll=1] number of pixels to scroll with each wheel spin
 * @property {boolean} [reverse] reverse the direction of the wheel scroll
 * @property {(boolean|string)} [clampWheel=false] clamp wheel(to avoid weird bounce with mouse wheel)
 * @property {string} [underflow=center] where to place world if too small for screen
 * @property {number} [factor=1] factor to multiply drag to increase the speed of movement
 * @property {string} [mouseButtons=all] changes which mouse buttons trigger drag, use: 'all', 'left', right' 'middle', or some combination, like, 'middle-right'; you may want to set viewport.options.disableOnContextMenu if you want to use right-click dragging
 * @property {string[]} [keyToPress=null] array containing {@link key|https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code} codes of keys that can be pressed for the drag to be triggered, e.g.: ['ShiftLeft', 'ShiftRight'}.
 * @property {boolean} [ignoreKeyToPressOnTouch=false] ignore keyToPress for touch events
 */


var dragOptions = {
  direction: 'all',
  wheel: true,
  wheelScroll: 1,
  reverse: false,
  clampWheel: false,
  underflow: 'center',
  factor: 1,
  mouseButtons: 'all',
  keyToPress: null,
  ignoreKeyToPressOnTouch: false
};
/**
 * @private
 */

var Drag =
/*#__PURE__*/
function (_Plugin) {
  _inherits(Drag, _Plugin);

  /**
   * @param {Viewport} parent
   * @param {DragOptions} options
   */
  function Drag(parent) {
    var _this2;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Drag);

    _this2 = _possibleConstructorReturn(this, _getPrototypeOf(Drag).call(this, parent));
    _this2.options = Object.assign({}, dragOptions, options);
    _this2.moved = false;
    _this2.reverse = _this2.options.reverse ? 1 : -1;
    _this2.xDirection = !_this2.options.direction || _this2.options.direction === 'all' || _this2.options.direction === 'x';
    _this2.yDirection = !_this2.options.direction || _this2.options.direction === 'all' || _this2.options.direction === 'y';
    _this2.keyIsPressed = false;

    _this2.parseUnderflow();

    _this2.mouseButtons(_this2.options.mouseButtons);

    if (_this2.options.keyToPress) {
      _this2.handleKeyPresses(_this2.options.keyToPress);
    }

    return _this2;
  }
  /**
   * Handles keypress events and set the keyIsPressed boolean accordingly
   * @param {array} codes - key codes that can be used to trigger drag event
   */


  _createClass(Drag, [{
    key: "handleKeyPresses",
    value: function handleKeyPresses(codes) {
      var _this3 = this;

      parent.addEventListener("keydown", function (e) {
        if (codes.includes(e.code)) _this3.keyIsPressed = true;
      });
      parent.addEventListener("keyup", function (e) {
        if (codes.includes(e.code)) _this3.keyIsPressed = false;
      });
    }
    /**
     * initialize mousebuttons array
     * @param {string} buttons
     */

  }, {
    key: "mouseButtons",
    value: function mouseButtons(buttons) {
      if (!buttons || buttons === 'all') {
        this.mouse = [true, true, true];
      } else {
        this.mouse = [buttons.indexOf('left') === -1 ? false : true, buttons.indexOf('middle') === -1 ? false : true, buttons.indexOf('right') === -1 ? false : true];
      }
    }
  }, {
    key: "parseUnderflow",
    value: function parseUnderflow() {
      var clamp = this.options.underflow.toLowerCase();

      if (clamp === 'center') {
        this.underflowX = 0;
        this.underflowY = 0;
      } else {
        this.underflowX = clamp.indexOf('left') !== -1 ? -1 : clamp.indexOf('right') !== -1 ? 1 : 0;
        this.underflowY = clamp.indexOf('top') !== -1 ? -1 : clamp.indexOf('bottom') !== -1 ? 1 : 0;
      }
    }
    /**
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "checkButtons",
    value: function checkButtons(event) {
      var isMouse = event.data.pointerType === 'mouse';
      var count = this.parent.input.count();

      if (count === 1 || count > 1 && !this.parent.plugins.get('pinch')) {
        if (!isMouse || this.mouse[event.data.button]) {
          return true;
        }
      }

      return false;
    }
    /**
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "checkKeyPress",
    value: function checkKeyPress(event) {
      if (!this.options.keyToPress || this.keyIsPressed || this.options.ignoreKeyToPressOnTouch && event.data.pointerType === 'touch') return true;
      return false;
    }
    /**
     * @param {PIXI.interaction.InteractionEvent} event
     */

  }, {
    key: "down",
    value: function down(event) {
      if (this.paused) {
        return;
      }

      if (this.checkButtons(event) && this.checkKeyPress(event)) {
        this.last = {
          x: event.data.global.x,
          y: event.data.global.y
        };
        this.current = event.data.pointerId;
        return true;
      } else {
        this.last = null;
      }
    }
  }, {
    key: "move",

    /**
     * @param {PIXI.interaction.InteractionEvent} event
     */
    value: function move(event) {
      if (this.paused) {
        return;
      }

      if (this.last && this.current === event.data.pointerId) {
        var x = event.data.global.x;
        var y = event.data.global.y;
        var count = this.parent.input.count();

        if (count === 1 || count > 1 && !this.parent.plugins.get('pinch')) {
          var distX = x - this.last.x;
          var distY = y - this.last.y;

          if (this.moved || this.xDirection && this.parent.input.checkThreshold(distX) || this.yDirection && this.parent.input.checkThreshold(distY)) {
            var newPoint = {
              x: x,
              y: y
            };

            if (this.xDirection) {
              this.parent.x += (newPoint.x - this.last.x) * this.options.factor;
            }

            if (this.yDirection) {
              this.parent.y += (newPoint.y - this.last.y) * this.options.factor;
            }

            this.last = newPoint;

            if (!this.moved) {
              this.parent.emit('drag-start', {
                screen: new Point(this.last.x, this.last.y),
                world: this.parent.toWorld(new Point(this.last.x, this.last.y)),
                viewport: this.parent
              });
            }

            this.moved = true;
            this.parent.emit('moved', {
              viewport: this.parent,
              type: 'drag'
            });
            return true;
          }
        } else {
          this.moved = false;
        }
      }
    }
    /**
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "up",
    value: function up() {
      if (this.paused) {
        return;
      }

      var touches = this.parent.input.touches;

      if (touches.length === 1) {
        var pointer = touches[0];

        if (pointer.last) {
          this.last = {
            x: pointer.last.x,
            y: pointer.last.y
          };
          this.current = pointer.id;
        }

        this.moved = false;
        return true;
      } else if (this.last) {
        if (this.moved) {
          var screen = new Point(this.last.x, this.last.y);
          this.parent.emit('drag-end', {
            screen: screen,
            world: this.parent.toWorld(screen),
            viewport: this.parent
          });
          this.last = null;
          this.moved = false;
          return true;
        }
      }
    }
    /**
     * @param {WheelEvent} event
     * @returns {boolean}
     */

  }, {
    key: "wheel",
    value: function wheel(event) {
      if (this.paused) {
        return;
      }

      if (this.options.wheel) {
        var wheel = this.parent.plugins.get('wheel');

        if (!wheel) {
          if (this.xDirection) {
            this.parent.x += event.deltaX * this.options.wheelScroll * this.reverse;
          }

          if (this.yDirection) {
            this.parent.y += event.deltaY * this.options.wheelScroll * this.reverse;
          }

          if (this.options.clampWheel) {
            this.clamp();
          }

          this.parent.emit('wheel-scroll', this.parent);
          this.parent.emit('moved', {
            viewport: this.parent,
            type: 'wheel'
          });

          if (!this.parent.options.passiveWheel) {
            event.preventDefault();
          }

          return true;
        }
      }
    }
  }, {
    key: "resume",
    value: function resume() {
      this.last = null;
      this.paused = false;
    }
  }, {
    key: "clamp",
    value: function clamp() {
      var decelerate = this.parent.plugins.get('decelerate') || {};

      if (this.options.clampWheel !== 'y') {
        if (this.parent.screenWorldWidth < this.parent.screenWidth) {
          switch (this.underflowX) {
            case -1:
              this.parent.x = 0;
              break;

            case 1:
              this.parent.x = this.parent.screenWidth - this.parent.screenWorldWidth;
              break;

            default:
              this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
          }
        } else {
          if (this.parent.left < 0) {
            this.parent.x = 0;
            decelerate.x = 0;
          } else if (this.parent.right > this.parent.worldWidth) {
            this.parent.x = -this.parent.worldWidth * this.parent.scale.x + this.parent.screenWidth;
            decelerate.x = 0;
          }
        }
      }

      if (this.options.clampWheel !== 'x') {
        if (this.parent.screenWorldHeight < this.parent.screenHeight) {
          switch (this.underflowY) {
            case -1:
              this.parent.y = 0;
              break;

            case 1:
              this.parent.y = this.parent.screenHeight - this.parent.screenWorldHeight;
              break;

            default:
              this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
          }
        } else {
          if (this.parent.top < 0) {
            this.parent.y = 0;
            decelerate.y = 0;
          }

          if (this.parent.bottom > this.parent.worldHeight) {
            this.parent.y = -this.parent.worldHeight * this.parent.scale.y + this.parent.screenHeight;
            decelerate.y = 0;
          }
        }
      }
    }
  }, {
    key: "active",
    get: function get() {
      return this.moved;
    }
  }]);

  return Drag;
}(Plugin);
/**
 * @typedef {object} PinchOptions
 * @property {boolean} [noDrag] disable two-finger dragging
 * @property {number} [percent=1.0] percent to modify pinch speed
 * @property {PIXI.Point} [center] place this point at center during zoom instead of center of two fingers
 */


var pinchOptions = {
  noDrag: false,
  percent: 1.0,
  center: null
};

var Pinch =
/*#__PURE__*/
function (_Plugin2) {
  _inherits(Pinch, _Plugin2);

  /**
   * @private
   * @param {Viewport} parent
   * @param {PinchOptions} [options]
   */
  function Pinch(parent) {
    var _this4;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Pinch);

    _this4 = _possibleConstructorReturn(this, _getPrototypeOf(Pinch).call(this, parent));
    _this4.options = Object.assign({}, pinchOptions, options);
    return _this4;
  }

  _createClass(Pinch, [{
    key: "down",
    value: function down() {
      if (this.parent.input.count() >= 2) {
        this.active = true;
        return true;
      }
    }
  }, {
    key: "move",
    value: function move(e) {
      if (this.paused || !this.active) {
        return;
      }

      var x = e.data.global.x;
      var y = e.data.global.y;
      var pointers = this.parent.input.touches;

      if (pointers.length >= 2) {
        var first = pointers[0];
        var second = pointers[1];
        var last = first.last && second.last ? Math.sqrt(Math.pow(second.last.x - first.last.x, 2) + Math.pow(second.last.y - first.last.y, 2)) : null;

        if (first.id === e.data.pointerId) {
          first.last = {
            x: x,
            y: y,
            data: e.data
          };
        } else if (second.id === e.data.pointerId) {
          second.last = {
            x: x,
            y: y,
            data: e.data
          };
        }

        if (last) {
          var oldPoint;
          var point = {
            x: first.last.x + (second.last.x - first.last.x) / 2,
            y: first.last.y + (second.last.y - first.last.y) / 2
          };

          if (!this.options.center) {
            oldPoint = this.parent.toLocal(point);
          }

          var dist = Math.sqrt(Math.pow(second.last.x - first.last.x, 2) + Math.pow(second.last.y - first.last.y, 2));
          var change = (dist - last) / this.parent.screenWidth * this.parent.scale.x * this.options.percent;
          this.parent.scale.x += change;
          this.parent.scale.y += change;
          this.parent.emit('zoomed', {
            viewport: this.parent,
            type: 'pinch'
          });
          var clamp = this.parent.plugins.get('clamp-zoom');

          if (clamp) {
            clamp.clamp();
          }

          if (this.options.center) {
            this.parent.moveCenter(this.options.center);
          } else {
            var newPoint = this.parent.toGlobal(oldPoint);
            this.parent.x += point.x - newPoint.x;
            this.parent.y += point.y - newPoint.y;
            this.parent.emit('moved', {
              viewport: this.parent,
              type: 'pinch'
            });
          }

          if (!this.options.noDrag && this.lastCenter) {
            this.parent.x += point.x - this.lastCenter.x;
            this.parent.y += point.y - this.lastCenter.y;
            this.parent.emit('moved', {
              viewport: this.parent,
              type: 'pinch'
            });
          }

          this.lastCenter = point;
          this.moved = true;
        } else {
          if (!this.pinching) {
            this.parent.emit('pinch-start', this.parent);
            this.pinching = true;
          }
        }

        return true;
      }
    }
  }, {
    key: "up",
    value: function up() {
      if (this.pinching) {
        if (this.parent.input.touches.length <= 1) {
          this.active = false;
          this.lastCenter = null;
          this.pinching = false;
          this.moved = false;
          this.parent.emit('pinch-end', this.parent);
          return true;
        }
      }
    }
  }]);

  return Pinch;
}(Plugin);
/**
 * @typedef ClampOptions
 * @property {(number|boolean)} [left=false] clamp left; true = 0
 * @property {(number|boolean)} [right=false] clamp right; true = viewport.worldWidth
 * @property {(number|boolean)} [top=false] clamp top; true = 0
 * @property {(number|boolean)} [bottom=false] clamp bottom; true = viewport.worldHeight
 * @property {string} [direction] (all, x, or y) using clamps of [0, viewport.worldWidth/viewport.worldHeight]; replaces left/right/top/bottom if set
 * @property {string} [underflow=center] where to place world if too small for screen (e.g., top-right, center, none, bottomleft)
 */


var clampOptions = {
  left: false,
  right: false,
  top: false,
  bottom: false,
  direction: null,
  underflow: 'center'
};

var Clamp =
/*#__PURE__*/
function (_Plugin3) {
  _inherits(Clamp, _Plugin3);

  /**
   * @private
   * @param {Viewport} parent
   * @param {ClampOptions} [options]
   */
  function Clamp(parent) {
    var _this5;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Clamp);

    _this5 = _possibleConstructorReturn(this, _getPrototypeOf(Clamp).call(this, parent));
    _this5.options = Object.assign({}, clampOptions, options);

    if (_this5.options.direction) {
      _this5.options.left = _this5.options.direction === 'x' || _this5.options.direction === 'all' ? true : null;
      _this5.options.right = _this5.options.direction === 'x' || _this5.options.direction === 'all' ? true : null;
      _this5.options.top = _this5.options.direction === 'y' || _this5.options.direction === 'all' ? true : null;
      _this5.options.bottom = _this5.options.direction === 'y' || _this5.options.direction === 'all' ? true : null;
    }

    _this5.parseUnderflow();

    _this5.last = {
      x: null,
      y: null,
      scaleX: null,
      scaleY: null
    };

    _this5.update();

    return _this5;
  }

  _createClass(Clamp, [{
    key: "parseUnderflow",
    value: function parseUnderflow() {
      var clamp = this.options.underflow.toLowerCase();

      if (clamp === 'none') {
        this.noUnderflow = true;
      } else if (clamp === 'center') {
        this.underflowX = this.underflowY = 0;
        this.noUnderflow = false;
      } else {
        this.underflowX = clamp.indexOf('left') !== -1 ? -1 : clamp.indexOf('right') !== -1 ? 1 : 0;
        this.underflowY = clamp.indexOf('top') !== -1 ? -1 : clamp.indexOf('bottom') !== -1 ? 1 : 0;
        this.noUnderflow = false;
      }
    }
    /**
     * handle move events
     * @param {PIXI.interaction.InteractionEvent} event
     * @returns {boolean}
     */

  }, {
    key: "move",
    value: function move() {
      this.update();
      return false;
    }
  }, {
    key: "update",
    value: function update() {
      if (this.paused) {
        return;
      } // only clamp on change


      if (this.parent.x === this.last.x && this.parent.y === this.last.y && this.parent.scale.x === this.last.scaleX && this.parent.scale.y === this.last.scaleY) {
        return;
      }

      var original = {
        x: this.parent.x,
        y: this.parent.y
      };
      var decelerate = this.parent.plugins['decelerate'] || {};

      if (this.options.left !== null || this.options.right !== null) {
        var moved = false;

        if (this.parent.screenWorldWidth < this.parent.screenWidth) {
          if (!this.noUnderflow) {
            switch (this.underflowX) {
              case -1:
                if (this.parent.x !== 0) {
                  this.parent.x = 0;
                  moved = true;
                }

                break;

              case 1:
                if (this.parent.x !== this.parent.screenWidth - this.parent.screenWorldWidth) {
                  this.parent.x = this.parent.screenWidth - this.parent.screenWorldWidth;
                  moved = true;
                }

                break;

              default:
                if (this.parent.x !== (this.parent.screenWidth - this.parent.screenWorldWidth) / 2) {
                  this.parent.x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
                  moved = true;
                }

            }
          }
        } else {
          if (this.options.left !== null) {
            if (this.parent.left < (this.options.left === true ? 0 : this.options.left)) {
              this.parent.x = -(this.options.left === true ? 0 : this.options.left) * this.parent.scale.x;
              decelerate.x = 0;
              moved = true;
            }
          }

          if (this.options.right !== null) {
            if (this.parent.right > (this.options.right === true ? this.parent.worldWidth : this.options.right)) {
              this.parent.x = -(this.options.right === true ? this.parent.worldWidth : this.options.right) * this.parent.scale.x + this.parent.screenWidth;
              decelerate.x = 0;
              moved = true;
            }
          }
        }

        if (moved) {
          this.parent.emit('moved', {
            viewport: this.parent,
            original: original,
            type: 'clamp-x'
          });
        }
      }

      if (this.options.top !== null || this.options.bottom !== null) {
        var _moved = false;

        if (this.parent.screenWorldHeight < this.parent.screenHeight) {
          if (!this.noUnderflow) {
            switch (this.underflowY) {
              case -1:
                if (this.parent.y !== 0) {
                  this.parent.y = 0;
                  _moved = true;
                }

                break;

              case 1:
                if (this.parent.y !== this.parent.screenHeight - this.parent.screenWorldHeight) {
                  this.parent.y = this.parent.screenHeight - this.parent.screenWorldHeight;
                  _moved = true;
                }

                break;

              default:
                if (this.parent.y !== (this.parent.screenHeight - this.parent.screenWorldHeight) / 2) {
                  this.parent.y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
                  _moved = true;
                }

            }
          }
        } else {
          if (this.options.top !== null) {
            if (this.parent.top < (this.options.top === true ? 0 : this.options.top)) {
              this.parent.y = -(this.options.top === true ? 0 : this.options.top) * this.parent.scale.y;
              decelerate.y = 0;
              _moved = true;
            }
          }

          if (this.options.bottom !== null) {
            if (this.parent.bottom > (this.options.bottom === true ? this.parent.worldHeight : this.options.bottom)) {
              this.parent.y = -(this.options.bottom === true ? this.parent.worldHeight : this.options.bottom) * this.parent.scale.y + this.parent.screenHeight;
              decelerate.y = 0;
              _moved = true;
            }
          }
        }

        if (_moved) {
          this.parent.emit('moved', {
            viewport: this.parent,
            original: original,
            type: 'clamp-y'
          });
        }
      }

      this.last.x = this.parent.x;
      this.last.y = this.parent.y;
      this.last.scaleX = this.parent.scale.x;
      this.last.scaleY = this.parent.scale.y;
    }
  }, {
    key: "reset",
    value: function reset() {
      this.update();
    }
  }]);

  return Clamp;
}(Plugin);
/**
 * @typedef {object} ClampZoomOptions
 * @property {number} [minWidth] minimum width
 * @property {number} [minHeight] minimum height
 * @property {number} [maxWidth] maximum width
 * @property {number} [maxHeight] maximum height
 */


var clampZoomOptions = {
  minWidth: null,
  minHeight: null,
  maxWidth: null,
  maxHeight: null
};

var ClampZoom =
/*#__PURE__*/
function (_Plugin4) {
  _inherits(ClampZoom, _Plugin4);

  /**
   * @private
   * @param {Viewport} parent
   * @param {ClampZoomOptions} [options]
   */
  function ClampZoom(parent) {
    var _this6;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, ClampZoom);

    _this6 = _possibleConstructorReturn(this, _getPrototypeOf(ClampZoom).call(this, parent));
    _this6.options = Object.assign({}, clampZoomOptions, options);

    _this6.clamp();

    return _this6;
  }

  _createClass(ClampZoom, [{
    key: "resize",
    value: function resize() {
      this.clamp();
    }
  }, {
    key: "clamp",
    value: function clamp() {
      if (this.paused) {
        return;
      }

      var width = this.parent.worldScreenWidth;
      var height = this.parent.worldScreenHeight;

      if (this.options.minWidth !== null && width < this.options.minWidth) {
        var original = this.parent.scale.x;
        this.parent.fitWidth(this.options.minWidth, false, false, true);
        this.parent.scale.y *= this.parent.scale.x / original;
        width = this.parent.worldScreenWidth;
        height = this.parent.worldScreenHeight;
        this.parent.emit('zoomed', {
          viewport: this.parent,
          type: 'clamp-zoom'
        });
      }

      if (this.options.maxWidth !== null && width > this.options.maxWidth) {
        var _original = this.parent.scale.x;
        this.parent.fitWidth(this.options.maxWidth, false, false, true);
        this.parent.scale.y *= this.parent.scale.x / _original;
        width = this.parent.worldScreenWidth;
        height = this.parent.worldScreenHeight;
        this.parent.emit('zoomed', {
          viewport: this.parent,
          type: 'clamp-zoom'
        });
      }

      if (this.options.minHeight !== null && height < this.options.minHeight) {
        var _original2 = this.parent.scale.y;
        this.parent.fitHeight(this.options.minHeight, false, false, true);
        this.parent.scale.x *= this.parent.scale.y / _original2;
        width = this.parent.worldScreenWidth;
        height = this.parent.worldScreenHeight;
        this.parent.emit('zoomed', {
          viewport: this.parent,
          type: 'clamp-zoom'
        });
      }

      if (this.options.maxHeight !== null && height > this.options.maxHeight) {
        var _original3 = this.parent.scale.y;
        this.parent.fitHeight(this.options.maxHeight, false, false, true);
        this.parent.scale.x *= this.parent.scale.y / _original3;
        this.parent.emit('zoomed', {
          viewport: this.parent,
          type: 'clamp-zoom'
        });
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      this.clamp();
    }
  }]);

  return ClampZoom;
}(Plugin);
/**
 * @typedef {object} DecelerateOptions
 * @property {number} [friction=0.95] percent to decelerate after movement
 * @property {number} [bounce=0.8] percent to decelerate when past boundaries (only applicable when viewport.bounce() is active)
 * @property {number} [minSpeed=0.01] minimum velocity before stopping/reversing acceleration
 */


var decelerateOptions = {
  friction: 0.95,
  bounce: 0.8,
  minSpeed: 0.01
};

var Decelerate =
/*#__PURE__*/
function (_Plugin5) {
  _inherits(Decelerate, _Plugin5);

  /**
   * @private
   * @param {Viewport} parent
   * @param {DecelerateOptions} [options]
   */
  function Decelerate(parent) {
    var _this7;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Decelerate);

    _this7 = _possibleConstructorReturn(this, _getPrototypeOf(Decelerate).call(this, parent));
    _this7.options = Object.assign({}, decelerateOptions, options);
    _this7.saved = [];

    _this7.reset();

    _this7.parent.on('moved', function (data) {
      return _this7.moved(data);
    });

    return _this7;
  }

  _createClass(Decelerate, [{
    key: "destroy",
    value: function destroy() {
      this.parent;
    }
  }, {
    key: "down",
    value: function down() {
      this.saved = [];
      this.x = this.y = false;
    }
  }, {
    key: "isActive",
    value: function isActive() {
      return this.x || this.y;
    }
  }, {
    key: "move",
    value: function move() {
      if (this.paused) {
        return;
      }

      var count = this.parent.input.count();

      if (count === 1 || count > 1 && !this.parent.plugins.get('pinch')) {
        this.saved.push({
          x: this.parent.x,
          y: this.parent.y,
          time: performance.now()
        });

        if (this.saved.length > 60) {
          this.saved.splice(0, 30);
        }
      }
    }
  }, {
    key: "moved",
    value: function moved(data) {
      if (this.saved.length) {
        var last = this.saved[this.saved.length - 1];

        if (data.type === 'clamp-x') {
          if (last.x === data.original.x) {
            last.x = this.parent.x;
          }
        } else if (data.type === 'clamp-y') {
          if (last.y === data.original.y) {
            last.y = this.parent.y;
          }
        }
      }
    }
  }, {
    key: "up",
    value: function up() {
      if (this.parent.input.count() === 0 && this.saved.length) {
        var now = performance.now();
        var _iteratorNormalCompletion10 = true;
        var _didIteratorError10 = false;
        var _iteratorError10 = undefined;

        try {
          for (var _iterator10 = this.saved[Symbol.iterator](), _step10; !(_iteratorNormalCompletion10 = (_step10 = _iterator10.next()).done); _iteratorNormalCompletion10 = true) {
            var save = _step10.value;

            if (save.time >= now - 100) {
              var time = now - save.time;
              this.x = (this.parent.x - save.x) / time;
              this.y = (this.parent.y - save.y) / time;
              this.percentChangeX = this.percentChangeY = this.options.friction;
              break;
            }
          }
        } catch (err) {
          _didIteratorError10 = true;
          _iteratorError10 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion10 && _iterator10["return"] != null) {
              _iterator10["return"]();
            }
          } finally {
            if (_didIteratorError10) {
              throw _iteratorError10;
            }
          }
        }
      }
    }
    /**
     * manually activate plugin
     * @param {object} options
     * @param {number} [options.x]
     * @param {number} [options.y]
     */

  }, {
    key: "activate",
    value: function activate(options) {
      options = options || {};

      if (typeof options.x !== 'undefined') {
        this.x = options.x;
        this.percentChangeX = this.options.friction;
      }

      if (typeof options.y !== 'undefined') {
        this.y = options.y;
        this.percentChangeY = this.options.friction;
      }
    }
  }, {
    key: "update",
    value: function update(elapsed) {
      if (this.paused) {
        return;
      }

      var moved;

      if (this.x) {
        this.parent.x += this.x * elapsed;
        this.x *= this.percentChangeX;

        if (Math.abs(this.x) < this.options.minSpeed) {
          this.x = 0;
        }

        moved = true;
      }

      if (this.y) {
        this.parent.y += this.y * elapsed;
        this.y *= this.percentChangeY;

        if (Math.abs(this.y) < this.options.minSpeed) {
          this.y = 0;
        }

        moved = true;
      }

      if (moved) {
        this.parent.emit('moved', {
          viewport: this.parent,
          type: 'decelerate'
        });
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      this.x = this.y = null;
    }
  }]);

  return Decelerate;
}(Plugin);

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
  return module = {
    exports: {}
  }, fn(module, module.exports), module.exports;
}

var penner = createCommonjsModule(function (module, exports) {
  /*
  	Copyright © 2001 Robert Penner
  	All rights reserved.
  
  	Redistribution and use in source and binary forms, with or without modification, 
  	are permitted provided that the following conditions are met:
  
  	Redistributions of source code must retain the above copyright notice, this list of 
  	conditions and the following disclaimer.
  	Redistributions in binary form must reproduce the above copyright notice, this list 
  	of conditions and the following disclaimer in the documentation and/or other materials 
  	provided with the distribution.
  
  	Neither the name of the author nor the names of contributors may be used to endorse 
  	or promote products derived from this software without specific prior written permission.
  
  	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY 
  	EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
  	MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE
  	COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
  	EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE
  	GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED 
  	AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
  	NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED 
  	OF THE POSSIBILITY OF SUCH DAMAGE.
   */
  (function () {
    var penner, umd;

    umd = function umd(factory) {
      {
        return module.exports = factory;
      }
    };

    penner = {
      linear: function linear(t, b, c, d) {
        return c * t / d + b;
      },
      easeInQuad: function easeInQuad(t, b, c, d) {
        return c * (t /= d) * t + b;
      },
      easeOutQuad: function easeOutQuad(t, b, c, d) {
        return -c * (t /= d) * (t - 2) + b;
      },
      easeInOutQuad: function easeInOutQuad(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * t * t + b;
        } else {
          return -c / 2 * (--t * (t - 2) - 1) + b;
        }
      },
      easeInCubic: function easeInCubic(t, b, c, d) {
        return c * (t /= d) * t * t + b;
      },
      easeOutCubic: function easeOutCubic(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t + 1) + b;
      },
      easeInOutCubic: function easeInOutCubic(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * t * t * t + b;
        } else {
          return c / 2 * ((t -= 2) * t * t + 2) + b;
        }
      },
      easeInQuart: function easeInQuart(t, b, c, d) {
        return c * (t /= d) * t * t * t + b;
      },
      easeOutQuart: function easeOutQuart(t, b, c, d) {
        return -c * ((t = t / d - 1) * t * t * t - 1) + b;
      },
      easeInOutQuart: function easeInOutQuart(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * t * t * t * t + b;
        } else {
          return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
        }
      },
      easeInQuint: function easeInQuint(t, b, c, d) {
        return c * (t /= d) * t * t * t * t + b;
      },
      easeOutQuint: function easeOutQuint(t, b, c, d) {
        return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
      },
      easeInOutQuint: function easeInOutQuint(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * t * t * t * t * t + b;
        } else {
          return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        }
      },
      easeInSine: function easeInSine(t, b, c, d) {
        return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
      },
      easeOutSine: function easeOutSine(t, b, c, d) {
        return c * Math.sin(t / d * (Math.PI / 2)) + b;
      },
      easeInOutSine: function easeInOutSine(t, b, c, d) {
        return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
      },
      easeInExpo: function easeInExpo(t, b, c, d) {
        if (t === 0) {
          return b;
        } else {
          return c * Math.pow(2, 10 * (t / d - 1)) + b;
        }
      },
      easeOutExpo: function easeOutExpo(t, b, c, d) {
        if (t === d) {
          return b + c;
        } else {
          return c * (-Math.pow(2, -10 * t / d) + 1) + b;
        }
      },
      easeInOutExpo: function easeInOutExpo(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
        } else {
          return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
        }
      },
      easeInCirc: function easeInCirc(t, b, c, d) {
        return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
      },
      easeOutCirc: function easeOutCirc(t, b, c, d) {
        return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
      },
      easeInOutCirc: function easeInOutCirc(t, b, c, d) {
        if ((t /= d / 2) < 1) {
          return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
        } else {
          return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
        }
      },
      easeInElastic: function easeInElastic(t, b, c, d) {
        var a, p, s;
        s = 1.70158;
        p = 0;
        a = c;
        if (t === 0) ;else if ((t /= d) === 1) ;

        if (!p) {
          p = d * .3;
        }

        if (a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }

        return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
      },
      easeOutElastic: function easeOutElastic(t, b, c, d) {
        var a, p, s;
        s = 1.70158;
        p = 0;
        a = c;
        if (t === 0) ;else if ((t /= d) === 1) ;

        if (!p) {
          p = d * .3;
        }

        if (a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }

        return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
      },
      easeInOutElastic: function easeInOutElastic(t, b, c, d) {
        var a, p, s;
        s = 1.70158;
        p = 0;
        a = c;
        if (t === 0) ;else if ((t /= d / 2) === 2) ;

        if (!p) {
          p = d * (.3 * 1.5);
        }

        if (a < Math.abs(c)) {
          a = c;
          s = p / 4;
        } else {
          s = p / (2 * Math.PI) * Math.asin(c / a);
        }

        if (t < 1) {
          return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
        } else {
          return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
        }
      },
      easeInBack: function easeInBack(t, b, c, d, s) {
        if (s === void 0) {
          s = 1.70158;
        }

        return c * (t /= d) * t * ((s + 1) * t - s) + b;
      },
      easeOutBack: function easeOutBack(t, b, c, d, s) {
        if (s === void 0) {
          s = 1.70158;
        }

        return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
      },
      easeInOutBack: function easeInOutBack(t, b, c, d, s) {
        if (s === void 0) {
          s = 1.70158;
        }

        if ((t /= d / 2) < 1) {
          return c / 2 * (t * t * (((s *= 1.525) + 1) * t - s)) + b;
        } else {
          return c / 2 * ((t -= 2) * t * (((s *= 1.525) + 1) * t + s) + 2) + b;
        }
      },
      easeInBounce: function easeInBounce(t, b, c, d) {
        var v;
        v = penner.easeOutBounce(d - t, 0, c, d);
        return c - v + b;
      },
      easeOutBounce: function easeOutBounce(t, b, c, d) {
        if ((t /= d) < 1 / 2.75) {
          return c * (7.5625 * t * t) + b;
        } else if (t < 2 / 2.75) {
          return c * (7.5625 * (t -= 1.5 / 2.75) * t + .75) + b;
        } else if (t < 2.5 / 2.75) {
          return c * (7.5625 * (t -= 2.25 / 2.75) * t + .9375) + b;
        } else {
          return c * (7.5625 * (t -= 2.625 / 2.75) * t + .984375) + b;
        }
      },
      easeInOutBounce: function easeInOutBounce(t, b, c, d) {
        var v;

        if (t < d / 2) {
          v = penner.easeInBounce(t * 2, 0, c, d);
          return v * .5 + b;
        } else {
          v = penner.easeOutBounce(t * 2 - d, 0, c, d);
          return v * .5 + c * .5 + b;
        }
      }
    };
    umd(penner);
  }).call(commonjsGlobal);
});
/**
 * returns correct Penner equation using string or Function
 * @param {(function|string)} [ease]
 * @param {defaults} default penner equation to use if none is provided
 */

function ease(ease, defaults) {
  if (!ease) {
    return penner[defaults];
  } else if (typeof ease === 'function') {
    return ease;
  } else if (typeof ease === 'string') {
    return penner[ease];
  }
}
/**
 * @typedef {options} BounceOptions
 * @property {string} [sides=all] all, horizontal, vertical, or combination of top, bottom, right, left (e.g., 'top-bottom-right')
 * @property {number} [friction=0.5] friction to apply to decelerate if active
 * @property {number} [time=150] time in ms to finish bounce
 * @property {object} [bounceBox] use this bounceBox instead of (0, 0, viewport.worldWidth, viewport.worldHeight)
 * @property {number} [bounceBox.x=0]
 * @property {number} [bounceBox.y=0]
 * @property {number} [bounceBox.width=viewport.worldWidth]
 * @property {number} [bounceBox.height=viewport.worldHeight]
 * @property {string|function} [ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
 * @property {string} [underflow=center] (top/bottom/center and left/right/center, or center) where to place world if too small for screen
 */


var bounceOptions = {
  sides: 'all',
  friction: 0.5,
  time: 150,
  ease: 'easeInOutSine',
  underflow: 'center',
  bounceBox: null
};

var Bounce =
/*#__PURE__*/
function (_Plugin6) {
  _inherits(Bounce, _Plugin6);

  /**
   * @private
   * @param {Viewport} parent
   * @param {BounceOptions} [options]
   * @fires bounce-start-x
   * @fires bounce.end-x
   * @fires bounce-start-y
   * @fires bounce-end-y
   */
  function Bounce(parent) {
    var _this8;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Bounce);

    _this8 = _possibleConstructorReturn(this, _getPrototypeOf(Bounce).call(this, parent));
    _this8.options = Object.assign({}, bounceOptions, options);
    _this8.ease = ease(_this8.options.ease, 'easeInOutSine');

    if (_this8.options.sides) {
      if (_this8.options.sides === 'all') {
        _this8.top = _this8.bottom = _this8.left = _this8.right = true;
      } else if (_this8.options.sides === 'horizontal') {
        _this8.right = _this8.left = true;
      } else if (_this8.options.sides === 'vertical') {
        _this8.top = _this8.bottom = true;
      } else {
        _this8.top = _this8.options.sides.indexOf('top') !== -1;
        _this8.bottom = _this8.options.sides.indexOf('bottom') !== -1;
        _this8.left = _this8.options.sides.indexOf('left') !== -1;
        _this8.right = _this8.options.sides.indexOf('right') !== -1;
      }
    }

    _this8.parseUnderflow();

    _this8.last = {};

    _this8.reset();

    return _this8;
  }

  _createClass(Bounce, [{
    key: "parseUnderflow",
    value: function parseUnderflow() {
      var clamp = this.options.underflow.toLowerCase();

      if (clamp === 'center') {
        this.underflowX = 0;
        this.underflowY = 0;
      } else {
        this.underflowX = clamp.indexOf('left') !== -1 ? -1 : clamp.indexOf('right') !== -1 ? 1 : 0;
        this.underflowY = clamp.indexOf('top') !== -1 ? -1 : clamp.indexOf('bottom') !== -1 ? 1 : 0;
      }
    }
  }, {
    key: "isActive",
    value: function isActive() {
      return this.toX !== null || this.toY !== null;
    }
  }, {
    key: "down",
    value: function down() {
      this.toX = this.toY = null;
    }
  }, {
    key: "up",
    value: function up() {
      this.bounce();
    }
  }, {
    key: "update",
    value: function update(elapsed) {
      if (this.paused) {
        return;
      }

      this.bounce();

      if (this.toX) {
        var toX = this.toX;
        toX.time += elapsed;
        this.parent.emit('moved', {
          viewport: this.parent,
          type: 'bounce-x'
        });

        if (toX.time >= this.options.time) {
          this.parent.x = toX.end;
          this.toX = null;
          this.parent.emit('bounce-x-end', this.parent);
        } else {
          this.parent.x = this.ease(toX.time, toX.start, toX.delta, this.options.time);
        }
      }

      if (this.toY) {
        var toY = this.toY;
        toY.time += elapsed;
        this.parent.emit('moved', {
          viewport: this.parent,
          type: 'bounce-y'
        });

        if (toY.time >= this.options.time) {
          this.parent.y = toY.end;
          this.toY = null;
          this.parent.emit('bounce-y-end', this.parent);
        } else {
          this.parent.y = this.ease(toY.time, toY.start, toY.delta, this.options.time);
        }
      }
    }
  }, {
    key: "calcUnderflowX",
    value: function calcUnderflowX() {
      var x;

      switch (this.underflowX) {
        case -1:
          x = 0;
          break;

        case 1:
          x = this.parent.screenWidth - this.parent.screenWorldWidth;
          break;

        default:
          x = (this.parent.screenWidth - this.parent.screenWorldWidth) / 2;
      }

      return x;
    }
  }, {
    key: "calcUnderflowY",
    value: function calcUnderflowY() {
      var y;

      switch (this.underflowY) {
        case -1:
          y = 0;
          break;

        case 1:
          y = this.parent.screenHeight - this.parent.screenWorldHeight;
          break;

        default:
          y = (this.parent.screenHeight - this.parent.screenWorldHeight) / 2;
      }

      return y;
    }
  }, {
    key: "oob",
    value: function oob() {
      var box = this.options.bounceBox;

      if (box) {
        var x1 = typeof box.x === 'undefined' ? 0 : box.x;
        var y1 = typeof box.y === 'undefined' ? 0 : box.y;
        var width = typeof box.width === 'undefined' ? this.parent.worldWidth : box.width;
        var height = typeof box.height === 'undefined' ? this.parent.worldHeight : box.height;
        return {
          left: this.parent.left < x1,
          right: this.parent.right > width,
          top: this.parent.top < y1,
          bottom: this.parent.bottom > height,
          topLeft: new Point(x1 * this.parent.scale.x, y1 * this.parent.scale.y),
          bottomRight: new Point(width * this.parent.scale.x - this.parent.screenWidth, height * this.parent.scale.y - this.parent.screenHeight)
        };
      }

      return {
        left: this.parent.left < 0,
        right: this.parent.right > this.parent.worldWidth,
        top: this.parent.top < 0,
        bottom: this.parent.bottom > this.parent.worldHeight,
        topLeft: new Point(0, 0),
        bottomRight: new Point(this.parent.worldWidth * this.parent.scale.x - this.parent.screenWidth, this.parent.worldHeight * this.parent.scale.y - this.parent.screenHeight)
      };
    }
  }, {
    key: "bounce",
    value: function bounce() {
      if (this.paused) {
        return;
      }

      var oob;
      var decelerate = this.parent.plugins.get('decelerate');

      if (decelerate && (decelerate.x || decelerate.y)) {
        if (decelerate.x && decelerate.percentChangeX === decelerate.options.friction || decelerate.y && decelerate.percentChangeY === decelerate.options.friction) {
          oob = this.oob();

          if (oob.left && this.left || oob.right && this.right) {
            decelerate.percentChangeX = this.options.friction;
          }

          if (oob.top && this.top || oob.bottom && this.bottom) {
            decelerate.percentChangeY = this.options.friction;
          }
        }
      }

      var drag = this.parent.plugins.get('drag') || {};
      var pinch = this.parent.plugins.get('pinch') || {};
      decelerate = decelerate || {};

      if (!drag.active && !pinch.active && (!this.toX || !this.toY) && (!decelerate.x || !decelerate.y)) {
        oob = oob || this.oob();
        var topLeft = oob.topLeft;
        var bottomRight = oob.bottomRight;

        if (!this.toX && !decelerate.x) {
          var x = null;

          if (oob.left && this.left) {
            x = this.parent.screenWorldWidth < this.parent.screenWidth ? this.calcUnderflowX() : -topLeft.x;
          } else if (oob.right && this.right) {
            x = this.parent.screenWorldWidth < this.parent.screenWidth ? this.calcUnderflowX() : -bottomRight.x;
          }

          if (x !== null && this.parent.x !== x) {
            this.toX = {
              time: 0,
              start: this.parent.x,
              delta: x - this.parent.x,
              end: x
            };
            this.parent.emit('bounce-x-start', this.parent);
          }
        }

        if (!this.toY && !decelerate.y) {
          var y = null;

          if (oob.top && this.top) {
            y = this.parent.screenWorldHeight < this.parent.screenHeight ? this.calcUnderflowY() : -topLeft.y;
          } else if (oob.bottom && this.bottom) {
            y = this.parent.screenWorldHeight < this.parent.screenHeight ? this.calcUnderflowY() : -bottomRight.y;
          }

          if (y !== null && this.parent.y !== y) {
            this.toY = {
              time: 0,
              start: this.parent.y,
              delta: y - this.parent.y,
              end: y
            };
            this.parent.emit('bounce-y-start', this.parent);
          }
        }
      }
    }
  }, {
    key: "reset",
    value: function reset() {
      this.toX = this.toY = null;
      this.bounce();
    }
  }]);

  return Bounce;
}(Plugin);
/**
 * @typedef SnapOptions
 * @property {boolean} [topLeft] snap to the top-left of viewport instead of center
 * @property {number} [friction=0.8] friction/frame to apply if decelerate is active
 * @property {number} [time=1000]
 * @property {string|function} [ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
 * @property {boolean} [interrupt=true] pause snapping with any user input on the viewport
 * @property {boolean} [removeOnComplete] removes this plugin after snapping is complete
 * @property {boolean} [removeOnInterrupt] removes this plugin if interrupted by any user input
 * @property {boolean} [forceStart] starts the snap immediately regardless of whether the viewport is at the desired location
 */


var snapOptions = {
  topLeft: false,
  friction: 0.8,
  time: 1000,
  ease: 'easeInOutSine',
  interrupt: true,
  removeOnComplete: false,
  removeOnInterrupt: false,
  forceStart: false
};

var Snap =
/*#__PURE__*/
function (_Plugin7) {
  _inherits(Snap, _Plugin7);

  /**
   * @private
   * @param {Viewport} parent
   * @param {number} x
   * @param {number} y
   * @param {SnapOptions} [options]
   * @event snap-start(Viewport) emitted each time a snap animation starts
   * @event snap-restart(Viewport) emitted each time a snap resets because of a change in viewport size
   * @event snap-end(Viewport) emitted each time snap reaches its target
   * @event snap-remove(Viewport) emitted if snap plugin is removed
   */
  function Snap(parent, x, y) {
    var _this9;

    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    _classCallCheck(this, Snap);

    _this9 = _possibleConstructorReturn(this, _getPrototypeOf(Snap).call(this, parent));
    _this9.options = Object.assign({}, snapOptions, options);
    _this9.ease = ease(options.ease, 'easeInOutSine');
    _this9.x = x;
    _this9.y = y;

    if (_this9.options.forceStart) {
      _this9.snapStart();
    }

    return _this9;
  }

  _createClass(Snap, [{
    key: "snapStart",
    value: function snapStart() {
      this.percent = 0;
      this.snapping = {
        time: 0
      };
      var current = this.options.topLeft ? this.parent.corner : this.parent.center;
      this.deltaX = this.x - current.x;
      this.deltaY = this.y - current.y;
      this.startX = current.x;
      this.startY = current.y;
      this.parent.emit('snap-start', this.parent);
    }
  }, {
    key: "wheel",
    value: function wheel() {
      if (this.options.removeOnInterrupt) {
        this.parent.plugins.remove('snap');
      }
    }
  }, {
    key: "down",
    value: function down() {
      if (this.options.removeOnInterrupt) {
        this.parent.plugins.remove('snap');
      } else if (this.options.interrupt) {
        this.snapping = null;
      }
    }
  }, {
    key: "up",
    value: function up() {
      if (this.parent.input.count() === 0) {
        var decelerate = this.parent.plugins.get('decelerate');

        if (decelerate && (decelerate.x || decelerate.y)) {
          decelerate.percentChangeX = decelerate.percentChangeY = this.options.friction;
        }
      }
    }
  }, {
    key: "update",
    value: function update(elapsed) {
      if (this.paused) {
        return;
      }

      if (this.options.interrupt && this.parent.input.count() !== 0) {
        return;
      }

      if (!this.snapping) {
        var current = this.options.topLeft ? this.parent.corner : this.parent.center;

        if (current.x !== this.x || current.y !== this.y) {
          this.snapStart();
        }
      } else {
        var snapping = this.snapping;
        snapping.time += elapsed;
        var finished, x, y;

        if (snapping.time > this.options.time) {
          finished = true;
          x = this.startX + this.deltaX;
          y = this.startY + this.deltaY;
        } else {
          var percent = this.ease(snapping.time, 0, 1, this.options.time);
          x = this.startX + this.deltaX * percent;
          y = this.startY + this.deltaY * percent;
        }

        if (this.options.topLeft) {
          this.parent.moveCorner(x, y);
        } else {
          this.parent.moveCenter(x, y);
        }

        this.parent.emit('moved', {
          viewport: this.parent,
          type: 'snap'
        });

        if (finished) {
          if (this.options.removeOnComplete) {
            this.parent.plugins.remove('snap');
          }

          this.parent.emit('snap-end', this.parent);
          this.snapping = null;
        }
      }
    }
  }]);

  return Snap;
}(Plugin);
/**
 * @typedef {Object} SnapZoomOptions
 * @property {number} [width=0] the desired width to snap (to maintain aspect ratio, choose only width or height)
 * @property {number} [height=0] the desired height to snap (to maintain aspect ratio, choose only width or height)
 * @property {number} [time=1000] time for snapping in ms
 * @property {(string|function)} [ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
 * @property {PIXI.Point} [center] place this point at center during zoom instead of center of the viewport
 * @property {boolean} [interrupt=true] pause snapping with any user input on the viewport
 * @property {boolean} [removeOnComplete] removes this plugin after snapping is complete
 * @property {boolean} [removeOnInterrupt] removes this plugin if interrupted by any user input
 * @property {boolean} [forceStart] starts the snap immediately regardless of whether the viewport is at the desired zoom
 * @property {boolean} [noMove] zoom but do not move
 */


var snapZoomOptions = {
  width: 0,
  height: 0,
  time: 1000,
  ease: 'easeInOutSine',
  center: null,
  interrupt: true,
  removeOnComplete: false,
  removeOnInterrupts: false,
  forceStart: false,
  noMove: false
};

var SnapZoom =
/*#__PURE__*/
function (_Plugin8) {
  _inherits(SnapZoom, _Plugin8);

  /**
   * @param {Viewport} parent
   * @param {SnapZoomOptions} options
   * @event snap-zoom-start(Viewport) emitted each time a fit animation starts
   * @event snap-zoom-end(Viewport) emitted each time fit reaches its target
   * @event snap-zoom-end(Viewport) emitted each time fit reaches its target
   */
  function SnapZoom(parent) {
    var _this10;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, SnapZoom);

    _this10 = _possibleConstructorReturn(this, _getPrototypeOf(SnapZoom).call(this, parent));
    _this10.options = Object.assign({}, snapZoomOptions, options);
    _this10.ease = ease(_this10.options.ease);

    if (_this10.options.width > 0) {
      _this10.xScale = parent.screenWidth / _this10.options.width;
    }

    if (_this10.options.height > 0) {
      _this10.yScale = parent.screenHeight / _this10.options.height;
    }

    _this10.xIndependent = _this10.xScale ? true : false;
    _this10.yIndependent = _this10.yScale ? true : false;
    _this10.xScale = _this10.xIndependent ? _this10.xScale : _this10.yScale;
    _this10.yScale = _this10.yIndependent ? _this10.yScale : _this10.xScale;

    if (_this10.options.time === 0) {
      parent.container.scale.x = _this10.xScale;
      parent.container.scale.y = _this10.yScale;

      if (_this10.options.removeOnComplete) {
        _this10.parent.plugins.remove('snap-zoom');
      }
    } else if (options.forceStart) {
      _this10.createSnapping();
    }

    return _this10;
  }

  _createClass(SnapZoom, [{
    key: "createSnapping",
    value: function createSnapping() {
      var scale = this.parent.scale;
      this.snapping = {
        time: 0,
        startX: scale.x,
        startY: scale.y,
        deltaX: this.xScale - scale.x,
        deltaY: this.yScale - scale.y
      };
      this.parent.emit('snap-zoom-start', this.parent);
    }
  }, {
    key: "resize",
    value: function resize() {
      this.snapping = null;

      if (this.options.width > 0) {
        this.xScale = this.parent.screenWidth / this.options.width;
      }

      if (this.options.height > 0) {
        this.yScale = this.parent.screenHeight / this.options.height;
      }

      this.xScale = this.xIndependent ? this.xScale : this.yScale;
      this.yScale = this.yIndependent ? this.yScale : this.xScale;
    }
  }, {
    key: "wheel",
    value: function wheel() {
      if (this.options.removeOnInterrupt) {
        this.parent.plugins.remove('snap-zoom');
      }
    }
  }, {
    key: "down",
    value: function down() {
      if (this.options.removeOnInterrupt) {
        this.parent.plugins.remove('snap-zoom');
      } else if (this.options.interrupt) {
        this.snapping = null;
      }
    }
  }, {
    key: "update",
    value: function update(elapsed) {
      if (this.paused) {
        return;
      }

      if (this.options.interrupt && this.parent.input.count() !== 0) {
        return;
      }

      var oldCenter;

      if (!this.options.center && !this.options.noMove) {
        oldCenter = this.parent.center;
      }

      if (!this.snapping) {
        if (this.parent.scale.x !== this.xScale || this.parent.scale.y !== this.yScale) {
          this.createSnapping();
        }
      } else if (this.snapping) {
        var snapping = this.snapping;
        snapping.time += elapsed;

        if (snapping.time >= this.options.time) {
          this.parent.scale.set(this.xScale, this.yScale);

          if (this.options.removeOnComplete) {
            this.parent.plugins.remove('snap-zoom');
          }

          this.parent.emit('snap-zoom-end', this.parent);
          this.snapping = null;
        } else {
          var _snapping = this.snapping;
          this.parent.scale.x = this.ease(_snapping.time, _snapping.startX, _snapping.deltaX, this.options.time);
          this.parent.scale.y = this.ease(_snapping.time, _snapping.startY, _snapping.deltaY, this.options.time);
        }

        var clamp = this.parent.plugins.get('clamp-zoom');

        if (clamp) {
          clamp.clamp();
        }

        if (!this.options.noMove) {
          if (!this.options.center) {
            this.parent.moveCenter(oldCenter);
          } else {
            this.parent.moveCenter(this.options.center);
          }
        }
      }
    }
  }, {
    key: "resume",
    value: function resume() {
      this.snapping = null;

      _get(_getPrototypeOf(SnapZoom.prototype), "resume", this).call(this);
    }
  }]);

  return SnapZoom;
}(Plugin);
/**
 * @typedef {object} FollowOptions
 * @property {number} [speed=0] to follow in pixels/frame (0=teleport to location)
 * @property {number} [acceleration] set acceleration to accelerate and decelerate at this rate; speed cannot be 0 to use acceleration
 * @property {number} [radius] radius (in world coordinates) of center circle where movement is allowed without moving the viewport
 */


var followOptions = {
  speed: 0,
  acceleration: null,
  radius: null
};

var Follow =
/*#__PURE__*/
function (_Plugin9) {
  _inherits(Follow, _Plugin9);

  /**
   * @private
   * @param {Viewport} parent
   * @param {PIXI.DisplayObject} target to follow
   * @param {FollowOptions} [options]
   */
  function Follow(parent, target) {
    var _this11;

    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, Follow);

    _this11 = _possibleConstructorReturn(this, _getPrototypeOf(Follow).call(this, parent));
    _this11.target = target;
    _this11.options = Object.assign({}, followOptions, options);
    _this11.velocity = {
      x: 0,
      y: 0
    };
    return _this11;
  }

  _createClass(Follow, [{
    key: "update",
    value: function update(elapsed) {
      if (this.paused) {
        return;
      }

      var center = this.parent.center;
      var toX = this.target.x,
          toY = this.target.y;

      if (this.options.radius) {
        var distance = Math.sqrt(Math.pow(this.target.y - center.y, 2) + Math.pow(this.target.x - center.x, 2));

        if (distance > this.options.radius) {
          var angle = Math.atan2(this.target.y - center.y, this.target.x - center.x);
          toX = this.target.x - Math.cos(angle) * this.options.radius;
          toY = this.target.y - Math.sin(angle) * this.options.radius;
        } else {
          return;
        }
      }

      var deltaX = toX - center.x;
      var deltaY = toY - center.y;

      if (deltaX || deltaY) {
        if (this.options.speed) {
          if (this.options.acceleration) {
            var _angle = Math.atan2(toY - center.y, toX - center.x);

            var _distance = Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));

            if (_distance) {
              var decelerationDistance = (Math.pow(this.velocity.x, 2) + Math.pow(this.velocity.y, 2)) / (2 * this.options.acceleration);

              if (_distance > decelerationDistance) {
                this.velocity = {
                  x: Math.min(this.velocity.x + this.options.acceleration * elapsed, this.options.speed),
                  y: Math.min(this.velocity.y + this.options.acceleration * elapsed, this.options.speed)
                };
              } else {
                this.velocity = {
                  x: Math.max(this.velocity.x - this.options.acceleration * this.options.speed, 0),
                  y: Math.max(this.velocity.y - this.options.acceleration * this.options.speed, 0)
                };
              }

              var changeX = Math.cos(_angle) * this.velocity.x;
              var changeY = Math.sin(_angle) * this.velocity.y;
              var x = Math.abs(changeX) > Math.abs(deltaX) ? toX : center.x + changeX;
              var y = Math.abs(changeY) > Math.abs(deltaY) ? toY : center.y + changeY;
              this.parent.moveCenter(x, y);
              this.parent.emit('moved', {
                viewport: this.parent,
                type: 'follow'
              });
            }
          } else {
            var _angle2 = Math.atan2(toY - center.y, toX - center.x);

            var _changeX = Math.cos(_angle2) * this.options.speed;

            var _changeY = Math.sin(_angle2) * this.options.speed;

            var _x = Math.abs(_changeX) > Math.abs(deltaX) ? toX : center.x + _changeX;

            var _y = Math.abs(_changeY) > Math.abs(deltaY) ? toY : center.y + _changeY;

            this.parent.moveCenter(_x, _y);
            this.parent.emit('moved', {
              viewport: this.parent,
              type: 'follow'
            });
          }
        } else {
          this.parent.moveCenter(toX, toY);
          this.parent.emit('moved', {
            viewport: this.parent,
            type: 'follow'
          });
        }
      }
    }
  }]);

  return Follow;
}(Plugin);
/**
 * @typedef WheelOptions
 * @property {number} [percent=0.1] percent to scroll with each spin
 * @property {number} [smooth] smooth the zooming by providing the number of frames to zoom between wheel spins
 * @property {boolean} [interrupt=true] stop smoothing with any user input on the viewport
 * @property {boolean} [reverse] reverse the direction of the scroll
 * @property {PIXI.Point} [center] place this point at center during zoom instead of current mouse position
 */


var wheelOptions = {
  percent: 0.1,
  smooth: false,
  interrupt: true,
  reverse: false,
  center: null
};

var Wheel =
/*#__PURE__*/
function (_Plugin10) {
  _inherits(Wheel, _Plugin10);

  /**
   * @private
   * @param {Viewport} parent
   * @param {WheelOptions} [options]
   * @event wheel({wheel: {dx, dy, dz}, event, viewport})
   */
  function Wheel(parent) {
    var _this12;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Wheel);

    _this12 = _possibleConstructorReturn(this, _getPrototypeOf(Wheel).call(this, parent));
    _this12.options = Object.assign({}, wheelOptions, options);
    return _this12;
  }

  _createClass(Wheel, [{
    key: "down",
    value: function down() {
      if (this.options.interrupt) {
        this.smoothing = null;
      }
    }
  }, {
    key: "update",
    value: function update() {
      if (this.smoothing) {
        var point = this.smoothingCenter;
        var change = this.smoothing;
        var oldPoint;

        if (!this.options.center) {
          oldPoint = this.parent.toLocal(point);
        }

        this.parent.scale.x += change.x;
        this.parent.scale.y += change.y;
        this.parent.emit('zoomed', {
          viewport: this.parent,
          type: 'wheel'
        });
        var clamp = this.parent.plugins.get('clamp-zoom');

        if (clamp) {
          clamp.clamp();
        }

        if (this.options.center) {
          this.parent.moveCenter(this.options.center);
        } else {
          var newPoint = this.parent.toGlobal(oldPoint);
          this.parent.x += point.x - newPoint.x;
          this.parent.y += point.y - newPoint.y;
        }

        this.smoothingCount++;

        if (this.smoothingCount >= this.options.smooth) {
          this.smoothing = null;
        }
      }
    }
  }, {
    key: "wheel",
    value: function wheel(e) {
      if (this.paused) {
        return;
      }

      var point = this.parent.input.getPointerPosition(e);
      var sign = this.options.reverse ? -1 : 1;
      var step = sign * -e.deltaY * (e.deltaMode ? 120 : 1) / 500;
      var change = Math.pow(2, (1 + this.options.percent) * step);

      if (this.options.smooth) {
        var original = {
          x: this.smoothing ? this.smoothing.x * (this.options.smooth - this.smoothingCount) : 0,
          y: this.smoothing ? this.smoothing.y * (this.options.smooth - this.smoothingCount) : 0
        };
        this.smoothing = {
          x: ((this.parent.scale.x + original.x) * change - this.parent.scale.x) / this.options.smooth,
          y: ((this.parent.scale.y + original.y) * change - this.parent.scale.y) / this.options.smooth
        };
        this.smoothingCount = 0;
        this.smoothingCenter = point;
      } else {
        var oldPoint;

        if (!this.options.center) {
          oldPoint = this.parent.toLocal(point);
        }

        this.parent.scale.x *= change;
        this.parent.scale.y *= change;
        this.parent.emit('zoomed', {
          viewport: this.parent,
          type: 'wheel'
        });
        var clamp = this.parent.plugins.get('clamp-zoom');

        if (clamp) {
          clamp.clamp();
        }

        if (this.options.center) {
          this.parent.moveCenter(this.options.center);
        } else {
          var newPoint = this.parent.toGlobal(oldPoint);
          this.parent.x += point.x - newPoint.x;
          this.parent.y += point.y - newPoint.y;
        }
      }

      this.parent.emit('moved', {
        viewport: this.parent,
        type: 'wheel'
      });
      this.parent.emit('wheel', {
        wheel: {
          dx: e.deltaX,
          dy: e.deltaY,
          dz: e.deltaZ
        },
        event: e,
        viewport: this.parent
      });

      if (!this.parent.options.passiveWheel) {
        return true;
      }
    }
  }]);

  return Wheel;
}(Plugin);
/**
 * @typedef MouseEdgesOptions
 * @property {number} [radius] distance from center of screen in screen pixels
 * @property {number} [distance] distance from all sides in screen pixels
 * @property {number} [top] alternatively, set top distance (leave unset for no top scroll)
 * @property {number} [bottom] alternatively, set bottom distance (leave unset for no top scroll)
 * @property {number} [left] alternatively, set left distance (leave unset for no top scroll)
 * @property {number} [right] alternatively, set right distance (leave unset for no top scroll)
 * @property {number} [speed=8] speed in pixels/frame to scroll viewport
 * @property {boolean} [reverse] reverse direction of scroll
 * @property {boolean} [noDecelerate] don't use decelerate plugin even if it's installed
 * @property {boolean} [linear] if using radius, use linear movement (+/- 1, +/- 1) instead of angled movement (Math.cos(angle from center), Math.sin(angle from center))
 * @property {boolean} [allowButtons] allows plugin to continue working even when there's a mousedown event
 */


var mouseEdgesOptions = {
  radius: null,
  distance: null,
  top: null,
  bottom: null,
  left: null,
  right: null,
  speed: 8,
  reverse: false,
  noDecelerate: false,
  linear: false,
  allowButtons: false
};

var MouseEdges =
/*#__PURE__*/
function (_Plugin11) {
  _inherits(MouseEdges, _Plugin11);

  /**
   * Scroll viewport when mouse hovers near one of the edges.
   * @private
   * @param {Viewport} parent
   * @param {MouseEdgeOptions} [options]
   * @event mouse-edge-start(Viewport) emitted when mouse-edge starts
   * @event mouse-edge-end(Viewport) emitted when mouse-edge ends
   */
  function MouseEdges(parent) {
    var _this13;

    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, MouseEdges);

    _this13 = _possibleConstructorReturn(this, _getPrototypeOf(MouseEdges).call(this, parent));
    _this13.options = Object.assign({}, mouseEdgesOptions, options);
    _this13.reverse = _this13.options.reverse ? 1 : -1;
    _this13.radiusSquared = Math.pow(_this13.options.radius, 2);

    _this13.resize();

    return _this13;
  }

  _createClass(MouseEdges, [{
    key: "resize",
    value: function resize() {
      var distance = this.options.distance;

      if (distance !== null) {
        this.left = distance;
        this.top = distance;
        this.right = this.parent.worldScreenWidth - distance;
        this.bottom = this.parent.worldScreenHeight - distance;
      } else if (!this.radius) {
        this.left = this.options.left;
        this.top = this.options.top;
        this.right = this.options.right === null ? null : this.parent.worldScreenWidth - this.options.right;
        this.bottom = this.options.bottom === null ? null : this.parent.worldScreenHeight - this.options.bottom;
      }
    }
  }, {
    key: "down",
    value: function down() {
      if (!this.options.allowButtons) {
        this.horizontal = this.vertical = null;
      }
    }
  }, {
    key: "move",
    value: function move(event) {
      if (event.data.pointerType !== 'mouse' && event.data.identifier !== 1 || !this.options.allowButtons && event.data.buttons !== 0) {
        return;
      }

      var x = event.data.global.x;
      var y = event.data.global.y;

      if (this.radiusSquared) {
        var center = this.parent.toScreen(this.parent.center);
        var distance = Math.pow(center.x - x, 2) + Math.pow(center.y - y, 2);

        if (distance >= this.radiusSquared) {
          var angle = Math.atan2(center.y - y, center.x - x);

          if (this.options.linear) {
            this.horizontal = Math.round(Math.cos(angle)) * this.options.speed * this.reverse * (60 / 1000);
            this.vertical = Math.round(Math.sin(angle)) * this.options.speed * this.reverse * (60 / 1000);
          } else {
            this.horizontal = Math.cos(angle) * this.options.speed * this.reverse * (60 / 1000);
            this.vertical = Math.sin(angle) * this.options.speed * this.reverse * (60 / 1000);
          }
        } else {
          if (this.horizontal) {
            this.decelerateHorizontal();
          }

          if (this.vertical) {
            this.decelerateVertical();
          }

          this.horizontal = this.vertical = 0;
        }
      } else {
        if (this.left !== null && x < this.left) {
          this.horizontal = 1 * this.reverse * this.options.speed * (60 / 1000);
        } else if (this.right !== null && x > this.right) {
          this.horizontal = -1 * this.reverse * this.options.speed * (60 / 1000);
        } else {
          this.decelerateHorizontal();
          this.horizontal = 0;
        }

        if (this.top !== null && y < this.top) {
          this.vertical = 1 * this.reverse * this.options.speed * (60 / 1000);
        } else if (this.bottom !== null && y > this.bottom) {
          this.vertical = -1 * this.reverse * this.options.speed * (60 / 1000);
        } else {
          this.decelerateVertical();
          this.vertical = 0;
        }
      }
    }
  }, {
    key: "decelerateHorizontal",
    value: function decelerateHorizontal() {
      var decelerate = this.parent.plugins.get('decelerate');

      if (this.horizontal && decelerate && !this.options.noDecelerate) {
        decelerate.activate({
          x: this.horizontal * this.options.speed * this.reverse / (1000 / 60)
        });
      }
    }
  }, {
    key: "decelerateVertical",
    value: function decelerateVertical() {
      var decelerate = this.parent.plugins.get('decelerate');

      if (this.vertical && decelerate && !this.options.noDecelerate) {
        decelerate.activate({
          y: this.vertical * this.options.speed * this.reverse / (1000 / 60)
        });
      }
    }
  }, {
    key: "up",
    value: function up() {
      if (this.horizontal) {
        this.decelerateHorizontal();
      }

      if (this.vertical) {
        this.decelerateVertical();
      }

      this.horizontal = this.vertical = null;
    }
  }, {
    key: "update",
    value: function update() {
      if (this.paused) {
        return;
      }

      if (this.horizontal || this.vertical) {
        var center = this.parent.center;

        if (this.horizontal) {
          center.x += this.horizontal * this.options.speed;
        }

        if (this.vertical) {
          center.y += this.vertical * this.options.speed;
        }

        this.parent.moveCenter(center);
        this.parent.emit('moved', {
          viewport: this.parent,
          type: 'mouse-edges'
        });
      }
    }
  }]);

  return MouseEdges;
}(Plugin);
/**
 * @typedef {object} ViewportOptions
 * @property {number} [screenWidth=window.innerWidth]
 * @property {number} [screenHeight=window.innerHeight]
 * @property {number} [worldWidth=this.width]
 * @property {number} [worldHeight=this.height]
 * @property {number} [threshold=5] number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
 * @property {boolean} [passiveWheel=true] whether the 'wheel' event is set to passive (note: if false, e.preventDefault() will be called when wheel is used over the viewport)
 * @property {boolean} [stopPropagation=false] whether to stopPropagation of events that impact the viewport (except wheel events, see options.passiveWheel)
 * @property {HitArea} [forceHitArea] change the default hitArea from world size to a new value
 * @property {boolean} [noTicker] set this if you want to manually call update() function on each frame
 * @property {PIXI.Ticker} [ticker=PIXI.Ticker.shared] use this PIXI.ticker for updates
 * @property {PIXI.InteractionManager} [interaction=null] InteractionManager, available from instantiated WebGLRenderer/CanvasRenderer.plugins.interaction - used to calculate pointer postion relative to canvas location on screen
 * @property {HTMLElement} [divWheel=document.body] div to attach the wheel event
 * @property {boolean} [disableOnContextMenu] remove oncontextmenu=() => {} from the divWheel element
 */


var viewportOptions = {
  screenWidth: window.innerWidth,
  screenHeight: window.innerHeight,
  worldWidth: null,
  worldHeight: null,
  threshold: 5,
  passiveWheel: true,
  stopPropagation: false,
  forceHitArea: null,
  noTicker: false,
  interaction: null,
  disableOnContextMenu: false
};
/**
 * Main class to use when creating a Viewport
 */

var Viewport =
/*#__PURE__*/
function (_Container) {
  _inherits(Viewport, _Container);

  /**
   * @param {ViewportOptions} [options]
   * @fires clicked
   * @fires drag-start
   * @fires drag-end
   * @fires drag-remove
   * @fires pinch-start
   * @fires pinch-end
   * @fires pinch-remove
   * @fires snap-start
   * @fires snap-end
   * @fires snap-remove
   * @fires snap-zoom-start
   * @fires snap-zoom-end
   * @fires snap-zoom-remove
   * @fires bounce-x-start
   * @fires bounce-x-end
   * @fires bounce-y-start
   * @fires bounce-y-end
   * @fires bounce-remove
   * @fires wheel
   * @fires wheel-remove
   * @fires wheel-scroll
   * @fires wheel-scroll-remove
   * @fires mouse-edge-start
   * @fires mouse-edge-end
   * @fires mouse-edge-remove
   * @fires moved
   * @fires moved-end
   * @fires zoomed
   * @fires zoomed-end
   * @fires frame-end
   */
  function Viewport() {
    var _this14;

    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck(this, Viewport);

    _this14 = _possibleConstructorReturn(this, _getPrototypeOf(Viewport).call(this));
    _this14.options = Object.assign({}, viewportOptions, options); // needed to pull this out of viewportOptions because of pixi.js v4 support (which changed from PIXI.ticker.shared to PIXI.Ticker.shared...sigh)

    if (options.ticker) {
      _this14.options.ticker = options.ticker;
    } else {
      // to avoid Rollup transforming our import, save pixi namespace in a variable
      // from here: https://github.com/pixijs/pixi.js/issues/5757
      var ticker;
      var pixiNS = PIXI;

      if (parseInt(/^(\d+)\./.exec(VERSION)[1]) < 5) {
        ticker = pixiNS.ticker.shared;
      } else {
        ticker = pixiNS.Ticker.shared;
      }

      _this14.options.ticker = options.ticker || ticker;
    }
    /** @type {number} */


    _this14.screenWidth = _this14.options.screenWidth;
    /** @type {number} */

    _this14.screenHeight = _this14.options.screenHeight;
    _this14._worldWidth = _this14.options.worldWidth;
    _this14._worldHeight = _this14.options.worldHeight;
    _this14.forceHitArea = _this14.options.forceHitArea;
    /**
     * number of pixels to move to trigger an input event (e.g., drag, pinch) or disable a clicked event
     * @type {number}
     */

    _this14.threshold = _this14.options.threshold;
    _this14.options.divWheel = _this14.options.divWheel || document.body;

    if (_this14.options.disableOnContextMenu) {
      _this14.options.divWheel.oncontextmenu = function (e) {
        return e.preventDefault();
      };
    }

    if (!_this14.options.noTicker) {
      _this14.tickerFunction = function () {
        return _this14.update(_this14.options.ticker.elapsedMS);
      };

      _this14.options.ticker.add(_this14.tickerFunction);
    }

    _this14.input = new InputManager(_assertThisInitialized(_this14));
    /**
     * Use this to add user plugins or access existing plugins (e.g., to pause, resume, or remove them)
     * @type {PluginManager}
     */

    _this14.plugins = new PluginManager(_assertThisInitialized(_this14));
    return _this14;
  }
  /**
   * overrides PIXI.Container's destroy to also remove the 'wheel' and PIXI.Ticker listeners
   * @param {(object|boolean)} [options] - Options parameter. A boolean will act as if all options have been set to that value
   * @param {boolean} [options.children=false] - if set to true, all the children will have their destroy method called as well. 'options' will be passed on to those calls.
   * @param {boolean} [options.texture=false] - Only used for child Sprites if options.children is set to true. Should it destroy the texture of the child sprite
   * @param {boolean} [options.baseTexture=false] - Only used for child Sprites if options.children is set to true. Should it destroy the base texture of the child sprite     */


  _createClass(Viewport, [{
    key: "destroy",
    value: function destroy(options) {
      if (!this.options.noTicker) {
        this.options.ticker.remove(this.tickerFunction);
      }

      this.input.destroy();

      _get(_getPrototypeOf(Viewport.prototype), "destroy", this).call(this, options);
    }
    /**
     * update viewport on each frame
     * by default, you do not need to call this unless you set options.noTicker=true
     * @param {number} elapsed time in milliseconds since last update
     */

  }, {
    key: "update",
    value: function update(elapsed) {
      if (!this.pause) {
        this.plugins.update(elapsed);

        if (this.lastViewport) {
          // check for moved-end event
          if (this.lastViewport.x !== this.x || this.lastViewport.y !== this.y) {
            this.moving = true;
          } else {
            if (this.moving) {
              this.emit('moved-end', this);
              this.moving = false;
            }
          } // check for zoomed-end event


          if (this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y) {
            this.zooming = true;
          } else {
            if (this.zooming) {
              this.emit('zoomed-end', this);
              this.zooming = false;
            }
          }
        }

        if (!this.forceHitArea) {
          this._hitAreaDefault = new Rectangle(this.left, this.top, this.worldScreenWidth, this.worldScreenHeight);
          this.hitArea = this._hitAreaDefault;
        }

        this._dirty = this._dirty || !this.lastViewport || this.lastViewport.x !== this.x || this.lastViewport.y !== this.y || this.lastViewport.scaleX !== this.scale.x || this.lastViewport.scaleY !== this.scale.y;
        this.lastViewport = {
          x: this.x,
          y: this.y,
          scaleX: this.scale.x,
          scaleY: this.scale.y
        };
        this.emit('frame-end', this);
      }
    }
    /**
     * use this to set screen and world sizes--needed for pinch/wheel/clamp/bounce
     * @param {number} [screenWidth=window.innerWidth]
     * @param {number} [screenHeight=window.innerHeight]
     * @param {number} [worldWidth]
     * @param {number} [worldHeight]
     */

  }, {
    key: "resize",
    value: function resize() {
      var screenWidth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.innerWidth;
      var screenHeight = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window.innerHeight;
      var worldWidth = arguments.length > 2 ? arguments[2] : undefined;
      var worldHeight = arguments.length > 3 ? arguments[3] : undefined;
      this.screenWidth = screenWidth;
      this.screenHeight = screenHeight;

      if (typeof worldWidth !== 'undefined') {
        this._worldWidth = worldWidth;
      }

      if (typeof worldHeight !== 'undefined') {
        this._worldHeight = worldHeight;
      }

      this.plugins.resize();
    }
    /**
     * world width in pixels
     * @type {number}
     */

  }, {
    key: "getVisibleBounds",

    /**
     * get visible bounds of viewport
     * @returns {PIXI.Rectangle}
     */
    value: function getVisibleBounds() {
      return new Rectangle(this.left, this.top, this.worldScreenWidth, this.worldScreenHeight);
    }
    /**
     * change coordinates from screen to world
     * @param {(number|PIXI.Point)} x or point
     * @param {number} [y]
     * @return {PIXI.Point}
     */

  }, {
    key: "toWorld",
    value: function toWorld(x, y) {
      if (arguments.length === 2) {
        return this.toLocal(new Point(x, y));
      } else {
        return this.toLocal(x);
      }
    }
    /**
     * change coordinates from world to screen
     * @param {(number|PIXI.Point)} x or point
     * @param {number} [y]
     * @return {PIXI.Point}
     */

  }, {
    key: "toScreen",
    value: function toScreen(x, y) {
      if (arguments.length === 2) {
        return this.toGlobal(new Point(x, y));
      } else {
        return this.toGlobal(x);
      }
    }
    /**
     * screen width in world coordinates
     * @type {number}
     */

  }, {
    key: "moveCenter",

    /**
     * move center of viewport to point
     * @param {(number|PIXI.Point)} x or point
     * @param {number} [y]
     * @return {Viewport} this
     */
    value: function moveCenter() {
      var x, y;

      if (!isNaN(arguments[0])) {
        x = arguments[0];
        y = arguments[1];
      } else {
        x = arguments[0].x;
        y = arguments[0].y;
      }

      this.position.set((this.worldScreenWidth / 2 - x) * this.scale.x, (this.worldScreenHeight / 2 - y) * this.scale.y);
      this.plugins.reset();
      this.dirty = true;
      return this;
    }
    /**
     * top-left corner of Viewport
     * @type {PIXI.Point}
     */

  }, {
    key: "moveCorner",

    /**
     * move viewport's top-left corner; also clamps and resets decelerate and bounce (as needed)
     * @param {(number|PIXI.Point)} x or point
     * @param {number} [y]
     * @return {Viewport} this
     */
    value: function moveCorner(x, y) {
      if (arguments.length === 1) {
        this.position.set(-x.x * this.scale.x, -x.y * this.scale.y);
      } else {
        this.position.set(-x * this.scale.x, -y * this.scale.y);
      }

      this.plugins.reset();
      return this;
    }
    /**
     * change zoom so the width fits in the viewport
     * @param {number} [width=this.worldWidth] in world coordinates
     * @param {boolean} [center] maintain the same center
     * @param {boolean} [scaleY=true] whether to set scaleY=scaleX
     * @param {boolean} [noClamp] whether to disable clamp-zoom
     * @returns {Viewport} this
     */

  }, {
    key: "fitWidth",
    value: function fitWidth(width, center) {
      var scaleY = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var noClamp = arguments.length > 3 ? arguments[3] : undefined;
      var save;

      if (center) {
        save = this.center;
      }

      this.scale.x = this.screenWidth / width;

      if (scaleY) {
        this.scale.y = this.scale.x;
      }

      var clampZoom = this.plugins.get('clamp-zoom');

      if (!noClamp && clampZoom) {
        clampZoom.clamp();
      }

      if (center) {
        this.moveCenter(save);
      }

      return this;
    }
    /**
     * change zoom so the height fits in the viewport
     * @param {number} [height=this.worldHeight] in world coordinates
     * @param {boolean} [center] maintain the same center of the screen after zoom
     * @param {boolean} [scaleX=true] whether to set scaleX = scaleY
     * @param {boolean} [noClamp] whether to disable clamp-zoom
     * @returns {Viewport} this
     */

  }, {
    key: "fitHeight",
    value: function fitHeight(height, center) {
      var scaleX = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
      var noClamp = arguments.length > 3 ? arguments[3] : undefined;
      var save;

      if (center) {
        save = this.center;
      }

      this.scale.y = this.screenHeight / height;

      if (scaleX) {
        this.scale.x = this.scale.y;
      }

      var clampZoom = this.plugins.get('clamp-zoom');

      if (!noClamp && clampZoom) {
        clampZoom.clamp();
      }

      if (center) {
        this.moveCenter(save);
      }

      return this;
    }
    /**
     * change zoom so it fits the entire world in the viewport
     * @param {boolean} center maintain the same center of the screen after zoom
     * @returns {Viewport} this
     */

  }, {
    key: "fitWorld",
    value: function fitWorld(center) {
      var save;

      if (center) {
        save = this.center;
      }

      this.scale.x = this.screenWidth / this.worldWidth;
      this.scale.y = this.screenHeight / this.worldHeight;

      if (this.scale.x < this.scale.y) {
        this.scale.y = this.scale.x;
      } else {
        this.scale.x = this.scale.y;
      }

      var clampZoom = this.plugins.get('clamp-zoom');

      if (clampZoom) {
        clampZoom.clamp();
      }

      if (center) {
        this.moveCenter(save);
      }

      return this;
    }
    /**
     * change zoom so it fits the size or the entire world in the viewport
     * @param {boolean} [center] maintain the same center of the screen after zoom
     * @param {number} [width=this.worldWidth] desired width
     * @param {number} [height=this.worldHeight] desired height
     * @returns {Viewport} this
     */

  }, {
    key: "fit",
    value: function fit(center) {
      var width = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.worldWidth;
      var height = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : this.worldHeight;
      var save;

      if (center) {
        save = this.center;
      }

      this.scale.x = this.screenWidth / width;
      this.scale.y = this.screenHeight / height;

      if (this.scale.x < this.scale.y) {
        this.scale.y = this.scale.x;
      } else {
        this.scale.x = this.scale.y;
      }

      var clampZoom = this.plugins.get('clamp-zoom');

      if (clampZoom) {
        clampZoom.clamp();
      }

      if (center) {
        this.moveCenter(save);
      }

      return this;
    }
    /**
     * zoom viewport to specific value
     * @param {number} scale value (e.g., 1 would be 100%, 0.25 would be 25%)
     * @param {boolean} [center] maintain the same center of the screen after zoom
     * @return {Viewport} this
     */

  }, {
    key: "setZoom",
    value: function setZoom(scale, center) {
      var save;

      if (center) {
        save = this.center;
      }

      this.scale.set(scale);
      var clampZoom = this.plugins.get('clamp-zoom');

      if (clampZoom) {
        clampZoom.clamp();
      }

      if (center) {
        this.moveCenter(save);
      }

      return this;
    }
    /**
     * zoom viewport by a certain percent (in both x and y direction)
     * @param {number} percent change (e.g., 0.25 would increase a starting scale of 1.0 to 1.25)
     * @param {boolean} [center] maintain the same center of the screen after zoom
     * @return {Viewport} this
     */

  }, {
    key: "zoomPercent",
    value: function zoomPercent(percent, center) {
      return this.setZoom(this.scale.x + this.scale.x * percent, center);
    }
    /**
     * zoom viewport by increasing/decreasing width by a certain number of pixels
     * @param {number} change in pixels
     * @param {boolean} [center] maintain the same center of the screen after zoom
     * @return {Viewport} this
     */

  }, {
    key: "zoom",
    value: function zoom(change, center) {
      this.fitWidth(change + this.worldScreenWidth, center);
      return this;
    }
    /**
     * changes scale of viewport and maintains center of viewport--same as calling setScale(scale, true)
     * @type {number}
     */

  }, {
    key: "snapZoom",

    /**
     * @param {SnapZoomOptions} options
     */
    value: function snapZoom(options) {
      this.plugins.add('snap-zoom', new SnapZoom(this, options));
      return this;
    }
    /**
     * is container out of world bounds
     * @returns {OutOfBounds}
     */

  }, {
    key: "OOB",
    value: function OOB() {
      return {
        left: this.left < 0,
        right: this.right > this.worldWidth,
        top: this.top < 0,
        bottom: this.bottom > this._worldHeight,
        cornerPoint: new Point(this.worldWidth * this.scale.x - this.screenWidth, this.worldHeight * this.scale.y - this.screenHeight)
      };
    }
    /**
     * world coordinates of the right edge of the screen
     * @type {number}
     */

  }, {
    key: "drag",

    /**
     * enable one-finger touch to drag
     * NOTE: if you expect users to use right-click dragging, you should enable viewport.options.disableOnContextMenu to avoid the context menu popping up on each right-click drag
     * @param {DragOptions} [options]
     * @returns {Viewport} this
     */
    value: function drag(options) {
      this.plugins.add('drag', new Drag(this, options));
      return this;
    }
    /**
     * clamp to world boundaries or other provided boundaries
     * NOTES:
     *   clamp is disabled if called with no options; use { direction: 'all' } for all edge clamping
     *   screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
     * @param {ClampOptions} [options]
     * @returns {Viewport} this
     */

  }, {
    key: "clamp",
    value: function clamp(options) {
      this.plugins.add('clamp', new Clamp(this, options));
      return this;
    }
    /**
     * decelerate after a move
     * NOTE: this fires 'moved' event during deceleration
     * @param {DecelerateOptions} [options]
     * @return {Viewport} this
     */

  }, {
    key: "decelerate",
    value: function decelerate(options) {
      this.plugins.add('decelerate', new Decelerate(this, options));
      return this;
    }
    /**
     * bounce on borders
     * NOTES:
     *    screenWidth, screenHeight, worldWidth, and worldHeight needs to be set for this to work properly
     *    fires 'moved', 'bounce-x-start', 'bounce-y-start', 'bounce-x-end', and 'bounce-y-end' events
     * @param {object} [options]
     * @param {string} [options.sides=all] all, horizontal, vertical, or combination of top, bottom, right, left (e.g., 'top-bottom-right')
     * @param {number} [options.friction=0.5] friction to apply to decelerate if active
     * @param {number} [options.time=150] time in ms to finish bounce
     * @param {string|function} [options.ease=easeInOutSine] ease function or name (see http://easings.net/ for supported names)
     * @param {string} [options.underflow=center] (top/bottom/center and left/right/center, or center) where to place world if too small for screen
     * @return {Viewport} this
     */

  }, {
    key: "bounce",
    value: function bounce(options) {
      this.plugins.add('bounce', new Bounce(this, options));
      return this;
    }
    /**
     * enable pinch to zoom and two-finger touch to drag
     * @param {PinchOptions} [options]
     * @return {Viewport} this
     */

  }, {
    key: "pinch",
    value: function pinch(options) {
      this.plugins.add('pinch', new Pinch(this, options));
      return this;
    }
    /**
     * snap to a point
     * @param {number} x
     * @param {number} y
     * @param {SnapOptions} [options]
     * @return {Viewport} this
     */

  }, {
    key: "snap",
    value: function snap(x, y, options) {
      this.plugins.add('snap', new Snap(this, x, y, options));
      return this;
    }
    /**
     * follow a target
     * NOTES:
     *    uses the (x, y) as the center to follow; for PIXI.Sprite to work properly, use sprite.anchor.set(0.5)
     *    options.acceleration is not perfect as it doesn't know the velocity of the target
     *    it adds acceleration to the start of movement and deceleration to the end of movement when the target is stopped
     *    fires 'moved' event
     * @param {PIXI.DisplayObject} target to follow
     * @param {FollowOptions} [options]
     * @returns {Viewport} this
     */

  }, {
    key: "follow",
    value: function follow(target, options) {
      this.plugins.add('follow', new Follow(this, target, options));
      return this;
    }
    /**
     * zoom using mouse wheel
     * @param {WheelOptions} [options]
     * @return {Viewport} this
     */

  }, {
    key: "wheel",
    value: function wheel(options) {
      this.plugins.add('wheel', new Wheel(this, options));
      return this;
    }
    /**
     * enable clamping of zoom to constraints
     * @param {ClampZoomOptions} [options]
     * @return {Viewport} this
     */

  }, {
    key: "clampZoom",
    value: function clampZoom(options) {
      this.plugins.add('clamp-zoom', new ClampZoom(this, options));
      return this;
    }
    /**
     * Scroll viewport when mouse hovers near one of the edges or radius-distance from center of screen.
     * NOTE: fires 'moved' event
     * @param {MouseEdgesOptions} [options]
     */

  }, {
    key: "mouseEdges",
    value: function mouseEdges(options) {
      this.plugins.add('mouse-edges', new MouseEdges(this, options));
      return this;
    }
    /**
     * pause viewport (including animation updates such as decelerate)
     * @type {boolean}
     */

  }, {
    key: "ensureVisible",

    /**
     * move the viewport so the bounding box is visible
     * @param {number} x - left
     * @param {number} y - top
     * @param {number} width
     * @param {number} height
     */
    value: function ensureVisible(x, y, width, height) {
      if (x < this.left) {
        this.left = x;
      } else if (x + width > this.right) {
        this.right = x + width;
      }

      if (y < this.top) {
        this.top = y;
      } else if (y + height > this.bottom) {
        this.bottom = y + height;
      }
    }
  }, {
    key: "worldWidth",
    get: function get() {
      if (this._worldWidth) {
        return this._worldWidth;
      } else {
        return this.width / this.scale.x;
      }
    },
    set: function set(value) {
      this._worldWidth = value;
      this.plugins.resize();
    }
    /**
     * world height in pixels
     * @type {number}
     */

  }, {
    key: "worldHeight",
    get: function get() {
      if (this._worldHeight) {
        return this._worldHeight;
      } else {
        return this.height / this.scale.y;
      }
    },
    set: function set(value) {
      this._worldHeight = value;
      this.plugins.resize();
    }
  }, {
    key: "worldScreenWidth",
    get: function get() {
      return this.screenWidth / this.scale.x;
    }
    /**
     * screen height in world coordinates
     * @type {number}
     */

  }, {
    key: "worldScreenHeight",
    get: function get() {
      return this.screenHeight / this.scale.y;
    }
    /**
     * world width in screen coordinates
     * @type {number}
     */

  }, {
    key: "screenWorldWidth",
    get: function get() {
      return this.worldWidth * this.scale.x;
    }
    /**
     * world height in screen coordinates
     * @type {number}
     */

  }, {
    key: "screenWorldHeight",
    get: function get() {
      return this.worldHeight * this.scale.y;
    }
    /**
     * center of screen in world coordinates
     * @type {PIXI.Point}
     */

  }, {
    key: "center",
    get: function get() {
      return new Point(this.worldScreenWidth / 2 - this.x / this.scale.x, this.worldScreenHeight / 2 - this.y / this.scale.y);
    },
    set: function set(value) {
      this.moveCenter(value);
    }
  }, {
    key: "corner",
    get: function get() {
      return new Point(-this.x / this.scale.x, -this.y / this.scale.y);
    },
    set: function set(value) {
      this.moveCorner(value);
    }
  }, {
    key: "scaled",
    set: function set(scale) {
      this.setZoom(scale, true);
    },
    get: function get() {
      return this.scale.x;
    }
  }, {
    key: "right",
    get: function get() {
      return -this.x / this.scale.x + this.worldScreenWidth;
    },
    set: function set(value) {
      this.x = -value * this.scale.x + this.screenWidth;
      this.plugins.reset();
    }
    /**
     * world coordinates of the left edge of the screen
     * @type { number }
     */

  }, {
    key: "left",
    get: function get() {
      return -this.x / this.scale.x;
    },
    set: function set(value) {
      this.x = -value * this.scale.x;
      this.plugins.reset();
    }
    /**
     * world coordinates of the top edge of the screen
     * @type {number}
     */

  }, {
    key: "top",
    get: function get() {
      return -this.y / this.scale.y;
    },
    set: function set(value) {
      this.y = -value * this.scale.y;
      this.plugins.reset();
    }
    /**
     * world coordinates of the bottom edge of the screen
     * @type {number}
     */

  }, {
    key: "bottom",
    get: function get() {
      return -this.y / this.scale.y + this.worldScreenHeight;
    },
    set: function set(value) {
      this.y = -value * this.scale.y + this.screenHeight;
      this.plugins.reset();
    }
    /**
     * determines whether the viewport is dirty (i.e., needs to be renderered to the screen because of a change)
     * @type {boolean}
     */

  }, {
    key: "dirty",
    get: function get() {
      return this._dirty;
    },
    set: function set(value) {
      this._dirty = value;
    }
    /**
     * permanently changes the Viewport's hitArea
     * NOTE: if not set then hitArea = PIXI.Rectangle(Viewport.left, Viewport.top, Viewport.worldScreenWidth, Viewport.worldScreenHeight)
     * @returns {HitArea}
     */

  }, {
    key: "forceHitArea",
    get: function get() {
      return this._forceHitArea;
    },
    set: function set(value) {
      if (value) {
        this._forceHitArea = value;
        this.hitArea = value;
      } else {
        this._forceHitArea = null;
        this.hitArea = new Rectangle(0, 0, this.worldWidth, this.worldHeight);
      }
    }
  }, {
    key: "pause",
    get: function get() {
      return this._pause;
    },
    set: function set(value) {
      this._pause = value;
      this.lastViewport = null;
      this.moving = false;
      this.zooming = false;

      if (value) {
        this.input.pause();
      }
    }
  }]);

  return Viewport;
}(Container);
/**
 * fires after a mouse or touch click
 * @event Viewport#clicked
 * @type {object}
 * @property {PIXI.Point} screen
 * @property {PIXI.Point} world
 * @property {Viewport} viewport
 */

/**
 * fires when a drag starts
 * @event Viewport#drag-start
 * @type {object}
 * @property {PIXI.Point} screen
 * @property {PIXI.Point} world
 * @property {Viewport} viewport
 */

/**
 * fires when a drag ends
 * @event Viewport#drag-end
 * @type {object}
 * @property {PIXI.Point} screen
 * @property {PIXI.Point} world
 * @property {Viewport} viewport
 */

/**
 * fires when a pinch starts
 * @event Viewport#pinch-start
 * @type {Viewport}
 */

/**
 * fires when a pinch end
 * @event Viewport#pinch-end
 * @type {Viewport}
 */

/**
 * fires when a snap starts
 * @event Viewport#snap-start
 * @type {Viewport}
 */

/**
 * fires when a snap ends
 * @event Viewport#snap-end
 * @type {Viewport}
 */

/**
 * fires when a snap-zoom starts
 * @event Viewport#snap-zoom-start
 * @type {Viewport}
 */

/**
 * fires when a snap-zoom ends
 * @event Viewport#snap-zoom-end
 * @type {Viewport}
 */

/**
 * fires when a bounce starts in the x direction
 * @event Viewport#bounce-x-start
 * @type {Viewport}
 */

/**
 * fires when a bounce ends in the x direction
 * @event Viewport#bounce-x-end
 * @type {Viewport}
 */

/**
 * fires when a bounce starts in the y direction
 * @event Viewport#bounce-y-start
 * @type {Viewport}
 */

/**
 * fires when a bounce ends in the y direction
 * @event Viewport#bounce-y-end
 * @type {Viewport}
 */

/**
 * fires when for a mouse wheel event
 * @event Viewport#wheel
 * @type {object}
 * @property {object} wheel
 * @property {number} wheel.dx
 * @property {number} wheel.dy
 * @property {number} wheel.dz
 * @property {Viewport} viewport
 */

/**
 * fires when a wheel-scroll occurs
 * @event Viewport#wheel-scroll
 * @type {Viewport}
 */

/**
 * fires when a mouse-edge starts to scroll
 * @event Viewport#mouse-edge-start
 * @type {Viewport}
 */

/**
 * fires when the mouse-edge scrolling ends
 * @event Viewport#mouse-edge-end
 * @type {Viewport}
 */

/**
 * fires when viewport moves through UI interaction, deceleration, or follow
 * @event Viewport#moved
 * @type {object}
 * @property {Viewport} viewport
 * @property {string} type (drag, snap, pinch, follow, bounce-x, bounce-y, clamp-x, clamp-y, decelerate, mouse-edges, wheel)
 */

/**
 * fires when viewport moves through UI interaction, deceleration, or follow
 * @event Viewport#zoomed
 * @type {object}
 * @property {Viewport} viewport
 * @property {string} type (drag-zoom, pinch, wheel, clamp-zoom)
 */

/**
 * fires when viewport stops moving
 * @event Viewport#moved-end
 * @type {Viewport}
 */

/**
 * fires when viewport stops zooming
 * @event Viewport#zoomed-end
 * @type {Viewport}
 */

/**
* fires at the end of an update frame
* @event Viewport#frame-end
* @type {Viewport}
*/

/** @typedef HitArea {(PIXI.Rectangle | PIXI.Circle | PIXI.Ellipse | PIXI.Polygon | PIXI.RoundedRectangle)} */

/**
 * @typedef {Object} OutOfBounds
 * @private
 * @property {boolean} left
 * @property {boolean} right
 * @property {boolean} top
 * @property {boolean} bottom
 * @property {PIXI.Point} cornerPoint
 */

/**
 * @typedef {Object} LastViewport
 * @private
 * @property {number} x
 * @property {number} y
 * @property {number} scaleX
 * @property {number} scaleY
 */


export { Plugin, Viewport };

