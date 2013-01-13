(function() {
  var Listcoach,
      global,
      supports,
      scrollTimeout,
      getStyleProperty,
      $doc,

      browserPrefixes = ['', 'Webkit', 'Moz', 'O', 'ms'],

      defaultOptions = {
        itemSelector: 'li',
        handleSelector: '',
        draggingElementClass: 'listcoach-dragging-element',
        draggingListClass: 'listcoach-dragging-list',
        zIndex: 1000,
        scrollOffset: 50,
      };

  getStyleProperty = function(property) {
    var style = document.createElement('listcoach').style,
        titleCaseProperty = property.charAt(0).toUpperCase() + property.slice(1),
        result;

    for ( var i in browserPrefixes ) {
      var prefix = browserPrefixes[i],
          prop = prefix ? prefix + titleCaseProperty : property;

      if ( style[prop] !== undefined ) {
        result = prop.split(titleCaseProperty);
        result = result.length === 1 ?
            result[0] : '-' + result[0].toLowerCase() + '-' + property;
      }
    }
    return result;
  };

  supports = {
    touch: (function() {
      try {
        return window.hasOwnProperty('ontouchstart');
      } catch (e) {
        return false;
      }
    })(),

    transitionProperty: getStyleProperty('transition'),

    transformProperty: getStyleProperty('transform')
  };

  Listcoach = function (el, options) {
    this.settings = $.extend({}, defaultOptions, options);
    this.$list = $(el).first();
    $doc = $(document);

    this.onDragStart = this.onDragStart.bind(this, supports.touch);
    this.onDragMove  = this.onDragMove.bind(this, supports.touch);
    this.onDragEnd   = this.onDragEnd.bind(this, supports.touch);
  };

  $.extend(Listcoach.prototype, {

    settings: null,
    itemHeight: 0,
    itemCount: 0,
    scrolling: false,

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
      this.containerScroll = window.innerHeight + window.scrollY;
      this.startX = startX;
      this.startY = startY;

      this.$items = this.getItems();
      toggleSortingStyles.call(this, true);

      this.startIndex = this.$items.index(this.$dragging);
      this.currentIndex = this.startIndex;
    },

    move: function(dx, dy) {
      var transformProp = supports.transformProperty,
          totalIndexDiff, currentDiff, newIndex, top, elements, i;

      // Move dragged object
      this.$dragging.css(transformProp, 'translate3d(' + dx + 'px, ' + dy + 'px, 0)');

      totalIndexDiff = Math.round(dy / this.itemHeight);
      totalIndexDiff = Math.max(totalIndexDiff, -this.startIndex);
      totalIndexDiff = Math.min(totalIndexDiff, this.itemCount - this.startIndex - 1);
      newIndex = this.startIndex + totalIndexDiff;

      clearTimeout(scrollTimeout);
      this.scroll(dx, dy);

      // If the current index did not change return
      if (this.currentIndex === newIndex) {
        return;
      }

      currentDiff = newIndex - this.currentIndex;

      if (currentDiff > 0) {
        if (newIndex > this.startIndex) {
          elements = this.$items.eq(newIndex);
          top = -this.itemHeight;
          for (i = 1; i < currentDiff; i++) {
            elements = elements.add(this.$items.eq(newIndex - i));
          }
        } else if (newIndex <= this.startIndex) {
          elements = this.$items.eq(this.currentIndex);
          top = 0;
          for (i = 1; i < currentDiff; i++) {
            elements = elements.add(this.$items.eq(this.currentIndex - i));
          }
        }
      } else if (currentDiff < 0) {
        if (newIndex < this.startIndex) {
          elements = this.$items.eq(newIndex);
          top = this.itemHeight;
          for (i = -1; i > currentDiff; i--) {
            elements = elements.add(this.$items.eq(newIndex + i));
          }
        } else if (newIndex >= this.startIndex) {
          elements = this.$items.eq(this.currentIndex);
          top = 0;
          for (i = -1; i > currentDiff; i--) {
            elements = elements.add(this.$items.eq(this.currentIndex + i));
          }
        }
      }

      this.currentIndex = newIndex;
      elements.css(transformProp, 'translate3d(0, ' + top + 'px, 0)');
    },

    scroll: function(dx, dy) {
      var draggingTop = this.$dragging.offset().top + this.itemHeight / 2,
          scrollBy;

      if ((draggingTop + this.settings.scrollOffset) > this.containerScroll)  {
        scrollBy = 8;
      } else if ((draggingTop - this.settings.scrollOffset) < window.scrollY && window.scrollY > 0) {
        scrollBy = -8;
      } else {
        this.scrolling = false;
        return;
      }

      this.scrolling = true;
      window.scrollBy(0, scrollBy);
      this.containerScroll += scrollBy;
      this.containerScroll = Math.min(this.containerScroll, $(document).height());

      scrollTimeout = setTimeout(this.move.bind(this, dx, dy + scrollBy), 25);
    },

    end: function() {
      var insertFunc = this.currentIndex < this.startIndex ? 'insertBefore' : 'insertAfter',
          insertEl = this.$items.eq(this.currentIndex);

      toggleSortingStyles.call(this, false).done(function() {

        if (this.currentIndex !== this.startIndex) {
          this.$dragging[insertFunc](insertEl);
        }

        this.trigger('sortupdate', [this.startIndex, this.currentIndex]);

        clearTimeout(scrollTimeout);

        delete this.startX;
        delete this.startY;
        delete this.currentIndex;
        delete this.startIndex;
        delete this.$dragging;
      }.bind(this));
    },

    on: function(eventName, callback) {
      this.$list.on('listcoach:' + eventName, callback);
    },

    off: function(eventName, callback) {
      this.$list.off('listcoach:' + eventName, callback);
    },

    trigger: function(eventName, args) {
      this.$list.trigger('listcoach:' + eventName, args);
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
        return $(event.currentTarget).parent(this.settings.itemSelector);
      } else {
        return $(event.currentTarget);
      }
    }
  });

  function toggleSortingStyles (toggle) {
    var transitionProp = supports.transitionProperty,
        transformProp = supports.transformProperty,
        transitionDeferred = $.Deferred(),
        resetTop;

    if (toggle) {
      // Set transitions and starting position on all items
      this.$items.css(transitionProp, transformProp + ' .3s').css(transformProp, 'translate3d(0,0,0)');
      // No transition for draggin item
      this.$dragging.css(transitionProp, '').css('z-index', this.settings.zIndex);
      transitionDeferred.resolve();
    } else {
      resetTop = (this.currentIndex - this.startIndex) * this.itemHeight;
      // No transition for all items
      this.$items.css(transitionProp, '');
      // Transition for draging item
      this.$dragging.css(transitionProp, transformProp + ' .2s').css(transformProp, 'translate3d(0, ' + resetTop +'px, 0)');

      setTimeout(function() {
        // Reset item styles
        this.$items
          .css(transitionProp, '')
          .css(transformProp, '')
          .css('z-index', '');
        transitionDeferred.resolve();
      }.bind(this), 200);
    }

    this.$dragging.toggleClass(this.settings.draggingElementClass, toggle);
    this.$list.toggleClass(this.settings.draggingListClass, toggle);

    return transitionDeferred;
  }

  function toggleStartListeners (toggle) {
    var onOff = toggle ? 'on' : 'off';
    this.$list[onOff](supports.touch ? 'touchstart' : 'mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onDragStart);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Listcoach;
  } else {
    global = (function () {
      return this;
    }());
    global.Listcoach = Listcoach;
  }
})();
