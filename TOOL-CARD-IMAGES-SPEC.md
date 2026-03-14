# AfroTools — Tool Card Image Specification
## For custom ChatGPT-generated card images

---

## 📐 Dimensions & Format
- **Size: 600 × 400 px** (3:2 aspect ratio)
- **Format: WebP** (save as PNG from ChatGPT, rename to .webp — Netlify serves fine)
- **Folder: `/assets/img/tools/`**
- Quality: High (no compression artifacts)

---

## 🎨 Design Style (Apple App Store card)
Each image should look like an **iOS App Store screenshot card** — clean, bold, professional.

Style reference: Apple Numbers, Monzo, Revolut, Wise app store cards.

### What to include in each card:
- **Dark navy background**: `#0a1929` to `#0d2b5e` gradient (or country flag colors for PAYE tools)
- **Large centered emoji or icon** (tool-specific, 80-120px equivalent)
- **Tool name in bold white text** at bottom or center
- **Subtle data visualization element** (chart snippet, number, or currency symbol)
- Clean, uncluttered — lots of breathing room

---

## 📋 Files Needed (Priority order)

### PAYE / Tax Calculators (already have some — upgrade these)
| Filename | Tool Name | Suggested Visual |
|----------|-----------|-----------------|
| `ng-paye.webp` | Nigeria PAYE | 🇳🇬 + "₦240,000/mo net" on dark green-blue gradient |
| `ke-paye.webp` | Kenya PAYE | 🇰🇪 + "KSh 85,000 net" on red-green gradient |
| `gh-paye.webp` | Ghana PAYE | 🇬🇭 + "GH₵ 3,200 net" on tri-colour gradient |
| `za-paye.webp` | South Africa PAYE | 🇿🇦 + "R 28,400 net" on SA-colour gradient |
| `eg-paye.webp` | Egypt PAYE | 🇪🇬 + "EGP 12,500 net" on red-white gradient |
| `tz-paye.webp` | Tanzania PAYE | 🇹🇿 + "TSh 450,000 net" on green-blue gradient |
| `rw-paye.webp` | Rwanda PAYE | 🇷🇼 + "Frw 280,000 net" on Rwanda flag gradient |
| `et-paye.webp` | Ethiopia PAYE | 🇪🇹 + "Br 8,400 net" on Ethiopia flag gradient |

### Flagship Tools (Priority — these show on homepage)
| Filename | Tool Name | Suggested Visual |
|----------|-----------|-----------------|
| `currency-converter.webp` | Currency Converter | Exchange arrows ↕ between flag pairs, live rate display |
| `import-duty.webp` | Import Duty Calculator | Customs/cargo icon, breakdown bar chart |
| `remittance-compare.webp` | Remittance Compare | 8 provider logos/names, comparison bars |
| `invoice-generator.webp` | Invoice Generator | Clean invoice preview thumbnail, ₦ symbol |
| `vat-calculator.webp` | VAT Calculator | Tax breakdown chart, 4 country flags |
| `pdf-workspace.webp` | PDF Workspace | PDF icon, merge/split visual |
| `cv-builder.webp` | CV Builder | Resume template thumbnail |
| `japa-calculator.webp` | Japa Calculator | Airplane ✈️ + "Cost of Moving" breakdown |

### Utility Tools
| Filename | Tool Name | Suggested Visual |
|----------|-----------|-----------------|
| `image-compress.webp` | Image Compressor | Before/after file size visual |
| `qr-generator.webp` | QR Code Generator | Sample QR code on dark card |
| `bmi-calculator.webp` | BMI Calculator | Body silhouette + health scale |
| `fuel-cost.webp` | Fuel Cost Calculator | Fuel pump + ₦ cost visual |
| `mobile-money-fees.webp` | Mobile Money Fees | M-Pesa/MTN logos + fee chart |
| `waec-calculator.webp` | WAEC Grade Calculator | Grade A-E chart, certificate icon |
| `fraction-calc.webp` | Fraction Calculator | Math equation display |
| `scientific-calc.webp` | Scientific Calculator | Calculator display |
| `percentage-calc.webp` | Percentage Calculator | % symbol + chart |
| `gpa-calculator.webp` | GPA Calculator | 4.0 scale bar chart |

---

## 💡 ChatGPT Prompt Template

Use this prompt in ChatGPT (DALL-E 3):

```
Create a mobile app store card image (600x400px, landscape).

Style: Apple App Store screenshot card. Dark navy gradient background
(#0a1929 to #0d2b5e). Clean, minimal, modern. High contrast.
No text except the tool name.

Content: [DESCRIBE TOOL-SPECIFIC VISUAL HERE]

Tool name in bold white text (SF Pro Display style) at bottom.
Subtle glow effect. Premium feel. 16px rounded corners visible.
Dark mode. No clutter.
```

**Example for Nigeria PAYE:**
```
Create a mobile app store card image (600x400px).
Dark navy-to-green gradient background. Nigerian flag 🇳🇬 emoji large and centered.
Below it: "₦ 240,000" in large white bold numbers. "Monthly Take-Home" in smaller white text.
Tool name "PAYE Calculator" in white at bottom.
Clean, Apple-style, premium dark card.
```

---

## 🗂 Folder Structure
```
/assets/img/tools/
├── ng-paye.webp          ← 600×400
├── ke-paye.webp          ← 600×400
├── gh-paye.webp          ← 600×400
├── za-paye.webp          ← 600×400
├── eg-paye.webp          ← 600×400
├── tz-paye.webp          ← 600×400
├── rw-paye.webp          ← 600×400
├── et-paye.webp          ← 600×400
├── currency-converter.webp
├── import-duty.webp
├── remittance-compare.webp
├── invoice-generator.webp
├── vat-calculator.webp
├── pdf-workspace.webp
├── cv-builder.webp
├── japa-calculator.webp
├── image-compress.webp
├── qr-generator.webp
├── bmi-calculator.webp
├── fuel-cost.webp
├── mobile-money-fees.webp
├── waec-calculator.webp
└── ... (more as needed)
```

Just drop the files in `/assets/img/tools/` and the homepage tool cards
will automatically pick them up — the `<img>` tags with `onerror` fallback
are already in every card. No code changes needed.

---

*Total: ~30 images needed at launch. At 3/day = 10 days to full coverage.*
