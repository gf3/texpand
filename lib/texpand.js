// Texpand
// Unobtrusively resize textarea's height as content is added.
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
Texpand.version = 0.6;
Texpand.prototype = {
  initialize: function(el, options) {
    this.options = {
      increment: 15,
      onExpand: Prototype.emptyFunction
    };
    Object.extend(this.options, options || {});
    
    // INIT
    this.element = $(el);
    
    // Requirements
    if (this.element.tagName.toLowerCase() != 'textarea') {
      throw(new Error('Texpand: can only be initialized with a <textarea> but got <' + this.element.tagName.toLowerCase() + '>'));
    }
    if (typeof Prototype == 'undefined' || (parseFloat(Prototype.Version.split(".")[0] + "." + Prototype.Version.split(".")[1]) < 1.6)) {
      throw(new Error('Texpand: requires Prototype 1.6.0+'));
    }
    if (typeof Effect == 'undefined') {
      throw(new Error('Textpand: requires Script.aculo.us, specifically Effects'));
    }
    
    // Setup Textarea & mimic
    this.element.insert({after: '<div id="texpand-mimic-'+this.element.identify()+'"></div>'}).setStyle({resize: 'none', overflow: 'hidden'});
    this.mimic = this.element.next();
    this.mimic.update(this.element.value);
    
    // Fix default font size if in em's, based on a 10px em unit (This is an IE thing mainly)
    var fontSize = this.element.getStyle('fontSize');
    if (fontSize.search(/em/) >= 0) {
      var pixelSize = parseFloat(fontSize.replace(/em/, ''))*10;
      this.element.setStyle({fontSize: pixelSize+'px'});
    }
    
    // Duplicate style
    var style = {};
    var properties = $w('borderBottomColor borderBottomStyle borderBottomWidth borderTopColor borderTopStyle borderTopWidth borderRightColor borderRightStyle borderRightWidth borderLeftColor borderLeftStyle borderLeftWidth fontSize fontFamily fontWeight letterSpacing lineHeight marginTop marginRight marginBottom marginLeft paddingTop paddingRight paddingBottom paddingLeft textAlign textIndent width wordSpacing');
    for (var i=0, length=properties.length; i < length; i++) {
      style[properties[i]] = this.element.getStyle(properties[i]);
    }
    this.mimic.setStyle(Object.extend(style, {display: 'block', position: 'absolute', left: '-9999px', top: '-9999px'}));
    
    // Reset font-family (IE7 & IE8 issue)
    this.element.setStyle({fontFamily: this.mimic.getStyle('fontFamily')});
    
    // Fix width for browser inconsistencies (Again an IE thing mainly) [Thanks tfluehr]
    var estimatedWidth = this.element.getWidth();
    if (estimatedWidth != this.mimic.getWidth()) {
      var tmpInt;
      estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle('marginLeft'),10)) ? 0 : tmpInt;
      estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle('marginRight'),10)) ? 0 : tmpInt;
      estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle('borderLeftWidth'),10)) ? 0 : tmpInt;
      estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle('borderRightWidth'),10)) ? 0 : tmpInt;
      estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle('paddingLeft'),10)) ? 0 : tmpInt;
      estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle('paddingRight'),10)) ? 0 : tmpInt;
      estimatedWidth += 'px';
      this.mimic.setStyle({width: estimatedWidth});
    }
    
    // Listen
    this.element.observe("keyup", this._autoExpand.bind(this));
    
    return this.element;
  },
  
  // Auto expand height if required
  _autoExpand: function(ev) {
    this.mimic.update(this.element.value.replace(/\n/gm, '<br />') + '<br />');
    
    var mimicCurrentHeight    = this.mimic.getHeight();
    var elementCurrentHeight  = this.element.getHeight();
    var differenceHeight      = elementCurrentHeight-mimicCurrentHeight;
    var targetHeight          = elementCurrentHeight + (this.options.increment - differenceHeight);
    if (differenceHeight < this.options.increment) {
      // Clear queue
      var queue = Effect.Queues.get('texpand'+this.element.identify());
      queue.each(function(effect) { effect.cancel(); });
      
      // Expand
      this.element.morph('height: '+targetHeight+'px;', { duration: 0.05, queue: { position: 'end', scope: 'texpand'+this.element.identify(), limit: 2 } });
      this.options.onExpand.call(ev);
    }
  },
  
  // Add text and resize
  appendText: function(text) {
    this.element.value += text;
    this._autoExpand();
  },
  
  // Replace text and resize
  setValue: function(text) {
    this.element.value = text;
    this._autoExpand();
  }
};
