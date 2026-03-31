/**
 * CreatorMind Engine — AI Creative Brief & Script Writer
 * Generation types, voice profiles, output formatting
 */
!function(){"use strict";

// ── AUTH HELPERS ──
var supabaseClient = null;
function getSupabase() {
  if (supabaseClient) return supabaseClient;
  if (window.AfroAuth && typeof AfroAuth.getSupabase === 'function') {
    supabaseClient = AfroAuth.getSupabase();
    return supabaseClient;
  }
  return null;
}
function getUserId() {
  if (window.AfroAuth && AfroAuth.user) return AfroAuth.user.id;
  return null;
}
function scopedKey(base) {
  var uid = getUserId();
  return uid ? base + '_' + uid : base;
}

var GENERATION_TYPES = {
  caption: { label: 'Caption Writer', icon: '📸', row: 1, platforms: ['instagram','tiktok','x','linkedin','facebook'] },
  thread: { label: 'Thread Writer', icon: '🧵', row: 1, platforms: ['x'] },
  script: { label: 'Script Writer', icon: '🎬', row: 1, platforms: ['youtube','tiktok','podcast','presentation'] },
  hook: { label: 'Hook Generator', icon: '⚡', row: 1, platforms: ['any','instagram','tiktok','youtube','x'] },
  hashtag: { label: 'Hashtag Generator', icon: '#️⃣', row: 1, platforms: ['instagram','tiktok','x','linkedin'] },
  bio: { label: 'Bio / About Writer', icon: '👤', row: 1, platforms: [] },
  pitch: { label: 'Pitch Email', icon: '📧', row: 2, platforms: [] },
  brief_decode: { label: 'Brief Decoder', icon: '📋', row: 2, platforms: [] },
  response: { label: 'Client Response', icon: '💬', row: 2, platforms: [] },
  product_desc: { label: 'Product Description', icon: '🛍️', row: 2, platforms: [] },
  repurpose: { label: 'Content Repurposer', icon: '♻️', row: 2, platforms: [] },
  campaign: { label: 'Campaign Ideas', icon: '💡', row: 2, platforms: [] }
};

var CAPTION_TONES = ['Professional','Casual','Funny','Inspirational','Controversial','Educational'];
var POST_TYPES = ['Photo','Carousel','Reel','Story'];
var CTA_TYPES = ['Visit link','Comment','Share','Save','DM'];
var SCRIPT_STYLES = ['Tutorial','Storytelling','Review','Reaction','Vlog','Educational','Entertainment'];
var VIDEO_LENGTHS = ['Under 1 min','1-5 min','5-15 min','15+ min'];
var HOOK_STYLES = ['Curiosity','Controversy','Statistic','Story','Question','Challenge','Confession'];
var THREAD_ANGLES = ['Educational','Opinion','Story','Tips','Case Study'];
var THREAD_LENGTHS = [5, 10, 15];
var REPURPOSE_FORMATS = ['IG Caption','X Thread','LinkedIn Post','TikTok Script','Newsletter','Carousel Text','Email'];

var TOKEN_LIMITS = {
  caption: 500,
  hook: 300,
  hashtag: 200,
  bio: 400,
  script: 2000,
  thread: 1500,
  pitch: 800,
  brief_decode: 1000,
  response: 600,
  product_desc: 500,
  repurpose: 1500,
  campaign: 1000
};

var MODEL_ROUTING = {
  hook: 'haiku',
  hashtag: 'haiku',
  caption: 'haiku',
  bio: 'haiku',
  script: 'sonnet',
  thread: 'sonnet',
  pitch: 'sonnet',
  brief_decode: 'sonnet',
  response: 'haiku',
  product_desc: 'haiku',
  repurpose: 'sonnet',
  campaign: 'sonnet'
};

function buildPrompt(type, formData, voiceProfile) {
  var parts = [];
  switch (type) {
    case 'caption':
      parts.push('Write 3 Instagram/social media caption options.');
      if (formData.platform) parts.push('Platform: ' + formData.platform);
      if (formData.topic) parts.push('Post is about: ' + formData.topic);
      if (formData.postType) parts.push('Post type: ' + formData.postType);
      if (formData.tone) parts.push('Tone: ' + formData.tone);
      if (formData.includeCta && formData.ctaType) parts.push('Include CTA: ' + formData.ctaType);
      parts.push('Label each option (e.g., "The bold one", "The safe one", "The viral one"). Format with proper line breaks.');
      break;
    case 'script':
      parts.push('Write a ' + (formData.platform || 'video') + ' script.');
      if (formData.title) parts.push('Topic: ' + formData.title);
      if (formData.length) parts.push('Target length: ' + formData.length);
      if (formData.style) parts.push('Style: ' + formData.style);
      if (formData.keyPoints) parts.push('Key points: ' + formData.keyPoints);
      parts.push('Include HOOK (first 5 seconds), BODY sections with timestamps, and CTA. Format clearly.');
      break;
    case 'hook':
      parts.push('Generate 10 scroll-stopping hooks.');
      if (formData.platform) parts.push('Platform: ' + formData.platform);
      if (formData.topic) parts.push('Topic: ' + formData.topic);
      if (formData.style) parts.push('Hook style focus: ' + formData.style);
      parts.push('Number each hook 1-10. Mix styles (curiosity, controversy, statistic, story, question).');
      break;
    case 'thread':
      parts.push('Write an X/Twitter thread.');
      if (formData.topic) parts.push('Topic: ' + formData.topic);
      if (formData.length) parts.push('Thread length: ' + formData.length + ' tweets');
      if (formData.angle) parts.push('Angle: ' + formData.angle);
      parts.push('Number each tweet. First tweet is the hook. Each tweet should standalone but flow as a narrative. End with a CTA.');
      break;
    case 'pitch':
      parts.push('Write a professional pitch email.');
      if (formData.brand) parts.push('Pitching to: ' + formData.brand);
      if (formData.pitchType) parts.push('Pitch type: ' + formData.pitchType);
      if (formData.valueProp) parts.push('Creator value proposition: ' + formData.valueProp);
      if (formData.includeBudget) parts.push('Include rate/budget discussion');
      parts.push('Make it personalized, confident, not begging. Reference the brand naturally.');
      break;
    case 'brief_decode':
      parts.push('Decode this brand brief into actionable creative direction:');
      if (formData.brief) parts.push(formData.brief);
      parts.push('Output: 1) What they actually want, 2) Key deliverables, 3) Timeline, 4) Creative direction, 5) Do\'s and Don\'ts, 6) What they\'re measuring');
      break;
    case 'repurpose':
      parts.push('Repurpose this content into different formats.');
      if (formData.original) parts.push('Original content:\n' + formData.original);
      if (formData.originalFormat) parts.push('Original format: ' + formData.originalFormat);
      if (formData.targetFormats) parts.push('Repurpose into: ' + formData.targetFormats.join(', '));
      parts.push('Adapt tone, length, and format for each platform. Keep the core message.');
      break;
    case 'hashtag':
      parts.push('Generate relevant hashtags.');
      if (formData.topic) parts.push('Content about: ' + formData.topic);
      if (formData.platform) parts.push('Platform: ' + formData.platform);
      parts.push('Provide 30 hashtags: 10 high-volume, 10 medium, 10 niche. Group them.');
      break;
    case 'bio':
      parts.push('Write 3 bio/about options.');
      if (formData.platform) parts.push('For: ' + formData.platform);
      if (formData.about) parts.push('About: ' + formData.about);
      parts.push('Each bio should have a different vibe (professional, creative, punchy). Keep platform character limits in mind.');
      break;
    case 'response':
      parts.push('Draft a professional client response.');
      if (formData.context) parts.push('Context: ' + formData.context);
      if (formData.tone) parts.push('Tone: ' + formData.tone);
      parts.push('Be clear, professional, and boundary-setting when needed.');
      break;
    case 'product_desc':
      parts.push('Write a compelling product description.');
      if (formData.product) parts.push('Product: ' + formData.product);
      if (formData.audience) parts.push('Target audience: ' + formData.audience);
      if (formData.platform) parts.push('Platform: ' + formData.platform);
      parts.push('Make it benefit-driven, scannable, and include a CTA.');
      break;
    case 'campaign':
      parts.push('Generate creative campaign ideas.');
      if (formData.objective) parts.push('Objective: ' + formData.objective);
      if (formData.audience) parts.push('Audience: ' + formData.audience);
      if (formData.budget) parts.push('Budget level: ' + formData.budget);
      parts.push('Provide 5 campaign concepts, each with: name, concept, key content pieces, expected outcome.');
      break;
    default:
      if (formData.message) parts.push(formData.message);
  }

  if (voiceProfile && voiceProfile.tone) {
    parts.push('\n[VOICE PROFILE — match this voice exactly]:');
    parts.push('Tone: ' + voiceProfile.tone);
    if (voiceProfile.sentence_style) parts.push('Sentence style: ' + voiceProfile.sentence_style);
    if (voiceProfile.vocabulary && voiceProfile.vocabulary.length) parts.push('Vocabulary/slang: ' + voiceProfile.vocabulary.join(', '));
    if (voiceProfile.emoji_usage) parts.push('Emoji usage: ' + voiceProfile.emoji_usage);
    if (voiceProfile.signature_patterns && voiceProfile.signature_patterns.length) parts.push('Patterns: ' + voiceProfile.signature_patterns.join('; '));
    if (voiceProfile.avoid && voiceProfile.avoid.length) parts.push('Avoid: ' + voiceProfile.avoid.join(', '));
  }

  return parts.join('\n');
}

function createHistoryEntry(type, formData, outputs) {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    type: type,
    input: formData,
    outputs: outputs || [],
    platform: formData.platform || '',
    isFavorite: false,
    createdAt: Date.now()
  };
}

function formatTimestamp(ts) {
  var d = new Date(ts);
  var now = new Date();
  var diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

window.AfroTools = window.AfroTools || {};
window.AfroTools.CreatorMindEngine = {
  GENERATION_TYPES: GENERATION_TYPES,
  CAPTION_TONES: CAPTION_TONES,
  POST_TYPES: POST_TYPES,
  CTA_TYPES: CTA_TYPES,
  SCRIPT_STYLES: SCRIPT_STYLES,
  VIDEO_LENGTHS: VIDEO_LENGTHS,
  HOOK_STYLES: HOOK_STYLES,
  THREAD_ANGLES: THREAD_ANGLES,
  THREAD_LENGTHS: THREAD_LENGTHS,
  REPURPOSE_FORMATS: REPURPOSE_FORMATS,
  TOKEN_LIMITS: TOKEN_LIMITS,
  MODEL_ROUTING: MODEL_ROUTING,
  buildPrompt: buildPrompt,
  createHistoryEntry: createHistoryEntry,
  formatTimestamp: formatTimestamp
};

}();
