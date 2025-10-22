html2canvas
===========

[Homepage](https://html2canvas.hertzen.com) | [Downloads](https://github.com/niklasvh/html2canvas/releases) | [Questions](https://github.com/niklasvh/html2canvas/discussions/categories/q-a)

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/niklasvh/html2canvas?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) 
![CI](https://github.com/niklasvh/html2canvas/workflows/CI/badge.svg?branch=master)
[![NPM Downloads](https://img.shields.io/npm/dm/html2canvas.svg)](https://www.npmjs.org/package/html2canvas)
[![NPM Version](https://img.shields.io/npm/v/html2canvas.svg)](https://www.npmjs.org/package/html2canvas)

#### JavaScript HTML renderer ####

 The script allows you to take "screenshots" of webpages or parts of it, directly on the users browser. The screenshot is based on the DOM and as such may not be 100% accurate to the real representation as it does not make an actual screenshot, but builds the screenshot based on the information available on the page.


### How does it work? ###
The script renders the current page as a canvas image, by reading the DOM and the different styles applied to the elements.

It does **not require any rendering from the server**, as the whole image is created on the **client's browser**. However, as it is heavily dependent on the browser, this library is *not suitable* to be used in nodejs.
It doesn't magically circumvent any browser content policy restrictions either, so rendering cross-origin content will require a [proxy](https://github.com/niklasvh/html2canvas/wiki/Proxies) to get the content to the [same origin](http://en.wikipedia.org/wiki/Same_origin_policy).

The script is still in a **very experimental state**, so I don't recommend using it in a production environment nor start building applications with it yet, as there will be still major changes made.

### Browser compatibility ###

**Version 2.0+** requires modern browsers:

* Chrome 84+ (2020)
* Firefox 63+ (2018)
* Safari 14.1+ (2021)
* Edge 84+ (2020)

Native `Promise` support is required (no polyfill needed).

**Version 1.x** supports older browsers (with `Promise` polyfill):

* Firefox 3.5+
* Google Chrome
* Opera 12+
* IE9+
* Safari 6+

As each CSS property needs to be manually built to be supported, there are a number of properties that are not yet supported.

### New in Version 2.0 ###

**Modern CSS Property Support:**

* `object-fit` - Control how images/video scale within containers (fill, contain, cover, none, scale-down)
* `object-position` - Position replaced elements within containers
* `aspect-ratio` - Maintain specific width-to-height ratios for elements (auto, numbers, ratio format)
* `gap`, `row-gap`, `column-gap` - Spacing between flex/grid items (length, percentage values)
* `inset`, `top`, `right`, `bottom`, `left` - Position offsets for positioned elements
* `rotate`, `scale`, `translate` - Individual transform properties (modern alternative to transform shorthand)
* `mix-blend-mode` - Blending modes for layer compositing (16 modes supported)
* `accent-color` - Custom colors for form controls
* `backdrop-filter` - Graphical effects behind elements
* `object-view-box` - Advanced view box control for replaced elements
* `scroll-snap-type`, `scroll-snap-align` - Scroll snapping behavior

**Total: 20 new CSS properties added in v2.0**

### Usage ###

The html2canvas library utilizes `Promise`s and expects them to be available in the global context. If you wish to
support [older browsers](http://caniuse.com/#search=promise) that do not natively support `Promise`s, please include a polyfill such as
[es6-promise](https://github.com/jakearchibald/es6-promise) before including `html2canvas`.

To render an `element` with html2canvas, simply call:
` html2canvas(element[, options]);`

The function returns a [Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) containing the `<canvas>` element. Simply add a promise fulfillment handler to the promise using `then`:

    html2canvas(document.body).then(function(canvas) {
        document.body.appendChild(canvas);
    });

### Building ###

You can download ready builds [here](https://github.com/niklasvh/html2canvas/releases).

Clone git repository:

    $ git clone git://github.com/niklasvh/html2canvas.git

Install dependencies:

    $ npm install

Build browser bundle

    $ npm run build

### Examples ###

For more information and examples, please visit the [homepage](https://html2canvas.hertzen.com) or try the [test console](https://html2canvas.hertzen.com/tests/).

### Contributing ###

If you wish to contribute to the project, please send the pull requests to the develop branch. Before submitting any changes, try and test that the changes work with all the support browsers. If some CSS property isn't supported or is incomplete, please create appropriate tests for it as well before submitting any code changes.
