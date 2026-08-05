# Scroll-Scrub Video Hero (Next.js + GSAP)

Scroll neeche = video aage chalti hai (camera ghar ke andar move karta hai).
Scroll upar = video reverse. Video pin rehti hai jab tak scrub complete na ho,
phir neeche ke sections aate hain.

## Setup

```bash
npm install
npm run dev
```

## Video file (MOST IMPORTANT STEP)

1. Apni walkthrough video ko is naam se rakho: `public/video/walkthrough.mp4`
2. Poster frame: `public/video/walkthrough-poster.jpg`

### Scrubbing ke liye video re-encode karna ZAROORI hai

Normal MP4 mein keyframes door door hote hain, is liye scrub laggy/jumpy hota hai.
Is command se har frame keyframe ban jata hai (smooth scrubbing):

```bash
ffmpeg -i input.mp4 -vf "scale=1920:-2" -movflags faststart -vcodec libx264 -crf 23 -g 1 -pix_fmt yuv420p -an public/video/walkthrough.mp4
```

- `-g 1` = keyframe every frame (ye hi magic hai)
- `-an` = audio strip (scrub videos muted hoti hain)
- File size barh jayegi, is liye video 10-20 seconds tak rakho aur 1080p max

## Tuning

`components/ScrollVideoHero.tsx` mein:
- `end: "+=400%"` — kitna scroll mein poori video chale (300% = tez, 600% = slow cinematic)
- `scrub: 0.6` — smoothing (0.3 tight, 1 floaty)
- Text stages: `.hero-stage` divs — jitne chahiye add karo, timing automatic split hoti hai

## Deploy

Vercel pe push karo — zero config. Video file 20MB se upar ho to
Vercel Blob / Cloudflare R2 pe host karke `src` update kar dena.
