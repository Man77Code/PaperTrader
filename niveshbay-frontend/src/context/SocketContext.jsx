import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [prices, setPrices] = useState({});
  const [orderBookUpdates, setOrderBookUpdates] = useState(null);
  const [tradeUpdates, setTradeUpdates] = useState([]);
  const [balanceUpdate, setBalanceUpdate] = useState(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
    });
    socket.on('disconnect', () => setConnected(false));

    socket.on('price_update', (data) => {
      setPrices(prev => ({ ...prev, [data.market_symbol?.replace('_', '-')]: data }));
    });

    socket.on('orderbook_update', (data) => {
      setOrderBookUpdates(data);
    });

    socket.on('market_trade', (data) => {
      setTradeUpdates(prev => [data, ...prev].slice(0, 50));
    });

    socket.on('balance_update', (data) => {
      setBalanceUpdate(data);
    });

    return () => {
      socket.disconnect();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (connected && user?.user_id && socketRef.current) {
      socketRef.current.emit('subscribe_user', user.user_id);
    }
  }, [connected, user?.user_id]);

  const subscribeMarket = useCallback((marketSymbol) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_market', marketSymbol);
    }
  }, []);

  const unsubscribeMarket = useCallback((marketSymbol) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_market', marketSymbol);
    }
  }, []);

  const subscribeUser = useCallback((userId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe_user', userId);
    }
  }, []);

  const unsubscribeUser = useCallback((userId) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe_user', userId);
    }
  }, []);

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      prices,
      orderBookUpdates,
      tradeUpdates,
      balanceUpdate,
      subscribeMarket,
      unsubscribeMarket,
      subscribeUser,
      unsubscribeUser,
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
