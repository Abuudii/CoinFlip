import React, { useEffect, useState } from 'react';
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

    useEffect(() => {
        const fetchHistoricalData = async () => {
            try {
                setLoading(true);
                // Get date 30 days ago
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                // Format date as YYYY-MM-DD
                const startDate = thirtyDaysAgo.toISOString().split('T')[0];
                const endDate = new Date().toISOString().split('T')[0];

                // Fetch historical data from CoinGecko API for crypto or ExchangeRate API for fiat
                const isCrypto = toCurrency.toLowerCase() === 'bitcoin' || fromCurrency.toLowerCase() === 'bitcoin';
                let response;

                if (isCrypto) {
                    // For crypto, use CoinGecko API
                    const symbol = toCurrency.toLowerCase() === 'bitcoin' ? 'bitcoin' : 'bitcoin';
                    const vsCurrency = fromCurrency.toLowerCase() === 'bitcoin' ? toCurrency.toLowerCase() : fromCurrency.toLowerCase();
                    response = await fetch(
                        `https://api.coingecko.com/api/v3/coins/${symbol}/market_chart/range?vs_currency=${vsCurrency}&from=${Math.floor(thirtyDaysAgo.getTime() / 1000)}&to=${Math.floor(Date.now() / 1000)}`
                    );
                } else {
                    // For fiat currencies, use Exchange Rates API
                    response = await fetch(
                        `https://api.exchangerate.host/timeseries?start_date=${startDate}&end_date=${endDate}&base=${fromCurrency}&symbols=${toCurrency}`
                    );
                }

                const data = await response.json();

                // Process the data based on API response format
                let chartData;
                if (isCrypto) {
                    chartData = data.prices.map(([timestamp, price]) => ({
                        date: new Date(timestamp).toLocaleDateString(),
                        rate: price
                    }));
                } else {
                    chartData = Object.entries(data.rates).map(([date, rates]) => ({
                        date,
                        rate: rates[toCurrency]
                    }));
                }

                setHistoricalData(chartData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching historical data:', error);
                setLoading(false);
            }
        };

        if (fromCurrency && toCurrency) {
            fetchHistoricalData();
        }
    }, [fromCurrency, toCurrency]);

    if (loading) {
        return <div>Loading historical data...</div>;
    }

    if (!historicalData) {
        return <div>No historical data available</div>;
    }

    const chartData = {
        labels: historicalData.map(data => data.date),
        datasets: [
            {
                label: `${fromCurrency} to ${toCurrency} Exchange Rate`,
                data: historicalData.map(data => data.rate),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: '30 Day Exchange Rate History'
            }
        },
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: `Exchange Rate (${toCurrency})`
                }
            },
            x: {
                title: {
                    display: true,
                    text: 'Date'
                }
            }
        }
    };

    return (
        <div style={{ width: '100%', maxWidth: '800px', margin: '20px auto' }}>
            <Line data={chartData} options={options} />
        </div>
    );
};

export default CurrencyGraph;