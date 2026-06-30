const https = require('https');
const connect = require('../config/Mysqlcon');

const COIN_ID_MAP = {
    'BTC'  : 'bitcoin',
    'ETH'  : 'ethereum',
    'SOL'  : 'solana',
    'BNB'  : 'binancecoin',
    'XRP'  : 'ripple',
    'DOGE' : 'dogecoin',
    'ADA'  : 'cardano',
};

const BASE_PRICES = {
    'SOL' : 5700,
    'BTC' : 5300000,
    'ETH' : 290000,
    'BNB' : 26000,
    'XRP' : 48,
    'DOGE': 12,
    'ADA' : 40,
};

function fetchLivePrices(coinIds) {
    return new Promise((resolve, reject) => {
        const ids = coinIds.join(',');
        const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`;
        https.get(url, { headers: { 'Accept': 'application/json' }, timeout: 5000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(data)); }
                catch (e) { reject(e); }
            });
        }).on('error', reject);
    });
}

async function priceTick(io) {
    try {
        const pool = await connect();
        const [pairs] = await pool.query("SELECT * FROM dbt_coinpair WHERE status = 1");
        if (!pairs.length) return;

        const coinsNeeded = [...new Set(
            pairs.map(p => p.market_symbol.split('_')[0]).filter(sym => COIN_ID_MAP[sym])
        )];
        if (!coinsNeeded.length) return;

        let livePrices;
        try {
            const coinGeckoIds = coinsNeeded.map(sym => COIN_ID_MAP[sym]);
            livePrices = await fetchLivePrices(coinGeckoIds);
        } catch (e) {
            livePrices = null;
        }

        const now = new Date();

        for (const pair of pairs) {
            const [coinSymbol] = pair.market_symbol.split('_');
            const geckoId = COIN_ID_MAP[coinSymbol];
            if (!geckoId) continue;

            let currentPrice;

            if (livePrices && livePrices[geckoId] && livePrices[geckoId].inr) {
                currentPrice = parseFloat(livePrices[geckoId].inr);
            } else {
                const [[prevRow]] = await pool.query(
                    "SELECT last_price FROM dbt_coinhistory WHERE market_symbol = ? ORDER BY id DESC LIMIT 1",
                    [pair.market_symbol]
                );
                const lastPrice = prevRow?.last_price ? parseFloat(prevRow.last_price) : (BASE_PRICES[coinSymbol] || 5700);
                const change = lastPrice * (Math.random() - 0.5) * 0.002;
                currentPrice = Math.max(lastPrice + change, 1);
            }

            if (!currentPrice || currentPrice <= 0) continue;

            const [[prevRow]] = await pool.query(
                "SELECT last_price FROM dbt_coinhistory WHERE market_symbol = ? ORDER BY id DESC LIMIT 1",
                [pair.market_symbol]
            );
            const prevClose = prevRow?.last_price ? parseFloat(prevRow.last_price) : currentPrice;

            const [[h1High]] = await pool.query(
                "SELECT COALESCE(MAX(bid_price), ?) AS v FROM dbt_biding_log WHERE market_symbol = ? AND success_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)",
                [currentPrice, pair.market_symbol]
            );
            const [[h1Low]] = await pool.query(
                "SELECT COALESCE(MIN(bid_price), ?) AS v FROM dbt_biding_log WHERE market_symbol = ? AND success_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)",
                [currentPrice, pair.market_symbol]
            );
            const [[h1Vol]] = await pool.query(
                "SELECT COALESCE(SUM(complete_qty), 0) AS v FROM dbt_biding_log WHERE market_symbol = ? AND bid_type = 'BUY' AND success_time >= DATE_SUB(NOW(), INTERVAL 1 HOUR)",
                [pair.market_symbol]
            );

            const [[h24High]] = await pool.query(
                "SELECT COALESCE(MAX(bid_price), ?) AS v FROM dbt_biding_log WHERE market_symbol = ? AND success_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
                [currentPrice, pair.market_symbol]
            );
            const [[h24Low]] = await pool.query(
                "SELECT COALESCE(MIN(bid_price), ?) AS v FROM dbt_biding_log WHERE market_symbol = ? AND success_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
                [currentPrice, pair.market_symbol]
            );
            const [[h24Vol]] = await pool.query(
                "SELECT COALESCE(SUM(complete_qty), 0) AS v FROM dbt_biding_log WHERE market_symbol = ? AND bid_type = 'BUY' AND success_time >= DATE_SUB(NOW(), INTERVAL 24 HOUR)",
                [pair.market_symbol]
            );

            await pool.query(
                `INSERT INTO dbt_coinhistory
                 (coin_symbol, market_symbol, last_price,
                  price_high_1h, price_low_1h, price_change_1h, volume_1h,
                  price_high_24h, price_low_24h, price_change_24h, volume_24h,
                  open, close, volumefrom, volumeto, date)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    coinSymbol, pair.market_symbol, currentPrice,
                    h1High.v, h1Low.v, (currentPrice - prevClose), h1Vol.v,
                    h24High.v, h24Low.v, (currentPrice - prevClose), h24Vol.v,
                    prevClose, currentPrice,
                    h24Vol.v, h24Vol.v
                ]
            );

            if (io) {
                io.to(pair.market_symbol).emit('price_update', {
                    market_symbol  : pair.market_symbol,
                    coin_symbol    : coinSymbol,
                    price          : currentPrice,
                    price_change_1h: currentPrice - prevClose,
                    price_change_24h: currentPrice - prevClose,
                    high_24h       : parseFloat(h24High.v),
                    low_24h        : parseFloat(h24Low.v),
                    volume_24h     : parseFloat(h24Vol.v),
                    timestamp      : now.getTime()
                });
            }
        }
    } catch (err) {
        console.error('[priceFeed] tick error:', err.message);
    }
}

function startPriceFeed(io, intervalMs = 5000) {
    console.log('[priceFeed] Starting live price feed, interval:', intervalMs, 'ms');
    priceTick(io);
    const timer = setInterval(() => priceTick(io), intervalMs);
    return () => clearInterval(timer);
}

module.exports = { startPriceFeed };
