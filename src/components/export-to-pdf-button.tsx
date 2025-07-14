"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import { format } from "date-fns"

interface ExportToPdfButtonProps {
  reportRef: React.RefObject<HTMLDivElement | null>
  fromDate: Date
  toDate: Date
  onExportStart: () => void
  onExportEnd: () => void
  timeFrames: string[]
  onTimeFrameChange: (timeFrame: string) => void
  onTabChange: (tab: string) => void
  logoUrl?: string // Optional logo URL
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
  logoUrl = "/images/CICSTASKMGMT_LOGO_NG.png", // Default to CICS logo if available
}: ExportToPdfButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportToPdf = async () => {
    if (!reportRef.current || isExporting) return

    setIsExporting(true)
    onExportStart()

    // Store original styles and classes
    const originalWidth = reportRef.current.style.width
    const originalOverflow = document.body.style.overflow

    // Define a type for the elements to modify
    type ElementToModify = {
      element: HTMLElement;
      originalClass?: string;
      originalDisplay?: string;
      originalParentDisplay?: string;
      isStyle?: boolean;
      restore?: () => void;
    }

    // Store elements that will be modified to restore later
    const elementsToModify: ElementToModify[] = []

    try {
      // We'll set the width dynamically based on the section we're capturing
      document.body.style.overflow = "hidden"

      const pdf = new jsPDF({
        orientation: "l",
        unit: "mm", 
        format: "a4",
        compress: true // Enable PDF compression
      })
      const dateRange = `${format(fromDate, "MMM d, yyyy")} - ${format(toDate, "MMM d, yyyy")}`
      const fileName = `Task_Report_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`

      // Page dimensions
      const pageWidth = 297 // A4 width in mm
      const pageHeight = 210 // A4 height in mm

      // Different margins for sides vs top/bottom
      const sideMargin = 10 // Original side margin
      const topBottomMargin = 5 // Reduced top/bottom margin

      const contentWidth = pageWidth - sideMargin * 2

      // Calculate x position to center content
      const xPos = sideMargin // Side margin is already accounted for in contentWidth

      // Add logo if available
      let currentY = topBottomMargin + 5 // Start a bit lower to accommodate the logo

      try {
        // Create an image element to load the logo
        const logoImg = new Image()
        logoImg.crossOrigin = "Anonymous" // Handle CORS if needed

        // Wait for the logo to load
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
          logoImg.src = logoUrl
        })

        // Calculate logo dimensions (max height 15mm, maintain aspect ratio)
        const logoMaxHeight = 15// mm
        const logoAspectRatio = logoImg.width / logoImg.height
        const logoHeight = Math.min(logoMaxHeight, 20) // mm, capped at 20mm
        const logoWidth = logoHeight * logoAspectRatio

        // Center the logo horizontally
        const logoX = (pageWidth - logoWidth) / 2

        // Add the logo to the PDF
        const logoCanvas = document.createElement("canvas")
        logoCanvas.width = logoImg.width
        logoCanvas.height = logoImg.height
        const logoCtx = logoCanvas.getContext("2d")
        
        if (!logoCtx) {
          // Handle the case where context couldn't be created
          console.error("Failed to get canvas context")
        } else {
          logoCtx.drawImage(logoImg, 0, 0, logoImg.width, logoImg.height)
          
          const logoDataUrl = logoCanvas.toDataURL("image/png")
          pdf.addImage(logoDataUrl, "PNG", logoX, currentY, logoWidth, logoHeight)
          
          // Update currentY to position text below the logo with increased bottom margin
          currentY += logoHeight + 10 // Increased from 5 to 10mm for more space
        }
      } catch (error) {
        console.error("Error loading logo:", error)
        // If logo fails to load, just continue without it
        currentY = 15 // Default position if no logo
      }

      // Add title
      pdf.setFontSize(18)
      pdf.setFont("helvetica", "bold")
      pdf.text("         Performance Report", 105, currentY, { align: "left" })
      currentY += 7
      // Add date range and additional text
      const additionalText = "                "; // Example additional text
      pdf.setFontSize(12);
      pdf.text(`${additionalText} ${dateRange} `, 105, currentY, { align: "left" });
      currentY += 10;
      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")

      // First capture the stats section with MD styling
      onTabChange("pieCharts")

      // Set MD width for user info and stats section
      reportRef.current.style.width = "1280px" // md breakpoint

      // Force medium screen layout for the stats section
      const statsSection = reportRef.current.querySelector(".bg-gray-300")

      if (statsSection) {
        // Find all grid elements in the stats section
        const gridElements = statsSection.querySelectorAll(".grid")

        // Process each grid to apply medium screen layout
        gridElements.forEach((grid) => {
          const originalClass = grid.className;

          // Check if this is a stats grid by looking for common patterns
          if (
            grid.className.includes("grid-cols-1") &&
            (grid.className.includes("md:grid-cols-1") ||
              grid.className.includes("lg:grid-cols-2") ||
              grid.className.includes("xl:grid-cols"))
          ) {
            // Force 1-column layout for stats grid (md typically has 1 column)
            grid.className = "grid grid-cols-4 gap-y-1 gap-x-2 p-4";
            elementsToModify.push({ element: grid as HTMLElement, originalClass }); // Explicit cast to HTMLElement
          }

          // Special handling for the filters grid
          if (grid.className.includes("grid-cols-4") && grid.className.includes("md:grid-cols")) {
            // Force 1-column layout for filters grid (md typically has 1 column)
            grid.className = "grid grid-cols-1 gap-y-4 gap-x-2 p-4";
            elementsToModify.push({ element: grid as HTMLElement, originalClass }); // Explicit cast to HTMLElement
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
          scale: 1.25, // Reduced from 2
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 1280, // Force md screen width
        })

        const statsImgData = statsCanvas.toDataURL("image/jpeg", 0.7) // Use JPEG with 70% quality
        const statsImgWidth = contentWidth
        const statsImgHeight = (statsCanvas.height * statsImgWidth) / statsCanvas.width

        pdf.addImage(statsImgData, "JPEG", xPos, currentY, statsImgWidth, statsImgHeight)
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
        // Add temporary bottom padding to prevent cutoff
        const originalPadding = (pieChartsSection as HTMLElement).style.paddingBottom
        ;(pieChartsSection as HTMLElement).style.paddingBottom = "20px"
        elementsToModify.push({
          element: pieChartsSection as HTMLElement,
          isStyle: true,
          restore: () => {
            (pieChartsSection as HTMLElement).style.paddingBottom = originalPadding
          }
        })
        
        const pieChartGrids = pieChartsSection.querySelectorAll(".grid")
        pieChartGrids.forEach((grid) => {
          if (grid.className.includes("grid-cols-2") || grid.className.includes("grid-cols-1")) {
            const originalClass = grid.className;
            grid.className = "grid grid-cols-3 gap-6 mb-6"; // Force 2-column layout for 2xl
            elementsToModify.push({ element: grid as HTMLElement, originalClass }); // Explicit cast to HTMLElement
        
            // Add bottom margin to each chart container
            const chartContainers = grid.querySelectorAll("div");
            chartContainers.forEach((container) => {
              if (container.querySelector("svg")) {
                const originalMargin = container.style.marginBottom;
                container.style.marginBottom = "15px";
                elementsToModify.push({
                  element: container as HTMLElement, // Explicit cast to HTMLElement
                  isStyle: true,
                  restore: () => {
                    container.style.marginBottom = originalMargin;
                  },
                });
              }
            });
          }
        });
      }

      // Wait 3 seconds for the layout to fully render with 2xl styling
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Export pie charts with 2XL styling
      if (pieChartsSection) {
        const pieCanvas = await html2canvas(pieChartsSection as HTMLElement, {
          scale: 1.25, // Reduced from 2
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 1536, // Force 2xl screen width
          // Add a small height buffer to ensure everything is captured
          height: (pieChartsSection as HTMLElement).offsetHeight + 10,
        })

        // Check if we need a new page
        if (currentY + (pieCanvas.height * contentWidth) / pieCanvas.width > pageHeight - topBottomMargin) {
          pdf.addPage()
          currentY = topBottomMargin
        }

        const pieImgData = pieCanvas.toDataURL("image/jpeg", 0.8) // Increased quality to 80%
        const pieImgWidth = contentWidth * 0.98 // Slightly reduce width to maintain aspect ratio
        const pieImgHeight = (pieCanvas.height * pieImgWidth) / pieCanvas.width

        pdf.addImage(pieImgData, "JPEG", xPos + (contentWidth - pieImgWidth) / 2, currentY, pieImgWidth, pieImgHeight)
        currentY += pieImgHeight + 10
      }

      // Export line charts and bar charts for all timeframes with 2XL styling
      const chartTypes = [
        { tab: "lineCharts", title: "Average Time Completion" },
        { tab: "barCharts", title: "Task Completion Status" },
      ]

      // Initialize variables for 4-per-page layout
      let chartsOnCurrentPage = 0
      currentY = topBottomMargin // Use topBottomMargin instead of generic margin
      pdf.addPage() // Start with a fresh page for the charts

      // Count total charts to process
      const totalCharts = chartTypes.length * timeFrames.length
      let processedCharts = 0

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
            processedCharts++
            const isLastChart = processedCharts === totalCharts

            const canvas = await html2canvas(chartElement as HTMLElement, {
              scale: 1.25, // Reduced from 2
              logging: false,
              useCORS: true,
              allowTaint: true,
              width: 1536, // Force 2xl screen width
            })

            // Calculate image dimensions - reduced height to fit 4 per page
            const imgWidth = contentWidth
            const imgHeight = Math.min((canvas.height * imgWidth) / canvas.width, 85) // Reduced height to fit 4 per page

            // Check if we need a new page
            if (chartsOnCurrentPage === 4 || currentY + imgHeight > pageHeight - topBottomMargin) {
              pdf.addPage()
              currentY = topBottomMargin
              chartsOnCurrentPage = 0
            }

            // Remove the title section that was here previously
            // Charts already have titles embedded from the website

            // Add the chart image
            const imgData = canvas.toDataURL("image/jpeg", 0.7) // Use JPEG with 70% quality
            pdf.addImage(imgData, "JPEG", xPos, currentY, imgWidth, imgHeight)

            // Update position for next chart
            currentY += imgHeight + 8 // Reduced spacing

            // Increment the charts counter
            chartsOnCurrentPage++

            // Only add a new page if this isn't the last chart and we've reached 4 charts
            if (!isLastChart && chartsOnCurrentPage === 4) {
              pdf.addPage()
              currentY = topBottomMargin
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
      {isExporting ? "Exporting..." : "Save Report"}
    </Button>
  )
}

