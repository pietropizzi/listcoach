(function() {
  var Orderly,
      global,
      supports,
      $doc,
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

      transitionProperty: (function() {
        var style = document.createElement('orderly').style,
            transitionProps = ['transition', 'WebkitTransition', 'MozTransition', 'OTransition', 'msTransition'],
            transition;

        for ( var i in transitionProps ) {
          var prop = transitionProps[i];
          if ( style[prop] !== undefined ) {
            transition = prop.split('Transition');
            transition = transition.length === 1 ?
                transition[0] :
                '-' + transition[0].charAt(0).toLowerCase() + transition[0].slice(1) + '-transition';
          }
        }

        return transition;
      })()
    };
  })();

  Orderly = function (el, options) {
    this.settings = $.extend({}, defaultOptions, options);
    this.$list = $(el).first();
    $doc = $(document);

    this.onDragStart = this.onDragStart.bind(this, supports.touch);
    this.onDragMove  = this.onDragMove.bind(this, supports.touch);
    this.onDragEnd   = this.onDragEnd.bind(this, supports.touch);
  };

  $.extend(Orderly.prototype, {

    settings: null,
    itemHeight: 0,
    itemCount: 0,
    scrolling: false,

    $list: null,
    $items: null,

    enable: function() {
      toggleStartListeners.call(this, true);

      this.$items = this.getItems().css('top', '0');
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
      this.containerScroll = window.innerHeight + $doc.scrollTop();
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

      this.scroll();

      // If the current index did not change return
      if (this.currentIndex === newIndex) {
        return;
      }

      this.currentIndex = newIndex;

      this.$items.each(function(i, item) {
        var top = '0';

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

    scroll: function() {
      var draggingTop = this.$dragging.offset().top;

      if ((draggingTop + 20) > this.containerScroll)  {
        this.scrolling = true;
        $doc.scrollTop($doc.scrollTop() + 8);
        this.containerScroll += 8;
      } else if ((draggingTop - 20) < $doc.scrollTop()) {
        this.scrolling = true;
        $doc.scrollTop($doc.scrollTop() - 8);
        this.containerScroll -= 8;
      }
    },

    end: function() {
      var insertFunc = this.currentIndex < this.startIndex ? 'insertBefore' : 'insertAfter',
          insertEl = this.$items.eq(this.currentIndex);

      toggleSortingStyles.call(this, false).done(function() {
        if (this.currentIndex !== this.startIndex) {
          this.$dragging[insertFunc](insertEl);
        }

        delete this.startX;
        delete this.startY;
        delete this.currentIndex;
        delete this.startIndex;
        delete this.$dragging;
      }.bind(this));
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
    var transitionProp = supports.transitionProperty,
        transitionDeferred = $.Deferred(),
        resetTop;

    if (toggle) {
      // Set transitions and starting position on all items
      this.$items.css(transitionProp, 'top .3s').css({position: 'relative', top: '0'});
      // No transition for draggin item
      this.$dragging.css(transitionProp, '').css('z-index', 1);
      transitionDeferred.resolve();
    } else {
      resetTop = (this.currentIndex - this.startIndex) * this.itemHeight;
      // No transition for all items
      this.$items.css(transitionProp, '');
      // Transition for draging item
      this.$dragging.css(transitionProp, 'top .2s, left .2s').css({top: resetTop, left: '0'});

      setTimeout(function() {
        // Reset item styles
        this.$items.css({
          position: '',
          top: '',
          left: '',
          'z-index': ''
        });
        transitionDeferred.resolve();
      }.bind(this), 200);
    }

    this.$dragging.toggleClass('orderly-sorting-element', toggle);
    this.$list.toggleClass('orderly-sorting-list', toggle);

    return transitionDeferred;
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
