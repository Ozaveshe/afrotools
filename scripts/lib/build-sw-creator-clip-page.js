"use strict";

const fs = require("node:fs");
const path = require("node:path");

const COPY = [
  ["CreatorClip Workspace | AfroTools", "Kihariri cha CreatorClip | AfroTools"],
  ["+ New Video", "+ Video mpya"],
  ["Drop your video here", "Weka video yako hapa"],
  ["or click to browse files", "au bofya kuchagua faili"],
  ["Choose Video", "Chagua video"],
  ["MP4, WebM, MOV up to 500MB", "MP4, WebM au MOV hadi MB 500"],
  ["MP4, WebM, MOV &mdash; up to 500MB", "MP4, WebM au MOV hadi MB 500"],
  ["TIMELINE", "RATIBA YA VIDEO"],
  ["Full video", "Video nzima"],
  ["Captions", "Manukuu"],
  ["Styles", "Mitindo"],
  ["Resize", "Badili ukubwa"],
  ["Text", "Maandishi"],
  ["Export", "Pakua"],
  ["Filters", "Vichujio"],
  ["Speed", "Kasi"],
  ["Audio", "Sauti"],
  ["Auto-Generate Captions", "Tengeneza manukuu kiotomatiki"],
  ["+ Add Caption", "+ Ongeza nukuu"],
  ["Clear All", "Futa yote"],
  ["No captions yet. Click &quot;Auto-Generate&quot; to create captions from audio, or add them manually.", "Bado hakuna manukuu. Yatengeneze kutoka sauti au uyaongeze mwenyewe."],
  ["No captions yet. Click \"Auto-Generate\" to create captions from audio, or add them manually.", "Bado hakuna manukuu. Yatengeneze kutoka sauti au uyaongeze mwenyewe."],
  ["Caption Style", "Mtindo wa manukuu"],
  ["SAMPLE", "MFANO"],
  ["Sample", "Mfano"],
  ["sample", "mfano"],
  ["Sam", "Mfa"],
  ["ple", "no"],
  ["Classic White", "Nyeupe ya kawaida"],
  ["Bold Yellow", "Njano nzito"],
  ["Minimal", "Rahisi"],
  ["Neon Glow", "Mwangaza wa neon"],
  ["Typewriter", "Mashine ya kuandika"],
  ["Gradient", "Mchanganyiko wa rangi"],
  ["Custom", "Chaguo lako"],
  ["Font", "Fonti"],
  ["Size", "Ukubwa"],
  ["Color", "Rangi"],
  ["BG Color", "Rangi ya nyuma"],
  ["Enable BG", "Washa mandharinyuma"],
  ["Position", "Nafasi"],
  ["Bottom", "Chini"],
  ["Center", "Katikati"],
  ["Top", "Juu"],
  ["Platform Size", "Ukubwa wa jukwaa"],
  ["Landscape", "Mlalo"],
  ["Portrait", "Wima"],
  ["Square", "Mraba"],
  ["Tall", "Mrefu"],
  ["Background Fill", "Kijazo cha mandharinyuma"],
  ["Blur", "Ukungu"],
  ["Black", "Nyeusi"],
  ["White", "Nyeupe"],
  ["Text Overlays", "Maandishi juu ya video"],
  ["No text overlays yet. Add text that appears at specific points in your video.", "Bado hakuna maandishi ya juu. Ongeza maandishi yatakayoonekana katika muda maalumu."],
  ["+ Add Text Overlay", "+ Ongeza maandishi"],
  ["Export Video", "Pakua video"],
  ["Quality", "Ubora"],
  ["Format", "Muundo"],
  ["Preparing...", "Inaandaa..."],
  ["Video Filters", "Vichujio vya video"],
  ["None", "Hakuna"],
  ["Grayscale", "Kijivu"],
  ["Warm", "Joto"],
  ["Cool", "Baridi"],
  ["Vintage", "Kizamani"],
  ["High Contrast", "Utofauti mkubwa"],
  ["Cinematic", "Sinema"],
  ["Adjustments", "Marekebisho"],
  ["Brightness", "Mwangaza"],
  ["Contrast", "Utofauti"],
  ["Saturation", "Ukolezi wa rangi"],
  ["Playback Speed", "Kasi ya kucheza"],
  ["Adjust video playback speed. Speed changes apply to the preview only â€” export uses original speed unless trimmed.", "Badili kasi ya hakiki. Video inayopakuliwa hutumia kasi ya asili isipokuwa sehemu iliyokatwa."],
  ["Adjust video playback speed. Speed changes apply to the preview only — export uses original speed unless trimmed.", "Badili kasi ya hakiki. Video inayopakuliwa hutumia kasi ya asili isipokuwa sehemu iliyokatwa."],
  ["Audio Controls", "Vidhibiti vya sauti"],
  ["Volume", "Kiwango cha sauti"],
  ["Mute", "Nyamazisha"],
  ["Fade In", "Sauti iingie taratibu"],
  ["Fade Out", "Sauti itoke taratibu"],
  ["About", "Kuhusu"],
];

function build(root) {
  let html = fs.readFileSync(path.join(root, "tools/creator-clip/app.html"), "utf8");
  html = html
    .replace(/ data-chat-bundle="[^"]+"/i, "")
    .replace(/href="style\.css([^"]*)"/i, 'href="/tools/creator-clip/style.css$1"')
    .replace(/href="(?:index|app)\.html"/g, 'href="/sw/zana/kukata-video-za-mtayarishi/"')
    .split(/(<[^>]+>)/)
    .map((part) => {
      if (part.startsWith("<")) return part;
      for (const [from, to] of [...COPY].sort((a, b) => b[0].length - a[0].length)) {
        part = part.split(from).join(to);
      }
      return part;
    })
    .join("");
  html = html
    .replace(/<html([^>]*?)lang="en"/i, '<html$1lang="sw"')
    .replace(/<meta name="robots" content="[^"]+">/i, '<meta name="robots" content="index, follow">')
    .replace(/<meta name="description" content="[^"]+">/i, '<meta name="description" content="Hariri video ndani ya kivinjari: kata, ongeza manukuu na maandishi, badili ukubwa, vichujio, kasi na sauti, kisha pakua WebM bila kupakia faili kwenye seva.">')
    .replace(/<meta property="og:title" content="[^"]+">/i, '<meta property="og:title" content="Kihariri kamili cha CreatorClip kwa Kiswahili">')
    .replace(/<meta property="og:description" content="[^"]+">/i, '<meta property="og:description" content="Kata na boresha video ndani ya kivinjari bila kupakia faili kwenye seva.">')
    .replace(/https:\/\/afrotools\.com\/tools\/creator-clip\/app/g, "https://afrotools.com/sw/zana/kukata-video-za-mtayarishi/")
    .replace(/<script src="\/assets\/js\/analytics-bootstrap\.js[^>]*><\/script>\s*/i, "")
    .replace(/<script src="\/assets\/js\/supabase-auth\.js[^>]*><\/script>\s*/i, "")
    .replace(/<script src="\/assets\/js\/lib\/creator-profile\.js[^>]*><\/script>\s*/i, "")
    .replace(/title="Save Project"/g, 'title="Hifadhi mradi"')
    .replace(/title="Load Project"/g, 'title="Rejesha mradi"')
    .replace(/title="Back 5s"/g, 'title="Rudi sekunde 5"')
    .replace(/title="Forward 5s"/g, 'title="Songa sekunde 5"')
    .replace(/title="Play\/Pause \(K\)"/g, 'title="Cheza au simamisha (K)"')
    .replace(/title="Fullscreen"/g, 'title="Skrini nzima"')
    .replace(/aria-label="FileInput"/g, 'aria-label="Faili ya video"')
    .replace(/aria-label="VolumeSlider"/g, 'aria-label="Kiwango cha sauti"')
    .replace(/aria-label="Custom Font"/g, 'aria-label="Fonti maalumu"')
    .replace(/aria-label="CustomSize"/g, 'aria-label="Ukubwa maalumu"')
    .replace(/aria-label="CustomColor"/g, 'aria-label="Rangi maalumu"')
    .replace(/aria-label="CustomBg"/g, 'aria-label="Rangi ya nyuma"')
    .replace(/aria-label="CustomBgOn"/g, 'aria-label="Washa rangi ya nyuma"')
    .replace(/aria-label="Custom Pos"/g, 'aria-label="Nafasi ya maandishi"')
    .replace(/aria-label="BrightnessSlider"/g, 'aria-label="Mwangaza"')
    .replace(/aria-label="ContrastSlider"/g, 'aria-label="Utofauti"')
    .replace(/aria-label="SaturationSlider"/g, 'aria-label="Ukolezi wa rangi"')
    .replace(/aria-label="AudioVolume"/g, 'aria-label="Kiwango cha sauti ya video"')
    .replace(/<script src="\/assets\/js\/pages\/creative\/creator-clip-app-controller\.js[^>]*><\/script>/i, '<script src="/assets/js/pages/creative/creator-clip-app-controller.js"></script><script src="/assets/js/lib/sw-accessibility.js" defer></script>');
  const seo = '<meta name="description" content="Hariri video ndani ya kivinjari: kata, ongeza manukuu na maandishi, badili ukubwa na pakua WebM bila kupakia faili kwenye seva."><meta name="geo.region" content="002"><meta property="og:title" content="Kihariri kamili cha CreatorClip kwa Kiswahili"><meta property="og:description" content="Kata na boresha video ndani ya kivinjari bila kupakia faili kwenye seva."><meta property="og:image" content="https://afrotools.com/assets/img/tools/creator-clip.webp"><meta property="og:locale" content="sw_KE"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebApplication","name":"Kihariri cha CreatorClip","url":"https://afrotools.com/sw/zana/kukata-video-za-mtayarishi/","inLanguage":"sw","applicationCategory":"MultimediaApplication","operatingSystem":"Web","isAccessibleForFree":true}</script>';
  return html.replace(/<\/head>/i, seo + '<link rel="stylesheet" href="/assets/css/sw-creative-final-a.css"><link rel="alternate" hreflang="en" href="https://afrotools.com/tools/creator-clip/"><link rel="alternate" hreflang="fr" href="https://afrotools.com/fr/tools/decoupe-de-video-pour-createur/"><link rel="alternate" hreflang="sw" href="https://afrotools.com/sw/zana/kukata-video-za-mtayarishi/"><link rel="alternate" hreflang="x-default" href="https://afrotools.com/tools/creator-clip/"></head>');
}

module.exports = { build };
