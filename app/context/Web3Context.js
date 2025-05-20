'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getContract, connectWallet } from '../utils/contract';

const Web3Context = createContext();

export function Web3Provider({ children }) {
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);

  const connect = async () => {
    try {
      setError(null);
      const signer = await connectWallet();
      const contract = await getContract(signer);
      const address = await signer.getAddress();
      const network = await signer.provider.getNetwork();
      
      setAccount(address);
      setContract(contract);
      setChainId(network.chainId);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError(error.message);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setContract(null);
    setChainId(null);
  };

  useEffect(() => {
    const init = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          await connect();
          
          window.ethereum.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
              disconnect();
            } else {
              await connect();
            }
          });

          window.ethereum.on('chainChanged', async () => {
            await connect();
          });
        }
      } catch (error) {
        console.error('Error initializing Web3:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    init();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, []);

  return (
    <Web3Context.Provider 
      value={{ 
        account, 
        contract, 
        loading, 
        error, 
        chainId,
        connect,
        disconnect
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
} 