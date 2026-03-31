/**
 * CarouselStudio Engine — Multi-slide carousel management, templates, history, persistence
 * IIFE module on window.AfroTools.engines.creatorCarousel
 */
(function() {
  'use strict';

  var _slides = [];
  var _activeIndex = 0;
  var _branding = { primaryColor: '#AF52DE', secondaryColor: '#1a1a1a', font: 'Montserrat', handle: '' };
  var _format = { w: 1080, h: 1350, name: '1080x1350' };
  var _history = [];
  var _historyIndex = -1;
  var _idCounter = 0;
  var _projectTitle = 'Untitled Carousel';
  var _templateId = null;

  function uid() { return 'layer_' + (++_idCounter) + '_' + Date.now(); }

  function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function pushHistory() {
    _history = _history.slice(0, _historyIndex + 1);
    _history.push(deepCopy({ slides: _slides, activeIndex: _activeIndex, branding: _branding }));
    _historyIndex = _history.length - 1;
    if (_history.length > 40) { _history.shift(); _historyIndex--; }
  }

  // ── FORMATS ──
  var FORMATS = {
    '1080x1350': { w: 1080, h: 1350, name: '1080x1350', label: 'IG Portrait' },
    '1080x1080': { w: 1080, h: 1080, name: '1080x1080', label: 'Square' },
    '1280x720':  { w: 1280, h: 720,  name: '1280x720',  label: 'LinkedIn' }
  };

  // ── TEMPLATES ──
  var TEMPLATES = [
    {
      id: 'edu-tips-01', name: '5 Tips — Bold', category: 'educational',
      format: '1080x1350', slideCount: 7,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#AF52DE', '#5B21B6'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: '5 THINGS EVERY CREATOR NEEDS', x: 540, y: 500, fontSize: 64, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 900, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'subhead', content: 'Swipe →', x: 540, y: 1250, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 400 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'number', content: '01', x: 540, y: 300, fontSize: 180, fontFamily: '"Montserrat", sans-serif', color: 'rgba(175,82,222,.2)', textAlign: 'center', maxWidth: 400, fontWeight: 900 },
          { type: 'text', role: 'headline', content: 'KNOW YOUR NICHE', x: 540, y: 580, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Pick one topic and go deep. Generalists get lost in the feed.', x: 540, y: 750, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'number', content: '02', x: 540, y: 300, fontSize: 180, fontFamily: '"Montserrat", sans-serif', color: 'rgba(175,82,222,.2)', textAlign: 'center', maxWidth: 400, fontWeight: 900 },
          { type: 'text', role: 'headline', content: 'POST CONSISTENTLY', x: 540, y: 580, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'The algorithm rewards consistency. Show up even when nobody claps.', x: 540, y: 750, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'number', content: '03', x: 540, y: 300, fontSize: 180, fontFamily: '"Montserrat", sans-serif', color: 'rgba(175,82,222,.2)', textAlign: 'center', maxWidth: 400, fontWeight: 900 },
          { type: 'text', role: 'headline', content: 'ENGAGE YOUR AUDIENCE', x: 540, y: 580, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Reply to every comment. Your community is your biggest asset.', x: 540, y: 750, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'number', content: '04', x: 540, y: 300, fontSize: 180, fontFamily: '"Montserrat", sans-serif', color: 'rgba(175,82,222,.2)', textAlign: 'center', maxWidth: 400, fontWeight: 900 },
          { type: 'text', role: 'headline', content: 'BUILD IN PUBLIC', x: 540, y: 580, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Share your journey — the wins AND the losses. People connect with real stories.', x: 540, y: 750, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'number', content: '05', x: 540, y: 300, fontSize: 180, fontFamily: '"Montserrat", sans-serif', color: 'rgba(175,82,222,.2)', textAlign: 'center', maxWidth: 400, fontWeight: 900 },
          { type: 'text', role: 'headline', content: 'MONETIZE EARLY', x: 540, y: 580, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Don\'t wait for 100K followers. Start selling value from day one.', x: 540, y: 750, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#AF52DE', '#5B21B6'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'FOLLOW FOR MORE', x: 540, y: 600, fontSize: 56, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'handle', content: '@yourhandle', x: 540, y: 750, fontSize: 32, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 400 }
        ]}
      ]
    },
    {
      id: 'story-01', name: 'Story Arc', category: 'storytelling',
      format: '1080x1350', slideCount: 5,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#1a1a2e', '#16213e'], angle: 180 }, layers: [
          { type: 'text', role: 'headline', content: 'THE DAY EVERYTHING CHANGED', x: 540, y: 600, fontSize: 56, fontFamily: '"Playfair Display", serif', color: '#fff', textAlign: 'center', maxWidth: 850, fontWeight: 700 },
          { type: 'text', role: 'subhead', content: 'A Story →', x: 540, y: 1250, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.4)', textAlign: 'center', maxWidth: 400 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a2e' }, layers: [
          { type: 'text', role: 'body', content: 'It started with a single message at 3am. I didn\'t know it yet, but my life was about to take a completely different direction...', x: 540, y: 600, fontSize: 32, fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,.85)', textAlign: 'center', maxWidth: 800, lineHeight: 1.5 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a2e' }, layers: [
          { type: 'text', role: 'body', content: 'I had two choices: stay comfortable or take the biggest risk of my career. The safe path was obvious. But something inside me said "not this time."', x: 540, y: 600, fontSize: 32, fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,.85)', textAlign: 'center', maxWidth: 800, lineHeight: 1.5 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a2e' }, layers: [
          { type: 'text', role: 'body', content: 'Six months later, I\'m writing this from a place I never imagined I\'d be. The lesson? Sometimes the scariest door leads to the best room.', x: 540, y: 600, fontSize: 32, fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,.85)', textAlign: 'center', maxWidth: 800, lineHeight: 1.5 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#1a1a2e', '#AF52DE'], angle: 180 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'WHAT\'S YOUR STORY?', x: 540, y: 580, fontSize: 48, fontFamily: '"Playfair Display", serif', color: '#fff', textAlign: 'center', maxWidth: 800, fontWeight: 700 },
          { type: 'text', role: 'handle', content: 'Share in the comments ↓', x: 540, y: 750, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.5)', textAlign: 'center', maxWidth: 500 }
        ]}
      ]
    },
    {
      id: 'beforeafter-01', name: 'Before & After', category: 'beforeafter',
      format: '1080x1350', slideCount: 4,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#FF3B30', '#FF6B3B'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: 'MY TRANSFORMATION', x: 540, y: 550, fontSize: 60, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 900, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'subhead', content: 'Before → After', x: 540, y: 750, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: 'BEFORE', x: 540, y: 200, fontSize: 64, fontFamily: '"Montserrat", sans-serif', color: '#FF3B30', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Where I started — struggling, unsure, no direction.', x: 540, y: 900, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: 'AFTER', x: 540, y: 200, fontSize: 64, fontFamily: '"Montserrat", sans-serif', color: '#34C759', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Where I am now — focused, profitable, growing every day.', x: 540, y: 900, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#34C759', '#30D158'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'YOUR TURN', x: 540, y: 600, fontSize: 56, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'handle', content: '@yourhandle', x: 540, y: 750, fontSize: 32, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 400 }
        ]}
      ]
    },
    {
      id: 'quote-01', name: 'Motivational Quotes', category: 'quote',
      format: '1080x1080', slideCount: 4,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#FFD60A', '#FF9500'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: 'WORDS TO LIVE BY', x: 540, y: 480, fontSize: 56, fontFamily: '"Bebas Neue", sans-serif', color: '#1a1a1a', textAlign: 'center', maxWidth: 800, uppercase: true },
          { type: 'text', role: 'subhead', content: '4 Quotes That Changed My Life →', x: 540, y: 620, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(0,0,0,.5)', textAlign: 'center', maxWidth: 600 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: '"The best time to start was yesterday. The second best time is now."', x: 540, y: 440, fontSize: 40, fontFamily: '"Playfair Display", serif', color: '#fff', textAlign: 'center', maxWidth: 800, lineHeight: 1.4 },
          { type: 'text', role: 'body', content: '— African Proverb', x: 540, y: 700, fontSize: 22, fontFamily: '"DM Sans", sans-serif', color: '#FFD60A', textAlign: 'center', maxWidth: 400 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: '"If you want to go fast, go alone. If you want to go far, go together."', x: 540, y: 440, fontSize: 40, fontFamily: '"Playfair Display", serif', color: '#fff', textAlign: 'center', maxWidth: 800, lineHeight: 1.4 },
          { type: 'text', role: 'body', content: '— African Proverb', x: 540, y: 700, fontSize: 22, fontFamily: '"DM Sans", sans-serif', color: '#FFD60A', textAlign: 'center', maxWidth: 400 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#FFD60A', '#FF9500'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'SAVE & SHARE', x: 540, y: 440, fontSize: 52, fontFamily: '"Bebas Neue", sans-serif', color: '#1a1a1a', textAlign: 'center', maxWidth: 800, uppercase: true },
          { type: 'text', role: 'handle', content: '@yourhandle', x: 540, y: 580, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(0,0,0,.5)', textAlign: 'center', maxWidth: 400 }
        ]}
      ]
    },
    {
      id: 'brand-01', name: 'Brand Introduction', category: 'brand',
      format: '1080x1350', slideCount: 5,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#007AFF', '#5856D6'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: 'HI, I\'M [NAME]', x: 540, y: 550, fontSize: 60, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 900, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'subhead', content: 'Nice to meet you →', x: 540, y: 750, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0f0f1a' }, layers: [
          { type: 'text', role: 'headline', content: 'WHAT I DO', x: 540, y: 350, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#007AFF', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'I help creators and businesses grow their online presence through strategic content and design.', x: 540, y: 650, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 750, lineHeight: 1.5 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0f0f1a' }, layers: [
          { type: 'text', role: 'headline', content: 'WHO I HELP', x: 540, y: 350, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#007AFF', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Creators, solopreneurs, and small businesses across Africa who want to stand out online.', x: 540, y: 650, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 750, lineHeight: 1.5 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0f0f1a' }, layers: [
          { type: 'text', role: 'headline', content: 'WHY FOLLOW ME', x: 540, y: 350, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#007AFF', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Daily tips on content strategy, design, and building a personal brand that actually makes money.', x: 540, y: 650, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 750, lineHeight: 1.5 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#007AFF', '#5856D6'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'LET\'S CONNECT', x: 540, y: 600, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'handle', content: '@yourhandle', x: 540, y: 750, fontSize: 32, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 400 }
        ]}
      ]
    },
    {
      id: 'product-01', name: 'Product Showcase', category: 'product',
      format: '1080x1350', slideCount: 5,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#34C759', '#30D158'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: 'INTRODUCING [PRODUCT]', x: 540, y: 550, fontSize: 56, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 900, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'subhead', content: 'See what\'s inside →', x: 540, y: 750, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0a1a0a' }, layers: [
          { type: 'text', role: 'headline', content: 'FEATURE 1', x: 540, y: 400, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#34C759', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Describe your first key feature here. What problem does it solve?', x: 540, y: 650, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 750 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0a1a0a' }, layers: [
          { type: 'text', role: 'headline', content: 'FEATURE 2', x: 540, y: 400, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#34C759', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Describe your second key feature. How does it make life easier?', x: 540, y: 650, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 750 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0a1a0a' }, layers: [
          { type: 'text', role: 'headline', content: 'PRICING', x: 540, y: 350, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#34C759', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'number', content: '$49', x: 540, y: 600, fontSize: 120, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 500, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'One-time payment. Lifetime access.', x: 540, y: 850, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.5)', textAlign: 'center', maxWidth: 600 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#34C759', '#30D158'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'GET IT NOW', x: 540, y: 600, fontSize: 56, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'handle', content: 'Link in bio ↑', x: 540, y: 750, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 400 }
        ]}
      ]
    },
    {
      id: 'data-01', name: 'Stats & Data', category: 'data',
      format: '1080x1080', slideCount: 5,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#5856D6', '#AF52DE'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: 'THE NUMBERS DON\'T LIE', x: 540, y: 440, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 900, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'subhead', content: 'Data that will surprise you →', x: 540, y: 620, fontSize: 24, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 600 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0f0f1a' }, layers: [
          { type: 'text', role: 'number', content: '73%', x: 540, y: 350, fontSize: 140, fontFamily: '"Montserrat", sans-serif', color: '#AF52DE', textAlign: 'center', maxWidth: 600, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'of African internet users access the web primarily through mobile phones', x: 540, y: 600, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0f0f1a' }, layers: [
          { type: 'text', role: 'number', content: '2.5B', x: 540, y: 350, fontSize: 140, fontFamily: '"Montserrat", sans-serif', color: '#AF52DE', textAlign: 'center', maxWidth: 600, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'projected African population by 2050 — the youngest continent on Earth', x: 540, y: 600, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#0f0f1a' }, layers: [
          { type: 'text', role: 'number', content: '$180B', x: 540, y: 350, fontSize: 120, fontFamily: '"Montserrat", sans-serif', color: '#AF52DE', textAlign: 'center', maxWidth: 600, fontWeight: 900 },
          { type: 'text', role: 'body', content: 'Africa\'s creative economy is growing faster than any other sector', x: 540, y: 600, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.7)', textAlign: 'center', maxWidth: 700 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#5856D6', '#AF52DE'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'FOLLOW FOR MORE DATA', x: 540, y: 440, fontSize: 44, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'handle', content: '@yourhandle', x: 540, y: 580, fontSize: 28, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 400 }
        ]}
      ]
    },
    {
      id: 'testimonial-01', name: 'Client Testimonials', category: 'testimonial',
      format: '1080x1350', slideCount: 5,
      slides: [
        { type: 'cover', bg: { type: 'gradient', colors: ['#FF2D55', '#FF6B81'], angle: 135 }, layers: [
          { type: 'text', role: 'headline', content: 'WHAT MY CLIENTS SAY', x: 540, y: 550, fontSize: 56, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 900, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'subhead', content: 'Real reviews →', x: 540, y: 750, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: '⭐⭐⭐⭐⭐', x: 540, y: 350, fontSize: 48, fontFamily: '"DM Sans", sans-serif', color: '#FFD60A', textAlign: 'center', maxWidth: 600 },
          { type: 'text', role: 'body', content: '"This completely changed how I approach my content. The results speak for themselves — 3x engagement in just one month."', x: 540, y: 650, fontSize: 28, fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,.85)', textAlign: 'center', maxWidth: 800, lineHeight: 1.5 },
          { type: 'text', role: 'handle', content: '— Sarah M., Content Creator', x: 540, y: 1000, fontSize: 20, fontFamily: '"DM Sans", sans-serif', color: '#FF2D55', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: '⭐⭐⭐⭐⭐', x: 540, y: 350, fontSize: 48, fontFamily: '"DM Sans", sans-serif', color: '#FFD60A', textAlign: 'center', maxWidth: 600 },
          { type: 'text', role: 'body', content: '"I was skeptical at first, but the ROI has been incredible. Best investment I\'ve made for my brand this year."', x: 540, y: 650, fontSize: 28, fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,.85)', textAlign: 'center', maxWidth: 800, lineHeight: 1.5 },
          { type: 'text', role: 'handle', content: '— David K., Entrepreneur', x: 540, y: 1000, fontSize: 20, fontFamily: '"DM Sans", sans-serif', color: '#FF2D55', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'content', bg: { type: 'solid', color: '#1a1a1a' }, layers: [
          { type: 'text', role: 'headline', content: '⭐⭐⭐⭐⭐', x: 540, y: 350, fontSize: 48, fontFamily: '"DM Sans", sans-serif', color: '#FFD60A', textAlign: 'center', maxWidth: 600 },
          { type: 'text', role: 'body', content: '"Professional, fast, and the results exceeded my expectations. I recommend this to every creator I know."', x: 540, y: 650, fontSize: 28, fontFamily: '"Playfair Display", serif', color: 'rgba(255,255,255,.85)', textAlign: 'center', maxWidth: 800, lineHeight: 1.5 },
          { type: 'text', role: 'handle', content: '— Amina O., Brand Strategist', x: 540, y: 1000, fontSize: 20, fontFamily: '"DM Sans", sans-serif', color: '#FF2D55', textAlign: 'center', maxWidth: 500 }
        ]},
        { type: 'cta', bg: { type: 'gradient', colors: ['#FF2D55', '#FF6B81'], angle: 135 }, layers: [
          { type: 'text', role: 'cta-headline', content: 'READY TO JOIN THEM?', x: 540, y: 600, fontSize: 52, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: 800, uppercase: true, fontWeight: 900 },
          { type: 'text', role: 'handle', content: 'DM me to get started →', x: 540, y: 750, fontSize: 26, fontFamily: '"DM Sans", sans-serif', color: 'rgba(255,255,255,.6)', textAlign: 'center', maxWidth: 500 }
        ]}
      ]
    }
  ];

  // ── PUBLIC API ──
  var pub = {
    TEMPLATES: TEMPLATES,
    FORMATS: FORMATS,

    init: function() {
      _slides = [];
      _activeIndex = 0;
      _history = [];
      _historyIndex = -1;
      _idCounter = 0;
    },

    getState: function() {
      return {
        slides: deepCopy(_slides),
        activeIndex: _activeIndex,
        branding: deepCopy(_branding),
        format: deepCopy(_format),
        title: _projectTitle,
        templateId: _templateId
      };
    },

    setFormat: function(formatKey) {
      var f = FORMATS[formatKey];
      if (f) { _format = deepCopy(f); }
      return _format;
    },

    getFormat: function() { return deepCopy(_format); },

    // ── SLIDE MANAGEMENT ──
    getSlides: function() { return deepCopy(_slides); },
    getSlideCount: function() { return _slides.length; },
    getActiveIndex: function() { return _activeIndex; },

    setActiveSlide: function(index) {
      if (index >= 0 && index < _slides.length) { _activeIndex = index; }
      return _activeIndex;
    },

    getActiveSlide: function() {
      return _slides[_activeIndex] ? deepCopy(_slides[_activeIndex]) : null;
    },

    addSlide: function(afterIndex) {
      if (_slides.length >= 10) return null;
      var idx = (typeof afterIndex === 'number') ? afterIndex + 1 : _slides.length;
      var slide = {
        id: uid(),
        type: 'content',
        bg: { type: 'solid', color: '#1a1a1a' },
        layers: [
          { id: uid(), type: 'text', role: 'headline', content: 'YOUR TEXT HERE', x: _format.w / 2, y: _format.h / 2 - 50, fontSize: 48, fontFamily: '"Montserrat", sans-serif', color: '#fff', textAlign: 'center', maxWidth: _format.w - 200, uppercase: true, fontWeight: 900 }
        ]
      };
      _slides.splice(idx, 0, slide);
      _activeIndex = idx;
      pushHistory();
      return slide;
    },

    removeSlide: function(index) {
      if (_slides.length <= 2) return false;
      if (index < 0 || index >= _slides.length) return false;
      _slides.splice(index, 1);
      if (_activeIndex >= _slides.length) _activeIndex = _slides.length - 1;
      pushHistory();
      return true;
    },

    duplicateSlide: function(index) {
      if (_slides.length >= 10) return null;
      if (index < 0 || index >= _slides.length) return null;
      var dup = deepCopy(_slides[index]);
      dup.id = uid();
      dup.layers.forEach(function(l) { l.id = uid(); });
      _slides.splice(index + 1, 0, dup);
      _activeIndex = index + 1;
      pushHistory();
      return dup;
    },

    reorderSlides: function(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= _slides.length) return false;
      if (toIndex < 0 || toIndex >= _slides.length) return false;
      var slide = _slides.splice(fromIndex, 1)[0];
      _slides.splice(toIndex, 0, slide);
      _activeIndex = toIndex;
      pushHistory();
      return true;
    },

    // ── LAYER MANAGEMENT ──
    updateSlideLayer: function(slideIndex, layerId, props) {
      var slide = _slides[slideIndex];
      if (!slide) return false;
      var layer = null;
      for (var i = 0; i < slide.layers.length; i++) {
        if (slide.layers[i].id === layerId) { layer = slide.layers[i]; break; }
      }
      if (!layer) return false;
      for (var key in props) { if (props.hasOwnProperty(key)) layer[key] = props[key]; }
      pushHistory();
      return true;
    },

    addLayerToSlide: function(slideIndex, layerData) {
      var slide = _slides[slideIndex];
      if (!slide) return null;
      if (slide.layers.length >= 5) return null;
      var layer = deepCopy(layerData);
      layer.id = uid();
      slide.layers.push(layer);
      pushHistory();
      return layer;
    },

    removeLayerFromSlide: function(slideIndex, layerId) {
      var slide = _slides[slideIndex];
      if (!slide) return false;
      var idx = -1;
      for (var i = 0; i < slide.layers.length; i++) {
        if (slide.layers[i].id === layerId) { idx = i; break; }
      }
      if (idx === -1) return false;
      slide.layers.splice(idx, 1);
      pushHistory();
      return true;
    },

    // ── SLIDE BACKGROUND ──
    setSlideBg: function(slideIndex, bgObj) {
      var slide = _slides[slideIndex];
      if (!slide) return false;
      slide.bg = deepCopy(bgObj);
      pushHistory();
      return true;
    },

    // ── BRANDING ──
    setBranding: function(obj) {
      for (var k in obj) { if (obj.hasOwnProperty(k)) _branding[k] = obj[k]; }
      return deepCopy(_branding);
    },

    getBranding: function() { return deepCopy(_branding); },

    // ── TEMPLATE LOADING ──
    loadTemplate: function(templateId) {
      var tpl = null;
      for (var i = 0; i < TEMPLATES.length; i++) {
        if (TEMPLATES[i].id === templateId) { tpl = TEMPLATES[i]; break; }
      }
      if (!tpl) return false;
      _templateId = templateId;
      if (tpl.format && FORMATS[tpl.format]) {
        _format = deepCopy(FORMATS[tpl.format]);
      }
      _slides = [];
      tpl.slides.forEach(function(s) {
        var slide = deepCopy(s);
        slide.id = uid();
        slide.layers.forEach(function(l) { l.id = uid(); });
        _slides.push(slide);
      });
      _activeIndex = 0;
      pushHistory();
      return true;
    },

    // ── TITLE ──
    setTitle: function(t) { _projectTitle = t; },
    getTitle: function() { return _projectTitle; },

    // ── HISTORY ──
    undo: function() {
      if (_historyIndex <= 0) return false;
      _historyIndex--;
      var state = deepCopy(_history[_historyIndex]);
      _slides = state.slides;
      _activeIndex = state.activeIndex;
      _branding = state.branding;
      return true;
    },

    redo: function() {
      if (_historyIndex >= _history.length - 1) return false;
      _historyIndex++;
      var state = deepCopy(_history[_historyIndex]);
      _slides = state.slides;
      _activeIndex = state.activeIndex;
      _branding = state.branding;
      return true;
    },

    canUndo: function() { return _historyIndex > 0; },
    canRedo: function() { return _historyIndex < _history.length - 1; },

    // ── CANVAS RENDER ──
    renderSlideToCanvas: function(slideIndex, canvas) {
      var slide = _slides[slideIndex];
      if (!slide) return;
      var ctx = canvas.getContext('2d');
      canvas.width = _format.w;
      canvas.height = _format.h;

      // Background
      var bg = slide.bg || { type: 'solid', color: '#1a1a1a' };
      if (bg.type === 'gradient' && bg.colors) {
        var angle = (bg.angle || 135) * Math.PI / 180;
        var x0 = _format.w / 2 - Math.cos(angle) * _format.w;
        var y0 = _format.h / 2 - Math.sin(angle) * _format.h;
        var x1 = _format.w / 2 + Math.cos(angle) * _format.w;
        var y1 = _format.h / 2 + Math.sin(angle) * _format.h;
        var grad = ctx.createLinearGradient(x0, y0, x1, y1);
        grad.addColorStop(0, bg.colors[0]);
        grad.addColorStop(1, bg.colors[1]);
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = bg.color || '#1a1a1a';
      }
      ctx.fillRect(0, 0, _format.w, _format.h);

      // Layers
      slide.layers.forEach(function(layer) {
        if (layer.type === 'text') {
          var fs = layer.fontSize || 48;
          var fw = layer.fontWeight || 400;
          var ff = layer.fontFamily || '"DM Sans", sans-serif';
          ctx.font = fw + ' ' + fs + 'px ' + ff;
          ctx.fillStyle = layer.color || '#fff';
          ctx.textAlign = layer.textAlign || 'center';
          ctx.textBaseline = 'middle';
          var text = layer.content || '';
          if (layer.uppercase) text = text.toUpperCase();

          // Word wrap
          var maxW = layer.maxWidth || (_format.w - 100);
          var words = text.split(' ');
          var lines = [];
          var currentLine = '';
          for (var w = 0; w < words.length; w++) {
            var test = currentLine ? currentLine + ' ' + words[w] : words[w];
            if (ctx.measureText(test).width > maxW && currentLine) {
              lines.push(currentLine);
              currentLine = words[w];
            } else {
              currentLine = test;
            }
          }
          if (currentLine) lines.push(currentLine);

          var lh = fs * (layer.lineHeight || 1.2);
          var totalH = lines.length * lh;
          var startY = (layer.y || _format.h / 2) - totalH / 2 + lh / 2;
          for (var li = 0; li < lines.length; li++) {
            ctx.fillText(lines[li], layer.x || _format.w / 2, startY + li * lh);
          }
        }
      });
    },

    // ── EXPORT ──
    exportSlide: function(slideIndex, format) {
      var canvas = document.createElement('canvas');
      this.renderSlideToCanvas(slideIndex, canvas);
      var mime = (format === 'jpeg') ? 'image/jpeg' : 'image/png';
      var quality = (format === 'jpeg') ? 0.9 : undefined;
      return canvas.toDataURL(mime, quality);
    },

    // ── LOCAL PERSISTENCE ──
    saveLocal: function() {
      try {
        var data = {
          slides: _slides,
          branding: _branding,
          format: _format,
          title: _projectTitle,
          templateId: _templateId,
          savedAt: Date.now()
        };
        localStorage.setItem('car_project', JSON.stringify(data));
        return true;
      } catch (e) { return false; }
    },

    loadLocal: function() {
      try {
        var raw = localStorage.getItem('car_project');
        if (!raw) return false;
        var data = JSON.parse(raw);
        _slides = data.slides || [];
        _branding = data.branding || _branding;
        _format = data.format || _format;
        _projectTitle = data.title || 'Untitled Carousel';
        _templateId = data.templateId || null;
        _activeIndex = 0;
        _history = [];
        _historyIndex = -1;
        pushHistory();
        return true;
      } catch (e) { return false; }
    },

    clearLocal: function() {
      localStorage.removeItem('car_project');
    }
  };

  if (!window.AfroTools) window.AfroTools = {};
  if (!window.AfroTools.engines) window.AfroTools.engines = {};
  window.AfroTools.engines.creatorCarousel = pub;
})();
