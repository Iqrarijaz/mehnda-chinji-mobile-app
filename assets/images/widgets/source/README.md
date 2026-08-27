# Widget card backgrounds

Ambient background plates for the home-screen editorial data widgets. They
carry **no baked-in numbers or typography** — every value, chart and label is a
live React Native component laid over the top.

## Files

| File | Size | Use |
|---|---|---|
| `weather_bg.png` | 400×200 | 1x |
| `weather_bg@2x.png` | 800×400 | 2x |
| `weather_bg@3x.png` | 1200×600 | 3x |

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

## Regenerating

`weather_bg.svg` is the artwork and opens in any vector editor. `weather_bg.build.py`
is the generator: it emits that SVG, rasterises it through cairo at 2x and
reduces with Lanczos, then adds fine grain (wide gradients band badly on OLED
without it).

```
pip install numpy Pillow cairosvg
python3 weather_bg.build.py <output-dir>
```

Editing the SVG by hand is fine for one-off tweaks. Change the generator if you
want the change to survive a rebuild — and re-run the contrast check in the PR
that introduced this if you move the sun or lighten the base, since both feed
directly into the numbers above.
