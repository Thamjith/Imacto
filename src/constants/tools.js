export const IMAGE_TOOLS = [
  { id: "crop", label: "Crop & resize", icon: "ti-crop" },
  { id: "compress", label: "Compress", icon: "ti-arrows-minimize" },
  { id: "convert", label: "Convert format", icon: "ti-transform" },
  { id: "rotate", label: "Rotate & flip", icon: "ti-rotate-clockwise" },
  { id: "bgremove", label: "Background remove", icon: "ti-eraser" },
  { id: "watermark", label: "Watermark", icon: "ti-typography", soon: true },
]

export const VIDEO_TOOLS = [
  { id: "vtrim", label: "Trim & clip", icon: "ti-scissors" },
  { id: "vconvert", label: "Convert format", icon: "ti-transform" },
  { id: "vcompress", label: "Compress video", icon: "ti-arrows-minimize" },
]

export const TOOL_META = {
  crop: { icon: "ti-crop", title: "Crop & resize", sub: "drag handles or set manually" },
  compress: { icon: "ti-arrows-minimize", title: "Compress", sub: "balance quality and file size" },
  convert: { icon: "ti-transform", title: "Convert format", sub: "change file type" },
  rotate: { icon: "ti-rotate-clockwise", title: "Rotate & flip", sub: "reorient your image" },
  bgremove: { icon: "ti-eraser", title: "Background remove", sub: "isolate the subject" },
  watermark: { icon: "ti-typography", title: "Watermark", sub: "overlay text or a mark" },
}

export const IMAGE_TOOL_IDS = IMAGE_TOOLS.map((t) => t.id)

export const ENABLED_TOOL_IDS = IMAGE_TOOLS.filter((t) => !t.soon).map((t) => t.id)

export const DEFAULT_TOOL_STATE = {
  crop: {
    aspect: "Free",
    width: 1920,
    height: 1080,
    linked: true,
    quality: 85,
    format: "keep",
    region: { x: 0, y: 0, width: 0, height: 0 },
  },
  compress: { preset: "Balanced", quality: 80, stripExif: true },
  convert: { format: "webp", profile: "sRGB", bg: "white" },
  rotate: { rotation: 0, flipH: false, flipV: false, format: "keep" },
  bgremove: { model: "isnet", bg: "transparent", format: "png", brushMode: "off", brushSize: 28 },
  watermark: { text: "© studio 2026", position: "BR", opacity: 60, size: 24 },
}
