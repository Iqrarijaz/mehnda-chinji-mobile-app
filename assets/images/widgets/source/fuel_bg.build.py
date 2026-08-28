"""
Fuel widget card background.

Same idiom as weather_bg: SVG authored, rasterised through cairo, grained.
Different safe zones though -- this card carries two price rows on the left and
a sparkline through the middle, so the calm region is much wider and the
ornament is pushed right to the edge.
"""
import io, os, sys
import numpy as np
import cairosvg
from PIL import Image

W, H = 1200, 600

SVG = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
<defs>
  <!-- Petroleum teal, holding deep across the left two-thirds. Warmth arrives
       only at the very top right, well clear of the chart lane. -->
  <linearGradient id="base" x1="0" y1="{H}" x2="{W}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0.00" stop-color="#01292E"/>
    <stop offset="0.30" stop-color="#013A3E"/>
    <stop offset="0.58" stop-color="#014F52"/>
    <stop offset="0.80" stop-color="#136C63"/>
    <stop offset="1.00" stop-color="#B98A3C"/>
  </linearGradient>

  <radialGradient id="ember" cx="{W-70}" cy="70" r="420" gradientUnits="userSpaceOnUse">
    <stop offset="0.00" stop-color="#FCBD48" stop-opacity="0.55"/>
    <stop offset="0.45" stop-color="#FF9B51" stop-opacity="0.20"/>
    <stop offset="1.00" stop-color="#FF9B51" stop-opacity="0"/>
  </radialGradient>

  <linearGradient id="wave" x1="700" y1="0" x2="{W}" y2="{H}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#FCBD48" stop-opacity="0.55"/>
    <stop offset="1" stop-color="#FF9B51" stop-opacity="0.10"/>
  </linearGradient>

  <filter id="soft"  x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter>
  <filter id="hazy"  x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="22"/></filter>

  <!-- Scrims. Wider and flatter than the weather plate: the chart lane runs
       through the middle of this card, so the calm band has to reach much
       further right than it does there. -->
  <linearGradient id="scrim" x1="0" y1="0" x2="{W*0.94}" y2="0" gradientUnits="userSpaceOnUse">
    <stop offset="0.00" stop-color="#001E24" stop-opacity="0.56"/>
    <stop offset="0.55" stop-color="#001E24" stop-opacity="0.34"/>
    <stop offset="1.00" stop-color="#001E24" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="floor" x1="0" y1="{H}" x2="0" y2="{H*0.44}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#00161C" stop-opacity="0.52"/>
    <stop offset="1" stop-color="#00161C" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="crown" x1="0" y1="0" x2="0" y2="{H*0.34}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="#001E24" stop-opacity="0.30"/>
    <stop offset="1" stop-color="#001E24" stop-opacity="0"/>
  </linearGradient>
</defs>

<rect width="{W}" height="{H}" fill="url(#base)"/>
<rect width="{W}" height="{H}" fill="url(#ember)"/>

<!-- Energy waves: long, shallow arcs sweeping off the right edge. Stroked and
     blurred rather than filled, so they read as motion rather than as shapes
     competing with the chart line drawn over the top. -->
<g fill="none" stroke="url(#wave)" filter="url(#soft)">
  <path d="M1200 96  C 980 150, 900 262, 1010 380 S 1160 520, 1200 556" stroke-width="10" opacity="0.55"/>
  <path d="M1200 168 C 1010 214, 946 306, 1046 404 S 1172 528, 1200 552" stroke-width="6"  opacity="0.42"/>
  <path d="M1200 254 C 1078 286, 1030 352, 1096 424 S 1180 512, 1200 540" stroke-width="4"  opacity="0.30"/>
</g>

<!-- Minimalist gauge sweep in the corner: an instrument hint, not a dial. -->
<g fill="none" filter="url(#soft)">
  <path d="M1044 66 A 126 126 0 0 1 1170 192" stroke="#FCBD48" stroke-opacity="0.55" stroke-width="5" stroke-linecap="round"/>
  <path d="M1076 58 A 158 158 0 0 1 1178 160" stroke="#FFE3A6" stroke-opacity="0.22" stroke-width="2" stroke-linecap="round"/>
</g>
<g filter="url(#hazy)" opacity="0.5">
  <circle cx="1152" cy="120" r="46" fill="#FCBD48" fill-opacity="0.35"/>
</g>

<rect width="{W}" height="{H}" fill="url(#crown)"/>
<rect width="{W}" height="{H}" fill="url(#scrim)"/>
<rect width="{W}" height="{H}" fill="url(#floor)"/>
</svg>'''

png = cairosvg.svg2png(bytestring=SVG.encode(), output_width=W*2, output_height=H*2)
im = Image.open(io.BytesIO(png)).convert("RGB").resize((W, H), Image.LANCZOS)

a = np.asarray(im).astype(np.float64)
rng = np.random.default_rng(23)
im = Image.fromarray(np.clip(a + (rng.random((H, W, 1)) - .5) * 3.4, 0, 255).astype(np.uint8), "RGB")

OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
im.save(f"{OUT}/fuel_bg@3x.png", optimize=True)
im.resize((800, 400), Image.LANCZOS).save(f"{OUT}/fuel_bg@2x.png", optimize=True)
im.resize((400, 200), Image.LANCZOS).save(f"{OUT}/fuel_bg.png", optimize=True)
open(f"{OUT}/fuel_bg.svg", "w").write(SVG)
print("ok")
