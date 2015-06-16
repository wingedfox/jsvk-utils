/**
 *  $Id$
 *  $HeadURL$
 * 
 *  @author Ildar Shaimordanov
 *  @author Ilya Lebedev
 *  @license LGPL
 *  @version $Rev$
 */
/**
 * Converts UTF-32 codes to string of chars
 *
 * @param {Number} code char code
 * @return {String}
 * @scope public
 */
String.fromCharCodeExt = function(code) {
    if (code<0x10000) {
        return String.fromCharCode(code);
    }
    code -= 0x10000;
    return String.fromCharCode(code >>10 | 0xD800)+String.fromCharCode(code & 0x3FF | 0xDC00)
}
/**
 *  Decodes html entities
 *
 *  @return {String} string with decoded entities
 *  @scope public
 */
String.prototype.entityDecode = function() {
    if (!arguments.callee.span) arguments.callee.span = document.createElement('span');
    var s = arguments.callee.span;
    s.innerHTML = this;
    return s.firstChild?s.firstChild.nodeValue:"";
}

/**
 *  Method is used to trim specified chars from the left of the string
 * 
 *  @param {String, Array} c char or char list to be trimmed, default is \s
 *  @return {String}
 *  @scope public
 */
String.prototype.ltrim = function(c) {
    if (isString(c)) c=c.split("");
    if (isArray(c) || isUndefined(c)) {
        c = isEmpty(c)?"\\s":RegExp.escape(c); 
        c = new RegExp("^(?:"+c+")+", "g");
        return this.replace(c, "");
    }
    return this; 
}
/**
 *  Method is used to trim specified list from the right of the string
 * 
 *  @param {String, Array} c char or char sequence to be trimmed, default is \s
 *  @return {String}
 *  @scope public
 */
String.prototype.rtrim = function(c) {
    if (isString(c)) c=c.split("");
    if (isArray(c) || isUndefined(c)) {
        c = isEmpty(c)?"\\s":RegExp.escape(c); 
        c = new RegExp("(?:"+c+")+$", "g");
        return this.replace(c, "");
    }
    return this; 
}
