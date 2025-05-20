"use client";

import { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../contracts/OrganDonation';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HospitalRegister() {
  const { connectWallet, address, setRole } = useWallet();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const registerHospital = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const tx = await contract.registerHospital(
        formData.name,
        formData.location,
        { gasLimit: 500000 }
      );

      await tx.wait();
      return true;
    } catch (error: any) {
      console.error('Error registering hospital:', error);
      throw new Error(error.message || 'Failed to register hospital');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!address) {
      setError('Please connect your wallet first');
      setLoading(false);
      return;
    }

    try {
      const success = await registerHospital();
      if (success) {
        setRole('HOSPITAL');
        router.push('/hospital/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#0a192f] text-white min-h-screen flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#112240] border-none">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-[#64ffda]">Hospital Registration</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Register your hospital to verify donors and patients
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
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
                  {error}
                </div>
              )}
              
              <div>
                <Label htmlFor="name">Hospital Name</Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-[#1d2d50] border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#64ffda]"
                  required
                />
              </div>

              <div>
                <Label htmlFor="location">Hospital Location</Label>
                <Input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-[#1d2d50] border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#64ffda]"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#64ffda] text-black hover:bg-[#52e0c4]"
                disabled={loading}
              >
                {loading ? 'Registering...' : 'Register Hospital'}
              </Button>

              <div className="text-center mt-4">
                <p className="text-gray-400">
                  Already registered?{' '}
                  <Link href="/hospital/login" className="text-[#64ffda] hover:underline">
                    Login here
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