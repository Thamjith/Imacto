import { describe, expect, it } from "vitest"
import {
  aspectRatioFromLabel,
  centerCropWithAspect,
  clampCropRegion,
  displayToRegion,
  imageDisplayRect,
  linkedDimensionPair,
  outputAspectRatio,
  parseDimension,
  regionToDisplay,
  resizeRegionFromHandle,
} from "@/lib/cropGeometry"

describe("aspectRatioFromLabel", () => {
  it("returns numeric ratios for known labels", () => {
    expect(aspectRatioFromLabel("1:1")).toBe(1)
    expect(aspectRatioFromLabel("16:9")).toBeCloseTo(16 / 9)
  })

  it("returns null for Free or unknown labels", () => {
    expect(aspectRatioFromLabel("Free")).toBeNull()
    expect(aspectRatioFromLabel("bogus")).toBeNull()
  })
})

describe("parseDimension", () => {
  it("parses numeric strings and rounds", () => {
    expect(parseDimension("200")).toBe(200)
    expect(parseDimension(199.6)).toBe(200)
  })

  it("returns the fallback for invalid or sub-1 values", () => {
    expect(parseDimension("abc", 42)).toBe(42)
    expect(parseDimension(0, 7)).toBe(7)
    expect(parseDimension(-5, 7)).toBe(7)
  })

  it("clamps to the 16384 maximum", () => {
    expect(parseDimension(999999)).toBe(16384)
  })
})

describe("clampCropRegion", () => {
  it("keeps an in-bounds region unchanged", () => {
    const region = { x: 10, y: 20, width: 100, height: 50 }
    expect(clampCropRegion(region, 500, 500)).toEqual(region)
  })

  it("shrinks dimensions that exceed the image", () => {
    expect(clampCropRegion({ x: 0, y: 0, width: 999, height: 999 }, 200, 100)).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 100,
    })
  })

  it("pulls the origin back so the region stays inside", () => {
    expect(clampCropRegion({ x: 180, y: 90, width: 100, height: 50 }, 200, 100)).toEqual({
      x: 100,
      y: 50,
      width: 100,
      height: 50,
    })
  })

  it("enforces a minimum size of 1", () => {
    expect(clampCropRegion({ x: 0, y: 0, width: 0, height: 0 }, 200, 100)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    })
  })
})

describe("centerCropWithAspect", () => {
  it("returns the full image for a null ratio", () => {
    expect(centerCropWithAspect(800, 600, null)).toEqual({ x: 0, y: 0, width: 800, height: 600 })
  })

  it("centers a square crop on a landscape image", () => {
    expect(centerCropWithAspect(800, 600, 1)).toEqual({ x: 100, y: 0, width: 600, height: 600 })
  })

  it("centers a 16:9 crop constrained by width", () => {
    const crop = centerCropWithAspect(1600, 1200, 16 / 9)
    expect(crop.width).toBe(1600)
    expect(crop.height).toBe(900)
    expect(crop.x).toBe(0)
    expect(crop.y).toBe(150)
  })
})

describe("outputAspectRatio", () => {
  it("uses the fixed aspect when set", () => {
    expect(outputAspectRatio({ aspect: "16:9" })).toBeCloseTo(16 / 9)
  })

  it("derives the ratio from the region when Free", () => {
    expect(outputAspectRatio({ aspect: "Free", region: { width: 200, height: 100 } })).toBe(2)
  })
})

describe("linkedDimensionPair", () => {
  it("derives height from width and ratio", () => {
    expect(linkedDimensionPair(1920, 16 / 9)).toEqual({ width: 1920, height: 1080 })
  })

  it("never returns a height below 1", () => {
    expect(linkedDimensionPair(1, 1000).height).toBe(1)
  })
})

describe("imageDisplayRect", () => {
  it("returns the container rect when image size is missing", () => {
    expect(imageDisplayRect(300, 200, 0, 0)).toEqual({ x: 0, y: 0, width: 300, height: 200 })
  })

  it("letterboxes a wide image (top/bottom bars)", () => {
    const rect = imageDisplayRect(400, 400, 800, 400)
    expect(rect.width).toBe(400)
    expect(rect.height).toBe(200)
    expect(rect.x).toBe(0)
    expect(rect.y).toBe(100)
  })

  it("pillarboxes a tall image (left/right bars)", () => {
    const rect = imageDisplayRect(400, 400, 400, 800)
    expect(rect.height).toBe(400)
    expect(rect.width).toBe(200)
    expect(rect.y).toBe(0)
    expect(rect.x).toBe(100)
  })
})

describe("regionToDisplay / displayToRegion", () => {
  const displayRect = { x: 0, y: 0, width: 400, height: 200 }
  const imageW = 800
  const imageH = 400

  it("maps a source region into display space", () => {
    const display = regionToDisplay({ x: 400, y: 200, width: 400, height: 200 }, displayRect, imageW, imageH)
    expect(display).toEqual({ x: 200, y: 100, width: 200, height: 100 })
  })

  it("round-trips region → display → region", () => {
    const region = { x: 80, y: 40, width: 200, height: 100 }
    const display = regionToDisplay(region, displayRect, imageW, imageH)
    expect(displayToRegion(display, displayRect, imageW, imageH)).toEqual(region)
  })
})

describe("resizeRegionFromHandle", () => {
  const region = { x: 100, y: 100, width: 200, height: 200 }

  it("grows from the south-east handle", () => {
    expect(resizeRegionFromHandle(region, "se", 50, 30, 1000, 1000, null)).toEqual({
      x: 100,
      y: 100,
      width: 250,
      height: 230,
    })
  })

  it("moves the region without resizing", () => {
    expect(resizeRegionFromHandle(region, "move", 25, -10, 1000, 1000, null)).toEqual({
      x: 125,
      y: 90,
      width: 200,
      height: 200,
    })
  })

  it("honors aspect lock on the se handle", () => {
    const result = resizeRegionFromHandle(region, "se", 100, 0, 1000, 1000, 1)
    expect(result.width).toBe(result.height)
  })

  it("keeps the result clamped within image bounds", () => {
    const result = resizeRegionFromHandle(region, "se", 5000, 5000, 320, 320, null)
    expect(result.x + result.width).toBeLessThanOrEqual(320)
    expect(result.y + result.height).toBeLessThanOrEqual(320)
  })
})
