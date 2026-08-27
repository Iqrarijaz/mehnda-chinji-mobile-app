"""
Weather widget card background.

Authored as SVG and rasterised through cairo, then grained. Vector beats the
earlier metaball approach here: cloud silhouettes come from real overlapping
shapes unioned inside a group, so the crowns stay distinct instead of fusing
into one dome.

Safe zones, from the widget spec:
  left + centre-left .... huge temperature, condition, H/L
  bottom band (full) .... metrics row, 5-day strip, footer link
  upper right ........... the only place ornament is allowed
"""
import io, os, sys
import numpy as np
import cairosvg
from PIL import Image

W, H = 1200, 600
SUNX, SUNY = 1058, 92

def puffs(specs):
    return "".join(f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}"/>' for cx, cy, rx, ry in specs)

# Cloud banks: overlapping ellipses plus a slab for the flat underside. Drawn
# inside a group so they union at full opacity and the GROUP carries the
# transparency -- that is what keeps the internal seams from showing.
BANK_MAIN = puffs([(880,214,66,50),(944,190,80,62),(1024,196,72,56),
                   (1092,218,64,48),(1148,236,54,40),(972,236,70,46)]) + \
            '<rect x="820" y="228" width="380" height="42" rx="21"/>'
BANK_SOFT = puffs([(742,150,46,34),(790,132,56,42),(846,148,44,32)]) + \
            '<rect x="700" y="152" width="196" height="26" rx="13"/>'
WISP      = puffs([(1128,352,52,26),(1180,344,44,22)]) + \
            '<rect x="1090" y="352" width="130" height="20" rx="10"/>'

SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <!-- Base field. Deep and even across the left two-thirds where every overlay
       sits; warmth is earned only towards the top-right corner. -->
  <linearGradient id="base" x1="0" y1="{H}" x2="{W}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0.00" stop-color="#01383B"/>
    <stop offset="0.34" stop-color="#014B4D"/>
    <stop offset="0.62" stop-color="#00696B"/>
    <stop offset="0.82" stop-color="#2C8A73"/>
    <stop offset="1.00" stop-color="#C9A757"/>
  </linearGradient>

  <radialGradient id="bloom" cx="{SUNX}" cy="{SUNY}" r="360" gradientUnits="userSpaceOnUse">
    <stop offset="0.00" stop-color="#FFCE72" stop-opacity="0.92"/>
    <stop offset="0.42" stop-color="#FF9B51" stop-opacity="0.30"/>
    <stop offset="1.00" stop-color="#FF9B51" stop-opacity="0"/>
  </radialGradient>

  <radialGradient id="disc" cx="{SUNX}" cy="{SUNY}" r="92" gradientUnits="userSpaceOnUse">
    <stop offset="0.00" stop-color="#FFFDF2"/>
    <stop offset="0.45" stop-color="#FFE9A8"/>
    <stop offset="1.00" stop-color="#FCBD48" stop-opacity="0"/>
  </radialGradient>

  <!-- Cloud body: lit crown, warm underside. userSpaceOnUse so every shape in
       the group samples one shared gradient rather than its own bounding box. -->
  <linearGradient id="cloudA" x1="0" y1="150" x2="0" y2="278" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#FFF2DA"/>
    <stop offset="1" stop-color="#E8B98A"/>
  </linearGradient>
  <linearGradient id="cloudB" x1="0" y1="100" x2="0" y2="184" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFFDF6"/><stop offset="1" stop-color="#D9E9D6"/>
  </linearGradient>
  <linearGradient id="cloudC" x1="0" y1="320" x2="0" y2="378" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FFF4E2"/><stop offset="1" stop-color="#E7B583"/>
  </linearGradient>

  <!-- Scrim: holds the lower-left dark so the temperature and metrics read. -->
  <linearGradient id="scrim" x1="0" y1="{H}" x2="{W*0.72}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#00272B" stop-opacity="0.60"/>
    <stop offset="0.55" stop-color="#00272B" stop-opacity="0.18"/>
    <stop offset="1" stop-color="#00272B" stop-opacity="0"/>
  </linearGradient>
  <!-- Top-left scrim. The header band brightened towards the warm side enough
       that its lightest pixels fell to 3.75:1 against white; this holds it
       down without touching the corner ornament. -->
  <linearGradient id="crown" x1="0" y1="0" x2="{W*0.78}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#00272B" stop-opacity="0.40"/>
    <stop offset="0.70" stop-color="#00272B" stop-opacity="0.20"/>
    <stop offset="1" stop-color="#00272B" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="crownFade" x1="0" y1="0" x2="0" y2="{H*0.46}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </linearGradient>
  <mask id="crownMask"><rect width="{W}" height="{H}" fill="url(#crownFade)"/></mask>

  <linearGradient id="floor" x1="0" y1="{H}" x2="0" y2="{H*0.52}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#00232A" stop-opacity="0.46"/>
    <stop offset="1" stop-color="#00232A" stop-opacity="0"/>
  </linearGradient>

  <filter id="soft" x="-25%" y="-25%" width="150%" height="150%">
    <feGaussianBlur stdDeviation="5"/></filter>
  <filter id="softer" x="-35%" y="-35%" width="170%" height="170%">
    <feGaussianBlur stdDeviation="11"/></filter>
  <filter id="shaft" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="46"/></filter>

  <!-- Islamic-geometry whisper, kept in the upper right only and far below the
       text-contrast threshold: texture, not pattern. -->
  <pattern id="lattice" width="66" height="66" patternUnits="userSpaceOnUse"
           patternTransform="rotate(45 0 0)">
    <path d="M33 0 V66 M0 33 H66" stroke="#FCBD48" stroke-opacity="0.16" stroke-width="1.1" fill="none"/>
    <circle cx="33" cy="33" r="12.5" stroke="#FCBD48" stroke-opacity="0.13" stroke-width="1.1" fill="none"/>
  </pattern>
  <radialGradient id="latticeFade" cx="{W}" cy="0" r="560" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#fff" stop-opacity="0.85"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="latticeMask"><rect width="{W}" height="{H}" fill="url(#latticeFade)"/></mask>

  <clipPath id="cornerOnly"><rect x="640" y="0" width="{W-640}" height="470"/></clipPath>
  <radialGradient id="shaftFadeG" cx="{SUNX}" cy="{SUNY}" r="400" gradientUnits="userSpaceOnUse">
    <stop offset="0.10" stop-color="#fff" stop-opacity="0.95"/>
    <stop offset="0.62" stop-color="#fff" stop-opacity="0.45"/>
    <stop offset="1.00" stop-color="#fff" stop-opacity="0"/>
  </radialGradient>
  <mask id="shaftFade"><rect width="{W}" height="{H}" fill="url(#shaftFadeG)"/></mask>
</defs>

<rect width="{W}" height="{H}" fill="url(#base)"/>
<rect width="{W}" height="{H}" fill="url(#lattice)" mask="url(#latticeMask)"/>
<rect width="{W}" height="{H}" fill="url(#bloom)"/>

<!-- Light shafts. Short, massively blurred and clipped to the top-right, then
     faded out well before the safe zones. The previous full-length wedges
     stayed crisp because 26px of blur is nothing against a 600px edge, and
     they cut straight through the area the temperature sits in. -->
<g clip-path="url(#cornerOnly)" mask="url(#shaftFade)">
  <g filter="url(#shaft)" opacity="0.26">
    <polygon points="{SUNX},{SUNY} 812,404 934,430" fill="#FFE3A6"/>
    <polygon points="{SUNX},{SUNY} 968,438 1074,424" fill="#FFE3A6" opacity="0.8"/>
    <polygon points="{SUNX},{SUNY} 1128,392 1200,330" fill="#FFE3A6" opacity="0.65"/>
  </g>
</g>

<circle cx="{SUNX}" cy="{SUNY}" r="92" fill="url(#disc)"/>

<g fill="url(#cloudB)" opacity="0.34" filter="url(#softer)">{BANK_SOFT}</g>
<g fill="url(#cloudC)" opacity="0.26" filter="url(#soft)">{WISP}</g>
<g fill="url(#cloudA)" opacity="0.60" filter="url(#soft)">{BANK_MAIN}</g>

<rect width="{W}" height="{H}" fill="url(#crown)" mask="url(#crownMask)"/>
<rect width="{W}" height="{H}" fill="url(#scrim)"/>
<rect width="{W}" height="{H}" fill="url(#floor)"/>
</svg>'''

png = cairosvg.svg2png(bytestring=SVG.encode(), output_width=W * 2, output_height=H * 2)
im = Image.open(io.BytesIO(png)).convert("RGB").resize((W, H), Image.LANCZOS)

# Fine grain stops the wide gradients from banding on OLED panels.
a = np.asarray(im).astype(np.float64)
rng = np.random.default_rng(13)
a = np.clip(a + (rng.random((H, W, 1)) - 0.5) * 3.4, 0, 255)
im = Image.fromarray(a.astype(np.uint8), "RGB")

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
im.save(f"{OUT}/weather_bg@3x.png", optimize=True)
im.resize((800, 400), Image.LANCZOS).save(f"{OUT}/weather_bg@2x.png", optimize=True)
im.resize((400, 200), Image.LANCZOS).save(f"{OUT}/weather_bg.png", optimize=True)
open(f"{OUT}/weather_bg.svg", "w").write(SVG)
print("ok")
