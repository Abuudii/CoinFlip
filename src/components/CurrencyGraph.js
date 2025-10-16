import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const CurrencyGraph = ({ fromCurrency, toCurrency }) => {
    const [historicalData, setHistoricalData] = useState(null);
    const [loading, setLoading] = useState(true);
    const chartRef = useRef(null);

    useEffect(() => {
        const fetchHistoricalData = async () => {
            try {
                setLoading(true);

                // ✅ Sonderfall für Krypto (CoinGecko bleibt gleich)
                if (fromCurrency === 'BTC') {
                    const response = await fetch(
                        `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=${toCurrency.toLowerCase()}&days=30&interval=daily`
                    );
                    const data = await response.json();

                    if (data.prices) {
                        const chartData = {
                            labels: data.prices.map(p => new Date(p[0]).toLocaleDateString()),
                            values: data.prices.map(p => p[1])
                        };
                        setHistoricalData(chartData);
                        setLoading(false);
                        return;
                    }
                }

                // ✅ Für FIAT jetzt nur über deinen Server (kein direkter apilayer-Call)
                const end = new Date().toISOString().split('T')[0];
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                const start = startDate.toISOString().split('T')[0];

                const response = await fetch(
                    `http://localhost:5000/api/timeseries?base=${fromCurrency}&symbol=${toCurrency}&start=${start}&end=${end}`
                );
                const data = await response.json();

                if (!data.success) throw new Error('Failed to fetch exchange rates');

                let ratesData = [];

                // Backend may return rows from DB (array) or the external API shape (object keyed by date)
                if (Array.isArray(data.rates)) {
                    // Rows from DB: [{ rate_date, rate_value }, ...]
                    ratesData = data.rates.map(r => ({
                        date: new Date(r.rate_date).toLocaleDateString(),
                        rate: parseFloat(r.rate_value)
                    }));
                } else if (data.rates && typeof data.rates === 'object') {
                    // External API shape: { '2023-10-01': { USD: 1.12 } }
                    ratesData = Object.entries(data.rates).map(([date, val]) => ({
                        date: new Date(date).toLocaleDateString(),
                        rate: parseFloat(val && val[toCurrency])
                    })).filter(d => !isNaN(d.rate));
                }

                if (ratesData.length === 0) throw new Error('No exchange rate data available');

                // Sortieren (älteste → neueste)
                const sortedData = ratesData.sort((a, b) => new Date(a.date) - new Date(b.date));
                setHistoricalData({
                    labels: sortedData.map(d => d.date),
                    values: sortedData.map(d => d.rate)
                });
                setLoading(false);
            } catch (error) {
                console.error('Error fetching historical data:', error);
                setLoading(false);
                setHistoricalData(null);
            }
        };

        if (fromCurrency && toCurrency) {
            fetchHistoricalData();
        }
    }, [fromCurrency, toCurrency]);

    if (loading) {
        return (
            <div className="chartContainer">
                <h3>30-Day Exchange Rate History</h3>
                <div className="loadingMessage">
                    <div>Loading historical exchange rates...</div>
                    <div className="loadingSubtext">
                        This may take a few seconds
                    </div>
                </div>
            </div>
        );
    }

    if (!historicalData) {
        return (
            <div className="chartContainer">
                <h3>30-Day Exchange Rate History</h3>
                <div className="errorMessage">
                    No historical data available for this currency pair
                </div>
            </div>
        );
    }

    const chartData = {
        labels: historicalData.labels,
        datasets: [
            {
                label: `${fromCurrency} → ${toCurrency} Exchange Rate`,
                data: historicalData.values,
                borderColor: "#3ee96f",
                backgroundColor: "rgba(62,233,111,0.1)",
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 3,
                pointHoverRadius: 6,
                pointBackgroundColor: "#3ee96f",
                pointHoverBackgroundColor: "#fff",
                pointBorderColor: "#3ee96f",
                pointHoverBorderColor: "#3ee96f",
                pointBorderWidth: 2,
                pointHoverBorderWidth: 2,
                tension: 0.1
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
            padding: { top: 10, right: 15, bottom: 0, left: 15 }
        },
        interaction: { mode: 'index', intersect: false },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'start',
                labels: {
                    color: '#fff',
                    font: { size: 13, weight: 'bold' },
                    padding: 15,
                    boxWidth: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 10,
                titleFont: { size: 13 },
                bodyFont: { size: 12 },
                displayColors: false
            }
        },
        scales: {
            x: {
                grid: {
                    color: "rgba(255,255,255,0.1)",
                    drawBorder: false,
                    tickLength: 8
                },
                ticks: {
                    color: "#fff",
                    font: { size: 11 },
                    maxRotation: 0,
                    minRotation: 0,
                    maxTicksLimit: 15,
                    padding: 5
                }
            },
            y: {
                grid: {
                    color: "rgba(255,255,255,0.1)",
                    drawBorder: false
                },
                ticks: {
                    color: "#fff",
                    font: { size: 11 },
                    callback: value => value.toLocaleString(),
                    maxTicksLimit: 8,
                    padding: 5
                },
                beginAtZero: false
            }
        }
    };

    return (
        <div className="chartContainer">
            <h3>30-Day Exchange Rate History</h3>
            <div className="chartWrapper">
                <Line ref={chartRef} data={chartData} options={chartOptions} />
            </div>
        </div>
    );
};

export default CurrencyGraph;
