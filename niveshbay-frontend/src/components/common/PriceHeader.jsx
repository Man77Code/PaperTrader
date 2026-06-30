import { useState, useEffect, useRef } from 'react';
import { useMarketData } from '../../hooks/useMarketData';
import { useSocket } from '../../context/SocketContext';
import { formatINR } from '../../utils/formatCurrency';

export default function PriceHeader({ symbol }) {
  const { activeCoin } = useMarketData(symbol);
  const { prices } = useSocket() || {};
  const prevPriceRef = useRef(null);

  const normalizedSymbol = symbol?.replace(/[_/]/g, '-') || 'SOL-INR';
  const livePrice = prices?.[normalizedSymbol];

  const [price, setPrice] = useState(activeCoin?.price || 0);
  const [change, setChange] = useState(activeCoin?.change_24h || 0);
  const [high, setHigh] = useState(activeCoin?.high_24h || 0);
  const [low, setLow] = useState(activeCoin?.low_24h || 0);
  const [vol, setVol] = useState(activeCoin?.volume_24h || 0);
  const [direction, setDirection] = useState('neutral');

  useEffect(() => {
    if (livePrice?.price !== undefined) {
      const newPrice = livePrice.price;
      if (prevPriceRef.current !== null) {
        if (newPrice > prevPriceRef.current) setDirection('up');
        else if (newPrice < prevPriceRef.current) setDirection('down');
      }
      prevPriceRef.current = newPrice;
      setPrice(newPrice);
      if (livePrice.price_change_24h !== undefined) setChange(livePrice.price_change_24h);
      if (livePrice.high_24h !== undefined) setHigh(livePrice.high_24h);
      if (livePrice.low_24h !== undefined) setLow(livePrice.low_24h);
      if (livePrice.volume_24h !== undefined) setVol(livePrice.volume_24h);
    } else if (activeCoin) {
      setPrice(activeCoin.price || 0);
      setChange(activeCoin.change_24h || 0);
      setHigh(activeCoin.high_24h || 0);
      setLow(activeCoin.low_24h || 0);
      setVol(activeCoin.volume_24h || 0);
    }
  }, [livePrice, activeCoin]);

  const isPositive = change >= 0;
  const priceColor = direction === 'up' ? '#0ecb81' : direction === 'down' ? '#f6465d' : (isPositive ? '#0ecb81' : '#f6465d');

  return (
    <div className="flex items-center gap-4 px-4 py-1.5 bg-[#0b0f19] border-b border-[#1e2433] text-xs">
      <span className="text-white font-bold text-sm">{symbol?.replace('-', '/') || 'SOL/INR'}</span>
      <span className="text-lg font-bold" style={{ color: priceColor }}>
        {price ? formatINR(price) : '--'}
      </span>
      <span className={isPositive ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>
        {change ? `${isPositive ? '+' : ''}${change?.toFixed(2)}%` : '--'}
      </span>
      <span className="text-[#848e9c]">24h High: <span className="text-white">{high ? formatINR(high) : '--'}</span></span>
      <span className="text-[#848e9c]">24h Low: <span className="text-white">{low ? formatINR(low) : '--'}</span></span>
      <span className="text-[#848e9c]">24h Vol: <span className="text-white">{vol ? vol?.toLocaleString('en-IN') : '--'}</span></span>
    </div>
  );
}
