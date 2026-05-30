import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ColorSwatches } from "@/components/common/ColorSwatches"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"
import { useStudio } from "@/context/StudioContext"
import { MODEL_REPO_URL, MODEL_SIZE_LABEL, fetchLatestModelVersion } from "@/lib/backgroundRemoval"

const FORMAT_OPTIONS = [
  { value: "png", label: "PNG (recommended)" },
  { value: "webp", label: "WebP" },
]

function isNewer(latest, current) {
  if (!latest) return false
  if (!current || current === "bundled") return true
  const a = latest.split(".").map(Number)
  const b = current.split(".").map(Number)
  for (let i = 0; i < 3; i += 1) {
    const x = a[i] || 0
    const y = b[i] || 0
    if (x !== y) return x > y
  }
  return false
}

export function BgRemovePanel({ state, set }) {
  const { bgModel, downloadBgModel, forgetBgModel } = useStudio()
  const [latest, setLatest] = useState(null)
  const [phase, setPhase] = useState("idle")
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState("")
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    if (bgModel.downloaded) {
      fetchLatestModelVersion().then((v) => {
        if (active) setLatest(v)
      })
    }
    return () => {
      active = false
    }
  }, [bgModel.downloaded])

  const download = async (version) => {
    setError(null)
    setPhase("downloading")
    setProgress(0)
    setProgressLabel("Starting…")
    try {
      await downloadBgModel(version, (p) => {
        setProgress(p.ratio)
        setProgressLabel(p.label)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed. Check your connection and try again.")
    } finally {
      setPhase("idle")
    }
  }

  // Initial install always uses the version bundled with the library (compatible).
  const installModel = () => download(null)
  // Explicit opt-in to a newer published library version.
  const updateModel = () => download(latest)

  const checkUpdate = async () => {
    setPhase("checking")
    setLatest(await fetchLatestModelVersion())
    setPhase("idle")
  }

  const pct = Math.round(progress * 100)
  const updateAvailable = bgModel.downloaded && isNewer(latest, bgModel.version)

  if (!bgModel.downloaded) {
    return (
      <div className="flex flex-col gap-3 px-[14px] py-3">
        <div className="rounded-[var(--border-radius-md)] border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] p-3">
          <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--color-text-primary)]">
            <i className="ti ti-download" />
            <span>On-device model required</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
            Background removal runs a neural segmentation model (IS-Net) entirely in your browser via
            ONNX Runtime + WebAssembly. Your images are never uploaded — only the model weights are
            downloaded (about {MODEL_SIZE_LABEL}, one time) and cached locally for future use.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-[var(--color-text-tertiary)]">
            <li className="flex items-center gap-1.5">
              <i className="ti ti-lock" /> Processed 100% locally — privacy preserving
            </li>
            <li className="flex items-center gap-1.5">
              <i className="ti ti-database" /> Cached after first download — no repeat fetch
            </li>
            <li className="flex items-center gap-1.5">
              <i className="ti ti-cpu" /> ONNX Runtime · WebAssembly · IS-Net (fp16)
            </li>
          </ul>
          <a
            className="mt-2 inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] underline"
            href={MODEL_REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <i className="ti ti-brand-github" /> Technical details &amp; source repository
          </a>
        </div>

        {phase === "downloading" ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span>{progressLabel}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-background-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--color-text-primary)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : (
          <Button className="btn-primary w-full" onClick={installModel}>
            <i className="ti ti-download" /> Download model ({MODEL_SIZE_LABEL})
          </Button>
        )}

        {error ? <p className="text-xs text-[#f87171]">{error}</p> : null}
      </div>
    )
  }

  return (
    <>
      <PanelSection label="replace with">
        <ColorSwatches value={state.bg} onChange={(bg) => set({ bg })} />
      </PanelSection>
      <PanelSection label="output format">
        <FormatSelect value={state.format} onChange={(format) => set({ format })} options={FORMAT_OPTIONS} />
      </PanelSection>
      <PanelSection label="model">
        <div className="rounded-[var(--border-radius-md)] border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] p-3 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
            <i className="ti ti-circle-check text-[var(--color-success)]" />
            <span>
              Model ready
              {bgModel.version && bgModel.version !== "bundled" ? ` · v${bgModel.version}` : ""}
            </span>
          </div>
          {bgModel.downloadedAt ? (
            <div className="mt-1 text-[var(--color-text-tertiary)]">
              Downloaded {new Date(bgModel.downloadedAt).toLocaleDateString()} · cached locally
            </div>
          ) : null}

          {updateAvailable ? (
            <div className="mt-2 flex items-center justify-between gap-2 rounded-[var(--border-radius-sm)] border border-[var(--color-border-tertiary)] bg-[var(--color-background-tertiary)] p-2">
              <span className="text-[var(--color-text-secondary)]">New model available · v{latest}</span>
              <Button
                variant="secondary"
                size="sm"
                className="btn-secondary"
                onClick={updateModel}
                disabled={phase === "downloading"}
              >
                {phase === "downloading" ? `${pct}%` : "Update"}
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="btn-secondary"
                onClick={checkUpdate}
                disabled={phase !== "idle"}
              >
                {phase === "checking" ? "Checking…" : "Check for updates"}
              </Button>
              {latest ? <span className="text-[var(--color-text-tertiary)]">Up to date</span> : null}
            </div>
          )}

          {phase === "downloading" ? (
            <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[var(--color-background-tertiary)]">
              <div
                className="h-full rounded-full bg-[var(--color-text-primary)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          ) : null}

          <button
            type="button"
            onClick={forgetBgModel}
            className="mt-2 block text-[var(--color-text-tertiary)] underline"
          >
            Forget model (re-ask consent)
          </button>
          {error ? <p className="mt-2 text-[#f87171]">{error}</p> : null}
        </div>
      </PanelSection>
    </>
  )
}
