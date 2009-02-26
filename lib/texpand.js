// Texpand v0.1
// Unobtrusively resize textarea's as content is added.
//
// Copyright (c) 2008, Gianni Chiappetta - gianni[at]runlevel6[dot]org
//
// Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to
// permit persons to whom the Software is furnished to do so, subject to
// the following conditions:
// 
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
// LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
// OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// Texpand Class
//------------------------------------------------------------------------------
var Texpand = Class.create();
Texpand.prototype = {
  initialize: function(el) {
    // INIT
    var obj = this;
    this.element = $(el);
    this.increment = 30;
    
    // Requirements
    if (this.element.tagName.toLowerCase() != 'textarea') throw('Texpand: can only be initialized with a <textarea> but got <'+this.element.tagName.toLowerCase()+'>');
    if (typeof Prototype=='undefined' || (parseFloat(Prototype.Version.split(".")[0] + "." + Prototype.Version.split(".")[1]) < 1.6)) throw('Texpand: requires Prototype 1.6.0+');
    if (typeof Effect=='undefined') throw('Textpand: requires Script.aculo.us, specifically Effects');
    
    // Setup Textarea & mimic
    this.element.insert({after: '<div id="texpand-mimic-'+this.element.identify()+'"></div>'});
    this.mimic = this.element.next();
    this.mimic.update(this.element.value);
    
    // Fix IE default font size, based on a 10px em unit
    if (Prototype.Browser.IE) {
      var fontSize = this.element.getStyle('fontSize');
      if (fontSize.search(/em/) >= 0) {
        var pixelSize = parseFloat(fontSize.replace(/em/, ''))*10;
        this.element.setStyle({fontSize: pixelSize+'px'});
      }
    }
    
    // Duplicate style
    var style = {};
    var properties = $w('borderBottomColor borderBottomStyle borderBottomWidth borderTopColor borderTopStyle borderTopWidth borderRightColor borderRightStyle borderRightWidth borderLeftColor borderLeftStyle borderLeftWidth fontSize fontFamily fontWeight letterSpacing lineHeight marginTop marginRight marginBottom marginLeft paddingTop paddingRight paddingBottom paddingLeft textAlign textIndent width wordSpacing');
    properties.each(function(property){
      style[property] = obj.element.getStyle(property);
    });
    this.mimic.setStyle(style);
    this.mimic.setStyle({display: 'block', position: 'absolute', left: '-9999px', top: '-9999px'});
        
    // Listen
    this.element.observe("keyup", obj._autoExpand.bind(obj));
    
    return this.element;
  },
  
  // Auto expand height if required
  _autoExpand: function(ev) {
    this.mimic.update(this.element.value.replace(/\n/gm, '<br />'));
    
    var mimicCurrentHeight    = this.mimic.getHeight();
    var elementCurrentHeight  = this.element.getHeight();
    var differenceHeight      = elementCurrentHeight-mimicCurrentHeight;
    var targetHeight          = elementCurrentHeight + (this.increment - differenceHeight);
    
    if (differenceHeight < this.increment) {
      // Clear queue
      var queue = Effect.Queues.get('texpand'+this.element.identify());
      queue.each(function(effect) { effect.cancel(); });
      
      // Expand
      this.element.morph('height: '+targetHeight+'px;', { duration: 0.1, queue: { position: 'end', scope: 'texpand'+this.element.identify(), limit: 2 } });
    }
  }
};
