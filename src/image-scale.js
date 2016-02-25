import $ from 'jquery'

'use strict'

const CONSTANTS = {
  NONE: 'none',
  FILL: 'fill',
  BEST_FILL: 'best-fill',
  BEST_FIT: 'best-fit',
  BEST_FIT_DOWN_ONLY: 'best-fit-down',

  ALIGN_LEFT: 'left',
  ALIGN_RIGHT: 'right',
  ALIGN_CENTER: 'center',
  ALIGN_TOP: 'top',
  ALIGN_BOTTOM: 'bottom',
  ALIGN_TOP_LEFT: 'top-left',
  ALIGN_TOP_RIGHT: 'top-right',
  ALIGN_BOTTOM_LEFT: 'bottom-left',
  ALIGN_BOTTOM_RIGHT: 'bottom-right'
}

class ImageScale {

  constructor(element, options) {
    this.options = options
    this.element = element

    var $element = this.$element = $(element),
      $img = this.$img = element.tagName === 'IMG' ? $element : $element.find('img'),
      img = this.img = $img[0]

    this.src = $img.attr('src')

    this.imgWidth = img.naturalWidth || img.width;
    this.imgHeight = img.naturalHeight || img.height;

    var $parent = this.$parent = options.parent ? options.parent : $($element.parent()[0]);
    this.parent = $parent[0];

    // Fixes: https://github.com/gestixi/image-scale/issues/1
    if ($parent.css('position') === 'static') {
      $parent.css('position', 'relative');
    }

    if (options.rescaleOnResize) {
      $(window).resize(function (e) {
        that.scheduleScale();
      });
    }
  }

  scale (firstTime, opt) {
    if (this._isDestroyed || this._canScale === false) return;

    var that = this,
      options = this.options,
      $parent = this.$parent,
      element = this.element,
      $element = this.$element,
      img = this.img,
      $img = this.$img;

    if (firstTime) {
      if (options.hideParentOverflow) {
        $parent.css({ overflow: 'hidden' });
      }
    }
    else {
      // If the source of the image has changed
      if (this.src !== $img.attr('src')) {
        this.destroy();
        $element.data('imageScale', null);
        $element.imageScale(options);
        return;
      }
    }

    this._didScheduleScale = false;

    if (options.rescaleOnResize && !opt) {
      if (!this._needUpdate(this.parent)) return;
    }
    opt = opt ? opt : {};

    var transition = opt.transition;
    if (transition) {
      this._canScale = false;
      $element.css('transition', 'all '+transition+'ms');

      setTimeout(function() {
        that._canScale = null;
        $element.css('transition', 'null');
      }, transition);
    }

    var destWidth = opt.destWidth ? opt.destWidth : $parent.outerWidth(),
      destHeight = opt.destHeight ? opt.destHeight : $parent.outerHeight(),

      destInnerWidth = opt.destWidth ? opt.destWidth : $parent.innerWidth(),
      destInnerHeight = opt.destHeight ? opt.destHeight : $parent.innerHeight(),

      widthOffset = destWidth - destInnerWidth,
      heightOffset = destHeight - destInnerHeight,

      scaleData = $element.attr('data-scale'),
      alignData = $element.attr('data-align'),

      scale = scaleData?scaleData:options.scale,
      align = alignData?alignData:options.align,

      fadeInDuration = options.fadeInDuration;

    if (!scale) {
      if (options.logLevel > 2) {
        console.log('imageScale - DEBUG NOTICE: The scale property is null.', element)
      }
      return;
    }

    if (this._cacheDestWidth === destWidth && this._cacheDestHeight === destHeight) {
      if (options.logLevel > 2) {
        console.log(`imageScale - DEBUG NOTICE: The parent size hasn't changed: dest width: ${destWidth} - dest height: ${destHeight}.`, element);
      }
    }

    var sourceWidth = this.imgWidth,
      sourceHeight = this.imgHeight;

    if (!(destWidth && destHeight && sourceWidth && sourceHeight)) {
      if (options.logLevel > 0) {
        console.error(`imageScale - DEBUG ERROR: The dimensions are incorrect: source width: ${sourceWidth} - source height: ${sourceHeight} - dest width: ${destWidth} - dest height: ${destHeight}.`, element);
      }
      return;
    }

    this._cacheDestWidth = destWidth;
    this._cacheDestHeight = destHeight;

    var layout = this._innerFrameForSize(scale, align, sourceWidth, sourceHeight, destWidth, destHeight);

    if (widthOffset) layout.x -= widthOffset/2;
    if (heightOffset) layout.y -= heightOffset/2;

    $element.css({ position: 'absolute', top: layout.y+'px', left: layout.x+'px', width: layout.width+'px', height: layout.height+'px', 'max-width': 'none' });

    if (firstTime && fadeInDuration) {
      $element.css({ display: 'none' });
      $element.fadeIn(fadeInDuration);
    }

    options.didScale.call(this, firstTime, opt);
  }

  /**
   Removes the data for the element.

   Here is an example on how you can call the destroy method:

   $image.imageScale('destroy');

   */
  destroy() {
    this._isDestroyed = true;
    this.$element.removeData('imageScale');
  }

  /**
   @private

   Returns a frame (x, y, width, height) fitting the source size (sourceWidth & sourceHeight) within the
   destination size (destWidth & destHeight) according to the align and scale properties.

   @param {String} scale
   @param {String} align
   @param {Number} sourceWidth
   @param {Number} sourceHeight
   @param {Number} destWidth
   @param {Number} destHeight
   @returns {Object} the inner frame with properties: { x: value, y: value, width: value, height: value }
   */
  _innerFrameForSize(scale, align, sourceWidth, sourceHeight, destWidth, destHeight) {
    var scaleX,
      scaleY,
      result;

    // Fast path
    result = { x: 0, y: 0, width: destWidth, height: destHeight };
    if (scale === this.FILL) return result;

    // Determine the appropriate scale
    scaleX = destWidth / sourceWidth;
    scaleY = destHeight / sourceHeight;

    switch (scale) {
      case this.BEST_FIT_DOWN_ONLY:
        if (scale !== this.BEST_FIT_DOWN_ONLY && this.options.logLevel > 1) {
          console.warn(`imageScale - DEBUG WARNING: The scale ${scale} was not understood.`);
        }

        if ((sourceWidth > destWidth) || (sourceHeight > destHeight)) {
          scale = scaleX < scaleY ? scaleX : scaleY;
        } else {
          scale = 1.0;
        }
        break;
      case this.BEST_FIT:
        scale = scaleX < scaleY ? scaleX : scaleY;
        break;
      case this.NONE:
        scale = 1.0;
        break;
      //case this.BEST_FILL:
      default:
        scale = scaleX > scaleY ? scaleX : scaleY;
        break;
    }

    sourceWidth *= scale;
    sourceHeight *= scale;
    result.width = Math.round(sourceWidth);
    result.height = Math.round(sourceHeight);

    // Align the image within its frame
    switch (align) {
      case this.ALIGN_LEFT:
        result.x = 0;
        result.y = (destHeight / 2) - (sourceHeight / 2);
        break;
      case this.ALIGN_RIGHT:
        result.x = destWidth - sourceWidth;
        result.y = (destHeight / 2) - (sourceHeight / 2);
        break;
      case this.ALIGN_TOP:
        result.x = (destWidth / 2) - (sourceWidth / 2);
        result.y = 0;
        break;
      case this.ALIGN_BOTTOM:
        result.x = (destWidth / 2) - (sourceWidth / 2);
        result.y = destHeight - sourceHeight;
        break;
      case this.ALIGN_TOP_LEFT:
        result.x = 0;
        result.y = 0;
        break;
      case this.ALIGN_TOP_RIGHT:
        result.x = destWidth - sourceWidth;
        result.y = 0;
        break;
      case this.ALIGN_BOTTOM_LEFT:
        result.x = 0;
        result.y = destHeight - sourceHeight;
        break;
      case this.ALIGN_BOTTOM_RIGHT:
        result.x = destWidth - sourceWidth;
        result.y = destHeight - sourceHeight;
        break;
      default: // this.ALIGN_CENTER
        if (align !== this.ALIGN_CENTER && this.options.logLevel > 1) {
          console.warn(`imageScale - DEBUG WARNING: The align ${align} was not understood.`);
        }
        result.x = (destWidth / 2) - (sourceWidth / 2);
        result.y = (destHeight / 2) - (sourceHeight / 2);
    }

    return result;
  }

  /**
   @private

   Determines if the windows size has changed since the last update.

   @returns {Boolean}
   */
  _needUpdate(parent) {
  var size = parent.clientHeight + ' ' + parent.clientWidth;

  if (this._lastParentSize !== size) {
    this._lastParentSize = size;
    return true;
  }
  return false;
}

  /**
   @private

   Schedule a scale update.
   */
  scheduleScale() {
  if (this._didScheduleScale) return;

  if (window.requestAnimationFrame) {
    var that = this;
    this._didScheduleScale = true;
    // setTimeout important when resizing down if the scrollbar were visible
    requestAnimationFrame(function() { setTimeout(function() { that.scale(); }, 0); });
  } else {
    this.scale();
  }
}

  static get NONE() {
    return CONSTANTS.NONE
  }

  static get FILL() {
    return CONSTANTS.FILL
  }

  static get BEST_FILL() {
    return CONSTANTS.BEST_FILL
  }

  static get BEST_FIT() {
    return CONSTANTS.BEST_FIT
  }

  static get BEST_FIT_DOWN_ONLY() {
    return CONSTANTS.BEST_FIT_DOWN_ONLY
  }

  static get ALIGN_LEFT() {
    return CONSTANTS.ALIGN_LEFT
  }

  static get ALIGN_RIGHT() {
    return CONSTANTS.ALIGN_RIGHT
  }

  static get ALIGN_CENTER() {
    return CONSTANTS.ALIGN_CENTER
  }

  static get ALIGN_TOP() {
    return CONSTANTS.ALIGN_TOP
  }

  static get ALIGN_BOTTOM() {
    return CONSTANTS.ALIGN_BOTTOM
  }

  static get ALIGN_TOP_LEFT() {
    return CONSTANTS.ALIGN_TOP_LEFT
  }

  static get ALIGN_BOTTOM_LEFT() {
    return CONSTANTS.ALIGN_BOTTOM_LEFT
  }

  static get ALIGN_BOTTOM_RIGHT() {
    return CONSTANTS.ALIGN_BOTTOM_RIGHT
  }
}


export default imageScale;
