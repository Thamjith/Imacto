export const ASPECT_RATIOS = {
  Free: null,
  "1:1": 1,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
}

export function aspectRatioFromLabel(aspect) {
  return ASPECT_RATIOS[aspect] ?? null
}

export function parseDimension(value, fallback = 1) {
  const n = typeof value === "number" ? value : parseInt(String(value), 10)
  if (!Number.isFinite(n) || n < 1) return fallback
  return Math.min(16384, Math.round(n))
}

export function clampCropRegion(region, imgW, imgH) {
  const width = Math.max(1, Math.min(region.width, imgW))
  const height = Math.max(1, Math.min(region.height, imgH))
  const x = Math.max(0, Math.min(region.x, imgW - width))
  const y = Math.max(0, Math.min(region.y, imgH - height))
  return { x, y, width, height }
}

/** Largest centered crop rect matching aspect ratio (or full image when ratio is null). */
export function centerCropWithAspect(imgW, imgH, ratio) {
  if (!ratio) {
    return { x: 0, y: 0, width: imgW, height: imgH }
  }

  let cropW = imgW
  let cropH = Math.round(cropW / ratio)
  if (cropH > imgH) {
    cropH = imgH
    cropW = Math.round(cropH * ratio)
  }

  return {
    x: Math.round((imgW - cropW) / 2),
    y: Math.round((imgH - cropH) / 2),
    width: cropW,
    height: cropH,
  }
}

export function outputAspectRatio(cropState) {
  const fixed = aspectRatioFromLabel(cropState.aspect)
  if (fixed) return fixed
  const w = parseDimension(cropState.region?.width, 1)
  const h = parseDimension(cropState.region?.height, 1)
  return w / h
}

export function linkedDimensionPair(width, ratio) {
  const w = parseDimension(width, 1)
  const h = Math.max(1, Math.round(w / ratio))
  return { width: w, height: h }
}

/** Letterboxed image rect inside the preview container (CSS pixels). */
export function imageDisplayRect(containerW, containerH, imageW, imageH) {
  if (!imageW || !imageH) {
    return { x: 0, y: 0, width: containerW, height: containerH }
  }

  const imageAspect = imageW / imageH
  const containerAspect = containerW / containerH

  if (imageAspect > containerAspect) {
    const width = containerW
    const height = containerW / imageAspect
    return { x: 0, y: containerH / 2 - height / 2, width, height }
  }

  const height = containerH
  const width = containerH * imageAspect
  return { x: containerW / 2 - width / 2, y: 0, width, height }
}

export function regionToDisplay(region, displayRect, imageW, imageH) {
  return {
    x: displayRect.x + (region.x / imageW) * displayRect.width,
    y: displayRect.y + (region.y / imageH) * displayRect.height,
    width: (region.width / imageW) * displayRect.width,
    height: (region.height / imageH) * displayRect.height,
  }
}

export function displayToRegion(display, displayRect, imageW, imageH) {
  const x = ((display.x - displayRect.x) / displayRect.width) * imageW
  const y = ((display.y - displayRect.y) / displayRect.height) * imageH
  const width = (display.width / displayRect.width) * imageW
  const height = (display.height / displayRect.height) * imageH
  return clampCropRegion(
    {
      x: Math.round(x),
      y: Math.round(y),
      width: Math.round(width),
      height: Math.round(height),
    },
    imageW,
    imageH
  )
}

/** Resize display-space crop box from a corner handle while honoring aspect lock. */
export function resizeRegionFromHandle(region, handle, dx, dy, imageW, imageH, aspectLock) {
  let { x, y, width, height } = region

  const applyAspect = (w, h, anchor) => {
    if (!aspectLock) return { width: w, height: h }
    const ratio = aspectLock
    if (anchor === "se" || anchor === "ne") {
      h = Math.round(w / ratio)
    } else {
      w = Math.round(h * ratio)
    }
    return { width: w, height: h }
  }

  switch (handle) {
    case "nw": {
      width -= dx
      height -= dy
      const sized = applyAspect(width, height, "nw")
      width = sized.width
      height = sized.height
      x = region.x + region.width - width
      y = region.y + region.height - height
      break
    }
    case "ne": {
      width += dx
      height -= dy
      const sized = applyAspect(width, height, "ne")
      width = sized.width
      height = sized.height
      y = region.y + region.height - height
      break
    }
    case "sw": {
      width -= dx
      height += dy
      const sized = applyAspect(width, height, "sw")
      width = sized.width
      height = sized.height
      x = region.x + region.width - width
      break
    }
    case "se": {
      width += dx
      height += dy
      const sized = applyAspect(width, height, "se")
      width = sized.width
      height = sized.height
      break
    }
    case "move":
      x += dx
      y += dy
      break
    default:
      break
  }

  return clampCropRegion({ x, y, width, height }, imageW, imageH)
}
