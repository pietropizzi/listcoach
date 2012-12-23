(function() {
  var Orderly,
      global,
      defaultOptions = {
        itemSelector: 'li',
        handleSelector: ''
      };

  function __bind (fn, me){ return function(){ return fn.apply(me, arguments); }; }

  function toggleSortingStyles (toggle) {
    if (toggle) {
      this.$items
        .css('position', 'relative')
        .not(this.$dragging)
          .css('-webkit-transition', 'top .3s');

      this.$dragging
        .css('z-index', 1)
        .addClass('orderly-sorting-element');
    } else {
      this.$items
        .css('-webkit-transition', '')
        .css({
          position: '',
          top: '',
          left: '',
          'z-index': ''
        });

      this.$dragging.removeClass('orderly-sorting-element');
    }
  }

  function isTouchDevice () {
    try {
      return window.hasOwnProperty('ontouchstart');
    } catch (e) {
      return false;
    }
  }

  Orderly = function (el, options) {
    this.settings = $.extend({}, defaultOptions, options);
    this.$list = $(el).first();
    this.$items = null;
    this.height = 0;
    this._enabled = false;
  };

  Orderly.prototype.enable = function() {
    if (isTouchDevice()) {
      this.onTouchStart = __bind(this.onTouchStart, this);
      this.onTouchMove = __bind(this.onTouchMove, this);
      this.onTouchEnd   = __bind(this.onTouchEnd, this);
      this.$list.on('touchstart', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onTouchStart);
    } else {
      this.onMouseDown = __bind(this.onMouseDown, this);
      this.onMouseMove = __bind(this.onMouseMove, this);
      this.onMouseUp   = __bind(this.onMouseUp, this);
      this.$list.on('mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onMouseDown);
    }

    this.setItems();
    this.setItemHeight();
    this._enabled = true;
  };

  Orderly.prototype.disable = function() {
    if (isTouchDevice()) {
      this.$list.off('touchstart', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onTouchStart);
    } else {
      this.$list.off('mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onMouseDown);
    }

    this.$items = null;
    this.height = 0;
    this._enabled = false;
  };

  Orderly.prototype.onMouseDown = function(event) {
    $(document).on({
      mousemove: this.onMouseMove,
      mouseup: this.onMouseUp
    });

    this.startX = event.pageX;
    this.startY = event.pageY;
    this.start();
    return false;
  };

  Orderly.prototype.onMouseMove = function(event) {
    this.move(event.pageX - this.startX, event.pageY - this.startY);
  };

  Orderly.prototype.onMouseUp = function() {
    $(document).off({
      mousemove: this.onMouseMove,
      mouseup: this.onMouseUp
    });
    this.end();
    delete this.startX;
    delete this.startY;
  };

  Orderly.prototype.onTouchStart = function(event) {
    var changedTouch = event.originalEvent.changedTouches[0];

    $(event.target).on({
      touchmove: this.onTouchMove,
      touchend: this.onTouchEnd
    });

    this.startX = changedTouch.pageX;
    this.startY = changedTouch.pageY;
    this.start();
    return false;
  };

  Orderly.prototype.onTouchMove = function(event) {
    var changedTouch = event.originalEvent.changedTouches[0];
    this.move(changedTouch.pageX - this.startX, changedTouch.pageY - this.startY);
  };

  Orderly.prototype.onTouchEnd = function(event) {
    $(event.target).off({
      touchmove: this.onTouchMove,
      touchend: this.onTouchEnd
    });
    this.end();
    delete this.startX;
    delete this.startY;
  };

  Orderly.prototype.setItemHeight = function() {
    if (this.$items.length > 1) {
      return this.height = this.$items.get(1).offsetTop - this.$items.get(0).offsetTop;
    } else {
      return this.height = 0;
    }
  };

  Orderly.prototype.setItems = function() {
    this.$items = this.$list.find(this.settings.itemSelector);
    this.itemCount = this.$items.length;
  };

  Orderly.prototype.setDragging = function() {
    if (this.settings.handleSelector) {
      this.$dragging = $(event.target).parent(this.settings.itemSelector);
    } else {
      this.$dragging = $(event.target);
    }
  };

  Orderly.prototype.start = function() {
    this.setItems();
    this.setDragging();

    toggleSortingStyles.call(this, true);

    this.startIndex = this.$items.index(this.$dragging);
    this.currentIndex = this.startIndex;
    console.log('start: ', this.startIndex);
  };

  Orderly.prototype.move = function(dx, dy) {
    var indexDiff, newIndex;

    // Move dragged object
    this.$dragging.css({
      top: dy,
      left: dx
    });

    indexDiff = Math.round(dy / this.height);
    indexDiff = Math.max(indexDiff, -this.startIndex); 
    indexDiff = Math.min(indexDiff, this.itemCount - this.startIndex - 1);
    newIndex = this.startIndex + indexDiff;

    // If the current index did not change return
    if (this.currentIndex === newIndex) {
      return;
    }

    this.currentIndex = newIndex;

    this.$items.each(function(i, item) {
      var top = '';

      // If this item is the dragged one we don't need to do anything
      if (i === this.startIndex) {
        return;
      }

      if (i < this.startIndex && i >= newIndex) {
        top = this.height;
      } else if (i > this.startIndex && i <= newIndex) {
        top = -this.height;
      }

      $(item).css('top', top);
    }.bind(this));
  };

  Orderly.prototype.end = function() {
    var insertFunc = this.currentIndex < this.startIndex ? 'insertBefore' : 'insertAfter',
        insertEl = this.$items.eq(this.currentIndex);

    toggleSortingStyles.call(this, false);
    
    if (this.currentIndex !== this.startIndex) {
      this.$dragging[insertFunc](insertEl);
    };

    delete this.currentIndex;
    delete this.startIndex;
    delete this.$dragging;
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Orderly;
  } else {
    global = (function () {
      return this;
    }());
    global.Orderly = Orderly;
  }
})();
