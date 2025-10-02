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

                // For crypto currencies, use CoinGecko API
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

                // Calculate dates for API call
                const now = new Date();
                const dates = [];

                // Generate array of dates for the last 30 days
                for (let i = 0; i < 30; i++) {
                    const date = new Date(now);
                    date.setDate(now.getDate() - i);
                    dates.push(date.toISOString().split('T')[0]);
                }

                const API_KEY = "8d1ef50b6a349477a48216738ea8eb57";
                const ratesData = [];

                // Fetch each date individually to work with free tier
                for (const date of dates) {
                    const response = await fetch(
                        `https://api.exchangeratesapi.io/v1/${date}?` +
                        `access_key=${API_KEY}` +
                        `&base=EUR` + // API requires EUR as base in free tier
                        `&symbols=${fromCurrency},${toCurrency}`
                    );

                    const data = await response.json();

                    if (data.success && data.rates) {
                        const fromRate = data.rates[fromCurrency] || 1;
                        const toRate = data.rates[toCurrency] || 1;

                        ratesData.push({
                            date: new Date(date).toLocaleDateString(),
                            rate: toRate / fromRate
                        });
                    }

                    // Add a small delay to avoid rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                if (ratesData.length === 0) {
                    throw new Error('Failed to fetch exchange rates');
                }

                // Sort data by date (oldest to newest)
                const sortedData = ratesData.sort((a, b) => new Date(a.date) - new Date(b.date));
                setHistoricalData({
                    labels: sortedData.map(d => d.date),
                    values: sortedData.map(d => d.rate)
                });
                console.log('Chart Data:', sortedData); // Debug logging
                setLoading(false);
            } catch (error) {
                console.error('Error fetching historical data:', error);
                setLoading(false);
                setHistoricalData(null);
                // Show more detailed error in the UI
                return <div style={{ color: 'var(--danger)', padding: '1rem', textAlign: 'center' }}>
                    Failed to load exchange rate data. Please try again later.
                </div>;
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
            padding: {
                top: 10,
                right: 15,
                bottom: 0,
                left: 15
            }
        },
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'start',
                labels: {
                    color: '#fff',
                    font: {
                        size: 13,
                        weight: 'bold'
                    },
                    padding: 15,
                    boxWidth: 15,
                    usePointStyle: true
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                padding: 10,
                titleFont: {
                    size: 13
                },
                bodyFont: {
                    size: 12
                },
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
                    font: {
                        size: 11
                    },
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
                    font: {
                        size: 11
                    },
                    callback: function (value) {
                        return value.toLocaleString()
                    },
                    maxTicksLimit: 8,
                    padding: 5
                },
                beginAtZero: false
            },
        },
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