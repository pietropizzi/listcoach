(function() {
  var Orderly,
      global,
      defaultOptions = {
        itemSelector: 'li',
        handleSelector: ''
      },
      supports;

  supports = (function () {
    return {
      touch: (function() {
        try {
          return window.hasOwnProperty('ontouchstart');
        } catch (e) {
          return false;
        }
      })()
    };
  })();

  function toggleSortingStyles (toggle) {
    if (toggle) {
      this.$items
        .css('position', 'relative')
        .not(this.$dragging)
          .css('-webkit-transition', 'top .3s');

      this.$dragging.css('z-index', 1);
    } else {
      this.$items
        .css({
          '-webkit-transition': '',
          position: '',
          top: '',
          left: '',
          'z-index': ''
        });
    }

    this.$dragging.toggleClass('orderly-sorting-element', toggle);
    this.$list.toggleClass('orderly-sorting-list', toggle);
  }

  Orderly = function (el, options) {
    this.settings = $.extend({}, defaultOptions, options);
    this.$list = $(el).first();
    this.$items = null;
    this.height = 0;
    this._enabled = false;
  };

  Orderly.prototype.enable = function() {
    this.onDragStart = this.onDragStart.bind(this, supports.touch);
    this.onDragMove  = this.onDragMove.bind(this, supports.touch);
    this.onDragEnd   = this.onDragEnd.bind(this, supports.touch);
    this.$list.on(supports.touch ? 'touchstart' : 'mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onDragStart);

    this.setItems();
    this.setItemHeight();
    this._enabled = true;
  };

  Orderly.prototype.disable = function() {
    this.$list.off(supports.touch ? 'touchstart' : 'mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onDragStart);

    this.$items = null;
    this.height = 0;
    this._enabled = false;
  };

  Orderly.prototype.onDragStart = function(isTouch, event) {
    var coordObj = isTouch ? event.originalEvent.changedTouches[0] : event;

    $(isTouch ? event.target : document)
      .on(isTouch ? 'touchmove' : 'mousemove', this.onDragMove)
      .on(isTouch ? 'touchend' : 'mouseup', this.onDragEnd);

    this.startX = coordObj.pageX;
    this.startY = coordObj.pageY;
    this.start();
    return false;
  };

  Orderly.prototype.onDragMove = function(isTouch, event) {
    var coordObj = isTouch ? event.originalEvent.changedTouches[0] : event;
    this.move(coordObj.pageX - this.startX, coordObj.pageY - this.startY);
  };

  Orderly.prototype.onDragEnd = function(isTouch, event) {
    $(isTouch ? event.target : document)
      .off(isTouch ? 'touchmove' : 'mousemove', this.onDragMove)
      .off(isTouch ? 'touchend' : 'mouseup', this.onDragEnd);

    delete this.startX;
    delete this.startY;
    this.end();
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
