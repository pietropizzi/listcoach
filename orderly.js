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

      this.$target.css('z-index', 1);
    } else {
      this.$items
        .css('-webkit-transition', '')
        .css({
          position: '',
          top: '',
          left: '',
          'z-index': ''
        });
    }
  }

  Orderly = function (el, options) {
    this.onMouseDown = __bind(this.onMouseDown, this);
    this.onMouseMove = __bind(this.onMouseMove, this);
    this.onMouseUp   = __bind(this.onMouseUp, this);

    this.settings = $.extend({}, defaultOptions, options);

    this.$list = $(el).first();
    this.$list.on('mousedown', [this.settings.itemSelector, this.settings.handleSelector].join(' '), this.onMouseDown);
  };

  Orderly.prototype.refreshItems = function() {
    this.$items = this.$list.find(this.settings.itemSelector);
    if (this.$items.length > 1) {
      return this.height = this.$items.get(1).offsetTop - this.$items.get(0).offsetTop;
    } else {
      return this.height = 0;
    }
  };

  Orderly.prototype.onMouseDown = function(event) {
    if (this.settings.handleSelector) {
      this.$target = $(event.target).parent(this.settings.itemSelector);
    } else {
      this.$target = $(event.target);
    }

    $(document).on({
      mousemove: this.onMouseMove,
      mouseup: this.onMouseUp
    });

    this.x1 = event.pageX;
    this.y1 = event.pageY;
    this.start();
    return false;
  };

  Orderly.prototype.onMouseMove = function(event) {
    this.move(event.pageX - this.x1, event.pageY - this.y1);
  };

  Orderly.prototype.onMouseUp = function(e) {
    if (!this.$target) return;
    $(document).off({
      mousemove: this.onMouseMove,
      mouseup: this.onMouseUp
    });
    this.end();
    delete this.$target;
    delete this.x1;
    delete this.y1;
  };

  Orderly.prototype.start = function() {
    this.refreshItems();
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
    return delete this.ti;
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
