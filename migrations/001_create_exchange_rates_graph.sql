-- Migration: create exchange_rates_graph table
-- Run this in your MySQL database (use mysql CLI or GUI).

CREATE TABLE IF NOT EXISTS exchange_rates_graph (
  id INT AUTO_INCREMENT PRIMARY KEY,
  base_currency VARCHAR(10) NOT NULL,
  target_currency VARCHAR(10) NOT NULL,
  rate_date DATE NOT NULL,
  rate_value DECIMAL(18,8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_pair_date (base_currency, target_currency, rate_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
