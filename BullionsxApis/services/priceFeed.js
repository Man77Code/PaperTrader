const connect = require('../config/Mysqlcon');

async function priceTick(io) {
    try {
        const pool = await connect();
        const [pairs] = await pool.query("SELECT * FROM dbt_coinpair WHERE status = 1");
        if (!pairs.length) return;

        for (const pair of pairs) {
            const [[latest]] = await pool.query(
                `SELECT coin_symbol, last_price,
                        price_high_1h, price_low_1h, price_change_1h, volume_1h,
                        price_high_24h, price_low_24h, price_change_24h, volume_24h
                 FROM dbt_coinhistory
                 WHERE market_symbol = ?
                 ORDER BY id DESC LIMIT 1`,
                [pair.market_symbol]
            );
            if (!latest) continue;

            if (io) {
                const price = parseFloat(latest.last_price);
                const prevClose = price - parseFloat(latest.price_change_24h || 0);
                const changePercent24h = prevClose > 0 ? (parseFloat(latest.price_change_24h) / prevClose) * 100 : 0;

                io.to(pair.market_symbol).emit('price_update', {
                    market_symbol     : pair.market_symbol,
                    coin_symbol       : latest.coin_symbol,
                    price,
                    price_change_1h   : parseFloat(latest.price_change_1h),
                    price_change_24h  : parseFloat(latest.price_change_24h),
                    change_percent_24h: changePercent24h,
                    high_24h          : parseFloat(latest.price_high_24h),
                    low_24h           : parseFloat(latest.price_low_24h),
                    volume_24h        : parseFloat(latest.volume_24h),
                    timestamp         : Date.now()
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
