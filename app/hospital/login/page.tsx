"use client";

import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ethers } from 'ethers';
import OrganDonationArtifact from '../../artifacts/contracts/OrganDonation.sol/OrganDonation.json';
import { contractAddress } from '../../config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HospitalLogin() {
  const { connectWallet, address, setRole } = useWallet();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const verifyHospital = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        OrganDonationArtifact.abi,
        signer
      );

      const hospital = await contract.hospitals(address);
      if (!hospital.hospitalAddress || hospital.hospitalAddress === ethers.ZeroAddress) {
        throw new Error('Address not registered as a hospital');
      }

      if (!hospital.isActive) {
        throw new Error('Hospital account is not active');
      }

      return true;
    } catch (error: any) {
      console.error('Error verifying hospital:', error);
      if (error.message.includes('not registered')) {
        throw new Error('Address not registered as a hospital');
      } else if (error.message.includes('not active')) {
        throw new Error('Hospital account is not active');
      } else {
        throw new Error('Failed to verify hospital status');
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!address) {
      setError('Please connect your wallet first');
      setLoading(false);
      return;
    }

    try {
      await verifyHospital();
      setRole('HOSPITAL');
      router.push('/hospital/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a192f] text-white min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#112240] border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-[#64ffda]">Hospital Login</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Connect your wallet to access the hospital dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!address ? (
            <div className="text-center">
              <p className="text-gray-400 mb-4">Please connect your wallet to continue</p>
              <Button 
                onClick={connectWallet}
                className="w-full bg-[#64ffda] text-black hover:bg-[#52e0c4]"
              >
                Connect Wallet
              </Button>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-[#64ffda] text-black hover:bg-[#52e0c4]"
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Login as Hospital'}
              </Button>

              <div className="text-center mt-4">
                <p className="text-gray-400">
                  Don't have an account?{' '}
                  <Link href="/hospital/register" className="text-[#64ffda] hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 