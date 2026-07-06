const connect = require('../config/Mysqlcon');

async function processMaturedStakes(io) {
    let conn;
    try {
        const pool = await connect();
        conn = await pool.getConnection();
        await conn.beginTransaction();

        const [matured] = await conn.query(
            `SELECT * FROM dbt_user_staking
             WHERE status = 'ACTIVE' AND maturity_date <= NOW()
             LIMIT 100`
        );

        if (!matured.length) {
            await conn.rollback();
            conn.release();
            return;
        }

        for (const stake of matured) {
            const principal = parseFloat(stake.stake_amount);
            const apr = parseFloat(stake.apr_percent);
            const days = parseInt(stake.duration_days);
            const reward = (principal * (apr / 100) * days) / 365;

            await conn.query(
                `UPDATE dbt_user_staking
                 SET reward_amount = ?, status = 'MATURED'
                 WHERE id = ? AND status = 'ACTIVE'`,
                [reward, stake.id]
            );

            if (io) {
                io.to(`user_${stake.user_id}`).emit('staking_matured', {
                    stake_id: stake.id,
                    plan_id: stake.plan_id,
                    reward,
                    principal,
                    total: principal + reward
                });
            }
        }

        await conn.commit();
        conn.release();
    } catch (err) {
        if (conn) { try { await conn.rollback(); } catch (_) {} conn.release(); }
        console.error('[stakingPayout] error:', err.message);
    }
}

function startStakingPayout(io, intervalMs = 60000) {
    console.log('[stakingPayout] Starting maturity payout job, interval:', intervalMs, 'ms');
    processMaturedStakes(io);
    const timer = setInterval(() => processMaturedStakes(io), intervalMs);
    return () => clearInterval(timer);
}

module.exports = { startStakingPayout };
