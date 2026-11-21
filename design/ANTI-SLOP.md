# Anti-slop rules

"AI slop" in interface design is the look a model produces when it falls back to its most common training examples instead of making choices for the subject: the same font, the same purple gradient, the same three cards with icons, the same fade-up animations. Anthropic's own frontend guidance names it directly: models "converge toward generic, on-distribution outputs", and the fix is distinctive type, a committed palette, one orchestrated motion moment and context-specific character. A judge who has seen a hundred hackathon demos spots it in a second, and it reads as "nobody decided anything here".

For a clinical product there is a second cost: decoration that carries no meaning competes with the information that does. Every rule below therefore has a clinical reason as well as a taste reason.

**How to use this file.** Before marking any UI task done, go through the checklist at the bottom. Two hits: fix them. Three or more: the screen goes back for redesign (the threshold used by the ux-skill ban list; pixelslop rates 7 or more as terminal).

## Banned, with the Meyar replacement

### Type
| Banned | Why it reads as generated | Meyar instead |
|---|---|---|
| Inter, Roboto, Arial, Open Sans or system-ui as the only face | The default every model reaches for | Readex Pro (patient), IBM Plex Sans Arabic (clinician), Alexandria (headlines only), Plex Mono (data only) |
| Monospace on prose for a "technical" feel | Tone without function | Mono only inside `.m-data` for genotypes, scores, codes and times |
| Gradient-filled headlines or numbers | Decoration that hurts legibility | Solid ink; saffron only on the hero headline accent and cover title |
| Title Case Buttons | Template habit | Sentence case, verb first |
| One weight everywhere | No hierarchy | Weight extremes: 300 hero against 600–700 emphasis |
| Letter-spaced Arabic | Breaks joined script | Never track Arabic; `.m-eyebrow` resets itself in `[lang="ar"]` |

### Colour
| Banned | Why | Meyar instead |
|---|---|---|
| Purple-to-blue or indigo gradients | The Tailwind `indigo-500` default, everywhere in training data | Juniper and saffron from Aseer, flat fills |
| Cyan or neon on near-black, glowing halos | "Cool" with no decision behind it | Instrument theme is warm kohl with flat marks, no glow, no blur |
| Pure #000 / #fff | Unconsidered | Tinted paper `#EDF2EC`, ink `#14201B`, kohl `#100F0C` |
| Cream paper + serif display + terracotta accent | The other current AI cluster | Green-tinted security paper, geometric Alexandria, terracotta only at the fast end of the scale |
| Grey text on coloured fills | Fails contrast | Darker shade of the fill's own hue (`--m-stop` on `--m-stop-tint`) |
| Green tick for "safe" | Implies the banned word | No green status and no tick on the patient side |
| Colour as the only signal | Fails WCAG 1.4.1 and colour-blind users | Shape + word + colour on every status |

### Layout and components
| Banned | Why | Meyar instead |
|---|---|---|
| Three identical icon cards in a row | The most-cited tell | One instrument per gene, sized by what it says; dashboards use varied spans (3/3/3/3, 7/5, 12) |
| Everything in a rounded, shadowed card; cards in cards | Flattens hierarchy | Radius by role (2/6/10/22 px); shadow only on the floating sheet; dividers and spacing elsewhere |
| Thick coloured stripe on one side of a rounded card | Template tell | Indicator as a labelled chip in the card bar |
| Big rounded icon tile above every heading | Decoration | Icons only where they carry status, at text size, one stroke weight, drawn for Meyar |
| Centred hero stack over a feature grid | Generic | The hero is the product's own instrument with live data |
| Glassmorphism, aurora, shader or liquid-metal backgrounds (the top 21st.dev hero trends) | Trend, not system | Texture only where it means something: paper grain, chart-paper grid, the Qatt band |
| Decorative sparklines with no data | Fake liveliness | Sparklines only of logged counts, with a faint grid and a marked endpoint |
| Big-number hero stats with no source | Fake proof | Counts from `cds/data/alerts.jsonl` labelled Demo data; any statistic needs a row in `docs/sources.md` |
| A modal for every message | Interrupts, and alert fatigue is the problem we solve | Side-rail card; modals only for destructive confirms |
| Every button primary | No hierarchy | One primary per screen |
| Emoji as icons | Mixed styles | The Meyar icon set in `showcase/index.html` |

### Motion
| Banned | Why | Meyar instead |
|---|---|---|
| Bounce, spring or elastic easing | Dated; real instruments decelerate | `--m-ease-settle`, never overshoots |
| Fade-up on scroll for every block | Scattered, says nothing | One orchestrated moment per screen (the calibration sweep) |
| `transition: all`, animating width or margin | Janky | transform, opacity, registered properties only |
| Looping pulses and spinners | Motion with no state | Motion only on a state change |
| Motion that ignores the user | Accessibility failure | Off under `prefers-reduced-motion` and in elder mode |

### Copy
| Banned | Meyar instead |
|---|---|
| "Empower", "leverage", "unlock", "transform", "seamless" | Concrete verbs: show, check, ask, send |
| "10,000+ patients", "99% accurate" | Only numbers with a row in `docs/sources.md` |
| "Jane Doe", "Acme Hospital", lorem ipsum | Fixture IDs (demo-001), real drug and gene names, labelled Demo data |
| "Something went wrong", "Invalid input" | Say what happened and the next step |
| Heading restated by its intro line | Say it once |
| "Safe", "No risk" | The three answers only |

## What we took from 21st.dev, and what we left

21st.dev is a community registry of React and Tailwind components (shadcn conventions). The craft worth copying: components read theme tokens instead of hard-coded colours, ship light and dark, separate logic from demo, and include ARIA and keyboard support. Dashboard registries there (evilcharts, dashboardcn, livedocs, ikada) show dense KPI tiles, heatmaps and undo toasts done with semantic tokens. We took those habits.

We left the most-copied looks: shader and liquid-metal heroes, gradient and shimmer buttons, glowing search bars, glass panels, and hard-coded zinc palettes that make every shadcn site look alike (the site's own FAQ concedes the risk). None of the pages we read addresses RTL or Arabic type, so nothing from there is used without RTL testing. Meyar's passport is plain web (no React per the stack), so we use the habits, not the components.

## Pre-merge checklist

Tick each that is TRUE of the screen. Two or more ticks: fix. Three or more: redesign.

- [ ] A font other than the four Meyar families appears.
- [ ] A purple, indigo or neon colour, a gradient on text, or a glow appears.
- [ ] Three or more sibling blocks are identical in size, icon and structure.
- [ ] A status is shown by colour alone, or the patient side shows a tick or the word "safe".
- [ ] Something animates on load other than the one orchestrated moment, or anything bounces.
- [ ] A number appears without a `docs/sources.md` row or a Demo data label.
- [ ] A modal interrupts the prescriber.
- [ ] Arabic text is letter-spaced, or genotype data reorders inside Arabic (missing `.m-data`).
- [ ] A tap target is under 48 px.
- [ ] A button says OK, Submit, Learn more or Click here.
- [ ] A hard-coded colour appears in a component instead of a token.

## Sources
- Anthropic, "Improving frontend design through skills", claude.com/blog/improving-frontend-design-through-skills
- pixelslop, AI slop pattern catalog, cdn.jsdelivr.net/npm/pixelslop@0.3.8/dist/skill/resources/ai-slop-patterns.md
- wystack agent-kit, anti-patterns, cdn.jsdelivr.net/npm/@wystack/agent-kit@0.12.0/wystack-agent-kit/references/anti-patterns.md
- impeccable, anti-patterns, mintlify.com/pbakaus/impeccable/concepts/anti-patterns
- ux-skill, anti-AI-slop ban list, github.com/Laith0003/ux-skill/wiki/Anti-AI-slop-ban-list
- "Why every AI-built website looks the same", dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p
- 21st.dev home, chart registries directory and "smaller shadcn registries" blog post (read 21 Nov 2026)
