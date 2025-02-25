import { useEffect, useRef, useState } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import html2canvas from "html2canvas";
import TrendlineModal from "./TrendlineModal";
import { sendTrendlineData } from "../services/api";

const CandlestickChart = ({ symbol = "BTCUSDT", interval = "1m" }) => {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  const xAxisRef = useRef(null);
  const yAxisRef = useRef(null);
  const canvasRef = useRef(null);

  const [candleData, setCandleData] = useState([]);
  const [trendlines, setTrendlines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentLine, setCurrentLine] = useState(null);
  const [crosshair, setCrosshair] = useState(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });
  const [ohlc, setOhlc] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedTrendline, setSelectedTrendline] = useState(null);

  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=100`
        );
        const data = await response.json();
        const formattedData = data.map((candle) => ({
          date: candle[0],
          open: Number.parseFloat(candle[1]),
          high: Number.parseFloat(candle[2]),
          low: Number.parseFloat(candle[3]),
          close: Number.parseFloat(candle[4]),
          volume: Number.parseFloat(candle[5]),
        }));
        setCandleData(formattedData);
      } catch (error) {
        console.error("Error fetching historical data:", error);
      }
    };

    fetchHistoricalData();
  }, [symbol, interval]);

  useEffect(() => {
    if (!chartRef.current) return;

    const root = am5.Root.new(chartRef.current);
    chartInstanceRef.current = root;
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5xy.XYChart.new(root, {
        panX: true,
        panY: true,
        layout: root.verticalLayout,
      })
    );

    const xAxis = chart.xAxes.push(
      am5xy.DateAxis.new(root, {
        baseInterval: { timeUnit: "minute", count: 1 },
        renderer: am5xy.AxisRendererX.new(root, {}),
        tooltip: am5.Tooltip.new(root, {}),
      })
    );
    xAxisRef.current = xAxis;

    const yAxis = chart.yAxes.push(
      am5xy.ValueAxis.new(root, {
        renderer: am5xy.AxisRendererY.new(root, {}),
      })
    );
    yAxisRef.current = yAxis;

    const series = chart.series.push(
      am5xy.CandlestickSeries.new(root, {
        name: "Candlestick",
        xAxis: xAxis,
        yAxis: yAxis,
        openValueYField: "open",
        valueYField: "close",
        lowValueYField: "low",
        highValueYField: "high",
        valueXField: "date",
        tooltip: am5.Tooltip.new(root, {
          pointerOrientation: "horizontal",
          labelText: "Open: {openValueY}\nHigh: {highValueY}\nLow: {lowValueY}\nClose: {valueY}",
        }),
      })
    );

    seriesRef.current = series;

    chart.set("cursor", am5xy.XYCursor.new(root, { xAxis, yAxis, behavior: "none" }));

    setChartDimensions({ width: chartRef.current.clientWidth, height: chartRef.current.clientHeight });

    return () => root.dispose();
  }, []);

  useEffect(() => {
    if (seriesRef.current && candleData.length > 0) {
      seriesRef.current.data.setAll(candleData);
    }
  }, [candleData]);

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setCurrentLine({ startX: x, startY: y, endX: x, endY: y });
  };

  const handleMouseMove = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setCrosshair({ x, y });

    if (candleData.length > 0) {
      const chartWidth = canvasRef.current.width;
      const candleWidth = chartWidth / candleData.length;
      const index = Math.floor(x / candleWidth);
      if (index >= 0 && index < candleData.length) {
        setOhlc(candleData[index]);
      }
    }

    if (isDrawing) {
      setCurrentLine((prev) => ({ ...prev, endX: x, endY: y }));
    }
    drawCanvas(trendlines, currentLine);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    const newTrendline = { ...currentLine, id: Date.now() };
    setTrendlines((prev) => [...prev, newTrendline]);
    setIsDrawing(false);
    setCurrentLine(null);
  };

  const handleContextMenu = async (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Find the clicked trendline
    const clickedTrendline = trendlines.find(line => {
      const distance = pointToLineDistance(x, y, line.startX, line.startY, line.endX, line.endY);
      return distance < 10; // 10px threshold for clicking
    });

    if (clickedTrendline) {
      setSelectedTrendline(clickedTrendline);
      setShowModal(true);
    }
  };

  const pointToLineDistance = (x, y, x1, y1, x2, y2) => {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const drawCanvas = (lines, tempLine = null) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    lines.forEach(({ startX, startY, endX, endY }) => {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    if (crosshair && ohlc) {
      ctx.fillStyle = "orange";
      ctx.font = "14px Arial";
      ctx.fillText(`O: ${ohlc.open} H: ${ohlc.high} L: ${ohlc.low} C: ${ohlc.close}`, crosshair.x + 10, crosshair.y - 10);
    }
  };

  const handleTrendlineUpdate = async (updatedTrendline) => {
    try {
      // Send trendline data to backend
      const trendlineData = {
        id: updatedTrendline.id,
        start: {
          x: updatedTrendline.startX,
          y: updatedTrendline.startY,
          price: yAxisRef.current.positionToValue(updatedTrendline.startY),
          time: xAxisRef.current.positionToValue(updatedTrendline.startX)
        },
        end: {
          x: updatedTrendline.endX,
          y: updatedTrendline.endY,
          price: yAxisRef.current.positionToValue(updatedTrendline.endY),
          time: xAxisRef.current.positionToValue(updatedTrendline.endX)
        },
        alertName: updatedTrendline.alertName,
        expiryDate: updatedTrendline.expiryDate
      };

      await sendTrendlineData(trendlineData);

      // Update local state
      setTrendlines(prev => 
        prev.map(t => t.id === updatedTrendline.id ? updatedTrendline : t)
      );
      setShowModal(false);
      alert('Trendline updated.');
    } catch (error) {
      console.error('Error updating trendline:', error);
      alert('Failed to update trendline. The Server is not running....');
    }
  };

  return (
    <div className="relative">
      <canvas 
        ref={canvasRef} 
        className="absolute top-0 left-0 z-10" 
        onMouseDown={handleMouseDown} 
        onMouseMove={handleMouseMove} 
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        width={chartDimensions.width} 
        height={chartDimensions.height} 
      />
      <div ref={chartRef} style={{ width: "100%", height: "500px", position: "relative" }}></div>
      
      {showModal && selectedTrendline && (
        <TrendlineModal
          trendline={selectedTrendline}
          onClose={() => setShowModal(false)}
          onUpdate={handleTrendlineUpdate}
          onDelete={(id) => {
            setTrendlines(prev => prev.filter(t => t.id !== id));
            setShowModal(false);
          }}
          darkMode={true}
        />
      )}
    </div>
  );
};

export default CandlestickChart;