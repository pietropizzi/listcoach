(function() {
  var Orderly,
      global,
      supports,
      defaultOptions = {
        itemSelector: 'li',
        handleSelector: ''
      };

  supports = (function () {
    return {
      touch: (function() {
        try {
          return window.hasOwnProperty('ontouchstart');
        } catch (e) {
          return false;
        }
      })(),

      transitionPrefix: (function() {
        var style = document.createElement('orderly').style,
            transitionProps = ["WebkitTransition", "MozTransition", "OTransition", "msTransition"],
            prefix;

        for ( var i in transitionProps ) {
          var prop = transitionProps[i];
          if ( style[prop] !== undefined ) {
            prefix = prop.split('Transition')[0];
          }
        }
        
        if (prefix) {
          return '-' + prefix.charAt(0).toLowerCase() + prefix.slice(1) + '-';
        }
        return false;
      })()
    };
  })();

  Orderly = function (el, options) {
    this.settings = $.extend({}, defaultOptions, options);
    this.$list = $(el).first();

    this.onDragStart = this.onDragStart.bind(this, supports.touch);
    this.onDragMove  = this.onDragMove.bind(this, supports.touch);
    this.onDragEnd   = this.onDragEnd.bind(this, supports.touch);
  };

  $.extend(Orderly.prototype, {

    settings: null,
    itemHeight: 0,
    itemCount: 0,

    $list: null,
    $items: null,

    enable: function() {
      toggleStartListeners.call(this, true);

      this.$items = this.getItems();
      this.itemCount = this.getItemCount();
      this.itemHeight = this.getItemHeight();
    },

    disable: function() {
      toggleStartListeners.call(this, false);

      this.$items = null;
      this.itemCount = 0;
      this.itemHeight = 0;
    },

    onDragStart: function(isTouch, event) {
      var coordObj;

      // TODO This does not work
      if (supports.touch && event.originalEvent.touches.length > 1) {
        return true;
      }

      coordObj = isTouch ? event.originalEvent.changedTouches[0] : event;

      $(isTouch ? event.target : document)
        .on(isTouch ? 'touchmove' : 'mousemove', this.onDragMove)
        .on(isTouch ? 'touchend' : 'mouseup', this.onDragEnd);

      this.$dragging = this.getDraggingElement(event);
      this.start(coordObj.pageX, coordObj.pageY);
      return false;
    },

    onDragMove: function(isTouch, event) {
      var coordObj = isTouch ? event.originalEvent.changedTouches[0] : event;
      this.move(coordObj.pageX - this.startX, coordObj.pageY - this.startY);
    },

    onDragEnd: function(isTouch, event) {
      $(isTouch ? event.target : document)
        .off(isTouch ? 'touchmove' : 'mousemove', this.onDragMove)
        .off(isTouch ? 'touchend' : 'mouseup', this.onDragEnd);

      this.end();
    },

    start: function(startX, startY) {
      this.startX = startX;
      this.startY = startY;

      this.$items = this.getItems();
      toggleSortingStyles.call(this, true);

      this.startIndex = this.$items.index(this.$dragging);
      this.currentIndex = this.startIndex;
    },

    move: function(dx, dy) {
      var indexDiff, newIndex;

      // Move dragged object
      this.$dragging.css({
        top: dy,
        left: dx
      });

      indexDiff = Math.round(dy / this.itemHeight);
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
          top = this.itemHeight;
        } else if (i > this.startIndex && i <= newIndex) {
          top = -this.itemHeight;
        }

        $(item).css('top', top);
      }.bind(this));
    },

    end: function() {
      var insertFunc = this.currentIndex < this.startIndex ? 'insertBefore' : 'insertAfter',
          insertEl = this.$items.eq(this.currentIndex);

      toggleSortingStyles.call(this, false);
      
      if (this.currentIndex !== this.startIndex) {
        this.$dragging[insertFunc](insertEl);
      }

      delete this.startX;
      delete this.startY;
      delete this.currentIndex;
      delete this.startIndex;
      delete this.$dragging;
    },

    getItemCount: function() {
      return (this.$items && this.$items.length) ? this.$items.length : 0;
    },

    getItemHeight: function() {
      if (this.$items.length > 1) {
        return this.$items.get(1).offsetTop - this.$items.get(0).offsetTop;
      } else {
        return 0;
      }
    },

    getItems: function() {
      return this.$list.find(this.settings.itemSelector);
    },

    getDraggingElement: function(event) {
      if (this.settings.handleSelector) {
        return $(event.target).parent(this.settings.itemSelector);
      } else {
        return $(event.target);
      }
    }
  });

  function toggleSortingStyles (toggle) {
    var transitionProp = supports.transitionPrefix + 'transition';
    if (toggle) {
      this.$items
        .css('position', 'relative')
        .not(this.$dragging)
          .css(transitionProp, 'top .3s');

      this.$dragging.css('z-index', 1);
    } else {
      this.$items
        .css(transitionProp, '')
        .css({
          position: '',
          top: '',
          left: '',
          'z-index': ''
        });
    }

    this.$dragging.toggleClass('orderly-sorting-element', toggle);
    this.$list.toggleClass('orderly-sorting-list', toggle);
  }

  function toggleStartListeners (toggle) {
    var onOff = toggle ? 'on' : 'off';
    this.$list[onOff](supports.touch ? 'touchstart' : 'mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onDragStart);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Orderly;
  } else {
    global = (function () {
      return this;
    }());
    global.Orderly = Orderly;
  }
})();
