# Hero images

`IceCreamHero.tsx` expects these four files here. All must be **transparent PNG/WebP**
cut-outs (square canvas, bowl centred, soft drop shadow baked in) — a JPG will paint a
solid rectangle over the giant word behind it and kill the whole effect.

| File | Slide |
| --- | --- |
| `bowl-strawberry.webp` | STRAW / Berry Pure |
| `bowl-berries.webp` | BERRIES / Blue Bliss |
| `bowl-banana.webp` | BANANA / Banana Crush |
| `bowl-kiwi.webp` | KIWIS / Kiwi Flavor |

Recommended: ~1400×1400px WebP with alpha (update the `bowl:` paths in
`components/IceCreamHero.tsx` if you change the extension).

## Optional floating fruit

Single-fruit cut-outs (one strawberry, a leaf, a chocolate chunk…) go in the `accents`
array of each slide. They render at `z-30`, above the bowl, and get a stronger mouse
parallax than the bowl:

```ts
accents: [
  { src: "/images/acc-strawberry.png", className: "left-[14%] top-[24%] w-[9vw]", depth: 1.6 },
  { src: "/images/acc-leaf.png",       className: "right-[18%] bottom-[18%] w-[11vw]", depth: 1.2 },
],
```
