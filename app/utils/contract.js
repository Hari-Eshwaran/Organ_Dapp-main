import { ethers } from 'ethers';
import { contractAddress } from '../config';
import OrganDonationArtifact from '../artifacts/contracts/OrganDonation.sol/OrganDonation.json';

const LOCAL_CHAIN_ID = 1337;

export const getContract = async (signer) => {
  try {
    const contract = new ethers.Contract(
      contractAddress,
      OrganDonationArtifact.abi,
      signer
    );
    return contract;
  } catch (error) {
    console.error('Error getting contract:', error);
    throw error;
  }
};

export const getProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return new ethers.BrowserProvider(window.ethereum);
  }
  return new ethers.JsonRpcProvider('http://127.0.0.1:8545');
};

export const getSigner = async () => {
  const provider = getProvider();
  return await provider.getSigner();
};

export const connectWallet = async () => {
  try {
    if (typeof window !== 'undefined' && window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      if (network.chainId !== BigInt(LOCAL_CHAIN_ID)) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${LOCAL_CHAIN_ID.toString(16)}` }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${LOCAL_CHAIN_ID.toString(16)}`,
                    chainName: 'Localhost',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18
                    },
                    rpcUrls: ['http://127.0.0.1:8545'],
                  },
                ],
              });
            } catch (addError) {
              throw new Error('Failed to add local network to MetaMask');
            }
          } else {
            throw new Error('Failed to switch to local network');
          }
        }
      }

      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      return signer;
    } else {
      throw new Error('Please install MetaMask!');
    }
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const handleContractError = (error) => {
  if (error.code === 'ACTION_REJECTED') {
    return 'Transaction was rejected by user';
  }
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for transaction';
  }
  if (error.message.includes('user rejected')) {
    return 'Transaction was rejected by user';
  }
  return error.message || 'An error occurred with the transaction';
}; 