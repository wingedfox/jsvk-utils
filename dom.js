/*
*  $Id$
*  $HeadURL$
*
*  DOM-related stuff and CSS manipulation class
*
*  @author Ilya Lebedev
*  @author $Author$
*  @modified $Date$
*  @version $Rev$
*  @license LGPL
*  @depends helpers.js
*  @depends arrayextensions.js
*/

if (isUndefined(DOM)) var DOM = {};
/**
 *  Performs parent lookup by
 *   - node object: actually it's "is child of" check
 *   - tagname: getParent(el, 'li') == getParent(el, 'tagName', 'LI')
 *   - any node attribute
 *
 *  @param {HTMLElement} el source element
 *  @param {HTMLElement, String} cp DOMNode or string tagname or string attribute name
 *  @param {String} vl optional attribute value
 *  @return {HTMLElement, Null}
 *  @scope public
 */
DOM.getParent = function (el /* : HTMLElement */, cp /* :String, HTMLElement */, vl /* :String */) /* :HTMLElement */ {
  if (el == null) return null;
  else if (el.nodeType == 1 &&
      ((!isUndefined(vl) && el[cp] == vl) ||
       ('string' == typeof cp && DOM.hasTagName(el, cp)) ||
       el == cp)) return el;
  else return arguments.callee(el.parentNode, cp, vl); 
};
/**
 *  Calculates the offset for the DOM node from top left corner
 * 
 *  @author Matt Kruse
 *  @see http://javascripttoolbox.com/lib/objectposition/index.php
 *  @param {HTMLElement} el
 *  @return {Object} x: horizontal offset, y: vertical offset
 *  @scope public
 */
DOM.getOffset = function (el /* :HTMLElement */) /* :Object */ {
    var fixBrowserQuirks = true
       ,o = el
       ,left = 0
       ,top = 0
       ,width = 0
       ,height = 0
       ,parentNode = null
       ,offsetParent = null;

    if (o==null) return null;
    
    offsetParent = o.offsetParent;
    var originalObject = o
       ,el = o; // "el" will be nodes as we walk up, "o" will be saved for offsetParent references
    while (el.parentNode!=null) {
      el = el.parentNode;
      if (el.offsetParent==null) {
      }
      else {
        var considerScroll = true;
        /*
        In Opera, if parentNode of the first object is scrollable, then offsetLeft/offsetTop already 
        take its scroll position into account. If elements further up the chain are scrollable, their 
        scroll offsets still need to be added in. And for some reason, TR nodes have a scrolltop value
        which must be ignored.
        */
        if (fixBrowserQuirks && window.opera) {
          if (el==originalObject.parentNode || el.nodeName=="TR") {
            considerScroll = false;
          }
        }
        if (considerScroll) {
          if (el.scrollTop && el.scrollTop>0) {
            top -= el.scrollTop;
          }
          if (el.scrollLeft && el.scrollLeft>0) {
            left -= el.scrollLeft;
          }
        }
      }
      // If this node is also the offsetParent, add on the offsets and reset to the new offsetParent
      if (el == offsetParent) {
        left += o.offsetLeft;
        if (el.clientLeft && el.nodeName!="TABLE") { 
          left += el.clientLeft;
        }
        top += o.offsetTop;
        if (el.clientTop && el.nodeName!="TABLE") {
          top += el.clientTop;
        }
        o = el;
        if (o.offsetParent==null) {
          if (o.offsetLeft) {
            left += o.offsetLeft;
          }
          if (o.offsetTop) {
            top += o.offsetTop;
          }
        }
        offsetParent = o.offsetParent;
      }
    }
    
  
    if (originalObject.offsetWidth) {
      width = originalObject.offsetWidth;
    }
    if (originalObject.offsetHeight) {
      height = originalObject.offsetHeight;
    }
    
    return {'x':left, 'y':top, 'width':width, 'height':height};
};
  
//DOM.getOffset = function (el /* :HTMLElement */) /* :Object */ {
/*
    var xy = {'x' : el.offsetLeft , 'y' : el.offsetTop};
    if (el.offsetParent) {
        var xy1 = arguments.callee(el.offsetParent);
        xy.x += xy1.x;
        xy.y += xy1.y;
    }
    return xy;
}
*/
/**
 *  Returns the width of the window canvas
 * 
 *  @return {Number}
 *  @scope public
 */
DOM.getClientWidth = function () /* :Number */{
    var w=0;
    if (self.innerHeight) w = self.innerWidth;
    else if (document.documentElement && document.documentElement.clientWidth) w = document.documentElement.clientWidth;
    else if (document.body) w = document.body.clientWidth;
    return w;
};
/**
 *  Returns the height of the window canvas
 * 
 *  @return {Number}
 *  @scope public
 */
DOM.getClientHeight = function () /* :Number */{
    var h=0;
    if (self.innerHeight) h = self.innerHeight;
    else if (document.documentElement && document.documentElement.clientHeight) h = document.documentElement.clientHeight;
    else if (document.body) h = document.body.clientHeight;
    return h;
};
/**
 *  Returns the height of the scrolled area for the body
 * 
 *  @return {Number}
 *  @scope public
 */
DOM.getBodyScrollTop = function () /* :Number */{
    return self.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || (document.body && document.body.scrollTop);
};
/**
 *  Returns the height of the scrolled area for the body
 * 
 *  @return {Number}
 *  @scope public
 */
DOM.getBodyScrollLeft = function () /* :Number */{
    return self.pageXOffset || (document.documentElement && document.documentElement.scrollLeft) || (document.body && document.body.scrollLeft);
};
/**
 *  Calculates cursor position properly
 *
 *  @param {Event} e event object to get cursor positions from
 *  @return {Object} object with x and y cursor positions
 *  @scope protected
 *  @see http://hartshorne.ca/2006/01/23/javascript_cursor_position/
 *  @author Beau Hartshorne
 */
DOM.getCursorPosition = function (e) {
    if (e.pageX || e.pageY) return {'x': e.pageX, 'y': e.pageY};
    
    var de = document.documentElement || document.body;
    return {'x': e.clientX + de.scrollLeft - (de.clientLeft || 0)
           ,'y': e.clientY + de.scrollTop - (de.clientTop || 0)};
};
/**
 *  Checks, if property matches a tagname(s)
 * 
 *  @param {HTMLElement} prop
 *  @param {String, Array} tags
 *  @return {Boolean}
 *  @scope public
 */
DOM.hasTagName = function (prop /* :HTMLElement */, tags /* :String, Array */) {
    if (isString(tags)) tags = [tags];
    if (!isArray(tags) || isEmpty(tags) || isUndefined(prop) || isEmpty(prop.tagName)) return false;
    var t = prop.tagName.toLowerCase();
    for (var i=0, tL=tags.length; i<tL; i++) {
        if (tags[i].toLowerCase() == t) return true;
    }
    return false;
};

/**
 *  DOM.CSS is the CSS processing class, allowing to easy mangle class names
 *
 *  @param {HTMLElement} el element to provide interface for
 *  @scope public
 *  @constructor
 *  @class DOM.CSS
 *  @exception on invalid parameter
 *  @depends arrayextensions.js
 *  @depends helpers.js
 */
DOM.CSS = function (el) {
  var keys = {
      'singleton' : 'DOM_CSS_singletonObject'
  };
  /**
   *  Interface itself
   *
   *  @param {HTMLElement} el element to provide interface for
   *  @return DOM.CSS
   */
  var instance = function(el) {
      var self = this
      /**
       *  Array of the css classes
       *
       *  @type Array
       *  @scope private
       */
         ,css = el.className.split(/\s+/)
         ,csstext = el.className;
      /**
       *  Adds the class name, unlimited number of arguments is supported
       *
       *  @param {String} class classname to apply to the element
       *  @return {String} new class name
       *  @scope public
       */
      self.addClass = function() {
          if (csstext != el.className) css = el.className.split(/\s+/);
          for (var i=arguments.length, ar, f=false; i>=0; i--) {
              ar=arguments[i];
              if (isString(ar) && css.indexOf(ar)==-1) {css[css.length] = ar; f=true};
          }
          if (f) el.className = css.join(" ");
          return csstext = el.className;
      };
      /**
       *  Removes the class name, unlimited number of arguments is supported
       *
       *  @param {String} class classname to apply to the element
       *  @return {String} new class name
       *  @scope public
       */
      self.removeClass = function() {
          if (csstext != el.className) css = el.className.split(/\s+/);
          for (var i=arguments.length, ar, f=false; i>=0; i--) {
              ar=arguments[i];
              if (isString(ar) && css.indexOf(ar)>-1) css.splice(css.indexOf(ar),1);
          }
          el.className = css.join(" ");
          return csstext = el.className;
      };
      /**
       *  Checks classname for the certain class
       *
       *  @param {String} c class name to check for
       *  @return {Boolean} class name existence
       *  @scope public
       */
      self.hasClass = function(c) {
          if (csstext != el.className) {
              csstext = el.className;
              css = csstext.split(/\s+/);
          }
          return css.indexOf(c)>-1;
      }
  };
  if (isUndefined(el.className)) { throw new Error('Invalid element supplied, no className attribute detected');};

  /*
  *  this is used for the IE, because sometimes it looses the singleton somehow
  */
  try {el[keys.singleton].t=true; return el[keys.singleton]} catch(e) { return el[keys.singleton] = new instance(el) }

};
