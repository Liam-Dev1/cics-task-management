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

    // Store original styles and classes
    const originalWidth = reportRef.current.style.width
    const originalOverflow = document.body.style.overflow

    // Store elements that will be modified to restore later
    const elementsToModify = []

    try {
      // We'll set the width dynamically based on the section we're capturing
      document.body.style.overflow = "hidden"

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

      // First capture the stats section with MD styling
      onTabChange("pieCharts")

      // Set MD width for user info and stats section
      reportRef.current.style.width = "768px" // md breakpoint

      // Force medium screen layout for the stats section
      const statsSection = reportRef.current.querySelector(".bg-gray-300")

      if (statsSection) {
        // Find all grid elements in the stats section
        const gridElements = statsSection.querySelectorAll(".grid")

        // Process each grid to apply medium screen layout
        gridElements.forEach((grid) => {
          const originalClass = grid.className

          // Check if this is a stats grid by looking for common patterns
          if (
            grid.className.includes("grid-cols-1") &&
            (grid.className.includes("md:grid-cols-1") ||
              grid.className.includes("lg:grid-cols-2") ||
              grid.className.includes("xl:grid-cols"))
          ) {
            // Force 1-column layout for stats grid (md typically has 1 column)
            grid.className = "grid grid-cols-1 gap-y-1 p-4"
            elementsToModify.push({ element: grid, originalClass })
          }

          // Special handling for the filters grid
          if (grid.className.includes("grid-cols-1") && grid.className.includes("md:grid-cols")) {
            // Force 1-column layout for filters grid (md typically has 1 column)
            grid.className = "grid grid-cols-1 gap-y-4 p-4"
            elementsToModify.push({ element: grid, originalClass })
          }
        })

        // Find and modify button containers
        const buttonContainers = statsSection.querySelectorAll("div")
        buttonContainers.forEach((container) => {
          // Look for the large screen buttons container (hidden by default on md)
          if (
            container.className.includes("hidden") &&
            (container.className.includes("lg:grid") || container.className.includes("xl:grid"))
          ) {
            const originalClass = container.className
            container.className = "hidden" // Keep hidden on md
            elementsToModify.push({ element: container, originalClass })
          }

          // Look for the small screen buttons container (visible on md)
          if (
            container.className.includes("flex") &&
            (container.className.includes("lg:hidden") || container.className.includes("xl:hidden"))
          ) {
            const originalClass = container.className
            container.className = "flex flex-col gap-2" // Force visible
            elementsToModify.push({ element: container, originalClass })
          }

          // Handle the 2xl stats grid - keep it hidden in md view
          if (container.className.includes("hidden") && container.className.includes("2xl:grid")) {
            const originalClass = container.className
            container.className = "hidden" // Keep hidden in md view
            elementsToModify.push({ element: container, originalClass })
          }

          // Make sure the regular stats grid is visible (the one that's hidden in 2xl)
          if (container.className.includes("2xl:hidden")) {
            const originalClass = container.className
            // Force 1-column layout for stats in md view
            container.className = "grid grid-cols-1 gap-y-1 p-4"
            elementsToModify.push({ element: container, originalClass })
          }
        })

        // Hide all buttons in the stats section
        const allButtons = statsSection.querySelectorAll("button")
        allButtons.forEach((button) => {
          // Check if this is a "Hide Graphs", "View Graphs", or "Export PDF" button
          const buttonText = button.textContent || ""
          if (
            buttonText.includes("Hide Graphs") ||
            buttonText.includes("View Graphs") ||
            buttonText.includes("Export PDF")
          ) {
            const originalDisplay = button.style.display
            button.style.display = "none"
            elementsToModify.push({
              element: button,
              originalDisplay,
              isStyle: true,
              restore: () => {
                button.style.display = originalDisplay
              },
            })

            // Also hide the parent container if it's a flex or grid container
            const parent = button.parentElement
            if (parent && (parent.className.includes("flex") || parent.className.includes("grid"))) {
              const originalParentDisplay = parent.style.display
              parent.style.display = "none"
              elementsToModify.push({
                element: parent,
                originalParentDisplay,
                isStyle: true,
                restore: () => {
                  parent.style.display = originalParentDisplay
                },
              })
            }
          }
        })
      }

      // Wait 3 seconds for the layout to fully render
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Export stats section with MD styling
      const statsElement = reportRef.current.querySelector(".bg-gray-300")
      if (statsElement) {
        const statsCanvas = await html2canvas(statsElement as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 768, // Force md screen width
        })

        const statsImgData = statsCanvas.toDataURL("image/png")
        const statsImgWidth = contentWidth
        const statsImgHeight = (statsCanvas.height * statsImgWidth) / statsCanvas.width

        pdf.addImage(statsImgData, "PNG", margin, currentY, statsImgWidth, statsImgHeight)
        currentY += statsImgHeight + 10
      }

      // Now switch to 2XL styling for the charts
      // Restore original classes first
      elementsToModify.forEach(({ element, originalClass, restore, isStyle }) => {
        if (element) {
          if (isStyle && restore) {
            restore()
          } else if (!isStyle && originalClass) {
            element.className = originalClass
          }
        }
      })

      // Clear the elements to modify array for the next section
      elementsToModify.length = 0

      // Set 2XL width for charts
      reportRef.current.style.width = "1536px" // 2xl breakpoint

      // Force extra large screen layout for the charts
      const pieChartsSection = reportRef.current.querySelector('[data-tab="pieCharts"]')
      if (pieChartsSection) {
        const pieChartGrids = pieChartsSection.querySelectorAll(".grid")
        pieChartGrids.forEach((grid) => {
          if (grid.className.includes("grid-cols-2") || grid.className.includes("grid-cols-1")) {
            const originalClass = grid.className
            grid.className = "grid grid-cols-2 gap-6 mb-6" // Force 2-column layout for 2xl
            elementsToModify.push({ element: grid, originalClass })
          }
        })
      }

      // Wait 3 seconds for the layout to fully render with 2xl styling
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Export pie charts with 2XL styling
      if (pieChartsSection) {
        const pieCanvas = await html2canvas(pieChartsSection as HTMLElement, {
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 1536, // Force 2xl screen width
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

      // Export line charts and bar charts for all timeframes with 2XL styling
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
              width: 1536, // Force 2xl screen width
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
      // Restore original styles and classes
      if (reportRef.current) {
        reportRef.current.style.width = originalWidth
        document.body.style.overflow = originalOverflow

        // Restore all modified elements to their original state
        elementsToModify.forEach(({ element, originalClass, restore, isStyle }) => {
          if (element) {
            if (isStyle && restore) {
              restore()
            } else if (!isStyle && originalClass) {
              element.className = originalClass
            }
          }
        })
      }

      setIsExporting(false)
      onExportEnd()
    }
  }

  return (
    <Button onClick={exportToPdf} disabled={isExporting} className="bg-gray-700 hover:bg-gray-600 text-white">
      <Download className="mr-2 h-4 w-4" />
      {isExporting ? "Exporting..." : "Export PDF"}
    </Button>
  )
}

