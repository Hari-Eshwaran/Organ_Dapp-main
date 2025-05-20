"use client";

import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { ethers } from 'ethers';
import OrganDonationArtifact from '../artifacts/contracts/OrganDonation.sol/OrganDonation.json';
import { contractAddress } from '../config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

export default function UnifiedLogin() {
  const { connectWallet, address, setRole } = useWallet();
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'donor' | 'patient' | 'admin'>('donor');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const verifyDonor = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        OrganDonationArtifact.abi,
        signer
      );

      const donor = await contract.donors(address);
      if (!donor.isRegistered) {
        throw new Error('Address not registered as a donor');
      }

      if (!donor.isVerified) {
        throw new Error('Donor account not verified yet');
      }

      return true;
    } catch (error) {
      console.error('Error verifying donor:', error);
      return false;
    }
  };

  const verifyPatient = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        OrganDonationArtifact.abi,
        signer
      );

      const patient = await contract.patients(address);
      if (!patient.patientAddress || patient.patientAddress === ethers.ZeroAddress) {
        throw new Error('Address not registered as a patient');
      }

      if (!patient.verified) {
        throw new Error('Patient account not verified yet');
      }

      return true;
    } catch (error: any) {
      console.error('Error verifying patient:', error);
      if (error.message.includes('not registered')) {
        throw new Error('Address not registered as a patient');
      } else if (error.message.includes('not verified')) {
        throw new Error('Patient account not verified yet');
      } else {
        throw new Error('Failed to verify patient status');
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
      switch (selectedRole) {
        case 'donor':
          const isDonorVerified = await verifyDonor();
          if (!isDonorVerified) {
            setError('Not registered or not verified as a donor');
            setLoading(false);
            return;
          }
          setRole('DONOR');
          router.push('/donor/dashboard');
          break;

        case 'patient':
          await verifyPatient();
          setRole('RECIPIENT');
          router.push('/patient/dashboard');
          break;

        case 'admin':
          if (formData.username !== ADMIN_CREDENTIALS.username || 
              formData.password !== ADMIN_CREDENTIALS.password) {
            setError('Invalid admin credentials');
            setLoading(false);
            return;
          }
          setRole('ADMIN');
          router.push('/admin/dashboard');
          break;
      }
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
          <CardTitle className="text-3xl font-bold text-center text-[#64ffda]">Login</CardTitle>
          <CardDescription className="text-center text-gray-400">
            Choose your role and connect your wallet to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="donor" className="w-full" onValueChange={(value) => setSelectedRole(value as 'donor' | 'patient' | 'admin')}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="donor" className="data-[state=active]:bg-[#64ffda] data-[state=active]:text-black">
                Donor
              </TabsTrigger>
              <TabsTrigger value="patient" className="data-[state=active]:bg-[#64ffda] data-[state=active]:text-black">
                Patient
              </TabsTrigger>
              <TabsTrigger value="admin" className="data-[state=active]:bg-[#64ffda] data-[state=active]:text-black">
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="donor">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-[#1d2d50] border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#64ffda]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
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
                    {loading ? 'Verifying...' : 'Login as Donor'}
                  </Button>

                  <div className="text-center mt-4">
                    <p className="text-gray-400">
                      Don't have an account?{' '}
                      <Link href="/donor/register" className="text-[#64ffda] hover:underline">
                        Register here
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="patient">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-[#1d2d50] border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#64ffda]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
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
                    {loading ? 'Verifying...' : 'Login as Patient'}
                  </Button>

                  <div className="text-center mt-4">
                    <p className="text-gray-400">
                      Don't have an account?{' '}
                      <Link href="/patient/register" className="text-[#64ffda] hover:underline">
                        Register here
                      </Link>
                    </p>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="admin">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Admin Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-[#1d2d50] border border-gray-600 rounded-md px-4 py-2 text-white focus:outline-none focus:border-[#64ffda]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
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
                    {loading ? 'Verifying...' : 'Login as Admin'}
                  </Button>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 