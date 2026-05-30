import { describe, expect, it } from "vitest"
import { estimateKB } from "@/lib/estimate"

describe("estimateKB", () => {
  it("scales linearly with quality for a given format", () => {
    const full = estimateKB(100, "jpg", 1000)
    const half = estimateKB(50, "jpg", 1000)
    expect(full).toBe(180)
    expect(half).toBe(90)
  })

  it("applies the per-format factor", () => {
    const base = 1000
    expect(estimateKB(100, "png", base)).toBe(620)
    expect(estimateKB(100, "webp", base)).toBe(120)
    expect(estimateKB(100, "avif", base)).toBe(80)
    expect(estimateKB(100, "bmp", base)).toBe(1600)
  })

  it("falls back to the keep factor for unknown formats", () => {
    expect(estimateKB(100, "heic", 1000)).toBe(estimateKB(100, "keep", 1000))
  })

  it("uses the default base size when none is provided", () => {
    expect(estimateKB(100, "jpg")).toBe(Math.round(2400 * 0.18))
  })

  it("returns an integer", () => {
    expect(Number.isInteger(estimateKB(37, "webp", 1234))).toBe(true)
  })
})
