# AfroTools Widget System - Build Manifest

**Total Widgets Built:** 223
**Total Iframe Embeds:** 223
**Total Registry Entries:** 223

## Counts by Category

- **african**: 4
- **agriculture**: 14
- **ai**: 1
- **business**: 10
- **crypto**: 5
- **data-productivity**: 6
- **developer**: 13
- **document-pdf**: 2
- **ecommerce**: 2
- **education**: 11
- **energy**: 9
- **engineering**: 2
- **financial**: 79
- **fintech**: 5
- **health**: 11
- **image-design**: 2
- **insurance**: 6
- **jobs**: 6
- **legal**: 5
- **property**: 8
- **telecom**: 8
- **trade**: 8
- **travel**: 6

## Source Model

- `widgets/WIDGET-REGISTRY.js` is the public widget registry consumed by the gallery and embed loader.
- `widgets/lite/widget-pack.js` adds data-driven calculator widgets without one JS file per calculator.
- `widgets/ai/mini-router.js` provides the deterministic Ask AfroTools AI mini-router widget.
- `widgets/build-widget-product.js` rebuilds the registry and generated lite iframe pages.

## Usage

```html
<div data-afrotools="nigeria-paye"></div>
<script src="https://afrotools.com/widgets/embed.js" async></script>
```

### Ask AfroTools AI mini-router

```html
<div data-afrotools="ask-ai-router" data-afrotools-default-country="Ghana" data-afrotools-default-category="career" data-afrotools-partner-id="example-partner" data-afrotools-allowed-categories="career,business,education"></div>
<script src="https://afrotools.com/widgets/embed.js" async></script>
```
