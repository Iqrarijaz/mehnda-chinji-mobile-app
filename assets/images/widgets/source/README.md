# Widget card backgrounds

Ambient background plates for the home-screen editorial data widgets. They
carry **no baked-in numbers or typography** — every value, chart and label is a
live React Native component laid over the top.

## Files

| File | Size | Use |
|---|---|---|
| `weather_bg.png` / `@2x` / `@3x` | 400×200 · 800×400 · 1200×600 | weather slide |
| `fuel_bg.png` / `@2x` / `@3x` | 400×200 · 800×400 · 1200×600 | fuel slide |

Both are 2:1 and consumed by the same card in `HomeInfoCarousel`, so they must
stay the same aspect as each other.

React Native picks the right density automatically — reference only the base
name:

```tsx
<ImageBackground
    source={require('@/assets/images/widgets/weather_bg.png')}
    style={styles.cardBackground}
    imageStyle={{ borderRadius: 22 }}
    resizeMode="cover"
>
```

The plate is a plain rectangle; corner rounding comes from `imageStyle`, so the
same file works at any `borderRadius`.

## Safe zones

Composition is built around where the overlay content goes, not the other way
round. Ornament is confined to the upper right; everything else is held dark
and even.

```
┌──────────────────────────────────┬──────────────┐
│ header · title, subtitle, place  │   sun and    │
│                                  │   clouds     │
│ 32°C  Partly Cloudy  H/L         │  (ornament)  │
├──────────────────────┬───────────┴──────────────┤
│ humidity wind feels  │  5-day strip · footer    │
└──────────────────────┴──────────────────────────┘
```

Measured contrast against white text, taken at the 99.5th-percentile (brightest)
pixel of each zone rather than the mean, so the figure reflects the worst case
a glyph can land on:

| Zone | Mean | Worst | AA (4.5:1) |
|---|---|---|---|
| Header row | 10.28 | 4.71 | pass |
| Temperature block | 11.53 | 9.01 | pass |
| Metrics row | 13.25 | 10.50 | pass |
| 5-day strip | 8.08 | 4.99 | pass |
| Footer line | 13.19 | 10.35 | pass |

**White is the intended foreground.** Dark text will not read on these plates.
If a light-theme variant is ever wanted, it needs its own plate rather than a
re-tint — the composition assumes light-on-dark throughout.

## fuel_bg safe zones

The fuel slide carries two price rows on the left and a trend line per row, so
its calm region is much wider than the weather plate's and the ornament — energy
waves and a gauge sweep — is pushed right to the edge.

| Zone | Mean | Worst | AA (4.5:1) |
|---|---|---|---|
| Header | 14.34 | 12.18 | pass |
| Petrol row | 14.35 | 12.34 | pass |
| Octane row | 15.53 | 13.37 | pass |
| Carousel dots | 15.66 | 14.41 | pass |

**The chart lane has a hard right limit.** Contrast falls below AA past roughly
90% of the card width, where the ember glow and gauge sit:

| Lane right edge | Worst-case | Text (4.5:1) |
|---|---|---|
| 96% | 3.73 | fail |
| 92% | 4.28 | fail |
| **90%** | **4.64** | **pass** |
| 88% | 4.94 | pass |

`FuelSlide` sizes its sparkline to end at 88%. Widen it and the line starts
crossing the bright corner — re-measure before changing `SPARK_W`.

The weather plate's dot band was checked too, since the carousel now draws
pagination inside the card: 10.78 worst case, comfortably clear.

## Regenerating

Each plate has a `.svg` (the artwork, opens in any vector editor) and a
`.build.py` (the generator: emits that SVG, rasterises through cairo at 2x,
reduces with Lanczos, then adds fine grain — wide gradients band badly on OLED
without it).

```
pip install numpy Pillow cairosvg
python3 weather_bg.build.py <output-dir>
python3 fuel_bg.build.py <output-dir>
```

Editing the SVG by hand is fine for one-off tweaks. Change the generator if you
want the change to survive a rebuild — and re-run the contrast check in the PR
that introduced this if you move the sun or lighten the base, since both feed
directly into the numbers above.
