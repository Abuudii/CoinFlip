import React, { useEffect, useState, useRef } from 'react';
import { API_URL } from '../utils/config';
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

                // Mappe bekannte Symbole zu CoinGecko IDs
                const cryptoMap = {
                    BTC: 'bitcoin',
                    ETH: 'ethereum',
                    XRP: 'ripple',
                    LTC: 'litecoin',
                    BCH: 'bitcoin-cash',
                    ADA: 'cardano',
                    DOT: 'polkadot',
                    DOGE: 'dogecoin'
                };

                const isCrypto = (s) => !!s && cryptoMap[s];

                // Beide sind Krypto -> hole beide in USD und bilde Ratio
                if (isCrypto(fromCurrency) && isCrypto(toCurrency)) {
                    const fromId = cryptoMap[fromCurrency];
                    const toId = cryptoMap[toCurrency];

                    const [resA, resB] = await Promise.all([
                        fetch(`https://api.coingecko.com/api/v3/coins/${fromId}/market_chart?vs_currency=usd&days=30&interval=daily`),
                        fetch(`https://api.coingecko.com/api/v3/coins/${toId}/market_chart?vs_currency=usd&days=30&interval=daily`)
                    ]);

                    const [dataA, dataB] = await Promise.all([resA.json(), resB.json()]);

                    if (dataA.prices && dataB.prices) {
                        // Beide arrays sollten gleiche timestamps haben (täglich)
                        const labels = dataA.prices.map(p => new Date(p[0]).toLocaleDateString());
                        const values = dataA.prices.map((p, i) => {
                            const a = p[1];
                            const b = (dataB.prices[i] && dataB.prices[i][1]) || NaN;
                            return b ? a / b : NaN;
                        }).filter(v => !isNaN(v));

                        setHistoricalData({ labels, values });
                        setLoading(false);
                        return;
                    }
                }

                // from Crypto -> to Fiat (e.g., BTC -> USD) : CoinGecko supports vs_currency
                if (isCrypto(fromCurrency) && !isCrypto(toCurrency)) {
                    const fromId = cryptoMap[fromCurrency];
                    const vs = toCurrency.toLowerCase();
                    const response = await fetch(
                        `https://api.coingecko.com/api/v3/coins/${fromId}/market_chart?vs_currency=${vs}&days=30&interval=daily`
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

                // to Crypto & from Fiat -> invert (e.g., USD -> BTC) : fetch coin vs fiat and invert
                if (!isCrypto(fromCurrency) && isCrypto(toCurrency)) {
                    const toId = cryptoMap[toCurrency];
                    const vs = fromCurrency.toLowerCase();
                    const response = await fetch(
                        `https://api.coingecko.com/api/v3/coins/${toId}/market_chart?vs_currency=${vs}&days=30&interval=daily`
                    );
                    const data = await response.json();
                    if (data.prices) {
                        // invert prices: 1 fiat -> X crypto => we want fiat -> crypto rate, so take 1/price
                        const labels = data.prices.map(p => new Date(p[0]).toLocaleDateString());
                        const values = data.prices.map(p => {
                            const v = p[1];
                            return v ? 1 / v : NaN;
                        }).filter(v => !isNaN(v));
                        setHistoricalData({ labels, values });
                        setLoading(false);
                        return;
                    }
                }

                // Fallback: FIAT oder unbekannte Kombination -> Backend timeseries
                const end = new Date().toISOString().split('T')[0];
                const startDate = new Date();
                startDate.setDate(startDate.getDate() - 30);
                const start = startDate.toISOString().split('T')[0];

                const response = await fetch(
                    `${API_URL}/timeseries?base=${fromCurrency}&symbol=${toCurrency}&start=${start}&end=${end}`
                );
                const data = await response.json();

                if (!data.success) throw new Error('Failed to fetch exchange rates');

                let ratesData = [];

                if (Array.isArray(data.rates)) {
                    ratesData = data.rates.map(r => ({
                        date: new Date(r.rate_date).toLocaleDateString(),
                        rate: parseFloat(r.rate_value)
                    }));
                } else if (data.rates && typeof data.rates === 'object') {
                    ratesData = Object.entries(data.rates).map(([date, val]) => ({
                        date: new Date(date).toLocaleDateString(),
                        rate: parseFloat(val && val[toCurrency])
                    })).filter(d => !isNaN(d.rate));
                }

                if (ratesData.length === 0) throw new Error('No exchange rate data available');

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
