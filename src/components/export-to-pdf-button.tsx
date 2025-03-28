"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { format } from "date-fns"

interface ExportToPdfButtonProps {
  reportRef: React.RefObject<HTMLDivElement>
  fromDate: Date
  toDate: Date
  onExportStart: () => void
  onExportEnd: () => void
  timeFrames: string[]
  onTimeFrameChange: (timeFrame: string) => void
  onTabChange: (tab: string) => void
}

export function ExportToPdfButton({
  reportRef,
  fromDate,
  toDate,
  onExportStart,
  onExportEnd,
  timeFrames,
  onTimeFrameChange,
  onTabChange,
}: ExportToPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPdf = async () => {
    if (!reportRef.current || isExporting) return

    setIsExporting(true)
    onExportStart()

    try {
      const pdf = new jsPDF("p", "mm", "a4")
      const dateRange = `${format(fromDate, "MMM d, yyyy")} - ${format(toDate, "MMM d, yyyy")}`
      const fileName = `Task_Report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`

      // Page dimensions
      const pageWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const margin = 10
      const contentWidth = pageWidth - margin * 2

      // Add title
      pdf.setFontSize(18)
      pdf.text("Task Management Report", 105, 15, { align: "center" })
      pdf.setFontSize(12)
      pdf.text(dateRange, 105, 22, { align: "center" })
      pdf.setFontSize(10)

      let currentY = 30

      // First capture the stats section
      onTabChange("pieCharts")
      // Wait 3 seconds for the charts to fully render
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Export stats section
      const statsElement = reportRef.current.querySelector(".bg-gray-300")
      if (statsElement) {
        const statsCanvas = await html2canvas(statsElement as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        const statsImgData = statsCanvas.toDataURL("image/png")
        const statsImgWidth = contentWidth
        const statsImgHeight = (statsCanvas.height * statsImgWidth) / statsCanvas.width

        pdf.addImage(statsImgData, "PNG", margin, currentY, statsImgWidth, statsImgHeight)
        currentY += statsImgHeight + 10
      }

      // Export pie charts
      const pieChartsElement = reportRef.current.querySelector('[data-tab="pieCharts"]')
      if (pieChartsElement) {
        const pieCanvas = await html2canvas(pieChartsElement as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
        })

        // Check if we need a new page
        if (currentY + (pieCanvas.height * contentWidth) / pieCanvas.width > pageHeight - margin) {
          pdf.addPage()
          currentY = margin
        }

        const pieImgData = pieCanvas.toDataURL("image/png")
        const pieImgWidth = contentWidth
        const pieImgHeight = (pieCanvas.height * pieImgWidth) / pieCanvas.width

        pdf.addImage(pieImgData, "PNG", margin, currentY, pieImgWidth, pieImgHeight)
        currentY += pieImgHeight + 10
      }

      // Export line charts and bar charts for all timeframes
      // We'll arrange them 2 per page
      const chartTypes = [
        { tab: "lineCharts", title: "Average Time Completion" },
        { tab: "barCharts", title: "Task Completion Status" },
      ]

      // Initialize variables for 2-per-page layout
      let chartsOnCurrentPage = 0
      currentY = margin
      pdf.addPage() // Start with a fresh page for the charts

      // Process each chart type
      for (const chartType of chartTypes) {
        onTabChange(chartType.tab)
        // Wait 3 seconds for the charts to fully render
        await new Promise((resolve) => setTimeout(resolve, 3000))

        // Process each timeframe
        for (const timeFrame of timeFrames) {
          onTimeFrameChange(timeFrame)
          // Wait 3 seconds for the charts to fully render after timeframe change
          await new Promise((resolve) => setTimeout(resolve, 3000))

          const chartElement = reportRef.current.querySelector(`[data-tab="${chartType.tab}"]`)
          if (chartElement) {
            const canvas = await html2canvas(chartElement as HTMLElement, {
              scale: 2,
              logging: false,
              useCORS: true,
              allowTaint: true,
            })

            // Calculate image dimensions
            const imgWidth = contentWidth
            const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 120) // Limit height to fit 2 per page

            // Check if we need a new page
            if (chartsOnCurrentPage === 2 || currentY + imgHeight + 15 > pageHeight - margin) {
              pdf.addPage()
              currentY = margin
              chartsOnCurrentPage = 0
            }

            // Add timeframe title
            pdf.setFontSize(14)
            pdf.text(`${chartType.title} (${timeFrame})`, 105, currentY + 7, { align: "center" })
            currentY += 15
            pdf.setFontSize(10)

            // Add the chart image
            const imgData = canvas.toDataURL("image/png")
            pdf.addImage(imgData, "PNG", margin, currentY, imgWidth, imgHeight)

            // Update position for next chart
            currentY += imgHeight + 15
            chartsOnCurrentPage++

            // If we've added 2 charts, prepare for a new page
            if (chartsOnCurrentPage === 2) {
              pdf.addPage()
              currentY = margin
              chartsOnCurrentPage = 0
            }
          }
        }
      }

      // Save the PDF
      pdf.save(fileName)
    } catch (error) {
      console.error("Error exporting PDF:", error)
    } finally {
      setIsExporting(false)
      onExportEnd()
    }
  }

  return (
    <Button onClick={exportToPdf} disabled={isExporting} className="bg-gray-700 hover:bg-gray-600 text-white">
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export to PDF"}
    </Button>
  )
}

