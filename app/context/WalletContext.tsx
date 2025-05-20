"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Web3Modal from 'web3modal';
import OrganDonationArtifact from '../artifacts/contracts/OrganDonation.sol/OrganDonation.json';
import { contractAddress } from '../config';

// Define the Role type
type Role = 'NONE' | 'DONOR' | 'RECIPIENT' | 'ADMIN' | 'HOSPITAL';

// Define the context type
interface WalletContextType {
  address: string | null;
  role: Role;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  setRole: (role: Role) => void;
}

// Create the context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Create the provider component
export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [role, setRole] = useState<Role>('NONE');

  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal({
        cacheProvider: true,
        providerOptions: {},
      });

      const connection = await web3Modal.connect();
      const provider = new ethers.BrowserProvider(connection);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      const contract = new ethers.Contract(
        "0x5FbDB2315678afecb367f032d93F642f64180337", // Replace with your deployed contract address or load dynamically
        OrganDonationArtifact.abi,
        signer
      );
      
      setAddress(address);

      // Determine user role
      let userRole = 0; // Default to Role.None (0)
      const rolesInterface = new ethers.Interface(OrganDonationArtifact.abi);
      const rolesData = rolesInterface.encodeFunctionData("roles", [address]);

      try {
        // Call the roles function directly via the provider
        const result = await provider.call({
          to: contract.getAddress(), // Use the contract's address
          data: rolesData // Encoded function data
        });
        console.log("WalletContext DEBUG: Raw result from roles call:", result);

        // Decode the result
        // If the result is "0x", it means the address is not in the mapping, which corresponds to Role.None (0)
        if (result === "0x") {
            userRole = 0;
        } else {
            const decodedResult = rolesInterface.decodeFunctionResult("roles", result);
            userRole = decodedResult[0]; // The role value is the first element
        }

        console.log("WalletContext DEBUG: Decoded user role value:", userRole);
      } catch (roleError: any) {
        console.error("WalletContext ERROR: Failed to fetch or decode user role:", roleError);
        // If fetching role fails, assume NONE or handle appropriately
        // The default userRole = 0 (NONE) will be used
      }

      switch (userRole) {
        case 1: // Donor
          setRole('DONOR');
          break;
        case 2: // Patient
          setRole('RECIPIENT');
          break;
        case 3: // Admin
          setRole('ADMIN');
          break;
        case 4: // Hospital
          setRole('HOSPITAL');
          break;
        default:
          setRole('NONE');
      }

      // Set up event listeners for wallet changes
      connection.on('accountsChanged', (accounts: string[]) => {
        setAddress(accounts[0]);
        window.location.reload();
      });

      connection.on('chainChanged', () => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setRole('NONE');
  };

  // Check if wallet is already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        role,
        connectWallet,
        disconnectWallet,
        setRole,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

// Create a custom hook to use the wallet context
export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 