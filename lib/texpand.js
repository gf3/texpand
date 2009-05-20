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
Texpand.version = 0.9;
Texpand.prototype = {
  initialize: function(el, options) {
    // INIT
    this.options = {
      increment: 10,
      autoShrink: false,
      expandOnLoad: false,
      expandOnFocus: true,
      shrinkOnBlur: true,
      tabSize: 4,
      onExpand: Prototype.emptyFunction
    };
    Object.extend(this.options, options || {});
    this.element = $(el);
    
    // Requirements
    if (this.element.tagName.toLowerCase() != 'textarea') {
      throw (new Error('Texpand: can only be initialized with a <textarea> but got <' + this.element.tagName.toLowerCase() + '>'));
    }
    if (typeof Prototype == 'undefined' || (parseFloat(Prototype.Version.split(".")[0] + "." + Prototype.Version.split(".")[1]) < 1.6)) {
      throw (new Error('Texpand: requires Prototype 1.6.0+'));
    }
    if (typeof Effect == 'undefined') {
      throw (new Error('Textpand: requires Script.aculo.us, specifically Effects'));
    }
    
    // replace tabs with spaces.
    this.element.value = this.element.value.replace(/\t/g, ' '.times(this.options.tabSize));
    
    // Setup Textarea & mimic
    this.element.insert({after: '<div id="texpand-mimic-' + this.element.identify() + 'Parent"><div id="texpand-mimic-' + this.element.identify() + '">' + this.element.value + '</div></div>'}).setStyle({
      resize: 'none',
      overflow: 'hidden'
    });
    this.mimic = this.element.next().down();
    
    this._setWhitespaceAndUpdate();
        
    this._setMimicStyles();
    
    // Listen
    this.initialHeight = this.element.getHeight();
    this.element.observe("keyup", this._autoExpand.bind(this));
    if (this.options.expandOnFocus) this.element.observe("focus", this._autoExpand.bind(this));
    if (this.options.shrinkOnBlur) this.element.observe("blur", this._shrinkToInitial.bind(this));
    if (this.options.expandOnLoad) this._autoExpand();
    return this.element;
  },
  
  _setMimicStyles: function(){
    if (!this.elementStyles && !this.mimicStyles) {
      this.elementStyles = {};
      this.mimicStyles = {};
      // Fix default font size if in em's, based on a 10px em unit (This is an IE thing mainly)
      var fontSize = this.element.getStyle('fontSize');
      this.elementStyles.fontSize = fontSize;
      if (fontSize.search(/em/) >= 0) {
        var pixelSize = parseFloat(fontSize.replace(/em/, '')) * 10;
        this.elementStyles.fontSize = pixelSize + 'px';
      }
      
      // Duplicate style
      var properties = $w('borderBottomColor borderBottomStyle borderBottomWidth borderTopColor borderTopStyle borderTopWidth borderRightColor borderRightStyle borderRightWidth borderLeftColor borderLeftStyle borderLeftWidth fontSize fontFamily fontWeight letterSpacing lineHeight marginTop marginRight marginBottom marginLeft paddingTop paddingRight paddingBottom paddingLeft textAlign textIndent width wordSpacing');
      for (var i = 0, length = properties.length; i < length; i++) {
        this.mimicStyles[properties[i]] = this.element.getStyle(properties[i]);
      }
      this.mimicStyles.display = 'block';
      this.mimicStyles.position = 'absolute';
      this.mimicStyles.left = '-9999px';
      this.mimicStyles.top = '-9999px';
      
      // Reset font-family (IE7 & IE8 issue)
      this.elementStyles.fontFamily = this.mimic.getStyle('fontFamily');
      this.mimicStyles.fontSize = this.elementStyles.fontSize;
      
      // Fix width for browser inconsistencies (Again an IE thing mainly) [Thanks tfluehr]
      var estimatedWidth = this.element.getWidth();
      if (estimatedWidth != this.mimic.getWidth()){
        var tmpInt;
        $w('marginLeft marginRight borderLeftWidth borderRightWidth paddingLeft paddingRight').each(function(item){
          estimatedWidth -= isNaN(tmpInt = parseInt(this.element.getStyle(item), 10)) ? 0 : tmpInt;
        }.bind(this));
        estimatedWidth += 'px';
        this.mimicStyles.width = estimatedWidth;
      }
    }
    this.mimic.setStyle(this.mimicStyles);
    this.element.setStyle(this.elementStyles);
  },
  
  // ugly, ugly, ugly hack because of IE not supporting white-space: pre-wrap
  // plus an even uglier hack because IE has another bug where if you dynamically update a <pre> tag
  // or any element that has white-space: pre then the pre formatting is lost.
  _setWhitespaceAndUpdate: function(){
    if (!this.whiteSpaceChecked) {
      // list of possible pre values
      var vals = $w('pre-wrap -moz-pre-wrap -pre-wrap -o-pre-wrap pre');
      var cVal;
      vals.each(function(item){
        try {
          this.mimic.setStyle({
            'whiteSpace': item
          });
          if (this.mimic.getStyle('whiteSpace') != item) throw 'error';
        } 
        catch (e) {
          // browser error or our own telling us that the value wasn't accepted
          return;
        }
        cVal = item;
        // value was accepted to we're done
        throw $break;
      }.bind(this));
      
      // if IE "pre" value then activate hack
      if (cVal == 'pre') this.wsHack = true;
      else {
        // secondary check for IE bug where pre formatting is lost.
        this.wsHack = this._testForSecondIEBug();
      }
      // cache that we did the check so it is only done once
      this.whiteSpaceChecked = true;
    }
    
    // values the same, skip updating
    if (this.mimic.innerHTML == this.element.value) return;
        
    if (this.wsHack) {
      var mParent = this.mimic.up();
      mParent.update('<pre id="texpand-mimic-' + this.element.identify() + '">'+ this.element.value + '<br /></pre>');
      // reset this.mimic to proper new element
      this.mimic = mParent.down();
      // reset styles on mimic because of new element
      this._setMimicStyles();
      // IE hack for white-space: pre to make word wrap function
      this.mimic.setStyle({ wordWrap: 'break-word' });
    }
    else {
      // good browsers so no hack
      this.mimic.update(this.element.value + '<br />');
    }
  },
  
  // check for IE losing pre formatting
  _testForSecondIEBug: function(){
    var str = 'a \n'.times(10);
    this.mimic.update(str);
    return this.mimic.getHeight() === 0 || !this.mimic.innerHTML.include('\n');
  },
  
  _effect: function(h) {
    // Clear queue
    var queue = Effect.Queues.get('texpand' + this.element.identify());
    queue.each(function(effect) {
      effect.cancel();
    });
    // Shrink or Expand according to value of h
    this.element.morph('height: ' + h + 'px;', {
      duration: 0.05,
      queue: {
        position: 'end',
        scope: 'texpand' + this.element.identify(),
        limit: 2
      }
    });
  },
  
  // shrink to Initial height
  _shrinkToInitial: function(ev) {
    this._effect(this.initialHeight);
  },
  
  // Auto expand height if required
  _autoExpand: function(ev) {
    if (ev) {
      // Keeps the keyboard from slowing down ie by only running the 
      // morph if the keyboard hasnt been touched for 0.1 seconds
      clearTimeout(this.keypressDelay);
      this.keypressDelay = this.doExpand.bind(this).delay(0.1, ev);
    }
    else this.doExpand();
  },
  
  doExpand: function(ev) {
    // Code to actually do the heavy lifting
    this._setWhitespaceAndUpdate();
    var mimicCurrentHeight = this.mimic.getHeight();
    var elementCurrentHeight = this.element.getHeight();
    var differenceHeight = elementCurrentHeight - mimicCurrentHeight;
    var targetHeight;
    // If the elements value == '' then we want the target height to be the inital height 
    // set when the texpand was created, usually a one line text box.
    if (this.element.value === '') targetHeight = this.initialHeight;
    else targetHeight = elementCurrentHeight + (this.options.increment - differenceHeight);
    
    if ((this.options.autoShrink && (differenceHeight > this.options.increment) || this.element.value === '') || differenceHeight < this.options.increment) {
      // Expand
      this._effect(targetHeight);
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
