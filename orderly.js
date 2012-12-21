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
        .not(this.$target)
          .css('-webkit-transition', 'top .3s');

      this.$target
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

      this.$target.removeClass('orderly-sorting-element');
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

  Orderly.prototype.destroy = function() {
    if (this._enabled) {
      this.disable();
    }
    delete this._enabled;
    delete this.$list;
    delete this.$items;
    delete this.settings;
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
  };

  Orderly.prototype.setTarget = function() {
    if (this.settings.handleSelector) {
      this.$target = $(event.target).parent(this.settings.itemSelector);
    } else {
      this.$target = $(event.target);
    }
  };

  Orderly.prototype.start = function() {
    this.setItems();
    this.setTarget();
    toggleSortingStyles.call(this, true);
    this.ti = this.$items.index(this.$target);
  };

  Orderly.prototype.move = function(dx, dy) {
    var ci, di;
    var _this = this;
    this.$target.css({
      top: dy,
      left: dx
    });
    di = Math.round(dy / this.height);
    if (di === this.di) return;
    this.di = di;
    ci = this.ti + this.di;

    this.$items.each(function(i, item) {
      var top;
      if (i === _this.ti) return;
      switch (true) {
        case i >= ci && i < _this.ti:
          top = _this.height;
          break;
        case i <= ci && i > _this.ti:
          top = -_this.height;
          break;
        default:
          top = '';
      }
      $(item).css('top', top);
    });
  };

  Orderly.prototype.end = function() {
    var ci, func, maxi;
    toggleSortingStyles.call(this, false);
    ci = this.ti + this.di;
    maxi = this.$items.length - 1;
    if (ci < 0) ci = 0;
    if (ci > maxi) ci = maxi;
    if (this.di < 0) {
      func = 'before';
    } else {
      func = 'after';
    }
    if (ci !== this.ti) $(this.$items.get(ci))[func](this.$target);
    delete this.di;
    delete this.ti;
    delete this.$target;
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
