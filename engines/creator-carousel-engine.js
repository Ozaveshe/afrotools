!function(){"use strict";

/* ── private state ── */
var e=[],t=0,
    n={primaryColor:"#AF52DE",secondaryColor:"#1a1a1a",font:"Montserrat",handle:""},
    o={w:1080,h:1350,name:"1080x1350"},
    r=[],a=-1,i=0,l="Untitled Carousel",s=null;

function c(){return"layer_"+ ++i+"_"+Date.now()}
function f(e){return JSON.parse(JSON.stringify(e))}
function y(){(r=r.slice(0,a+1)).push(f({slides:e,activeIndex:t,branding:n})),a=r.length-1,r.length>40&&(r.shift(),a--)}

/* ── FORMATS (original 3 + 5 new) ── */
var d={
  "1080x1350":{w:1080,h:1350,name:"1080x1350",label:"IG Portrait"},
  "1080x1080":{w:1080,h:1080,name:"1080x1080",label:"Square"},
  "1280x720":{w:1280,h:720,name:"1280x720",label:"LinkedIn"},
  "1080x1920":{w:1080,h:1920,name:"1080x1920",label:"TikTok / IG Story"},
  "1200x1500":{w:1200,h:1500,name:"1200x1500",label:"Pinterest"},
  "1200x627":{w:1200,h:627,name:"1200x627",label:"LinkedIn Landscape"},
  "1080x566":{w:1080,h:566,name:"1080x566",label:"Facebook"},
  "1600x900":{w:1600,h:900,name:"1600x900",label:"X / Twitter"}
};

/* ── TEMPLATES (original 8) ── */
var x=[
/* 1 — edu-tips-01 */
{id:"edu-tips-01",name:"5 Tips \u2014 Bold",category:"educational",format:"1080x1350",slideCount:7,slides:[{type:"cover",bg:{type:"gradient",colors:["#AF52DE","#5B21B6"],angle:135},layers:[{type:"text",role:"headline",content:"5 THINGS EVERY CREATOR NEEDS",x:540,y:500,fontSize:64,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},{type:"text",role:"subhead",content:"Swipe \u2192",x:540,y:1250,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:400}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"number",content:"01",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(175,82,222,.2)",textAlign:"center",maxWidth:400,fontWeight:900},{type:"text",role:"headline",content:"KNOW YOUR NICHE",x:540,y:580,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Pick one topic and go deep. Generalists get lost in the feed.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"number",content:"02",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(175,82,222,.2)",textAlign:"center",maxWidth:400,fontWeight:900},{type:"text",role:"headline",content:"POST CONSISTENTLY",x:540,y:580,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"The algorithm rewards consistency. Show up even when nobody claps.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"number",content:"03",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(175,82,222,.2)",textAlign:"center",maxWidth:400,fontWeight:900},{type:"text",role:"headline",content:"ENGAGE YOUR AUDIENCE",x:540,y:580,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Reply to every comment. Your community is your biggest asset.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"number",content:"04",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(175,82,222,.2)",textAlign:"center",maxWidth:400,fontWeight:900},{type:"text",role:"headline",content:"BUILD IN PUBLIC",x:540,y:580,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Share your journey \u2014 the wins AND the losses. People connect with real stories.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"number",content:"05",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(175,82,222,.2)",textAlign:"center",maxWidth:400,fontWeight:900},{type:"text",role:"headline",content:"MONETIZE EARLY",x:540,y:580,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Don\u2019t wait for 100K followers. Start selling value from day one.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"cta",bg:{type:"gradient",colors:["#AF52DE","#5B21B6"],angle:135},layers:[{type:"text",role:"cta-headline",content:"FOLLOW FOR MORE",x:540,y:600,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:32,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:400}]}]},

/* 2 — story-01 */
{id:"story-01",name:"Story Arc",category:"storytelling",format:"1080x1350",slideCount:5,slides:[{type:"cover",bg:{type:"gradient",colors:["#1a1a2e","#16213e"],angle:180},layers:[{type:"text",role:"headline",content:"THE DAY EVERYTHING CHANGED",x:540,y:600,fontSize:56,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:850,fontWeight:700},{type:"text",role:"subhead",content:"A Story \u2192",x:540,y:1250,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.4)",textAlign:"center",maxWidth:400}]},{type:"content",bg:{type:"solid",color:"#1a1a2e"},layers:[{type:"text",role:"body",content:"It started with a single message at 3am. I didn\u2019t know it yet, but my life was about to take a completely different direction...",x:540,y:600,fontSize:32,fontFamily:'"Playfair Display", serif',color:"rgba(255,255,255,.85)",textAlign:"center",maxWidth:800,lineHeight:1.5}]},{type:"content",bg:{type:"solid",color:"#1a1a2e"},layers:[{type:"text",role:"body",content:"I had two choices: stay comfortable or take the biggest risk of my career. The safe path was obvious. But something inside me said \u201cnot this time.\u201d",x:540,y:600,fontSize:32,fontFamily:'"Playfair Display", serif',color:"rgba(255,255,255,.85)",textAlign:"center",maxWidth:800,lineHeight:1.5}]},{type:"content",bg:{type:"solid",color:"#1a1a2e"},layers:[{type:"text",role:"body",content:"Six months later, I\u2019m writing this from a place I never imagined I\u2019d be. The lesson? Sometimes the scariest door leads to the best room.",x:540,y:600,fontSize:32,fontFamily:'"Playfair Display", serif',color:"rgba(255,255,255,.85)",textAlign:"center",maxWidth:800,lineHeight:1.5}]},{type:"cta",bg:{type:"gradient",colors:["#1a1a2e","#AF52DE"],angle:180},layers:[{type:"text",role:"cta-headline",content:"WHAT\u2019S YOUR STORY?",x:540,y:580,fontSize:48,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,fontWeight:700},{type:"text",role:"handle",content:"Share in the comments \u2193",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.5)",textAlign:"center",maxWidth:500}]}]},

/* 3 — beforeafter-01 */
{id:"beforeafter-01",name:"Before & After",category:"beforeafter",format:"1080x1350",slideCount:4,slides:[{type:"cover",bg:{type:"gradient",colors:["#FF3B30","#FF6B3B"],angle:135},layers:[{type:"text",role:"headline",content:"MY TRANSFORMATION",x:540,y:550,fontSize:60,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},{type:"text",role:"subhead",content:"Before \u2192 After",x:540,y:750,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:500}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"BEFORE",x:540,y:200,fontSize:64,fontFamily:'"Montserrat", sans-serif',color:"#FF3B30",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Where I started \u2014 struggling, unsure, no direction.",x:540,y:900,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"AFTER",x:540,y:200,fontSize:64,fontFamily:'"Montserrat", sans-serif',color:"#34C759",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Where I am now \u2014 focused, profitable, growing every day.",x:540,y:900,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}]},{type:"cta",bg:{type:"gradient",colors:["#34C759","#30D158"],angle:135},layers:[{type:"text",role:"cta-headline",content:"YOUR TURN",x:540,y:600,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:32,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:400}]}]},

/* 4 — quote-01 */
{id:"quote-01",name:"Motivational Quotes",category:"quote",format:"1080x1080",slideCount:4,slides:[{type:"cover",bg:{type:"gradient",colors:["#FFD60A","#FF9500"],angle:135},layers:[{type:"text",role:"headline",content:"WORDS TO LIVE BY",x:540,y:480,fontSize:56,fontFamily:'"Bebas Neue", sans-serif',color:"#1a1a1a",textAlign:"center",maxWidth:800,uppercase:!0},{type:"text",role:"subhead",content:"4 Quotes That Changed My Life \u2192",x:540,y:620,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(0,0,0,.5)",textAlign:"center",maxWidth:600}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"\u201cThe best time to start was yesterday. The second best time is now.\u201d",x:540,y:440,fontSize:40,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,lineHeight:1.4},{type:"text",role:"body",content:"\u2014 African Proverb",x:540,y:700,fontSize:22,fontFamily:'"DM Sans", sans-serif',color:"#FFD60A",textAlign:"center",maxWidth:400}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"\u201cIf you want to go fast, go alone. If you want to go far, go together.\u201d",x:540,y:440,fontSize:40,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,lineHeight:1.4},{type:"text",role:"body",content:"\u2014 African Proverb",x:540,y:700,fontSize:22,fontFamily:'"DM Sans", sans-serif',color:"#FFD60A",textAlign:"center",maxWidth:400}]},{type:"cta",bg:{type:"gradient",colors:["#FFD60A","#FF9500"],angle:135},layers:[{type:"text",role:"cta-headline",content:"SAVE & SHARE",x:540,y:440,fontSize:52,fontFamily:'"Bebas Neue", sans-serif',color:"#1a1a1a",textAlign:"center",maxWidth:800,uppercase:!0},{type:"text",role:"handle",content:"@yourhandle",x:540,y:580,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(0,0,0,.5)",textAlign:"center",maxWidth:400}]}]},

/* 5 — brand-01 */
{id:"brand-01",name:"Brand Introduction",category:"brand",format:"1080x1350",slideCount:5,slides:[{type:"cover",bg:{type:"gradient",colors:["#007AFF","#5856D6"],angle:135},layers:[{type:"text",role:"headline",content:"HI, I\u2019M [NAME]",x:540,y:550,fontSize:60,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},{type:"text",role:"subhead",content:"Nice to meet you \u2192",x:540,y:750,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}]},{type:"content",bg:{type:"solid",color:"#0f0f1a"},layers:[{type:"text",role:"headline",content:"WHAT I DO",x:540,y:350,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#007AFF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"I help creators and businesses grow their online presence through strategic content and design.",x:540,y:650,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}]},{type:"content",bg:{type:"solid",color:"#0f0f1a"},layers:[{type:"text",role:"headline",content:"WHO I HELP",x:540,y:350,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#007AFF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Creators, solopreneurs, and small businesses across Africa who want to stand out online.",x:540,y:650,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}]},{type:"content",bg:{type:"solid",color:"#0f0f1a"},layers:[{type:"text",role:"headline",content:"WHY FOLLOW ME",x:540,y:350,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#007AFF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Daily tips on content strategy, design, and building a personal brand that actually makes money.",x:540,y:650,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}]},{type:"cta",bg:{type:"gradient",colors:["#007AFF","#5856D6"],angle:135},layers:[{type:"text",role:"cta-headline",content:"LET\u2019S CONNECT",x:540,y:600,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:32,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:400}]}]},

/* 6 — product-01 */
{id:"product-01",name:"Product Showcase",category:"product",format:"1080x1350",slideCount:5,slides:[{type:"cover",bg:{type:"gradient",colors:["#34C759","#30D158"],angle:135},layers:[{type:"text",role:"headline",content:"INTRODUCING [PRODUCT]",x:540,y:550,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},{type:"text",role:"subhead",content:"See what\u2019s inside \u2192",x:540,y:750,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}]},{type:"content",bg:{type:"solid",color:"#0a1a0a"},layers:[{type:"text",role:"headline",content:"FEATURE 1",x:540,y:400,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#34C759",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Describe your first key feature here. What problem does it solve?",x:540,y:650,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750}]},{type:"content",bg:{type:"solid",color:"#0a1a0a"},layers:[{type:"text",role:"headline",content:"FEATURE 2",x:540,y:400,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#34C759",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"body",content:"Describe your second key feature. How does it make life easier?",x:540,y:650,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750}]},{type:"content",bg:{type:"solid",color:"#0a1a0a"},layers:[{type:"text",role:"headline",content:"PRICING",x:540,y:350,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#34C759",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"number",content:"$49",x:540,y:600,fontSize:120,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:500,fontWeight:900},{type:"text",role:"body",content:"One-time payment. Lifetime access.",x:540,y:850,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.5)",textAlign:"center",maxWidth:600}]},{type:"cta",bg:{type:"gradient",colors:["#34C759","#30D158"],angle:135},layers:[{type:"text",role:"cta-headline",content:"GET IT NOW",x:540,y:600,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"handle",content:"Link in bio \u2191",x:540,y:750,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:400}]}]},

/* 7 — data-01 */
{id:"data-01",name:"Stats & Data",category:"data",format:"1080x1080",slideCount:5,slides:[{type:"cover",bg:{type:"gradient",colors:["#5856D6","#AF52DE"],angle:135},layers:[{type:"text",role:"headline",content:"THE NUMBERS DON\u2019T LIE",x:540,y:440,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},{type:"text",role:"subhead",content:"Data that will surprise you \u2192",x:540,y:620,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:600}]},{type:"content",bg:{type:"solid",color:"#0f0f1a"},layers:[{type:"text",role:"number",content:"73%",x:540,y:350,fontSize:140,fontFamily:'"Montserrat", sans-serif',color:"#AF52DE",textAlign:"center",maxWidth:600,fontWeight:900},{type:"text",role:"body",content:"of African internet users access the web primarily through mobile phones",x:540,y:600,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#0f0f1a"},layers:[{type:"text",role:"number",content:"2.5B",x:540,y:350,fontSize:140,fontFamily:'"Montserrat", sans-serif',color:"#AF52DE",textAlign:"center",maxWidth:600,fontWeight:900},{type:"text",role:"body",content:"projected African population by 2050 \u2014 the youngest continent on Earth",x:540,y:600,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:700}]},{type:"content",bg:{type:"solid",color:"#0f0f1a"},layers:[{type:"text",role:"number",content:"$180B",x:540,y:350,fontSize:120,fontFamily:'"Montserrat", sans-serif',color:"#AF52DE",textAlign:"center",maxWidth:600,fontWeight:900},{type:"text",role:"body",content:"Africa\u2019s creative economy is growing faster than any other sector",x:540,y:600,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:700}]},{type:"cta",bg:{type:"gradient",colors:["#5856D6","#AF52DE"],angle:135},layers:[{type:"text",role:"cta-headline",content:"FOLLOW FOR MORE DATA",x:540,y:440,fontSize:44,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"handle",content:"@yourhandle",x:540,y:580,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:400}]}]},

/* 8 — testimonial-01 */
{id:"testimonial-01",name:"Client Testimonials",category:"testimonial",format:"1080x1350",slideCount:5,slides:[{type:"cover",bg:{type:"gradient",colors:["#FF2D55","#FF6B81"],angle:135},layers:[{type:"text",role:"headline",content:"WHAT MY CLIENTS SAY",x:540,y:550,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},{type:"text",role:"subhead",content:"Real reviews \u2192",x:540,y:750,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"\u2b50\u2b50\u2b50\u2b50\u2b50",x:540,y:350,fontSize:48,fontFamily:'"DM Sans", sans-serif',color:"#FFD60A",textAlign:"center",maxWidth:600},{type:"text",role:"body",content:"\u201cThis completely changed how I approach my content. The results speak for themselves \u2014 3x engagement in just one month.\u201d",x:540,y:650,fontSize:28,fontFamily:'"Playfair Display", serif',color:"rgba(255,255,255,.85)",textAlign:"center",maxWidth:800,lineHeight:1.5},{type:"text",role:"handle",content:"\u2014 Sarah M., Content Creator",x:540,y:1000,fontSize:20,fontFamily:'"DM Sans", sans-serif',color:"#FF2D55",textAlign:"center",maxWidth:500}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"\u2b50\u2b50\u2b50\u2b50\u2b50",x:540,y:350,fontSize:48,fontFamily:'"DM Sans", sans-serif',color:"#FFD60A",textAlign:"center",maxWidth:600},{type:"text",role:"body",content:"\u201cI was skeptical at first, but the ROI has been incredible. Best investment I've made for my brand this year.\u201d",x:540,y:650,fontSize:28,fontFamily:'"Playfair Display", serif',color:"rgba(255,255,255,.85)",textAlign:"center",maxWidth:800,lineHeight:1.5},{type:"text",role:"handle",content:"\u2014 David K., Entrepreneur",x:540,y:1000,fontSize:20,fontFamily:'"DM Sans", sans-serif',color:"#FF2D55",textAlign:"center",maxWidth:500}]},{type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{type:"text",role:"headline",content:"\u2b50\u2b50\u2b50\u2b50\u2b50",x:540,y:350,fontSize:48,fontFamily:'"DM Sans", sans-serif',color:"#FFD60A",textAlign:"center",maxWidth:600},{type:"text",role:"body",content:"\u201cProfessional, fast, and the results exceeded my expectations. I recommend this to every creator I know.\u201d",x:540,y:650,fontSize:28,fontFamily:'"Playfair Display", serif',color:"rgba(255,255,255,.85)",textAlign:"center",maxWidth:800,lineHeight:1.5},{type:"text",role:"handle",content:"\u2014 Amina O., Brand Strategist",x:540,y:1000,fontSize:20,fontFamily:'"DM Sans", sans-serif',color:"#FF2D55",textAlign:"center",maxWidth:500}]},{type:"cta",bg:{type:"gradient",colors:["#FF2D55","#FF6B81"],angle:135},layers:[{type:"text",role:"cta-headline",content:"READY TO JOIN THEM?",x:540,y:600,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},{type:"text",role:"handle",content:"DM me to get started \u2192",x:540,y:750,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}]}]},

/* ── NEW AFROCENTRIC TEMPLATES (9-14) ── */

/* 9 — afro-kente-01 */
{id:"afro-kente-01",name:"Kente Tips",category:"educational",format:"1080x1350",slideCount:7,slides:[
  {type:"cover",bg:{type:"gradient",colors:["#D4AF37","#1B1464"],angle:135},layers:[
    {type:"text",role:"headline",content:"5 THINGS ABOUT AFRICAN BUSINESS",x:540,y:500,fontSize:58,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},
    {type:"text",role:"subhead",content:"Swipe \u2192",x:540,y:1250,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(212,175,55,.7)",textAlign:"center",maxWidth:400}
  ]},
  {type:"content",bg:{type:"solid",color:"#1B1464"},layers:[
    {type:"text",role:"number",content:"01",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(212,175,55,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"KNOW THE AFRICAN MARKET",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Africa has 54 countries, 2,000+ languages, and a booming middle class. Understand the diversity before you build.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1B1464"},layers:[
    {type:"text",role:"number",content:"02",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(212,175,55,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"MOBILE-FIRST ALWAYS",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Over 70% of Africans access the internet via mobile. Your product must be built for the phone first.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1B1464"},layers:[
    {type:"text",role:"number",content:"03",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(212,175,55,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"SOLVE LOCAL PROBLEMS",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"The best African startups solve uniquely African pain points \u2014 payments, logistics, agriculture, education.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1B1464"},layers:[
    {type:"text",role:"number",content:"04",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(212,175,55,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"BUILD COMMUNITY FIRST",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"In Africa, trust is currency. Build relationships and community before scaling your product.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1B1464"},layers:[
    {type:"text",role:"number",content:"05",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(212,175,55,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"THINK PAN-AFRICAN",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Don\u2019t limit to one country. AfCFTA opens 1.3 billion consumers \u2014 build for the continent.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"cta",bg:{type:"gradient",colors:["#D4AF37","#1B1464"],angle:135},layers:[
    {type:"text",role:"cta-headline",content:"FOLLOW FOR MORE",x:540,y:600,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:32,fontFamily:'"DM Sans", sans-serif',color:"rgba(212,175,55,.7)",textAlign:"center",maxWidth:400}
  ]}
]},

/* 10 — afro-proverbs-01 */
{id:"afro-proverbs-01",name:"African Proverbs",category:"quote",format:"1080x1080",slideCount:4,slides:[
  {type:"cover",bg:{type:"solid",color:"#2C1810"},layers:[
    {type:"text",role:"headline",content:"AFRICAN WISDOM",x:540,y:400,fontSize:60,fontFamily:'"Playfair Display", serif',color:"#D4AF37",textAlign:"center",maxWidth:800,fontWeight:700},
    {type:"text",role:"subhead",content:"Proverbs that guide us \u2192",x:540,y:560,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(212,175,55,.5)",textAlign:"center",maxWidth:600}
  ]},
  {type:"content",bg:{type:"solid",color:"#2C1810"},layers:[
    {type:"text",role:"headline",content:"\u201cHowever long the night, the dawn will break.\u201d",x:540,y:400,fontSize:42,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,lineHeight:1.4},
    {type:"text",role:"body",content:"\u2014 African Proverb",x:540,y:640,fontSize:22,fontFamily:'"DM Sans", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:400}
  ]},
  {type:"content",bg:{type:"solid",color:"#2C1810"},layers:[
    {type:"text",role:"headline",content:"\u201cA child who is not embraced by the village will burn it down to feel its warmth.\u201d",x:540,y:400,fontSize:38,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,lineHeight:1.4},
    {type:"text",role:"body",content:"\u2014 African Proverb",x:540,y:660,fontSize:22,fontFamily:'"DM Sans", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:400}
  ]},
  {type:"content",bg:{type:"solid",color:"#2C1810"},layers:[
    {type:"text",role:"headline",content:"\u201cSmooth seas do not make skillful sailors.\u201d",x:540,y:400,fontSize:42,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,lineHeight:1.4},
    {type:"text",role:"body",content:"\u2014 African Proverb",x:540,y:640,fontSize:22,fontFamily:'"DM Sans", sans-serif',color:"#D4AF37",textAlign:"center",maxWidth:400}
  ]}
]},

/* 11 — afro-jollof-01 */
{id:"afro-jollof-01",name:"Jollof Recipe",category:"food",format:"1080x1350",slideCount:5,slides:[
  {type:"cover",bg:{type:"gradient",colors:["#FF3B30","#FF6B3B"],angle:135},layers:[
    {type:"text",role:"headline",content:"NIGERIAN JOLLOF RECIPE",x:540,y:500,fontSize:56,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},
    {type:"text",role:"subhead",content:"The one that ends all debates \u2192",x:540,y:700,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a0a"},layers:[
    {type:"text",role:"headline",content:"INGREDIENTS",x:540,y:250,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#FF3B30",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"2 cups long-grain rice \u2022 6 tomatoes \u2022 3 red peppers \u2022 Scotch bonnets \u2022 1 onion \u2022 Tomato paste \u2022 Seasoning cubes \u2022 Thyme \u2022 Bay leaves \u2022 Vegetable oil \u2022 Salt to taste",x:540,y:700,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.6}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a0a"},layers:[
    {type:"text",role:"headline",content:"THE STEPS",x:540,y:250,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#FF3B30",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"1. Blend tomatoes, peppers & onion \u2022 2. Fry tomato paste in oil until deep red \u2022 3. Add blended mix, cook down 30 min \u2022 4. Season generously \u2022 5. Add washed rice, stir \u2022 6. Cover tightly, cook on low 45 min \u2022 7. The smoky bottom is the prize!",x:540,y:700,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.6}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a0a"},layers:[
    {type:"text",role:"headline",content:"PRO TIPS",x:540,y:300,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#FF6B3B",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Use parboiled rice for best results \u2022 Let the tomato base cook until oil floats \u2022 Don\u2019t stir after adding rice \u2022 The \u201cparty jollof\u201d flavour comes from slight burning at the bottom",x:540,y:700,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.6}
  ]},
  {type:"cta",bg:{type:"gradient",colors:["#FF3B30","#FF6B3B"],angle:135},layers:[
    {type:"text",role:"cta-headline",content:"SAVE THIS RECIPE",x:540,y:600,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:400}
  ]}
]},

/* 12 — afro-diaspora-01 */
{id:"afro-diaspora-01",name:"Diaspora Connect",category:"brand",format:"1080x1350",slideCount:5,slides:[
  {type:"cover",bg:{type:"solid",color:"#0A1628"},layers:[
    {type:"text",role:"headline",content:"CONNECTING AFRICANS WORLDWIDE",x:540,y:500,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#007AFF",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},
    {type:"text",role:"subhead",content:"Our story \u2192",x:540,y:700,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(0,122,255,.5)",textAlign:"center",maxWidth:500}
  ]},
  {type:"content",bg:{type:"solid",color:"#0A1628"},layers:[
    {type:"text",role:"headline",content:"THE MISSION",x:540,y:350,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#007AFF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"There are over 170 million people of African descent living outside the continent. We\u2019re building bridges that bring them home \u2014 digitally.",x:540,y:650,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}
  ]},
  {type:"content",bg:{type:"solid",color:"#0A1628"},layers:[
    {type:"text",role:"headline",content:"WHAT WE OFFER",x:540,y:350,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#007AFF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Community events \u2022 Business networking \u2022 Cultural exchange \u2022 Investment opportunities \u2022 Remittance tools \u2022 Skill sharing across borders",x:540,y:650,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}
  ]},
  {type:"content",bg:{type:"solid",color:"#0A1628"},layers:[
    {type:"text",role:"number",content:"54",x:540,y:350,fontSize:140,fontFamily:'"Montserrat", sans-serif',color:"rgba(0,122,255,.3)",textAlign:"center",maxWidth:600,fontWeight:900},
    {type:"text",role:"headline",content:"COUNTRIES, ONE PEOPLE",x:540,y:580,fontSize:44,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"From Lagos to London, Nairobi to New York \u2014 Africa is everywhere.",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.5)",textAlign:"center",maxWidth:700}
  ]},
  {type:"cta",bg:{type:"gradient",colors:["#007AFF","#0A1628"],angle:180},layers:[
    {type:"text",role:"cta-headline",content:"JOIN THE MOVEMENT",x:540,y:600,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:32,fontFamily:'"DM Sans", sans-serif',color:"rgba(0,122,255,.7)",textAlign:"center",maxWidth:400}
  ]}
]},

/* 13 — afro-music-01 */
{id:"afro-music-01",name:"Afrobeats Top 5",category:"listicle",format:"1080x1350",slideCount:7,slides:[
  {type:"cover",bg:{type:"gradient",colors:["#E066FF","#FF2D55"],angle:135},layers:[
    {type:"text",role:"headline",content:"TOP 5 AFROBEATS TRACKS RIGHT NOW",x:540,y:500,fontSize:52,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:900,uppercase:!0,fontWeight:900},
    {type:"text",role:"subhead",content:"Swipe for the playlist \u2192",x:540,y:700,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a1e"},layers:[
    {type:"text",role:"number",content:"01",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(224,102,255,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"[SONG TITLE]",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#E066FF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Artist Name \u2022 Album Name \u2022 2026",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a1e"},layers:[
    {type:"text",role:"number",content:"02",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(224,102,255,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"[SONG TITLE]",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#E066FF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Artist Name \u2022 Album Name \u2022 2026",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a1e"},layers:[
    {type:"text",role:"number",content:"03",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(224,102,255,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"[SONG TITLE]",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#E066FF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Artist Name \u2022 Album Name \u2022 2026",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a1e"},layers:[
    {type:"text",role:"number",content:"04",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(224,102,255,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"[SONG TITLE]",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#E066FF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Artist Name \u2022 Album Name \u2022 2026",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a1e"},layers:[
    {type:"text",role:"number",content:"05",x:540,y:300,fontSize:180,fontFamily:'"Montserrat", sans-serif',color:"rgba(224,102,255,.2)",textAlign:"center",maxWidth:400,fontWeight:900},
    {type:"text",role:"headline",content:"[SONG TITLE]",x:540,y:580,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#E066FF",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"body",content:"Artist Name \u2022 Album Name \u2022 2026",x:540,y:750,fontSize:24,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:700}
  ]},
  {type:"cta",bg:{type:"gradient",colors:["#E066FF","#FF2D55"],angle:135},layers:[
    {type:"text",role:"cta-headline",content:"FOLLOW FOR WEEKLY PICKS",x:540,y:600,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:800,uppercase:!0,fontWeight:900},
    {type:"text",role:"handle",content:"@yourhandle",x:540,y:750,fontSize:32,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:400}
  ]}
]},

/* 14 — afro-fashion-01 */
{id:"afro-fashion-01",name:"Ankara Lookbook",category:"product",format:"1080x1350",slideCount:5,slides:[
  {type:"cover",bg:{type:"gradient",colors:["#C41E3A","#D4AF37"],angle:135},layers:[
    {type:"text",role:"headline",content:"ANKARA LOOKBOOK",x:540,y:500,fontSize:60,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:900,fontWeight:700},
    {type:"text",role:"subhead",content:"New collection \u2192",x:540,y:700,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:500}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a0e"},layers:[
    {type:"text",role:"headline",content:"LOOK 01",x:540,y:250,fontSize:48,fontFamily:'"Playfair Display", serif',color:"#D4AF37",textAlign:"center",maxWidth:800,fontWeight:700},
    {type:"text",role:"body",content:"Modern Ankara blazer with traditional Adire print lining. Perfect for the boardroom and beyond.",x:540,y:900,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a0e"},layers:[
    {type:"text",role:"headline",content:"LOOK 02",x:540,y:250,fontSize:48,fontFamily:'"Playfair Display", serif',color:"#D4AF37",textAlign:"center",maxWidth:800,fontWeight:700},
    {type:"text",role:"body",content:"Floor-length Ankara gown with gold embroidery. Statement piece for special occasions.",x:540,y:900,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}
  ]},
  {type:"content",bg:{type:"solid",color:"#1a0a0e"},layers:[
    {type:"text",role:"headline",content:"LOOK 03",x:540,y:250,fontSize:48,fontFamily:'"Playfair Display", serif',color:"#D4AF37",textAlign:"center",maxWidth:800,fontWeight:700},
    {type:"text",role:"body",content:"Casual Ankara shorts set with matching bucket hat. Street style meets heritage.",x:540,y:900,fontSize:26,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.7)",textAlign:"center",maxWidth:750,lineHeight:1.5}
  ]},
  {type:"cta",bg:{type:"gradient",colors:["#C41E3A","#D4AF37"],angle:135},layers:[
    {type:"text",role:"cta-headline",content:"SHOP THE COLLECTION",x:540,y:600,fontSize:48,fontFamily:'"Playfair Display", serif',color:"#fff",textAlign:"center",maxWidth:800,fontWeight:700},
    {type:"text",role:"handle",content:"Link in bio \u2191",x:540,y:750,fontSize:28,fontFamily:'"DM Sans", sans-serif',color:"rgba(255,255,255,.6)",textAlign:"center",maxWidth:400}
  ]}
]}
];

/* ── AFRO ASSETS DATA ── */
var AFRO_STICKERS=[
  {cat:"flags",items:["\ud83c\uddf3\ud83c\uddec","\ud83c\uddec\ud83c\udded","\ud83c\uddf0\ud83c\uddea","\ud83c\uddff\ud83c\udde6","\ud83c\uddea\ud83c\uddf9","\ud83c\uddf9\ud83c\uddff","\ud83c\udde8\ud83c\uddf2","\ud83c\uddf8\ud83c\uddf3","\ud83c\udde8\ud83c\uddee","\ud83c\uddf2\ud83c\udde6","\ud83c\uddea\ud83c\uddec","\ud83c\uddf7\ud83c\uddfc","\ud83c\uddfa\ud83c\uddec","\ud83c\uddff\ud83c\uddfc","\ud83c\uddf2\ud83c\uddff","\ud83c\uddf2\ud83c\uddf1","\ud83c\udde7\ud83c\uddeb","\ud83c\uddf3\ud83c\uddea","\ud83c\uddf9\ud83c\uddec","\ud83c\udde7\ud83c\uddef"]},
  {cat:"culture",items:["\ud83e\udd41","\ud83e\ude98","\ud83c\udfad","\ud83e\udedd","\ud83c\udffe","\ud83e\udeb6","\ud83c\udf0d","\ud83e\udd81","\ud83d\udc18","\ud83e\udd92","\ud83e\udd93","\ud83d\udc06","\ud83e\udd85","\ud83c\udf34","\ud83c\udf3a","\ud83e\udeb7","\ud83d\udc8e","\ud83d\udc51","\u270a\ud83c\udfff","\u270a\ud83c\udffe"]},
  {cat:"food",items:["\ud83c\udf72","\ud83c\udf5b","\ud83e\udd58","\ud83e\uded5","\ud83e\udd5c","\ud83e\udd65","\ud83c\udf4c","\ud83e\udd6d","\ud83c\udf4a","\ud83c\udf36\ufe0f","\ud83e\uded1","\ud83e\uddc5","\ud83c\udf60","\ud83c\udf3d","\ud83c\udf5a","\ud83e\uded8","\ud83e\udd6c","\ud83c\udf4d","\ud83e\udd51","\u2615"]},
  {cat:"music",items:["\ud83c\udfb5","\ud83c\udfb6","\ud83c\udfa4","\ud83c\udfa7","\ud83c\udfb9","\ud83c\udfb8","\ud83c\udfba","\ud83e\ude97","\ud83d\udc83\ud83c\udfff","\ud83d\udd7a\ud83c\udfff","\ud83d\ude4c\ud83c\udfff","\ud83d\udc4f\ud83c\udfff","\ud83e\udd32\ud83c\udfff","\ud83d\ude4f\ud83c\udfff","\ud83d\udcaa\ud83c\udfff","\ud83e\udef6\ud83c\udfff","\u2764\ufe0f\u200d\ud83d\udd25","\ud83d\udd25","\u26a1","\u2728"]},
  {cat:"business",items:["\ud83d\udcb0","\ud83d\udcc8","\ud83d\ude80","\ud83d\udca1","\ud83c\udfaf","\ud83d\udcf1","\ud83d\udcbb","\ud83c\udfe6","\ud83e\ude99","\ud83d\udcb3","\ud83d\udcca","\ud83c\udfd7\ufe0f","\ud83c\udf10","\ud83d\udee1\ufe0f","\u2b50","\ud83c\udfc6","\ud83c\udf93","\ud83d\udcda","\ud83e\udd1d\ud83c\udfff","\ud83d\udcbc"]}
];

var AFRO_PALETTES=[
  {name:"Kente",colors:["#D4AF37","#C41E3A","#006B3C","#1B1464","#FF6B00"]},
  {name:"Sahel",colors:["#E8A317","#8B4513","#DAA520","#CD853F","#F5E6C8"]},
  {name:"Savanna",colors:["#C19A6B","#8B7355","#556B2F","#DAA520","#2F4F4F"]},
  {name:"Lagos Nights",colors:["#0A1628","#FF3B30","#FFD60A","#E066FF","#00FFD4"]},
  {name:"Nairobi",colors:["#006B3C","#C41E3A","#000","#fff","#D4AF37"]},
  {name:"Marrakech",colors:["#C25A1F","#1B4D8E","#D4AF37","#006B3C","#F5E6C8"]}
];

/* ── PROJECT MANAGEMENT helpers ── */
var PROJ_KEY="car_projects";

function _getProjects(){
  try{var p=localStorage.getItem(PROJ_KEY);return p?JSON.parse(p):[];}catch(e){return[];}
}
function _saveProjects(arr){
  try{localStorage.setItem(PROJ_KEY,JSON.stringify(arr));return!0;}catch(e){return!1;}
}
function _genId(){return"proj_"+Date.now()+"_"+Math.random().toString(36).substr(2,6);}

/* ── PUBLIC API ── */
var g={
  TEMPLATES:x,
  FORMATS:d,

  init:function(){e=[],t=0,r=[],a=-1,i=0},

  getState:function(){return{slides:f(e),activeIndex:t,branding:f(n),format:f(o),title:l,templateId:s}},

  setFormat:function(e){var t=d[e];return t&&(o=f(t)),o},
  getFormat:function(){return f(o)},

  getSlides:function(){return f(e)},
  getSlideCount:function(){return e.length},
  getActiveIndex:function(){return t},
  setActiveSlide:function(n){return n>=0&&n<e.length&&(t=n),t},
  getActiveSlide:function(){return e[t]?f(e[t]):null},

  addSlide:function(n){
    if(e.length>=10)return null;
    var r="number"==typeof n?n+1:e.length,
        a={id:c(),type:"content",bg:{type:"solid",color:"#1a1a1a"},layers:[{id:c(),type:"text",role:"headline",content:"YOUR TEXT HERE",x:o.w/2,y:o.h/2-50,fontSize:48,fontFamily:'"Montserrat", sans-serif',color:"#fff",textAlign:"center",maxWidth:o.w-200,uppercase:!0,fontWeight:900}]};
    return e.splice(r,0,a),t=r,y(),a
  },

  removeSlide:function(n){return!(e.length<=2||n<0||n>=e.length||(e.splice(n,1),t>=e.length&&(t=e.length-1),y(),0))},

  duplicateSlide:function(n){
    if(e.length>=10)return null;
    if(n<0||n>=e.length)return null;
    var o=f(e[n]);
    return o.id=c(),o.layers.forEach(function(e){e.id=c()}),e.splice(n+1,0,o),t=n+1,y(),o
  },

  reorderSlides:function(n,o){
    if(n<0||n>=e.length)return!1;
    if(o<0||o>=e.length)return!1;
    var r=e.splice(n,1)[0];
    return e.splice(o,0,r),t=o,y(),!0
  },

  updateSlideLayer:function(t,n,o){
    var r=e[t];if(!r)return!1;
    for(var a=null,i=0;i<r.layers.length;i++)if(r.layers[i].id===n){a=r.layers[i];break}
    if(!a)return!1;
    for(var l in o)o.hasOwnProperty(l)&&(a[l]=o[l]);
    return y(),!0
  },

  addLayerToSlide:function(t,n){
    var o=e[t];if(!o)return null;
    if(o.layers.length>=5)return null;
    var r=f(n);return r.id=c(),o.layers.push(r),y(),r
  },

  removeLayerFromSlide:function(t,n){
    var o=e[t];if(!o)return!1;
    for(var r=-1,a=0;a<o.layers.length;a++)if(o.layers[a].id===n){r=a;break}
    return-1!==r&&(o.layers.splice(r,1),y(),!0)
  },

  setSlideBg:function(t,n){var o=e[t];return!!o&&(o.bg=f(n),y(),!0)},

  setBranding:function(e){for(var t in e)e.hasOwnProperty(t)&&(n[t]=e[t]);return f(n)},
  getBranding:function(){return f(n)},

  loadTemplate:function(n){
    for(var r=null,a=0;a<x.length;a++)if(x[a].id===n){r=x[a];break}
    return!!r&&(s=n,r.format&&d[r.format]&&(o=f(d[r.format])),e=[],r.slides.forEach(function(t){var n=f(t);n.id=c(),n.layers.forEach(function(e){e.id=c()}),e.push(n)}),t=0,y(),!0)
  },

  setTitle:function(e){l=e},
  getTitle:function(){return l},

  undo:function(){
    if(a<=0)return!1;
    a--;var o=f(r[a]);
    return e=o.slides,t=o.activeIndex,n=o.branding,!0
  },
  redo:function(){
    if(a>=r.length-1)return!1;
    a++;var o=f(r[a]);
    return e=o.slides,t=o.activeIndex,n=o.branding,!0
  },
  canUndo:function(){return a>0},
  canRedo:function(){return a<r.length-1},

  renderSlideToCanvas:function(t,n){
    var r=e[t];
    if(r){
      var a=n.getContext("2d");
      n.width=o.w,n.height=o.h;
      var i=r.bg||{type:"solid",color:"#1a1a1a"};
      if("gradient"===i.type&&i.colors){
        var l=(i.angle||135)*Math.PI/180,
            s=o.w/2-Math.cos(l)*o.w,c_=o.h/2-Math.sin(l)*o.h,
            ff=o.w/2+Math.cos(l)*o.w,yy=o.h/2+Math.sin(l)*o.h,
            dd=a.createLinearGradient(s,c_,ff,yy);
        dd.addColorStop(0,i.colors[0]),dd.addColorStop(1,i.colors[1]),a.fillStyle=dd
      }else a.fillStyle=i.color||"#1a1a1a";
      a.fillRect(0,0,o.w,o.h),
      r.layers.forEach(function(e){
        if("text"===e.type){
          var t=e.fontSize||48,n=e.fontWeight||400,r=e.fontFamily||'"DM Sans", sans-serif';
          a.font=n+" "+t+"px "+r,a.fillStyle=e.color||"#fff",a.textAlign=e.textAlign||"center",a.textBaseline="middle";
          var i=e.content||"";
          e.uppercase&&(i=i.toUpperCase());
          for(var l=e.maxWidth||o.w-100,s=i.split(" "),c=[],f="",y=0;y<s.length;y++){
            var d=f?f+" "+s[y]:s[y];
            a.measureText(d).width>l&&f?(c.push(f),f=s[y]):f=d
          }
          f&&c.push(f);
          for(var x=t*(e.lineHeight||1.2),g=c.length*x,h=(e.y||o.h/2)-g/2+x/2,p=0;p<c.length;p++)
            a.fillText(c[p],e.x||o.w/2,h+p*x)
        }
      })
    }
  },

  exportSlide:function(e,t){
    var n=document.createElement("canvas");
    this.renderSlideToCanvas(e,n);
    var o="jpeg"===t?"image/jpeg":"image/png",r="jpeg"===t?.9:void 0;
    return n.toDataURL(o,r)
  },

  /* ── Original save/load (single project, backward compat) ── */
  saveLocal:function(){
    try{
      var t={slides:e,branding:n,format:o,title:l,templateId:s,savedAt:Date.now()};
      return localStorage.setItem("car_project",JSON.stringify(t)),!0
    }catch(e){return!1}
  },
  loadLocal:function(){
    try{
      var i=localStorage.getItem("car_project");
      if(!i)return!1;
      var c_=JSON.parse(i);
      return e=c_.slides||[],n=c_.branding||n,o=c_.format||o,l=c_.title||"Untitled Carousel",s=c_.templateId||null,t=0,r=[],a=-1,y(),!0
    }catch(e){return!1}
  },
  clearLocal:function(){localStorage.removeItem("car_project")},

  /* ── Afro Assets methods ── */
  getAfroStickers:function(){return f(AFRO_STICKERS)},
  getAfroPalettes:function(){return f(AFRO_PALETTES)},

  /* ── Project Management (multi-project) ── */
  saveProject:function(name){
    var projects=_getProjects();
    var id=_genId();
    var proj={
      id:id,
      name:name||l||"Untitled Carousel",
      slides:f(e),
      branding:f(n),
      format:f(o),
      title:l,
      templateId:s,
      createdAt:Date.now(),
      updatedAt:Date.now()
    };
    projects.push(proj);
    _saveProjects(projects);
    return id;
  },

  updateProject:function(projId,name){
    var projects=_getProjects();
    for(var p=0;p<projects.length;p++){
      if(projects[p].id===projId){
        projects[p].name=name||projects[p].name;
        projects[p].slides=f(e);
        projects[p].branding=f(n);
        projects[p].format=f(o);
        projects[p].title=l;
        projects[p].templateId=s;
        projects[p].updatedAt=Date.now();
        _saveProjects(projects);
        return!0;
      }
    }
    return!1;
  },

  loadProject:function(projId){
    var projects=_getProjects();
    for(var p=0;p<projects.length;p++){
      if(projects[p].id===projId){
        var proj=projects[p];
        e=f(proj.slides)||[];
        n=f(proj.branding)||n;
        o=f(proj.format)||o;
        l=proj.title||"Untitled Carousel";
        s=proj.templateId||null;
        t=0;r=[];a=-1;y();
        return f(proj);
      }
    }
    return null;
  },

  deleteProject:function(projId){
    var projects=_getProjects();
    var filtered=[];
    for(var p=0;p<projects.length;p++){
      if(projects[p].id!==projId)filtered.push(projects[p]);
    }
    if(filtered.length===projects.length)return!1;
    _saveProjects(filtered);
    return!0;
  },

  duplicateProject:function(projId){
    var projects=_getProjects();
    for(var p=0;p<projects.length;p++){
      if(projects[p].id===projId){
        var orig=projects[p];
        var newId=_genId();
        var dup=f(orig);
        dup.id=newId;
        dup.name=orig.name+" (Copy)";
        dup.createdAt=Date.now();
        dup.updatedAt=Date.now();
        projects.push(dup);
        _saveProjects(projects);
        return newId;
      }
    }
    return null;
  },

  listProjects:function(){
    return f(_getProjects());
  },

  /* ── Cross-Tool Workflow ── */
  exportSlideForThumb:function(slideIdx){
    var slide=e[slideIdx];
    if(!slide)return null;
    return{
      width:o.w,
      height:o.h,
      bg:f(slide.bg),
      layers:f(slide.layers),
      source:"creatorCarousel",
      sourceTitle:l,
      sourceSlideIdx:slideIdx
    };
  },

  getThumbLink:function(){
    return"/tools/thumbnail-forge/";
  }
};

window.AfroTools||(window.AfroTools={});
window.AfroTools.engines||(window.AfroTools.engines={});
window.AfroTools.engines.creatorCarousel=g;

}();
