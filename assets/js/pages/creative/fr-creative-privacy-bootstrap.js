(function () {
  "use strict";

  var TWEMOJI_FLAG =
    /^https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@[^/]+\/assets\/svg\/[0-9a-f-]+\.svg(?:[?#].*)?$/i;
  var LOCAL_FLAG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E";
  var SUPABASE_SDK =
    /^https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@[^/]+\/dist\/umd\/supabase(?:\.min)?\.js(?:[?#].*)?$/i;
  var LOCAL_SUPABASE_SDK = "/assets/js/supabase.min.js";

  function localizeFlag(value) {
    return typeof value === "string" && TWEMOJI_FLAG.test(value)
      ? LOCAL_FLAG
      : value;
  }

  function localizeMarkup(value) {
    return typeof value === "string"
      ? value.replace(
          /https:\/\/cdn\.jsdelivr\.net\/gh\/twitter\/twemoji@[^/]+\/assets\/svg\/[0-9a-f-]+\.svg(?:[?#][^"' <]*)?/gi,
          LOCAL_FLAG
        )
      : value;
  }

  function localizeSource(element, value) {
    if (element instanceof HTMLImageElement) return localizeFlag(value);
    if (
      element instanceof HTMLScriptElement &&
      typeof value === "string" &&
      SUPABASE_SDK.test(value)
    ) {
      return LOCAL_SUPABASE_SDK;
    }
    return value;
  }

  function patchMarkupProperty(prototype, property) {
    var descriptor = Object.getOwnPropertyDescriptor(prototype, property);
    if (!descriptor || !descriptor.get || !descriptor.set) return;
    Object.defineProperty(prototype, property, {
      configurable: descriptor.configurable,
      enumerable: descriptor.enumerable,
      get: descriptor.get,
      set: function (value) {
        return descriptor.set.call(this, localizeMarkup(value));
      },
    });
  }

  patchMarkupProperty(Element.prototype, "innerHTML");
  patchMarkupProperty(ShadowRoot.prototype, "innerHTML");

  var nativeInsertAdjacentHtml = Element.prototype.insertAdjacentHTML;
  Element.prototype.insertAdjacentHTML = function (position, value) {
    return nativeInsertAdjacentHtml.call(this, position, localizeMarkup(value));
  };

  var nativeSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function (name, value) {
    return nativeSetAttribute.call(
      this,
      name,
      String(name).toLowerCase() === "src"
        ? localizeSource(this, value)
        : value
    );
  };

  var imageSource = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    "src"
  );
  if (imageSource && imageSource.get && imageSource.set) {
    Object.defineProperty(HTMLImageElement.prototype, "src", {
      configurable: imageSource.configurable,
      enumerable: imageSource.enumerable,
      get: imageSource.get,
      set: function (value) {
        return imageSource.set.call(this, localizeFlag(value));
      },
    });
  }

  var scriptSource = Object.getOwnPropertyDescriptor(
    HTMLScriptElement.prototype,
    "src"
  );
  if (scriptSource && scriptSource.get && scriptSource.set) {
    Object.defineProperty(HTMLScriptElement.prototype, "src", {
      configurable: scriptSource.configurable,
      enumerable: scriptSource.enumerable,
      get: scriptSource.get,
      set: function (value) {
        return scriptSource.set.call(this, localizeSource(this, value));
      },
    });
  }

  document.documentElement.setAttribute(
    "data-fr-creative-privacy-bootstrap",
    "ready"
  );
})();
