/* eslint-env browser */
// Night train: the first Genuary26 "jan 19: 16x16" sketch (genuary26-jan19,
// src/sketch6.ts) without p5. sceneAt() describes the scene on a 16x16 grid;
// <night-train> animates it with one solid color per cell.

export const SIZE = 16
export const COLORS = {
  sky: '#000080', // navy
  moon: '#faf0e6', // linen
  trunk: '#8b4513', // saddlebrown
  leaves: '#228b22', // forestgreen
  train: '#ffe4c4', // bisque
  window: '#a52a2a' // brown
}

const RUNWAY = 64
const CARS = 4
const CAR_GAP = 1
const CAR_WIDTH = SIZE * 2 - CARS * CAR_GAP
const WINDOWS = 6
const WINDOW_GAP = 1
const WINDOW_WIDTH = (CAR_WIDTH - 2) / WINDOWS - WINDOW_GAP
const TRAIN_SPEED = 0.5
const TRAIN_LENGTH = CARS * (CAR_WIDTH + CAR_GAP)
const LOOP = RUNWAY + TRAIN_LENGTH * 3

// Shapes for animation frame `frame` (p5's frameCount, starting at 1),
// back to front. Circles are { x, y, d } with x, y at the top-left corner.
export function sceneAt (frame) {
  const shapes = [
    { type: 'rect', x: 3.5, y: 8, w: 2, h: 9, r: 0.2, color: COLORS.trunk },
    { type: 'circle', x: 0.5, y: 6, d: 4, color: COLORS.leaves },
    { type: 'circle', x: 2.5, y: 5, d: 4, color: COLORS.leaves },
    { type: 'circle', x: 4.5, y: 6, d: 4, color: COLORS.leaves }
  ]

  const start = (frame % LOOP) * TRAIN_SPEED - 40 - TRAIN_LENGTH
  for (let car = 0; car < CARS; car++) {
    const x = start + car * (CAR_WIDTH + CAR_GAP)
    shapes.push({ type: 'rect', x, y: 10, w: CAR_WIDTH, h: 8, r: 1.2, color: COLORS.train })
    for (let i = 0; i < WINDOWS; i++) {
      shapes.push({
        type: 'rect',
        x: x + 2 + i * (WINDOW_WIDTH + WINDOW_GAP),
        y: 12,
        w: WINDOW_WIDTH,
        h: 4,
        r: 0.5,
        color: COLORS.window
      })
    }
  }

  shapes.push(
    { type: 'circle', x: 10, y: 2, d: 4, color: COLORS.moon },
    { type: 'circle', x: 9, y: 2, d: 4, color: COLORS.sky }
  )
  return shapes
}

const SUPERSAMPLE = 16
const PALETTE = Object.values(COLORS).map(hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)))
const SKY = 0
const TRAIN = Object.keys(COLORS).indexOf('train')
// A cell where the train meets the sky only stays train-colored when the train
// covers most of it, so the cars' rounded corners still read at 16x16.
const TRAIN_EDGE_COVERAGE = 0.75

function nearest (r, g, b) {
  let best = 0
  let bestDist = Infinity
  PALETTE.forEach(([pr, pg, pb], i) => {
    const dist = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2
    if (dist < bestDist) {
      best = i
      bestDist = dist
    }
  })
  return best
}

const cache = new Map()

// Draws frame `frame` onto a 16x16 2D context, one palette color per cell.
// The animation repeats every LOOP frames, so each frame is computed once.
export function drawFrame (ctx, frame, scratch) {
  const key = frame % LOOP
  if (!cache.has(key)) cache.set(key, renderCells(ctx, frame, scratch))
  ctx.putImageData(cache.get(key), 0, 0)
}

function renderCells (ctx, frame, scratch) {
  const size = SIZE * SUPERSAMPLE
  const hi = scratch.getContext('2d', { willReadFrequently: true })
  hi.setTransform(SUPERSAMPLE, 0, 0, SUPERSAMPLE, 0, 0)
  hi.fillStyle = COLORS.sky
  hi.fillRect(0, 0, SIZE, SIZE)
  for (const s of sceneAt(frame)) {
    hi.fillStyle = s.color
    hi.beginPath()
    if (s.type === 'rect') {
      hi.roundRect(s.x, s.y, s.w, s.h, s.r)
    } else {
      hi.arc(s.x + s.d / 2, s.y + s.d / 2, s.d / 2, 0, Math.PI * 2)
    }
    hi.fill()
  }

  const px = hi.getImageData(0, 0, size, size).data
  const out = ctx.createImageData(SIZE, SIZE)
  const counts = new Array(PALETTE.length)
  const firstSeen = new Array(PALETTE.length)
  for (let cy = 0; cy < SIZE; cy++) {
    for (let cx = 0; cx < SIZE; cx++) {
      counts.fill(0)
      firstSeen.fill(Infinity)
      for (let y = 0; y < SUPERSAMPLE; y++) {
        for (let x = 0; x < SUPERSAMPLE; x++) {
          const i = ((cy * SUPERSAMPLE + y) * size + cx * SUPERSAMPLE + x) * 4
          const c = nearest(px[i], px[i + 1], px[i + 2])
          counts[c]++
          firstSeen[c] = Math.min(firstSeen[c], y * SUPERSAMPLE + x)
        }
      }
      // Ties (a shape edge through the middle of a cell) go to the color
      // reached first, scanning from the cell's top left.
      const ranked = counts.map((n, i) => [n, i])
        .sort((a, b) => b[0] - a[0] || firstSeen[a[1]] - firstSeen[b[1]])
      let color = ranked[0][1]
      if (color === TRAIN && ranked[1][1] === SKY &&
          ranked[0][0] < TRAIN_EDGE_COVERAGE * SUPERSAMPLE ** 2) {
        color = SKY
      }
      out.data.set([...PALETTE[color], 255], (cy * SIZE + cx) * 4)
    }
  }
  return out
}

// Draws frame `frame` with smooth edges, the way the p5 sketch looks when it
// is zoomed in on the genuary page.
export function drawSmooth (ctx, frame) {
  const scale = ctx.canvas.width / SIZE
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.fillStyle = COLORS.sky
  ctx.fillRect(0, 0, SIZE, SIZE)
  for (const s of sceneAt(frame)) {
    ctx.fillStyle = s.color
    ctx.beginPath()
    if (s.type === 'rect') {
      ctx.roundRect(s.x, s.y, s.w, s.h, s.r)
    } else {
      ctx.arc(s.x + s.d / 2, s.y + s.d / 2, s.d / 2, 0, Math.PI * 2)
    }
    ctx.fill()
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
}

const FRAME_MS = 1000 / 60
const ZOOM = 5

// <night-train frame="330" zoom> plays the sketch from that frame. Anything
// inside the element (like a still <img>) shows until the canvas takes over,
// and stays for visitors who prefer reduced motion.
//
// With `zoom`, it grows to 5x like the sketches on the genuary page: while the
// mouse is over it, or after a click or tap until the next click or tap
// elsewhere (pointerdown, since iOS sends no click for taps on plain text).
// Zoomed in, it draws the scene smoothly at full resolution.
export class NightTrain extends HTMLElement {
  connectedCallback () {
    if (this.hasAttribute('zoom')) this.setUpZoom()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'display:block;width:100%;height:100%'
    canvas.setAttribute('aria-hidden', 'true')
    const scratch = document.createElement('canvas')
    scratch.width = scratch.height = SIZE * SUPERSAMPLE
    const ctx = canvas.getContext('2d')

    const draw = (frame) => {
      const large = this.classList.contains('large')
      const width = large ? Math.round(SIZE * ZOOM * window.devicePixelRatio) : SIZE
      if (canvas.width !== width) {
        canvas.width = canvas.height = width
        canvas.style.imageRendering = large ? 'auto' : 'pixelated'
      }
      if (large) drawSmooth(ctx, frame)
      else drawFrame(ctx, frame, scratch)
    }

    const first = Number(this.getAttribute('frame')) || 1
    let begin
    const tick = (now) => {
      begin ??= now
      draw(first + Math.floor((now - begin) / FRAME_MS))
      this.raf = requestAnimationFrame(tick)
    }
    draw(first)
    this.replaceChildren(canvas)
    this.raf = requestAnimationFrame(tick)
  }

  setUpZoom () {
    const isTouch = (e) => e.pointerType === 'touch'
    this.onpointerenter = (e) => { if (!isTouch(e)) this.grow() }
    this.onpointerleave = (e) => { if (!isTouch(e)) this.shrink() }
    this.onclick = () => this.grow({ clicked: true })
    this.onOutsideClick = (e) => {
      if (!this.contains(e.target)) this.shrink({ force: true })
    }
    document.addEventListener('pointerdown', this.onOutsideClick)
  }

  grow ({ clicked } = {}) {
    if (clicked) this.classList.add('clicked')
    this.classList.add('large')
  }

  shrink ({ force } = {}) {
    if (!force && this.classList.contains('clicked')) return
    this.classList.remove('large', 'clicked')
  }

  disconnectedCallback () {
    cancelAnimationFrame(this.raf)
    if (this.onOutsideClick) document.removeEventListener('pointerdown', this.onOutsideClick)
  }
}

if (!customElements.get('night-train')) customElements.define('night-train', NightTrain)
