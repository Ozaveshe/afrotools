'use strict';

// Inline in the destination head so Chromium sees the opt-in before pagereveal.
module.exports = `<style>
@view-transition { navigation: auto }
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important }
}
</style>`;
