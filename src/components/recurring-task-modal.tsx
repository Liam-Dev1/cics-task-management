"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Plus, Trash } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface RecurringTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (recurringSettings: RecurringSettings) => void
  initialSettings?: RecurringSettings
}

export interface RecurringSettings {
  isRecurring: boolean
  recurrencePattern: "daily" | "weekly" | "biweekly" | "monthly" | "custom"
  recurrenceInterval: number
  recurrenceEndType: "never" | "after" | "on"
  recurrenceCount: number
  recurrenceEndDate: string
  nextDeadlines: string[]
}

export default function RecurringTaskModal({ isOpen, onClose, onSave, initialSettings }: RecurringTaskModalProps) {
  const [settings, setSettings] = useState<RecurringSettings>(
    initialSettings || {
      isRecurring: true,
      recurrencePattern: "weekly",
      recurrenceInterval: 1,
      recurrenceEndType: "never",
      recurrenceCount: 10,
      recurrenceEndDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      nextDeadlines: [],
    },
  )

  const [customDeadline, setCustomDeadline] = useState("")

  const handlePatternChange = (pattern: "daily" | "weekly" | "biweekly" | "monthly" | "custom") => {
    setSettings({ ...settings, recurrencePattern: pattern })
  }

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setSettings({ ...settings, recurrenceInterval: value })
    }
  }

  const handleEndTypeChange = (value: "never" | "after" | "on") => {
    setSettings({ ...settings, recurrenceEndType: value })
  }

  const handleCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number.parseInt(e.target.value)
    if (!isNaN(value) && value > 0) {
      setSettings({ ...settings, recurrenceCount: value })
    }
  }

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings({ ...settings, recurrenceEndDate: e.target.value })
  }

  const addCustomDeadline = () => {
    if (customDeadline && !settings.nextDeadlines.includes(customDeadline)) {
      setSettings({
        ...settings,
        nextDeadlines: [...settings.nextDeadlines, customDeadline].sort(
          (a, b) => new Date(a).getTime() - new Date(b).getTime(),
        ),
      })
      setCustomDeadline("")
    }
  }

  const removeDeadline = (deadline: string) => {
    setSettings({
      ...settings,
      nextDeadlines: settings.nextDeadlines.filter((d) => d !== deadline),
    })
  }

  const handleSave = () => {
    onSave(settings)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure Recurring Task</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Recurrence Pattern</Label>
            <Select
              value={settings.recurrencePattern}
              onValueChange={(value: "daily" | "weekly" | "biweekly" | "monthly" | "custom") =>
                handlePatternChange(value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Bi-weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.recurrencePattern !== "custom" && (
            <div className="space-y-2">
              <Label>Repeat every</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="1"
                  value={settings.recurrenceInterval}
                  onChange={handleIntervalChange}
                  className="w-20"
                />
                <span>
                  {settings.recurrencePattern === "daily"
                    ? "day(s)"
                    : settings.recurrencePattern === "weekly"
                      ? "week(s)"
                      : settings.recurrencePattern === "biweekly"
                        ? "2 weeks"
                        : "month(s)"}
                </span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>End</Label>
            <RadioGroup
              value={settings.recurrenceEndType}
              onValueChange={(value: "never" | "after" | "on") => handleEndTypeChange(value)}
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="never" />
                <Label htmlFor="never">Never</Label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="after" id="after" />
                <Label htmlFor="after">After</Label>
                <Input
                  type="number"
                  min="1"
                  value={settings.recurrenceCount}
                  onChange={handleCountChange}
                  className="w-20 ml-2"
                  disabled={settings.recurrenceEndType !== "after"}
                />
                <span>occurrences</span>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on" id="on" />
                <Label htmlFor="on">On</Label>
                <Input
                  type="date"
                  value={settings.recurrenceEndDate}
                  onChange={handleEndDateChange}
                  className="ml-2"
                  disabled={settings.recurrenceEndType !== "on"}
                />
              </div>
            </RadioGroup>
          </div>

          {settings.recurrencePattern === "custom" && (
            <div className="space-y-2 border-t pt-4 mt-4">
              <Label>Custom Deadlines</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomDeadline}
                  disabled={!customDeadline}
                >
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="space-y-2 mt-2">
                {settings.nextDeadlines.length > 0 ? (
                  <div className="space-y-2">
                    {settings.nextDeadlines.map((deadline) => (
                      <div key={deadline} className="flex items-center justify-between bg-gray-100 p-2 rounded">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          {new Date(deadline).toLocaleDateString()}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDeadline(deadline)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-2">No custom deadlines added</div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

