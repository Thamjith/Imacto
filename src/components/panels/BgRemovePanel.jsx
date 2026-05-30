import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ChipGroup } from "@/components/common/ChipGroup"
import { ColorSwatches } from "@/components/common/ColorSwatches"
import { FormatSelect } from "@/components/common/FormatSelect"
import { PanelSection } from "@/components/common/PanelSection"
import { SliderField } from "@/components/common/SliderField"
import { useStudio } from "@/context/StudioContext"
import { cn } from "@/lib/utils"
import { MODEL_OPTIONS, MODEL_REPO_URL, fetchLatestModelVersion, modelSize } from "@/lib/backgroundRemoval"

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

function ModelChooser({ selected, onChoose, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      {MODEL_OPTIONS.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={disabled}
          onClick={() => onChoose(m.id)}
          className={cn(
            "flex items-center justify-between gap-2 rounded-[var(--border-radius-md)] border px-2.5 py-2 text-left disabled:opacity-50",
            selected === m.id
              ? "border-[var(--color-text-primary)] bg-[var(--color-background-secondary)]"
              : "border-[var(--color-border-tertiary)]"
          )}
        >
          <span className="flex flex-col">
            <span className="text-xs text-[var(--color-text-primary)]">{m.label}</span>
            <span className="text-[10px] leading-tight text-[var(--color-text-tertiary)]">{m.hint}</span>
          </span>
          <span className="shrink-0 text-[11px] text-[var(--color-text-secondary)]">{m.size}</span>
        </button>
      ))}
    </div>
  )
}

const EXTERNAL_NOTE =
  "Only these IS-Net variants are supported by the on-device engine. Arbitrary external ONNX models (e.g. from the onnx/models zoo) use different inputs/outputs and aren't compatible."

const BRUSH_MODES = [
  { id: "off", label: "Off" },
  { id: "erase", label: "Erase" },
  { id: "restore", label: "Restore" },
]

export function BgRemovePanel({ state, set }) {
  const { bgModel, downloadBgModel, forgetBgModel, bgBrush } = useStudio()
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

  const download = async (version, variant) => {
    setError(null)
    setPhase("downloading")
    setProgress(0)
    setProgressLabel("Starting…")
    try {
      await downloadBgModel(version, variant, (p) => {
        setProgress(p.ratio)
        setProgressLabel(p.label)
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed. Check your connection and try again.")
    } finally {
      setPhase("idle")
    }
  }

  // Initial install uses the version bundled with the library (always compatible).
  const installModel = () => download(null, state.model)
  // Explicit opt-in to a newer published library version.
  const updateModel = () => download(latest, state.model)
  // Switch the active model variant (re-downloads that variant if needed).
  const switchVariant = (variant) => {
    set({ model: variant })
    if (variant !== bgModel.variant) download(bgModel.version, variant)
  }

  const pct = Math.round(progress * 100)
  const updateAvailable = bgModel.downloaded && isNewer(latest, bgModel.version)
  const busy = phase === "downloading"

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
            downloaded (once) and cached locally for future use.
          </p>
          <ul className="mt-2 flex flex-col gap-1 text-xs text-[var(--color-text-tertiary)]">
            <li className="flex items-center gap-1.5">
              <i className="ti ti-lock" /> Processed 100% locally — privacy preserving
            </li>
            <li className="flex items-center gap-1.5">
              <i className="ti ti-database" /> Cached after first download — no repeat fetch
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

        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Model quality
          </div>
          <ModelChooser selected={state.model} onChoose={(m) => set({ model: m })} disabled={busy} />
          <p className="mt-2 text-[10px] leading-tight text-[var(--color-text-tertiary)]">{EXTERNAL_NOTE}</p>
        </div>

        {busy ? (
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
            <i className="ti ti-download" /> Download model ({modelSize(state.model)})
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
      <PanelSection label="model quality">
        <ModelChooser selected={state.model} onChoose={switchVariant} disabled={busy} />
        {busy ? (
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)]">
              <span>{progressLabel}</span>
              <span>{pct}%</span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-background-secondary)]">
              <div
                className="h-full rounded-full bg-[var(--color-text-primary)] transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        ) : null}
        <p className="mt-2 text-[10px] leading-tight text-[var(--color-text-tertiary)]">{EXTERNAL_NOTE}</p>
      </PanelSection>
      <PanelSection label="manual refine">
        <ChipGroup options={BRUSH_MODES} value={state.brushMode} onChange={(brushMode) => set({ brushMode })} />
        {state.brushMode !== "off" ? (
          <div className="mt-3 flex flex-col gap-3">
            <SliderField
              label="Brush size"
              value={state.brushSize}
              onChange={(brushSize) => set({ brushSize })}
              min={4}
              max={120}
              unit="px"
            />
            <Button
              variant="secondary"
              size="sm"
              className="btn-secondary w-full"
              onClick={() => bgBrush?.reset()}
              disabled={!bgBrush?.canUndo}
            >
              <i className="ti ti-restore" /> Reset to model output
            </Button>
          </div>
        ) : null}
        <p className="mt-2 text-[10px] leading-tight text-[var(--color-text-tertiary)]">
          Erase removes more of the subject; Restore paints original pixels back. Undo/redo is in the
          bottom-right bar.
        </p>
      </PanelSection>
      <PanelSection label="model">
        <div className="rounded-[var(--border-radius-md)] border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] p-3 text-xs">
          <div className="flex items-center gap-1.5 text-[var(--color-text-primary)]">
            <i className="ti ti-circle-check text-[var(--color-success)]" />
            <span>Model ready{bgModel.version ? ` · v${bgModel.version}` : ""}</span>
          </div>
          {bgModel.downloadedAt ? (
            <div className="mt-1 text-[var(--color-text-tertiary)]">
              Downloaded {new Date(bgModel.downloadedAt).toLocaleDateString()} · cached locally
            </div>
          ) : null}

          {updateAvailable ? (
            <div className="mt-2 flex flex-col gap-2 rounded-[var(--border-radius-sm)] border border-[var(--color-border-tertiary)] bg-[var(--color-background-tertiary)] p-2">
              <span className="text-[var(--color-text-secondary)]">New model available · v{latest}</span>
              <Button variant="secondary" size="sm" className="btn-secondary w-full" onClick={updateModel} disabled={busy}>
                {busy ? `${pct}%` : "Update"}
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" className="btn-secondary" onClick={async () => { setPhase("checking"); setLatest(await fetchLatestModelVersion()); setPhase("idle") }} disabled={phase !== "idle"}>
                {phase === "checking" ? "Checking…" : "Check for updates"}
              </Button>
              {latest ? <span className="text-[var(--color-text-tertiary)]">Up to date</span> : null}
            </div>
          )}

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
