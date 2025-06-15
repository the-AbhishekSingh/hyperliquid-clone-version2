"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (event: string, callback: (accounts: string[]) => void) => void;
      isMetaMask?: boolean;
      selectedAddress: string | null;
      enable: () => Promise<string[]>;
      _metamask: {
        isUnlocked: () => Promise<boolean>;
      };
    };
  }
}

interface Web3ContextType {
  account: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  isConnecting: boolean;
  error: string | null;
  balance: string;
  isDummyAccount: boolean;
  createDummyAccount: () => void;
}

const Web3Context = createContext<Web3ContextType>({
  account: null,
  connect: async () => {},
  disconnect: async () => {},
  isConnecting: false,
  error: null,
  balance: '0',
  isDummyAccount: false,
  createDummyAccount: () => {},
});

export function Web3Provider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState('0');
  const [isDummyAccount, setIsDummyAccount] = useState(false);
  const [isRequestPending, setIsRequestPending] = useState(false);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  const createDummyAccount = () => {
    try {
      const wallet = ethers.Wallet.createRandom();
      setAccount(wallet.address);
      setBalance('10000000');
      setIsDummyAccount(true);
      setError(null);
      setIsConnecting(false);
    } catch (err) {
      console.error('Error creating dummy account:', err);
      setError('Failed to create dummy account');
    }
  };

  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      setAccount(null);
      setBalance('0');
      setIsDummyAccount(false);
    } else {
      setAccount(accounts[0]);
      if (provider) {
        provider.getBalance(accounts[0]).then(bal => {
          setBalance(ethers.formatEther(bal));
        });
      }
    }
  }, [provider]);

  const handleChainChanged = useCallback(() => {
    window.location.reload();
  }, []);

  const connect = async () => {
    if (isRequestPending || isConnecting) {
      console.log('Connection request already pending');
      return;
    }

    if (typeof window.ethereum === 'undefined') {
      window.open('https://metamask.io/download/', '_blank');
      setError('Please install MetaMask to use this feature');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setIsDummyAccount(false);
    setIsRequestPending(true);

    try {
      setAccount(null);
      
      // Check if MetaMask is unlocked
      const isUnlocked = await window.ethereum._metamask.isUnlocked();
      if (!isUnlocked) {
        throw new Error('Please unlock your MetaMask wallet');
      }

      // Create provider
      const newProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(newProvider);

      // First check if we already have accounts
      let accounts: string[] = [];
      try {
        accounts = await newProvider.listAccounts();
      } catch (err) {
        console.log('No existing accounts found');
      }

      // If no accounts, request them
      if (accounts.length === 0) {
        try {
          // Wait for any pending requests to complete
          await new Promise(resolve => setTimeout(resolve, 1000));
          accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        } catch (err: any) {
          if (err.code === -32002) {
            setError('Please complete the pending MetaMask request first');
            setIsConnecting(false);
            setIsRequestPending(false);
            return;
          }
          throw err;
        }
      }
      
      if (accounts.length === 0) {
        throw new Error('No accounts found. Please unlock MetaMask.');
      }

      setAccount(accounts[0]);
      
      // Get balance
      const balance = await newProvider.getBalance(accounts[0]);
      setBalance(ethers.formatEther(balance));

      // Set up event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err?.message || 'Failed to connect wallet');
      setAccount(null);
      setBalance('0');
      setIsDummyAccount(false);
    } finally {
      setIsConnecting(false);
      setIsRequestPending(false);
    }
  };

  const disconnect = async () => {
    try {
      setAccount(null);
      setBalance('0');
      setIsDummyAccount(false);
      setError(null);
      setProvider(null);

      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }

      localStorage.removeItem('walletConnected');
      sessionStorage.removeItem('walletConnected');
    } catch (err) {
      console.error('Disconnect error:', err);
      setAccount(null);
      setBalance('0');
      setIsDummyAccount(false);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, [handleAccountsChanged, handleChainChanged]);

  return (
    <Web3Context.Provider value={{ 
      account, 
      connect, 
      disconnect, 
      isConnecting, 
      error,
      balance,
      isDummyAccount,
      createDummyAccount
    }}>
      {children}
    </Web3Context.Provider>
  );
}

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}; 