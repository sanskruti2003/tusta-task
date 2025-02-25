"use client"

import { useState, useEffect, useCallback } from "react"
import { Moon, Sun, Star } from "lucide-react"
import CandlestickChart from "./components/CandlestickChart"
import TrendlineModal from "./components/TrendlineModal"
import { useTheme } from "./hooks/useTheme"
import { useTrendlines } from "./hooks/useTrendlines"
import { useLocalStorage } from "./hooks/useLocalStorage"

function App() {
  const [darkMode, toggleDarkMode] = useTheme()
  const [chartData, setChartData] = useState([])
  const [favoriteCoins, setFavoriteCoins] = useLocalStorage("favoriteCoins", ["BTC", "ETH"])
  const [selectedCoin, setSelectedCoin] = useState("BTC")
  const [selectedTimeframe, setSelectedTimeframe] = useState("1h") // Default timeframe
  const [showTrendlineModal, setShowTrendlineModal] = useState(false)
  const [selectedTrendline, setSelectedTrendline] = useState(null)
  const { trendlines, addTrendline, updateTrendline, deleteTrendline } = useTrendlines()

  const fetchPriceData = useCallback(async () => {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${selectedCoin}USDT&interval=${selectedTimeframe}&limit=100`,
      )
      const data = await response.json()
      const formattedData = data.map((candle) => ({
        time: candle[0],
        open: Number.parseFloat(candle[1]),
        high: Number.parseFloat(candle[2]),
        low: Number.parseFloat(candle[3]),
        close: Number.parseFloat(candle[4]),
        volume: Number.parseFloat(candle[5]),
      }))
      setChartData(formattedData)
    } catch (error) {
      console.error("Error fetching price data:", error)
    }
  }, [selectedCoin, selectedTimeframe])

  useEffect(() => {
    fetchPriceData()
    const interval = setInterval(fetchPriceData, 10000)
    return () => clearInterval(interval)
  }, [fetchPriceData])

  const handleTrendlineContextMenu = (e, trendline) => {
    e.preventDefault()
    setSelectedTrendline(trendline)
    setShowTrendlineModal(true)
  }

  const downloadChart = () => {
    const canvas = document.querySelector(".konva-canvas")
    if (canvas) {
      const link = document.createElement("a")
      link.download = `${selectedCoin}-chart.png`
      link.href = canvas.toDataURL()
      link.click()
    }
  }

  const toggleFavoriteCoin = (coin) => {
    setFavoriteCoins((prev) => (prev.includes(coin) ? prev.filter((c) => c !== coin) : [...prev, coin]))
  }

  return (
    <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
      <nav className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <h1 className="text-4xl font-bold text-center">Crypto Trendline Chart</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => toggleFavoriteCoin(selectedCoin)}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
              >
                <Star
                  className={`w-5 h-5 ${favoriteCoins.includes(selectedCoin) ? "fill-current text-yellow-400" : ""}`}
                />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="relative h-[600px] rounded-lg overflow-hidden border dark:border-gray-500">
          <CandlestickChart
            data={chartData}
            trendlines={trendlines}
            onTrendlineContextMenu={handleTrendlineContextMenu}
            darkMode={darkMode}
          />
        </div>
      </main>

      {showTrendlineModal && (
        <TrendlineModal
          trendline={selectedTrendline}
          onClose={() => setShowTrendlineModal(false)}
          onUpdate={updateTrendline}
          onDelete={deleteTrendline}
          darkMode={darkMode}
        />
      )}
    </div>
  )
}

export default App

