// "use client"

// import { useEffect, useState, memo } from "react"
// import TemperatureLineChart from "@/components/temperature-display"
// import type { TemperatureReading } from "@/types/types"
// import { AlertTriangle, Check, Inbox, Loader2, RefreshCw } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"

// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// // Memoized chart component that only re-renders when data changes
// const MemoizedTemperatureChart = memo(function MemoizedTemperatureChart({
//   data,
// }: {
//   data: TemperatureReading[]
// }) {
//   return (
//     <div className="h-[400px]">
//       <TemperatureLineChart data={data} />
//     </div>
//   )
// })

// export default function Home() {
//   const [temperatureData, setTemperatureData] = useState<TemperatureReading[]>([])
//   const [loading, setLoading] = useState(true)
//   const [error, setError] = useState<string | null>(null)
//   // Separate state for chart data to control when the chart refreshes
//   const [chartData, setChartData] = useState<TemperatureReading[]>([])
//   // Track whether data is being updated
//   const [updatingData, setUpdatingData] = useState(false)

//   const fetchTemperatureData = async (isPartialUpdate = false) => {
//     try {
//       if (!isPartialUpdate) {
//         // Initial load - show full page loading state
//         setLoading(true)
//       } else {
//         // Partial update - show smaller indicator
//         setUpdatingData(true)
//       }

//       const response = await fetch("/api/temperature")

//       if (!response.ok) {
//         throw new Error(`HTTP error! Status: ${response.status}`)
//       }

//       const data = await response.json()

//       // Always update both datasets now
//       setTemperatureData(data)
//       setChartData(data)
//       setError(null)
//     } catch (err) {
//       console.error("Error fetching data:", err)
//       setError("Temperatuurgegevens laden mislukt. Probeer het later opnieuw.")
//     } finally {
//       setLoading(false)
//       setUpdatingData(false)
//     }
//   }

//   // Initial data load
//   useEffect(() => {
//     fetchTemperatureData(false)

//     // Set up polling to refresh data every minute
//     const intervalId = setInterval(() => fetchTemperatureData(true), 30000)

//     // Clean up on component unmount
//     return () => clearInterval(intervalId)
//   }, [])

//   // Function to manually refresh data
//   const refreshData = () => {
//     fetchTemperatureData(true)
//   }

//   // Determine status for the top bar
//   const getStatus = () => {
//     if (loading) return { color: "bg-slate-500/90", text: "Temperatuurgegevens laden..." }
//     if (error) return { color: "bg-rose-500/90", text: "Fout bij het laden van gegevens" }
//     if (temperatureData.length === 0) return { color: "bg-slate-500/90", text: "Geen temperatuurgegevens beschikbaar" }

//     const hasWarning = temperatureData.some((reading) => reading.warning)
//     return hasWarning
//       ? { color: "bg-amber-500/90", text: "⚠️ Waarschuwing: Temperatuur boven drempelwaarde gedetecteerd" }
//       : { color: "bg-emerald-500/90", text: "✅ Alle temperatuurmetingen binnen normale waarden" }
//   }

//   const status = getStatus()

//   return (
//     <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
//       {/* Status Bar */}
//       <div className={`w-full ${status.color} text-white py-3 px-4 shadow-md`}>
//         <div className="container mx-auto flex items-center">
//           {loading ? (
//             <Loader2 className="h-5 w-5 animate-spin mr-3" />
//           ) : error ? (
//             <AlertTriangle className="h-5 w-5 mr-3" />
//           ) : temperatureData.length === 0 ? (
//             <Inbox className="h-5 w-5 mr-3" />
//           ) : temperatureData.some((reading) => reading.warning) ? (
//             <AlertTriangle className="h-5 w-5 mr-3" />
//           ) : (
//             <Check className="h-5 w-5 mr-3" />
//           )}
//           <span className="font-medium">{status.text}</span>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8">
//         <header className="mb-8 relative">
//           <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 shadow-lg">
//             <div className="flex flex-col md:flex-row md:items-center md:justify-between">
//               <div className="mb-4 md:mb-0">
//                 <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
//                   <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-200 dark:to-slate-400">
//                     Temperatuur Monitor
//                   </span>
//                 </h1>
//                 <p className="mt-2 text-slate-600 dark:text-slate-400 text-lg">
//                   Realtime temperatuurgegevens van de PICO sensor
//                 </p>
//               </div>
//               <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm py-2 px-4 rounded-lg shadow-sm">
//                 <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
//                 <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Live Data</span>
//               </div>
//             </div>
//             <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
//               <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full shadow-md flex items-center justify-center">
//                 <div className="h-1 w-10 bg-slate-300 dark:bg-slate-600 rounded-full"></div>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Loading State */}
//         {loading && (
//           <div className="flex flex-col items-center justify-center py-16">
//             <div className="relative">
//               <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-300 animate-spin"></div>
//               <Loader2 className="h-8 w-8 text-slate-500 dark:text-slate-300 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
//             </div>
//             <span className="text-slate-600 dark:text-slate-300 mt-4 font-medium">Temperatuurgegevens laden...</span>
//           </div>
//         )}

//         {/* Error State */}
//         {error && (
//           <Alert
//             variant="destructive"
//             className="mb-8 border-0 shadow-md bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200"
//           >
//             <AlertTriangle className="h-5 w-5" />
//             <AlertDescription className="ml-2">{error}</AlertDescription>
//           </Alert>
//         )}

//         {/* Empty State */}
//         {!loading && !error && temperatureData.length === 0 && (
//           <Card className="text-center py-16">
//             <CardContent className="pt-6">
//               <Inbox className="h-12 w-12 mx-auto text-gray-400" />
//               <p className="mt-4 text-gray-600 dark:text-gray-300">Geen temperatuurgegevens beschikbaar.</p>
//             </CardContent>
//           </Card>
//         )}

//         {/* Main Content - Latest Observations (Left) and Chart (Right) */}
//         {!loading && !error && temperatureData.length > 0 && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {/* Left column: Latest Readings */}
//             <div className="md:col-span-1">
//               <Card>
//                 <CardHeader className="flex flex-row items-center justify-between">
//                   <CardTitle>Laatste Metingen</CardTitle>
//                   {updatingData && (
//                     <div className="flex items-center text-sm text-gray-500">
//                       <Loader2 className="h-4 w-4 animate-spin mr-2" />
//                     </div>
//                   )}
//                 </CardHeader>
//                 <CardContent>
//                   <div className="space-y-3">
//                     {temperatureData.slice(0, 5).map((reading, index) => (
//                       <div
//                         key={index}
//                         className={`p-4 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md transform hover:-translate-y-1 ${reading.warning
//                           ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/20 border-l-4 border-red-500"
//                           : "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/40 dark:to-green-900/20 border-l-4 border-green-500"
//                           }`}
//                       >
//                         <div className="flex justify-between items-center">
//                           <div>
//                             <p className="text-xl font-bold">{reading.temperature.toFixed(1)}°C</p>
//                             <p className="text-xs text-gray-500 dark:text-gray-400">
//                               {new Date(reading.timestamp).toLocaleString("nl-NL", {
//                                 day: "numeric",
//                                 month: "numeric",
//                                 hour: "2-digit",
//                                 minute: "2-digit",
//                               })}
//                             </p>
//                           </div>
//                           <div
//                             className={`rounded-full p-1.5 ${reading.warning ? "bg-red-100 dark:bg-red-800/30" : "bg-green-100 dark:bg-green-800/30"
//                               }`}
//                           >
//                             {reading.warning ? (
//                               <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
//                             ) : (
//                               <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
//                             )}
//                           </div>
//                         </div>
//                         <p
//                           className={`text-xs mt-1 font-medium ${reading.warning ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
//                             }`}
//                         >
//                           {reading.warning ? "⚠️ Boven drempelwaarde" : "✅ Normaal"}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>

//             {/* Right column: Temperature Chart */}
//             <div className="md:col-span-2">
//               <Card className="overflow-hidden border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm h-full">
//                 <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
//                   <CardTitle className="text-lg font-semibold">Temperatuurverloop</CardTitle>
//                   {updatingData && (
//                     <div className="flex items-center text-sm text-slate-500">
//                       <div className="h-4 w-4 rounded-full border-2 border-slate-200 dark:border-slate-700 border-t-slate-500 dark:border-t-slate-300 animate-spin mr-2"></div>
//                       <span>Bijwerken...</span>
//                     </div>
//                   )}
//                   {!updatingData && !loading && (
//                     <button
//                       onClick={refreshData}
//                       className="text-sm text-slate-600 hover:text-slate-800 cursor-pointer dark:text-slate-400 dark:hover:text-slate-200 flex items-center transition-colors duration-200 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full"
//                     >
//                       <RefreshCw className="h-3 w-3 mr-1" />
//                       Ververs gegevens
//                     </button>
//                   )}
//                 </CardHeader>
//                 <CardContent className="p-0 pt-4">
//                   <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 p-4 rounded-lg mx-4 mb-4">
//                     <MemoizedTemperatureChart data={chartData} />
//                   </div>
//                 </CardContent>
//               </Card>
//             </div>
//           </div>
//         )}

//         {/* Auto-refresh indicator */}
//         {!loading && !error && temperatureData.length > 0 && (
//           <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
//             <p className="flex items-center justify-center">
//               <RefreshCw className="h-4 w-4 mr-1 animate-spin [animation-duration:4s]" />
//               Gegevens worden elke minuut automatisch bijgewerkt
//             </p>
//           </div>
//         )}
//       </div>
//     </main>
//   )
// }



"use client"

import { useEffect, useState, memo } from "react"
import TemperatureLineChart from "@/components/temperature-display"
import type { TemperatureReading } from "@/types/types"
import { AlertTriangle, Check, Inbox, Loader2, LogOut, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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
  // Separate state for chart data to control when the chart refreshes
  const [chartData, setChartData] = useState<TemperatureReading[]>([])
  // Track whether data is being updated
  const [updatingData, setUpdatingData] = useState(false)
  // Track user authentication
  const [user, setUser] = useState<{ id: number; username: string } | null>(null)

  const router = useRouter()

  // Check authentication status
  useEffect(() => {
    const storedUser = sessionStorage.getItem('user')

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        setUser(parsedUser)
        console.log("User is logged in:", parsedUser)
      } catch (error) {
        console.error("Failed to parse user data:", error)
        console.log("User is NOT logged in - invalid data")
        router.push('/login')
      }
    } else {
      console.log("User is NOT logged in - no session data")
      router.push('/login')
    }
  }, [router])

  const fetchTemperatureData = async (isPartialUpdate = false) => {
    try {
      if (!isPartialUpdate) {
        // Initial load - show full page loading state
        setLoading(true)
      } else {
        // Partial update - show smaller indicator
        setUpdatingData(true)
      }

      const response = await fetch("/api/temperature")

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      // Always update both datasets now
      setTemperatureData(data)
      setChartData(data)
      setError(null)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Temperatuurgegevens laden mislukt. Probeer het later opnieuw.")
    } finally {
      setLoading(false)
      setUpdatingData(false)
    }
  }

  // Initial data load
  useEffect(() => {
    // Only fetch data if user is authenticated
    if (user) {
      fetchTemperatureData(false)

      // Set up polling to refresh data every minute
      const intervalId = setInterval(() => fetchTemperatureData(true), 30000)

      // Clean up on component unmount
      return () => clearInterval(intervalId)
    }
  }, [user])

  // Function to manually refresh data
  const refreshData = () => {
    fetchTemperatureData(true)
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      // Clear user from session storage
      sessionStorage.removeItem('user')
      console.log("User logged out")

      // Redirect to login page
      router.push('/login')
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  // Determine status for the top bar
  const getStatus = () => {
    if (loading) return { color: "bg-slate-500/90", text: "Temperatuurgegevens laden..." }
    if (error) return { color: "bg-rose-500/90", text: "Fout bij het laden van gegevens" }
    if (temperatureData.length === 0) return { color: "bg-slate-500/90", text: "Geen temperatuurgegevens beschikbaar" }

    const hasWarning = temperatureData.some((reading) => reading.warning)
    return hasWarning
      ? { color: "bg-amber-500/90", text: "⚠️ Waarschuwing: Temperatuur boven drempelwaarde gedetecteerd" }
      : { color: "bg-emerald-500/90", text: "✅ Alle temperatuurmetingen binnen normale waarden" }
  }

  const status = getStatus()

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
              <span className="text-sm font-medium mr-3">Logged in as: {user.username}</span>
              <button
                onClick={handleLogout}
                className="flex items-center bg-white/20 hover:bg-white/30 rounded px-3 py-1 text-sm font-medium transition-colors"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
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
            <AlertDescription className="ml-2">{error}</AlertDescription>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Auto-refresh indicator */}
        {!loading && !error && temperatureData.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-1 animate-spin [animation-duration:4s]" />
              Gegevens worden elke minuut automatisch bijgewerkt
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
