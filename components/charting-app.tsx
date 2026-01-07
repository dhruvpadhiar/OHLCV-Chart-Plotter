"use client"

import { useState, useRef, useEffect } from "react"
import CSVUploader from "./csv-uploader"
import ChartHeader from "./chart-header"
import ChartDisplay from "./chart-display"
import ToolsSidebar from "./tools-sidebar"
import { parseCSVData, type OHLCData } from "@/lib/csv-parser"

export default function ChartingApp() {
  const [data, setData] = useState<OHLCData[]>([])
  const [fileName, setFileName] = useState("STOCK")
  const [isLoading, setIsLoading] = useState(false)
  const [timeframe, setTimeframe] = useState<string>("ALL")
  const [chartType, setChartType] = useState<"candlestick" | "line" | "area">("candlestick")
  const [indicators, setIndicators] = useState<{
    sma?: number[]
    ema?: number[]
    sma20?: boolean
    sma50?: boolean
    ema20?: boolean
    ema50?: boolean
    rsi14?: boolean
    macd?: boolean
    macdHist?: boolean
  }>({})
  const [drawingMode, setDrawingMode] = useState<string | null>(null)
  const chartRef = useRef<any>(null)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case "l":
          setDrawingMode(drawingMode === "line" ? null : "line")
          break
        case "h":
          setDrawingMode(drawingMode === "horizontal" ? null : "horizontal")
          break
        case "r":
          setDrawingMode(drawingMode === "rectangle" ? null : "rectangle")
          break
        case "f":
          setDrawingMode(drawingMode === "fibonacci" ? null : "fibonacci")
          break
        case "t":
          setDrawingMode(drawingMode === "text" ? null : "text")
          break
        case "escape":
          setDrawingMode(null)
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [drawingMode])

  const handleFileUpload = (file: File) => {
    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const csv = e.target?.result as string
        const parsed = parseCSVData(csv)
        setData(parsed)
        const name = file.name.replace(".csv", "").toUpperCase()
        setFileName(name)
        
        // Auto-detect appropriate timeframe based on data range
        if (parsed.length > 0) {
          const firstDate = parsed[0].date
          const lastDate = parsed[parsed.length - 1].date
          const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
          
          if (daysDiff <= 1) {
            setTimeframe("1D")
          } else if (daysDiff <= 5) {
            setTimeframe("5D")
          } else if (daysDiff <= 30) {
            setTimeframe("1M")
          } else if (daysDiff <= 90) {
            setTimeframe("3M")
          } else if (daysDiff <= 180) {
            setTimeframe("6M")
          } else if (daysDiff < 365) {
            setTimeframe("YTD")
          } else if (daysDiff <= 365) {
            setTimeframe("1Y")
          } else if (daysDiff <= 1825) {
            setTimeframe("5Y")
          } else {
            setTimeframe("ALL")
          }
        }
      } catch (error) {
        console.error("Error parsing CSV:", error)
        alert("Error parsing CSV file. Please ensure it's a valid CSV file with proper date format.")
      } finally {
        setIsLoading(false)
      }
    }
    reader.readAsText(file)
  }

  const getFilteredData = () => {
    if (!data.length) return []

    const now = new Date(data[data.length - 1].date)
    let startDate = new Date(now)

    switch (timeframe) {
      case "1D":
        startDate.setDate(startDate.getDate() - 1)
        break
      case "5D":
        startDate.setDate(startDate.getDate() - 5)
        break
      case "1M":
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case "3M":
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case "6M":
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case "YTD":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case "1Y":
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case "5Y":
        startDate.setFullYear(startDate.getFullYear() - 5)
        break
      default:
        return data
    }

    return data.filter((d) => d.date >= startDate)
  }

  const filteredData = getFilteredData()

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-white">
      {/* Left Sidebar - Only show when chart is displayed */}
      {data.length > 0 && (
        <ToolsSidebar drawingMode={drawingMode} setDrawingMode={setDrawingMode} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!data.length ? (
          <CSVUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
        ) : (
          <>
            <ChartHeader
              fileName={fileName}
              data={filteredData}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
              chartType={chartType}
              setChartType={setChartType}
              indicators={indicators}
              setIndicators={setIndicators}
            />
            <ChartDisplay
              ref={chartRef}
              data={filteredData}
              chartType={chartType}
              indicators={indicators}
              drawingMode={drawingMode}
            />
          </>
        )}
      </div>
    </div>
  )
}
