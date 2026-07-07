-- ============================================================
-- Wallet Feature Migration
-- Additive: does not modify any existing table's columns/rows
-- that are used by trading/staking/register flows.
-- ============================================================

-- 1. Fix sharewallet / fundwallet defaults and NULL→0
ALTER TABLE dbt_balance
  MODIFY COLUMN sharewallet DECIMAL(20,8) DEFAULT 0.00000000 NOT NULL,
  MODIFY COLUMN fundwallet DECIMAL(20,8) DEFAULT 0.00000000 NOT NULL;

UPDATE dbt_balance SET sharewallet = 0 WHERE sharewallet IS NULL;
UPDATE dbt_balance SET fundwallet = 0 WHERE fundwallet IS NULL;

-- 2. dbt_coin_network — per-coin network config
CREATE TABLE IF NOT EXISTS dbt_coin_network (
  id INT AUTO_INCREMENT PRIMARY KEY,
  coin_symbol VARCHAR(50) NOT NULL,
  network_name VARCHAR(50) NOT NULL,
  min_deposit DECIMAL(20,8) DEFAULT 0.00000000,
  min_withdraw DECIMAL(20,8) DEFAULT 0.00000000,
  max_withdraw DECIMAL(20,8) DEFAULT 0.00000000,
  withdraw_fee DECIMAL(20,8) DEFAULT 0.00000000,
  confirmations_required INT DEFAULT 1,
  deposit_status TINYINT(1) DEFAULT 1,
  withdraw_status TINYINT(1) DEFAULT 1,
  status TINYINT(1) DEFAULT 1
);

-- 3. tbl_withdraw — withdrawal requests
CREATE TABLE IF NOT EXISTS tbl_withdraw (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  currency VARCHAR(50) NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  charge DECIMAL(20,8) DEFAULT 0.00000000,
  net_amount DECIMAL(20,8) NOT NULL,
  txn_id VARCHAR(255),
  address VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  message TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
