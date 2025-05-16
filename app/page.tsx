"use client"

import { useEffect, useState, memo, useCallback, useMemo } from "react"
import TemperatureLineChart from "@/components/temperature-display"
import type { TemperatureReading } from "@/types/types"
import { AlertTriangle, Check, ChevronLeft, ChevronRight, Inbox, Loader2, LogOut, RefreshCw, Timer } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

// Memoized chart component that only re-renders when data changes
const MemoizedTemperatureChart = memo(function MemoizedTemperatureChart({
  data,
}: {
  data: TemperatureReading[]
}) {
  return (
    <div className="h-[400px]">
      <TemperatureLineChart data={data} />
    </div>
  )
})

export default function Home() {
  const [temperatureData, setTemperatureData] = useState<TemperatureReading[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isApiUnreachable, setIsApiUnreachable] = useState(false)
  // Separate state for chart data to control when the chart refreshes
  const [chartData, setChartData] = useState<TemperatureReading[]>([])
  // Track whether data is being updated
  const [updatingData, setUpdatingData] = useState(false)
  // Track user authentication
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10 // Number of items per page
  // Stale data tracking
  const [isDataStale, setIsDataStale] = useState(false)
  const [staleDataDialogOpen, setStaleDataDialogOpen] = useState(false)
  const [lastDataPoint, setLastDataPoint] = useState<TemperatureReading | null>(null)
  // Update interval in milliseconds (60000ms = 1 minute)
  const UPDATE_INTERVAL = 6000

  const router = useRouter()

  const showStaleDataDemo = () => {
    // If we have temperature data, use the latest point as the "stale" one
    if (temperatureData.length > 0) {
      setLastDataPoint(temperatureData[0]);
    }
    setIsDataStale(true);
    setStaleDataDialogOpen(true);
  };

  // Check authentication status
  useEffect(() => {
    const storedUser = sessionStorage.getItem("user")

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log("User is logged in:", parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
        console.log("User is NOT logged in - invalid data")
        router.push("/login")
      }
    } else {
      console.log("User is NOT logged in - no session data")
      router.push("/login")
    }
  }, [router])

  // Calculate pagination values
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return temperatureData.slice(startIndex, startIndex + itemsPerPage)
  }, [temperatureData, currentPage, itemsPerPage])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(temperatureData.length / itemsPerPage)),
    [temperatureData, itemsPerPage],
  )

  // Check if data is stale (older than 5 minutes)
  const checkDataFreshness = useCallback(() => {
    if (!temperatureData.length) return

    const latestReading = temperatureData[0] // Assuming data is sorted newest first
    const latestTimestamp = new Date(latestReading.timestamp)
    const now = new Date()
    const diffInMs = now.getTime() - latestTimestamp.getTime()
    const diffInMinutes = diffInMs / (1000 * 60)

    if (diffInMinutes > 5) {
      setIsDataStale(true)
      setLastDataPoint(latestReading)
      setStaleDataDialogOpen(true)
    } else {
      setIsDataStale(false)
    }
  }, []) // Remove temperatureData dependency

  const fetchTemperatureData = async (isPartialUpdate = false) => {
    try {
      if (!isPartialUpdate) {
        setLoading(true)
      } else {
        setUpdatingData(true)
      }

      // Use the history endpoint to get temperature data
      const response = await fetch("/api/temperature/history")

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      // Always update both datasets now
      setTemperatureData(data)
      setChartData(data)
      setError(null)
      setIsApiUnreachable(false)

      // Remove this setTimeout call
      // setTimeout(() => checkDataFreshness(), 300)
    } catch (err) {
      console.error("Error fetching data:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)

      // Check if this might be a connection error to the Flask backend
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("NetworkError") ||
        errorMessage.includes("ECONNREFUSED")
      ) {
        setIsApiUnreachable(true)
        setError("De server (app.py) is niet bereikbaar. Controleer of de Flask-server actief is.")
      } else {
        setError("Temperatuurgegevens laden mislukt. Probeer het later opnieuw.")
      }
    } finally {
      setLoading(false)
      setUpdatingData(false)
    }
  }

  // Initial data load
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      // Initial fetch
      fetchTemperatureData(false)

      // Set up polling to refresh data every minute
      const intervalId = setInterval(() => fetchTemperatureData(true), UPDATE_INTERVAL)

      // Set up regular checks for stale data
      const staleCheckId = setInterval(() => {
        if (temperatureData.length > 0) {
          const latestReading = temperatureData[0]
          const latestTimestamp = new Date(latestReading.timestamp)
          const now = new Date()
          const diffInMs = now.getTime() - latestTimestamp.getTime()
          const diffInMinutes = diffInMs / (1000 * 60)

          if (diffInMinutes > 5) {
            setIsDataStale(true)
            setLastDataPoint(latestReading)
            setStaleDataDialogOpen(true)
          } else {
            setIsDataStale(false)
          }
        }
      }, 60000)

      // Clean up on component unmount
      return () => {
        clearInterval(intervalId)
        clearInterval(staleCheckId)
      }
    }
  }, [user]) // Remove checkDataFreshness dependency

  // Function to manually refresh data
  const refreshData = () => {
    fetchTemperatureData(true)
  }

  // Pagination handlers
  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
  }

  const goToPreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      })

      // Clear user from session storage
      sessionStorage.removeItem("user")
      console.log("User logged out")

      // Redirect to login page
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Determine status for the top bar
  const getStatus = () => {
    if (loading) return { color: "bg-slate-500/90", text: "Temperatuurgegevens laden..." }
    if (error) {
      if (isApiUnreachable) {
        return { color: "bg-rose-500/90", text: "De app.py server is niet bereikbaar" }
      }
      return { color: "bg-rose-500/90", text: "Fout bij het laden van gegevens" }
    }
    if (temperatureData.length === 0) return { color: "bg-slate-500/90", text: "Geen temperatuurgegevens beschikbaar" }
    if (isDataStale) return { color: "bg-amber-500/90", text: "⚠️ Let op: Laatste meting is ouder dan 5 minuten" }

    const hasWarning = temperatureData.some((reading) => reading.warning)
    return hasWarning
      ? { color: "bg-amber-500/90", text: "⚠️ Waarschuwing: Temperatuur boven drempelwaarde gedetecteerd" }
      : { color: "bg-emerald-500/90", text: "✅ Alle temperatuurmetingen binnen normale waarden" }
  }

  const status = getStatus()

  // Format date for display
  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("nl-NL", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  // Create page numbers for pagination
  const renderPageNumbers = () => {
    const pageNumbers = []
    const maxVisiblePages = 5

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)

    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }

    if (startPage > 1) {
      pageNumbers.push(
        <Button key="first" variant="outline" size="sm" onClick={() => goToPage(1)} className="hidden sm:flex">
          1
        </Button>,
      )
      if (startPage > 2) {
        pageNumbers.push(
          <span key="dots1" className="px-2">
            ...
          </span>,
        )
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(
        <Button
          key={i}
          variant={i === currentPage ? "default" : "outline"}
          size="sm"
          onClick={() => goToPage(i)}
          className="w-9"
        >
          {i}
        </Button>,
      )
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push(
          <span key="dots2" className="px-2">
            ...
          </span>,
        )
      }
      pageNumbers.push(
        <Button key="last" variant="outline" size="sm" onClick={() => goToPage(totalPages)} className="hidden sm:flex">
          {totalPages}
        </Button>,
      )
    }

    return pageNumbers
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Status Bar */}
      <div className={`w-full ${status.color} text-white py-3 px-4 shadow-md`}>
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
            ) : error ? (
              <AlertTriangle className="h-5 w-5 mr-3" />
            ) : temperatureData.length === 0 ? (
              <Inbox className="h-5 w-5 mr-3" />
                ) : isDataStale ? (
                  <Timer className="h-5 w-5 mr-3" />
            ) : temperatureData.some((reading) => reading.warning) ? (
              <AlertTriangle className="h-5 w-5 mr-3" />
            ) : (
              <Check className="h-5 w-5 mr-3" />
            )}
            <span className="font-medium">{status.text}</span>
          </div>

          {/* User info and logout button */}
          {user && (
            <div className="flex items-center">
              <span className="text-sm font-medium mr-3 hidden sm:inline">Ingelogd als: {user.username}</span>
              <button
                onClick={showStaleDataDemo}
                className="flex items-center bg-amber-500/90 hover:bg-amber-600/90 rounded px-3 py-1 text-sm font-medium transition-colors mr-2"
              >
                Demo Alarm
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Uitloggen
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 relative">
          <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="mb-4 md:mb-0">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400">
                    Temperatuur Monitor
                  </span>
                </h1>
                <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
                  Realtime temperatuurgegevens van de PICO sensor
                </p>
              </div>
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm py-2 px-4 rounded-lg shadow-sm">
                <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Live Data</span>
              </div>
            </div>
            <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
              <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center">
                <div className="h-1 w-10 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-300 animate-spin"></div>
              <Loader2 className="h-8 w-8 text-slate-500 dark:text-slate-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <span className="text-slate-600 dark:text-slate-300 mt-4 font-medium">Temperatuurgegevens laden...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-8 border-0 shadow-md bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200"
          >
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="ml-2">
              {isApiUnreachable ? (
                <>
                  <strong>Server niet bereikbaar:</strong> {error}
                  <div className="mt-2 text-sm">
                    Controleer of de Flask backend (app.py) correct is opgestart en bereikbaar is.
                  </div>
                </>
              ) : (
                error
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!loading && !error && temperatureData.length === 0 && (
          <Card className="text-center py-16">
            <CardContent className="pt-6">
              <Inbox className="h-12 w-12 mx-auto text-gray-400" />
              <p className="mt-4 text-gray-600 dark:text-gray-300">Geen temperatuurgegevens beschikbaar.</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content - Latest Observations (Left) and Chart (Right) */}
        {!loading && !error && temperatureData.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Left column: Latest Readings */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Laatste Metingen</CardTitle>
                  {updatingData && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {temperatureData.slice(0, 5).map((reading, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 ${reading.warning
                            ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 border-l-4 border-red-500"
                            : "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-l-4 border-green-500"
                          }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-xl font-bold">{reading.temperature.toFixed(1)}°C</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(reading.timestamp).toLocaleString("nl-NL", {
                                day: "numeric",
                                month: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <div
                            className={`rounded-full p-1.5 ${reading.warning ? "bg-red-100 dark:bg-red-800/30" : "bg-green-100 dark:bg-green-800/30"
                              }`}
                          >
                            {reading.warning ? (
                              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : (
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-xs mt-1 font-medium ${reading.warning ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                            }`}
                        >
                          {reading.warning ? "⚠️ Boven drempelwaarde" : "✅ Normaal"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: Temperature Chart */}
            <div className="md:col-span-2">
              <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle className="text-lg font-semibold">Temperatuurverloop</CardTitle>
                  {updatingData && (
                    <div className="flex items-center text-sm text-slate-500">
                      <div className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-300 animate-spin mr-2"></div>
                      <span>Bijwerken...</span>
                    </div>
                  )}
                  {!updatingData && !loading && (
                    <button
                      onClick={refreshData}
                      className="text-sm text-slate-600 hover:text-slate-800 cursor-pointer dark:text-slate-400 dark:hover:text-slate-200 flex items-center transition-colors duration-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Ververs gegevens
                    </button>
                  )}
                </CardHeader>
                <CardContent className="p-0 pt-4">
                  <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 rounded-lg mx-4 mb-4">
                    <MemoizedTemperatureChart data={chartData} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Data Table with Pagination */}
        {!loading && !error && temperatureData.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Temperatuurgeschiedenis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">#</TableHead>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Temperatuur</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((reading, index) => {
                      const itemNumber = (currentPage - 1) * itemsPerPage + index + 1
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{itemNumber}</TableCell>
                          <TableCell>{formatDateTime(reading.timestamp)}</TableCell>
                          <TableCell>{reading.temperature.toFixed(1)}°C</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${reading.warning
                                  ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                                }`}
                            >
                              {reading.warning ? "Waarschuwing" : "Normaal"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Pagina {currentPage} van {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="icon" onClick={goToPreviousPage} disabled={currentPage === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center">{renderPageNumbers()}</div>
                <Button variant="outline" size="icon" onClick={goToNextPage} disabled={currentPage === totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}

        {/* Auto-refresh indicator */}
        {!loading && !error && temperatureData.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-1 animate-spin [animation-duration:4s]" />
              Gegevens worden elke minuut automatisch bijgewerkt
            </p>
            {temperatureData.length > 0 && temperatureData[0] && (
              <p className="mt-1">Laatste meting: {formatDateTime(temperatureData[0].timestamp)}</p>
            )}
          </div>
        )}
      </div>

      {/* Stale Data Alert Dialog */}
      <Dialog open={staleDataDialogOpen} onOpenChange={setStaleDataDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-amber-600">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Geen recente temperatuurgegevens
            </DialogTitle>
          </DialogHeader>
          <DialogDescription className="space-y-4">
            <p className="text-base font-medium">
              Er zijn al meer dan 5 minuten geen nieuwe temperatuurmetingen ontvangen.
            </p>
            {lastDataPoint && (
              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md">
                <p className="mb-2">
                  <strong>Laatste geregistreerde meting:</strong>
                </p>
                <p>
                  Temperatuur: <span className="font-medium">{lastDataPoint.temperature.toFixed(1)}°C</span>
                </p>
                <p>
                  Tijdstip: <span className="font-medium">{formatDateTime(lastDataPoint.timestamp)}</span>
                </p>
                <p>
                  Status:{" "}
                  <span className={`font-medium ${lastDataPoint.warning ? "text-red-600" : "text-green-600"}`}>
                    {lastDataPoint.warning ? "Waarschuwing - Boven drempelwaarde" : "Normaal"}
                  </span>
                </p>
              </div>
            )}
            <p>Controleer of de PICO W sensor correct functioneert en verbonden is.</p>
          </DialogDescription>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setStaleDataDialogOpen(false)}>
              Sluiten
            </Button>
            <Button onClick={refreshData} className="ml-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Gegevens verversen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
