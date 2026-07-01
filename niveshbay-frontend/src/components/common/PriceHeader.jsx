import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { formatINR } from '../../utils/formatCurrency';
import api from '../../api/axiosInstance';

export default function PriceHeader({ symbol }) {
  const { prices } = useSocket() || {};
  const prevPriceRef = useRef(null);

  const dbSymbol = symbol ? symbol.replace('-', '_') : 'SOL_INR';
  const normalizedSymbol = symbol?.replace(/[_/]/g, '-') || 'SOL-INR';
  const livePrice = prices?.[normalizedSymbol];

  const [price, setPrice] = useState(0);
  const [change, setChange] = useState(0);
  const [high, setHigh] = useState(0);
  const [low, setLow] = useState(0);
  const [vol, setVol] = useState(0);
  const [direction, setDirection] = useState('neutral');
  const [loaded, setLoaded] = useState(false);

  const fetchLatest = useCallback(async () => {
    try {
      const res = await api.get('/latest-price', { params: { market_symbol: dbSymbol } });
      if (res.data) {
        setPrice(parseFloat(res.data.price) || 0);
        if (res.data.change_percent_24h !== undefined) {
          setChange(parseFloat(res.data.change_percent_24h) || 0);
        } else if (res.data.change_24h !== undefined && res.data.price) {
          const raw = parseFloat(res.data.change_24h);
          const price = parseFloat(res.data.price);
          const prev = price - raw;
          setChange(prev > 0 ? (raw / prev) * 100 : 0);
        } else {
          setChange(0);
        }
        setHigh(parseFloat(res.data.high_24h) || 0);
        setLow(parseFloat(res.data.low_24h) || 0);
        setVol(parseFloat(res.data.volume_24h) || 0);
        setLoaded(true);
      }
    } catch {
      // fallback — will get data from socket
    }
  }, [dbSymbol]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  useEffect(() => {
    if (livePrice?.price !== undefined) {
      const newPrice = livePrice.price;
      if (prevPriceRef.current !== null) {
        if (newPrice > prevPriceRef.current) setDirection('up');
        else if (newPrice < prevPriceRef.current) setDirection('down');
      } else {
        setDirection('neutral');
      }
      prevPriceRef.current = newPrice;
      setPrice(newPrice);
      if (livePrice.change_percent_24h !== undefined) {
        setChange(livePrice.change_percent_24h);
      } else if (livePrice.price_change_24h !== undefined && livePrice.price) {
        const prev = livePrice.price - livePrice.price_change_24h;
        setChange(prev > 0 ? (livePrice.price_change_24h / prev) * 100 : 0);
      }
      if (livePrice.high_24h !== undefined) setHigh(livePrice.high_24h);
      if (livePrice.low_24h !== undefined) setLow(livePrice.low_24h);
      if (livePrice.volume_24h !== undefined) setVol(livePrice.volume_24h);
      setLoaded(true);
    }
  }, [livePrice]);

  const isPositive = change >= 0;
  const priceColor = direction === 'up' ? '#0ecb81' : direction === 'down' ? '#f6465d' : (isPositive ? '#0ecb81' : '#f6465d');

  if (!loaded) {
    return (
      <div className="flex items-center gap-4 px-4 py-1.5 bg-[#0b0f19] border-b border-[#1e2433] text-xs">
        <span className="text-white font-bold text-sm">{symbol?.replace('-', '/') || 'SOL/INR'}</span>
        <span className="text-lg font-bold text-[#848e9c]">--</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-[#0b0f19] border-b border-[#1e2433] text-xs">
      <span className="text-white font-bold text-sm">{symbol?.replace('-', '/') || 'SOL/INR'}</span>
      <span className="text-lg font-bold" style={{ color: priceColor }}>
        {price ? formatINR(price) : '--'}
      </span>
      <span className={isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
        {change ? `${isPositive ? '+' : ''}${Number(change).toFixed(2)}%` : '--'}
      </span>
      <span className="text-[#848e9c]">24h High: <span className="text-white">{high ? formatINR(high) : '--'}</span></span>
      <span className="text-[#848e9c]">24h Low: <span className="text-white">{low ? formatINR(low) : '--'}</span></span>
      <span className="text-[#848e9c]">24h Vol: <span className="text-white">{vol ? Number(vol).toLocaleString('en-IN') : '--'}</span></span>
    </div>
  );
}
