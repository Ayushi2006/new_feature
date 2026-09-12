"use client";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarRange, LoaderCircle, MapPinned, TrendingUp, X } from "lucide-react";
import { runChangeDetection } from "../lib/satquery";
import { colors } from "./MapViewer";

// Renders a stacked land-cover mix bar (water / urban / vegetation) using
// the same color tokens as the map overlays, so "before" and "after"
// visually read as the same legend.
function MixBar({ mix }) {
    const order = ["water", "urban", "vegetation"];
    return (
        <div className="cd-swatch" role="img" aria-label="Land cover mix">
            {order.map((key) => (
                <span
                    key={key}
                    className="cd-swatch-seg"
                    style={{ width: `${mix[key]}%`, background: colors[key] }}
                    title={`${key}: ${mix[key]}%`}
                />
            ))}
        </div>
    );
}

export default function ChangeDetection({ scene, busy: parentBusy, onShowOnMap }) {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);

    // Selecting a different area invalidates the previous comparison.
    useEffect(() => {
        setResult(null);
        setError("");
    }, [scene.id]);

    async function detect() {
        setError("");
        setBusy(true);
        try {
            // Small artificial delay so the interaction feels like a real
            // analysis is running. Replace this whole try block with a
            // fetch() to a real change-detection API when one exists —
            // `runChangeDetection` already returns the exact shape the
            // rest of this component (and the map overlay) expects.
            await new Promise((r) => setTimeout(r, 550));
            setResult(runChangeDetection(scene, fromDate, toDate));
        } catch (e) {
            setError(e instanceof Error ? e.message : "Change detection failed.");
            setResult(null);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="cd-panel">
            <div className="assistant-intro">
                <h2>Change detection</h2>
                <p>
                    Pick a date range for <strong>{scene.name}</strong> and run a
                    before/after comparison.
                </p>
            </div>

            <div className="cd-dates">
                <label>
                    <span>From date</span>
                    <input
                        type="date"
                        aria-label="From date"
                        value={fromDate}
                        max={toDate || undefined}
                        onChange={(e) => setFromDate(e.target.value)}
                    />
                </label>
                <label>
                    <span>To date</span>
                    <input
                        type="date"
                        aria-label="To date"
                        value={toDate}
                        min={fromDate || undefined}
                        onChange={(e) => setToDate(e.target.value)}
                    />
                </label>
            </div>

            <button
                className="cd-run primary"
                disabled={busy || parentBusy || !fromDate || !toDate}
                onClick={detect}
            >
                {busy ? (
                    <LoaderCircle size={14} className="spin" />
                ) : (
                    <TrendingUp size={14} />
                )}
                {busy ? "Detecting changes…" : "Detect changes"}
            </button>

            {error && (
                <div className="error-message" role="alert">
                    {error}
                    <button aria-label="Dismiss error" onClick={() => setError("")}>
                        <X size={13} />
                    </button>
                </div>
            )}

            {result && (
                <>
                    <div className="cd-summary">
                        <div>
                            <strong>{result.changePercent}%</strong>
                            <span>Change detected</span>
                        </div>
                        <div>
                            <strong>{result.areaKm2} km²</strong>
                            <span>Affected area</span>
                        </div>
                        <div>
                            <strong>{result.primaryChange}</strong>
                            <span>Primary change</span>
                        </div>
                    </div>

                    <div className="cd-compare">
                        <div className="cd-swatch-card">
                            <span className="eyebrow">BEFORE · {result.fromDate}</span>
                            <MixBar mix={result.beforeMix} />
                        </div>
                        <ArrowRight size={16} className="cd-compare-arrow" />
                        <div className="cd-swatch-card">
                            <span className="eyebrow">AFTER · {result.toDate}</span>
                            <MixBar mix={result.afterMix} />
                        </div>
                    </div>
                    <div className="cd-legend">
                        <span><i className="water" />Water</span>
                        <span><i className="urban" />Built-up</span>
                        <span><i className="vegetation" />Vegetation</span>
                    </div>

                    <div className="cd-chart">
                        <span className="eyebrow">CHANGE BY CATEGORY</span>
                        {result.breakdown.map((b) => (
                            <div className="cd-chart-row" key={b.key}>
                                <span>{b.label}</span>
                                <div className="cd-bar-track">
                                    <div
                                        className="cd-bar"
                                        style={{
                                            width: `${Math.min(100, Math.abs(b.delta) * 4)}%`,
                                            background: b.color,
                                        }}
                                    />
                                </div>
                                <strong>
                                    {b.delta > 0 ? "+" : ""}
                                    {b.delta}%
                                </strong>
                            </div>
                        ))}
                    </div>

                    <button
                        className="view-evidence"
                        onClick={() => onShowOnMap(result.changeFeatures)}
                    >
                        <MapPinned size={14} /> Show change overlay on map{" "}
                        <ArrowRight size={14} />
                    </button>

                    <p className="cd-disclaimer">
                        <CalendarRange size={11} /> Demo data — this comparison is
                        generated in the browser to show the workflow. It is not
                        retrieved from a live satellite feed.
                    </p>
                </>
            )}
        </div>
    );
}
