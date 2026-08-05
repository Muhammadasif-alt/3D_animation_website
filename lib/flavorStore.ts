/**
 * Tiny shared store so the hand-off section knows which flavour the hero is
 * currently showing. The hero publishes its index; the section subscribes and
 * flies that exact bowl down into the empty slot.
 *
 * Deliberately not React context: the hero and the section are siblings under
 * <main>, and a context provider would mean restructuring the page for one
 * number.
 */

export type Flavor = {
  key: string;
  name: string;
  price: string;
  image: string;
  /** card tint */
  bg: string;
};

/** order must match IceCreamHero's SLIDES */
export const FLAVORS: Flavor[] = [
  {
    key: "strawberry",
    name: "Berry Pure",
    price: "$6.50",
    image: "/images/bowl-strawberry.webp",
    bg: "#B00A38",
  },
  {
    key: "berries",
    name: "Blue Bliss",
    price: "$6.90",
    image: "/images/bowl-berries.webp",
    bg: "#5E0BA8",
  },
  {
    key: "banana",
    name: "Banana Crush",
    price: "$6.20",
    image: "/images/bowl-banana.webp",
    bg: "#C08A00",
  },
  {
    key: "kiwi",
    name: "Kiwi Flavor",
    price: "$6.70",
    image: "/images/bowl-kiwi.webp",
    bg: "#1B7A22",
  },
];

let current = 0;
const listeners = new Set<(index: number) => void>();

export function setFlavor(index: number) {
  if (index === current) return;
  current = index;
  listeners.forEach((fn) => fn(index));
}

export function getFlavor() {
  return current;
}

export function subscribeFlavor(fn: (index: number) => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
