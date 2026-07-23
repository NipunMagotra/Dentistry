"use client"

import { useState } from "react"
import { saveDentalChart } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, AlertCircle, CheckCircle2, Save, Sparkles, User, RefreshCw, XCircle } from "lucide-react"

export type ToothCondition = 'healthy' | 'cavity' | 'filling' | 'crown' | 'rct' | 'extracted'

export interface ToothState {
  condition: ToothCondition
  note?: string
  updatedAt?: string
}

export interface ChartData {
  [toothNumber: string]: ToothState
}

interface VisualOdontogramProps {
  patientId: string
  patientName: string
  initialChartData?: ChartData
  onSaveSuccess?: () => void
}

// FDI Standard Tooth Numbers
const ADULT_UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11]
const ADULT_UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28]
const ADULT_LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38]
const ADULT_LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41]

const PEDIATRIC_UPPER_RIGHT = [55, 54, 53, 52, 51]
const PEDIATRIC_UPPER_LEFT = [61, 62, 63, 64, 65]
const PEDIATRIC_LOWER_LEFT = [71, 72, 73, 74, 75]
const PEDIATRIC_LOWER_RIGHT = [85, 84, 83, 82, 81]

const CONDITION_COLORS: Record<ToothCondition, { bg: string; text: string; border: string; label: string }> = {
  healthy: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700", label: "Healthy / Normal" },
  cavity: { bg: "bg-red-500/15 dark:bg-red-950/40", text: "text-red-600 dark:text-red-400", border: "border-red-500", label: "Cavity / Decay" },
  filling: { bg: "bg-sky-500/15 dark:bg-sky-950/40", text: "text-sky-600 dark:text-sky-400", border: "border-sky-500", label: "Filling / Composite" },
  crown: { bg: "bg-amber-500/15 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500", label: "Crown / Cap" },
  rct: { bg: "bg-purple-500/15 dark:bg-purple-950/40", text: "text-purple-600 dark:text-purple-400", border: "border-purple-500", label: "Root Canal (RCT)" },
  extracted: { bg: "bg-slate-300/40 dark:bg-slate-700/40", text: "text-slate-400 dark:text-slate-500", border: "border-dashed border-slate-400 dark:border-slate-600", label: "Extracted / Missing" },
}

export function VisualOdontogram({ patientId, patientName, initialChartData = {}, onSaveSuccess }: VisualOdontogramProps) {
  const [chartMode, setChartMode] = useState<'adult' | 'pediatric'>('adult')
  const [chartData, setChartData] = useState<ChartData>(initialChartData)
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)
  const [editingCondition, setEditingCondition] = useState<ToothCondition>('healthy')
  const [editingNote, setEditingNote] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleToothClick = (toothNum: number) => {
    setSelectedTooth(toothNum)
    const currentState = chartData[toothNum]
    setEditingCondition(currentState?.condition || 'healthy')
    setEditingNote(currentState?.note || '')
  }

  const handleApplyToothChanges = () => {
    if (selectedTooth === null) return
    
    setChartData(prev => ({
      ...prev,
      [selectedTooth]: {
        condition: editingCondition,
        note: editingNote,
        updatedAt: new Date().toISOString()
      }
    }))
    setSelectedTooth(null)
  }

  const handleSaveChart = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      const res = await saveDentalChart(patientId, chartData)
      if (res.success) {
        setSaveMessage("Dental chart saved successfully!")
        if (onSaveSuccess) onSaveSuccess()
      } else {
        setSaveMessage("Failed to save dental chart: " + (res.error || "Unknown error"))
      }
    } catch (err) {
      setSaveMessage("Error saving chart.")
    } finally {
      setIsSaving(false)
    }
  }

  // Calculate summary counts
  const stats = Object.values(chartData).reduce((acc, curr) => {
    acc[curr.condition] = (acc[curr.condition] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const renderTooth = (num: number) => {
    const state = chartData[num] || { condition: 'healthy' }
    const styles = CONDITION_COLORS[state.condition]

    return (
      <button
        key={num}
        type="button"
        onClick={() => handleToothClick(num)}
        className={`relative group flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all hover:scale-105 hover:shadow-md ${styles.border} ${styles.bg}`}
      >
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">#{num}</span>
        
        {/* Anatomical Tooth SVG Representation */}
        <div className="relative w-8 h-10 flex items-center justify-center">
          <svg viewBox="0 0 32 40" className="w-full h-full drop-shadow-sm">
            <path
              d="M6 10 C6 4, 26 4, 26 10 C28 18, 24 36, 16 36 C8 36, 4 18, 6 10 Z"
              fill={state.condition === 'healthy' ? '#e2e8f0' : state.condition === 'cavity' ? '#ef4444' : state.condition === 'filling' ? '#3b82f6' : state.condition === 'crown' ? '#f59e0b' : state.condition === 'rct' ? '#a855f7' : '#94a3b8'}
              stroke="currentColor"
              strokeWidth="1.5"
              className={styles.text}
            />
            {state.condition === 'rct' && (
              <line x1="16" y1="12" x2="16" y2="32" stroke="#ffffff" strokeWidth="2" strokeDasharray="2,2" />
            )}
            {state.condition === 'extracted' && (
              <g stroke="#ef4444" strokeWidth="3">
                <line x1="4" y1="6" x2="28" y2="34" />
                <line x1="28" y1="6" x2="4" y2="34" />
              </g>
            )}
          </svg>
        </div>

        <span className={`mt-1 text-[9px] font-semibold truncate max-w-[50px] ${styles.text}`}>
          {state.condition === 'healthy' ? 'Normal' : state.condition.toUpperCase()}
        </span>

        {state.note && (
          <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-sky-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </button>
    )
  }

  const upperRight = chartMode === 'adult' ? ADULT_UPPER_RIGHT : PEDIATRIC_UPPER_RIGHT
  const upperLeft = chartMode === 'adult' ? ADULT_UPPER_LEFT : PEDIATRIC_UPPER_LEFT
  const lowerRight = chartMode === 'adult' ? ADULT_LOWER_RIGHT : PEDIATRIC_LOWER_RIGHT
  const lowerLeft = chartMode === 'adult' ? ADULT_LOWER_LEFT : PEDIATRIC_LOWER_LEFT

  return (
    <Card className="w-full shadow-lg border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Visual Odontogram — Dental Charting
          </CardTitle>
          <CardDescription>
            Click any tooth to update cavity, filling, crown, RCT, or extraction status for <span className="font-semibold text-slate-800 dark:text-slate-200">{patientName}</span>.
          </CardDescription>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setChartMode('adult')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${chartMode === 'adult' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Adult (32 Teeth)
            </button>
            <button
              type="button"
              onClick={() => setChartMode('pediatric')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${chartMode === 'pediatric' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Pediatric (20 Teeth)
            </button>
          </div>

          <Button
            onClick={handleSaveChart}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Dental Chart
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {saveMessage && (
          <div className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${saveMessage.includes('success') ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
            {saveMessage.includes('success') ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {saveMessage}
          </div>
        )}

        {/* Legend Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Condition Legend:</span>
          <div className="flex flex-wrap items-center gap-3">
            {Object.entries(CONDITION_COLORS).map(([key, val]) => (
              <div key={key} className="flex items-center gap-1.5 text-xs font-medium">
                <span className={`w-3 h-3 rounded-full border ${val.border} ${val.bg}`} />
                <span className="text-slate-700 dark:text-slate-300">{val.label}</span>
                {stats[key] ? (
                  <span className="ml-0.5 px-1.5 py-0.2 text-[10px] font-bold bg-slate-200 dark:bg-slate-700 rounded-full">
                    {stats[key]}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>

        {/* Mouth Anatomical Chart Display */}
        <div className="p-6 bg-slate-100/60 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 space-y-8">
          
          {/* UPPER ARCH (MAXILLARY) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              <span>Upper Right (Q1/Q5)</span>
              <span className="text-emerald-500 font-extrabold">MAXILLARY ARCH (UPPER)</span>
              <span>Upper Left (Q2/Q6)</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-end gap-1.5 overflow-x-auto pb-1">
                {upperRight.map(num => renderTooth(num))}
              </div>
              <div className="flex items-center justify-start gap-1.5 overflow-x-auto pb-1">
                {upperLeft.map(num => renderTooth(num))}
              </div>
            </div>
          </div>

          <div className="w-full border-t border-dashed border-slate-300 dark:border-slate-800 relative">
            <span className="absolute left-1/2 -top-2.5 -translate-x-1/2 px-3 text-[10px] font-extrabold uppercase bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full">
              Occlusal Plane
            </span>
          </div>

          {/* LOWER ARCH (MANDIBULAR) */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-end gap-1.5 overflow-x-auto pt-1">
                {lowerRight.map(num => renderTooth(num))}
              </div>
              <div className="flex items-center justify-start gap-1.5 overflow-x-auto pt-1">
                {lowerLeft.map(num => renderTooth(num))}
              </div>
            </div>
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
              <span>Lower Right (Q4/Q8)</span>
              <span className="text-emerald-500 font-extrabold">MANDIBULAR ARCH (LOWER)</span>
              <span>Lower Left (Q3/Q7)</span>
            </div>
          </div>

        </div>
      </CardContent>

      {/* TOOTH CONDITION MODAL */}
      <Dialog open={selectedTooth !== null} onOpenChange={open => !open && setSelectedTooth(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Update Tooth #{selectedTooth} Details
            </DialogTitle>
            <DialogDescription>
              Select clinical condition and add clinical diagnosis notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinical Condition</Label>
              <Select value={editingCondition} onValueChange={(val) => { if (val) setEditingCondition(val as ToothCondition) }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="healthy">⚪ Healthy / Normal</SelectItem>
                  <SelectItem value="cavity">🔴 Cavity / Dental Caries</SelectItem>
                  <SelectItem value="filling">🔵 Composite Filling</SelectItem>
                  <SelectItem value="crown">🟡 Dental Crown / Cap</SelectItem>
                  <SelectItem value="rct">🟣 Root Canal Treatment (RCT)</SelectItem>
                  <SelectItem value="extracted">❌ Extracted / Missing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600 dark:text-slate-300">Clinical Notes / Surface Details</Label>
              <Input
                placeholder="e.g. Mesial cavity, Porcelain fused to metal crown..."
                value={editingNote}
                onChange={e => setEditingNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedTooth(null)}>
              Cancel
            </Button>
            <Button onClick={handleApplyToothChanges} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
