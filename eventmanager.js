/**
 *  EventManager (EM shorthand) is the class, written to manage event attach/detach/register and so on
 *
 *
 *
 *
 *  @class
 *  @constructor EventManager
 */
var EM = new function () {
    var self = this;
    /**
     *  Events pool
     *  Element format:
     *  { 'node' : {HTMLElement},
     *    ['rootEHCaller' : {Function}]
     *    'handler' : {
     *      <event_name> : [Function[, Function[, ...]]]
     *      [,<event_name> : [Function[, Function[, ...]]]]
     *    }
     *  }
     *
     *  @type Array
     *  @scope private
     */
    var pool = [];
    /**
     *  Unique ID counter, used to attach IDs to the objects
     *
     *  @type Number
     *  @scope private
     */
    var UID = 0;
    /**
     *  List of used keys, applied to different kinds of objects
     *
     *  @type Object
     *  @scope private
     */
    var keys = {
        'UEID' : '__eventManagerUniqueElementId'
//       ,'UHID' : '__eventManagerUniqueHandlerId'
    }
    /**************************************************************************
    *  PROTECTED METHODS
    ***************************************************************************/
    /**
     *  Method is being binded to any new event handler, then, when called,
     *  does some unification between browser platforms and calls all binded 
     *  event handlers
     *
     *  @param {Event} e event object
     *  @scope protected
     */
    var rootEventHandler = function (e) {
        unifyEvent(e)
        var id = null
           ,hid = null
           ,el = e.target
           ,fe = true;

        if (!(id = e.currentTarget[keys.UEID]) || !(hid = pool[id].handler[e.type])) return;

        for (var i=0, hL=hid.length; i<hL; i++) if (isFunction(hid[i])) hid[i](e);
    }
    /**
     *  Prevents event from calling default event handler
     *
     *  @scope protected
     */
    var preventDefault = function() {
        this.returnValue = false;
    }
    /**
     *  Prevents event from futher bubbling
     *
     *  @scope protected
     */
    var stopPropagation = function() {
        this.cancelBubble = true;
    }
    /**
     *  Performs events cleanup on page unload
     *  It aims to remove leaking closures
     *
     *  @param {Event} e window.unload event
     *  @scope protected
     */
    var unloadEventHandler = function (e) {
        for (var i=pool.length-1,pid=null,el=null; i>=0; i--) {
            if (pool[i] && (el=(pid = pool[i]).node)) {
                for (var z in pid.handler) {
                    if (!pid.handler.hasOwnProperty(z)) continue;

                    if (el.removeEventListener) {
                        el.removeEventListener(z, pid.rootEHCaller?pid.rootEHCaller:rootEventHandler, false);
                    } else {
                        el.detachEvent('on'+z, pid.rootEHCaller?pid.rootEHCaller:rootEventHandler);
                    }
                    pid.handler[z].length = 0;
                }
            }
            el = pid.node = null;
       }
       if (window.removeEventListener) {
           window.removeEventListener(z, arguments.callee, false);
       } else {
           window.detachEvent('on'+z, arguments.callee);
       }
    }
    /**************************************************************************
    *  PRIVATE METHODS
    ***************************************************************************/
    /**
     *  Calls binded function in the context of the event
     *
     *  @param {Event} e target event
     *  @param {Function} f function to bind
     *  @scope private
     */
    var bindEventFunction = function(e,f) {
        return function(){f.apply(e,arguments)};
    }
    /**
     *  Makes an event clone, it does not dereference objects in the event properties
     *
     *  @param {Event} e event handler
     *  @return {Object} cloned event
     *  @scope private
     */
    var unifyEvent = function (e) {
        if (!e.preventDefault) e.preventDefault = bindEventFunction(e, preventDefault);
        if (!e.stopPropagation) e.stopPropagation = bindEventFunction(e, stopPropagation);
        if (!e.getCursorPosition) e.getCursorPosition = DOM.getCursorPosition;
        if (!e.target) e.target = e.srcElement;
        return e;
    }
    /**
     *  Returns UEID property for the specified element, creates it, if asked
     *
     *  @param {Object} el element to find UEID on
     *  @param {Boolean} f optional flag to force UEID creation, if not exists
     *  @retutn {Number} UEID, if > 0
     *  @scope private
     */
    var getUEID = function (el, f) {
        return el[keys.UEID] || (f && (el[keys.UEID] = ++UID));
    }
    /**************************************************************************
    *  PUBLIC METHODS
    ***************************************************************************/
    /**
     *  Adds the event listener to the queue
     *
     *  @param {Object} el element to attach event handler to
     *  @param {String} et event name to attach event handler to (without 'on' prefix)
     *  @param {Function} h event handler
     *  @return {Boolean} success state
     *  @scope public
     */
    self.addEventListener = function (el, et, h) {
        if (!isFunction(h)) return false;
        if (!el.addEventListener && !el.attachEvent) return false;
        /*
        *  unique identifier is used to keep an eye on the element
        */
        var id = getUEID(el, true)
           ,pid = null
           ,hid = null;

        /*
        *  prepare pool object, if needed
        */
        if (!pool[id]) {
            pool[id] = {
                'node' : el
               ,'handler' : {}
            }
        }
        pid = pool[id];
        /*
        *  prepare handlers storage in the pool object, if needed
        */
        if (!pid.handler.hasOwnProperty(et)) {
            pid.handler[et] = [];
            /*
            *  if we a here, this means that we have not connected to a node yet
            *  note, we've already made a check for the required methods existense
            */
            if (el.addEventListener) {
                el.addEventListener(et, rootEventHandler, false);
            } else if (el.attachEvent) {
                /*
                *  this workaround is used to avoid IE's lack of currentTarget property
                */
                pid.rootEHCaller = function(e) { 
                    e.currentTarget = pid.node;//pool[id].node;
                    rootEventHandler(e);
                    e.currentTarget = null;
                }
                el.attachEvent('on'+et, pid.rootEHCaller);
            }
        }
        hid = pid.handler[et];
        /*
        *  finally, attach handler, if it was not attached before
        */
        if (hid.indexOf(h)==-1) {
            hid[hid.length] = h;
            return true;
        }
        return false;
    }
    /**
     *  Removes the event listener from the queue
     *
     *  @param {Object} el element to attach event handler to
     *  @param {String} et event name to attach event handler to (without 'on' prefix)
     *  @param {Function} h event handler
     *  @return {Boolean} success state
     *  @scope public
     */
    self.removeEventListener = function (el,et,h) {
        if (!isFunction(h)) return false;
        var id = getUEID(el)
           ,pid = pool[id]
           ,eid = null;
        if (pid && (eid = pid.handler[et])) {
            /*
            *  we've found an event handler
            */
            eid.splice(eid.indexOf(h),1);
            if (0 == eid.length) {
                delete pid.handler[et];
                /*
                *  remove the actual listener
                */
                if (el.removeEventListener) {
                    el.removeEventListener(et, pid.rootEHCaller?pid.rootEHCaller:rootEventHandler, false);
                } else if (el.detachEvent) {
                    el.detachEvent('on'+et, pid.rootEHCaller?pid.rootEHCaller:rootEventHandler);
                }
            }
            return true;
        }
        return false;
    }
    /**
     *  Dispatch custom events on the specified element
     *
     *  @param {Object} el element to fire event on
     *  @param {Object} e event object itself
     *  @return {Boolean} cancelled status
     *  @scope public
     */
    self.dispatchEvent = function (el,e) {
        e.currentTarget = el;
        rootEventHandler(e);
        e.currentTarget = null;
    }
    /**
     *  Registers new event handler for any object
     *  It's a good idea to register events on the object instances, really
     *
     *  @param {Object} o object to register new event on
     *  @param {String} n bindable event name
     *  @return {EMEvent} object, allowing to invoke events
     *  @scope public
     *  @see EM.EventTarget
     */
    self.registerEvent = function (o, n) {
        var id = getUEID(o,true);

        return new EM.EventTarget(o,n);
    }
    /**
     *  Performs object initialization
     *
     */
    var __construct = function() {
        if (window.addEventListener) {
            window.addEventListener('unload',unloadEventHandler,false);
        } else {
			window.attachEvent('onunload',unloadEventHandler);
        }
    }
    __construct();
}
/**
 *  EventTarget base class
 *  Used to create self-containing event object
 *
 *  @class EM.EventTarget
 *  @constructor
 *  @param {String} name event name
 *  @param {Null, Object} obj event execution context (this), window if null passed
 *  @param {Boolean} bubble flag allowing event to bubble across element.parentNode
 *  @param {Function} def default action for the event
 */
EM.EventTarget = function (name, obj, bubble, def) {
    var self = this;

    /**
     *  Indicates possible bubbling, by default bubbling is not allowed
     *
     *  @type Boolean
     *  @default false
     *  @scope private
     */
    var canBubble = !!bubble;
    /**
     *  Stores function, performing default action for the event
     *
     *  @type Function
     *  @scope private
     */
    var defaultAction = isFunction(def)?def:null;

    /**************************************************************************
    *  PRIVATE METHODS
    ***************************************************************************/
    /**************************************************************************
    *  PROTECTED METHODS
    ***************************************************************************/
    /**
     *  Used to trigger created event on the supplied object or on the 'obj' constructor param
     *
     *
     *  @param {Object} el optional element to trigger event on (.target property in the event object)
     *  @param {Object} event data
     */
    self.trigger = function (el, data) {
        if (!el) el = obj;
        var e = {};
        for (var i in data) {
            if (data.hasOwnProperty(i)) e[i] = data[i];
        }

        /*
        *  set defaults
        */
        canBubble = !!bubble;
        defaultAction = def;

        /*
        *  start the go
        */
        do {
            e.preventDefault = preventDefault;
            e.stopPropagation = stopPropagation;
            e.target = el;
            e.type = name;
            EM.dispatchEvent(el, e);
        } while ((el = el.parentNode) && el.canBubble)
        /*
        *  try to execute the default action
        */
        if (isFunction(defaultAction)) {
            defaultAction(e);
        }
        return !!defaultAction;
    }
    /**
     *  Prevents default event action
     *
     *  @scope protected
     */
    var preventDefault = function () {
        defaultAction = null;
    }
    /**
     *  Stops bubbling
     *
     *  @scope protected
     */
    var stopPropagation = function () {
        canBubble = false;
    }
}

/*
*  register core event handler, domload
*  it's called right on the document initialization, before images complete load
*/
new (function () {
    
    var evt = EM.registerEvent('domload',document)
       ,executed = false
       ,clearEvents = function() {
           //For IE
           EM.removeEventListener(document, 'propertychange', handlers.ie);
           //For Mozilla
           EM.removeEventListener(document, 'DOMContentLoaded', handlers.mz);
           //For someone else
           EM.removeEventListener(window, 'load', handlers.mz);
       }
       ,handlers = { 'ie' : function(e) {
                               if (window.event.propertyName == 'activeElement' && !executed) {
                                   evt.trigger(document);
                                   clearEvents();
                                   executed = true;
                               }
                           }
                    ,'mz' : function (e) {if(!executed)evt.trigger(document); executed=true;}
                   };

    //For IE
    EM.addEventListener(document, 'propertychange', handlers.ie);
    //For Mozilla
    EM.addEventListener(document,'DOMContentLoaded', handlers.mz);
    //For Safari and Opera
    if(/WebKit|Khtml/i.test(navigator.userAgent)||(window.opera&&parseInt(window.opera.version())<9))(function(){/loaded|complete/.test(document.readystate)?evt.trigger(document):setTimeout(arguments.callee,100)})();
    //For someone else
    EM.addEventListener(window, 'load', handlers.mz);
})