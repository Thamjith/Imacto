declare module "*.css"

interface Performance {
  memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

interface Navigator {
  deviceMemory?: number
}
