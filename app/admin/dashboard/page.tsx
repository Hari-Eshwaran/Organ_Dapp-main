"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../../contracts/OrganDonation-updated';
import { Button } from "../../../components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";

interface Donor {
  donorAddress: string;
  name: string;
  bloodType: string;
  organs: string[];
  location: string;
  deceased: boolean;
  hospitalVerified: boolean;
  adminVerified: boolean;
  ipfsHash: string;
}

interface Patient {
  patientAddress: string;
  name: string;
  bloodType: string;
  neededOrgan: string;
  urgency: string;
  location: string;
  hospitalVerified: boolean;
  adminVerified: boolean;
  ipfsHash: string;
}

interface Match {
  donorAddress: string;
  patientAddress: string;
  organType: string;
  matchScore: number;
  distance: number;
}

export default function AdminDashboard() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('verification');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalPatients: 0,
    totalMatches: 0,
    pendingHospitalVerifications: 0,
    pendingAdminVerifications: 0
  });

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) throw new Error('MetaMask is not installed');

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      const donorAddresses: string[] = await contract.getDonorList();
      const patientAddresses: string[] = await contract.getPatientList();

      const donorsData = await Promise.all(
        donorAddresses.map(async (address: string) => {
          const donor = await contract.donors(address);
          return {
            donorAddress: address,
            name: donor.name,
            bloodType: donor.bloodType,
            organs: donor.organs,
            location: donor.location,
            deceased: donor.deceased,
            hospitalVerified: donor.hospitalVerified,
            adminVerified: donor.adminVerified,
            ipfsHash: donor.ipfsHash
          };
        })
      );

      const patientsData = await Promise.all(
        patientAddresses.map(async (address: string) => {
          const patient = await contract.patients(address);
          return {
            patientAddress: address,
            name: patient.name,
            bloodType: patient.bloodType,
            neededOrgan: patient.neededOrgan,
            urgency: patient.urgency,
            location: patient.location,
            hospitalVerified: patient.hospitalVerified,
            adminVerified: patient.adminVerified,
            ipfsHash: patient.ipfsHash
          };
        })
      );

      setDonors(donorsData);
      setPatients(patientsData);

      // Calculate statistics
      setStats({
        totalDonors: donorsData.length,
        totalPatients: patientsData.length,
        totalMatches: matches.length,
        pendingHospitalVerifications: 
          donorsData.filter(d => !d.hospitalVerified).length + 
          patientsData.filter(p => !p.hospitalVerified).length,
        pendingAdminVerifications: 
          donorsData.filter(d => d.hospitalVerified && !d.adminVerified).length + 
          patientsData.filter(p => p.hospitalVerified && !p.adminVerified).length
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const hospitalVerifyUser = async (userAddress: string, role: 'donor' | 'patient') => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.hospitalVerifyUser(
        userAddress,
        role === 'donor' ? 1 : 2 // Role.Donor = 1, Role.Patient = 2
      );
      await tx.wait();
      
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify user');
    } finally {
      setLoading(false);
    }
  };

  const adminVerifyUser = async (userAddress: string, role: 'donor' | 'patient') => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.adminVerifyUser(
        userAddress,
        role === 'donor' ? 1 : 2 // Role.Donor = 1, Role.Patient = 2
      );
      await tx.wait();
      
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to verify user');
    } finally {
      setLoading(false);
    }
  };

  const markDonorDeceased = async (donorAddress: string) => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      const tx = await contract.markDonorDeceased(donorAddress);
      await tx.wait();
      
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to mark donor as deceased');
    } finally {
      setLoading(false);
    }
  };

  const initiateOrganMatching = async (donorAddress: string) => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      
      // Find matching patients based on blood type and needed organ
      const donor = donors.find(d => d.donorAddress === donorAddress);
      if (!donor) throw new Error('Donor not found');
      
      const matchingPatients = patients.filter(p => 
        p.bloodType === donor.bloodType && 
        p.hospitalVerified && 
        p.adminVerified
      );
      
      // For each matching patient, mark the organ as matched
      for (const patient of matchingPatients) {
        const tx = await contract.markOrganAsMatched(donorAddress, patient.patientAddress);
        await tx.wait();
      }
      
      await loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate organ matching');
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
  }, [address]);

  return (
    <div className="bg-[#0a192f] text-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#64ffda]">Admin Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#112240] border-gray-700">
            <CardHeader>
              <CardTitle className="text-[#64ffda]">Total Donors</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalDonors}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#112240] border-gray-700">
            <CardHeader>
              <CardTitle className="text-[#64ffda]">Total Patients</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalPatients}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#112240] border-gray-700">
            <CardHeader>
              <CardTitle className="text-[#64ffda]">Total Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalMatches}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#112240] border-gray-700">
            <CardHeader>
              <CardTitle className="text-[#64ffda]">Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingHospitalVerifications + stats.pendingAdminVerifications}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[#112240]">
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="records">Records</TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Hospital Verification Section */}
              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Hospital Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">Pending Hospital Verifications</h3>
                  
                  {/* Unverified Donors */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Donors</h4>
                    {donors.filter(d => !d.hospitalVerified).map((donor) => (
                      <div key={donor.donorAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                        <p className="font-bold">{donor.name}</p>
                        <p>Blood Type: {donor.bloodType}</p>
                        <p>Location: {donor.location}</p>
                        <Button
                          onClick={() => hospitalVerifyUser(donor.donorAddress, 'donor')}
                          className="mt-2 bg-[#64ffda] text-black hover:bg-[#52e0c4]"
                          disabled={loading}
                        >
                          Verify Donor
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Unverified Patients */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Patients</h4>
                    {patients.filter(p => !p.hospitalVerified).map((patient) => (
                      <div key={patient.patientAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                        <p className="font-bold">{patient.name}</p>
                        <p>Blood Type: {patient.bloodType}</p>
                        <p>Needed Organ: {patient.neededOrgan}</p>
                        <p>Urgency: {patient.urgency}</p>
                        <Button
                          onClick={() => hospitalVerifyUser(patient.patientAddress, 'patient')}
                          className="mt-2 bg-[#64ffda] text-black hover:bg-[#52e0c4]"
                          disabled={loading}
                        >
                          Verify Patient
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Admin Verification Section */}
              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Admin Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">Pending Admin Verifications</h3>
                  
                  {/* Hospital Verified Donors */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Donors</h4>
                    {donors.filter(d => d.hospitalVerified && !d.adminVerified).map((donor) => (
                      <div key={donor.donorAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                        <p className="font-bold">{donor.name}</p>
                        <p>Blood Type: {donor.bloodType}</p>
                        <p>Location: {donor.location}</p>
                        <Button
                          onClick={() => adminVerifyUser(donor.donorAddress, 'donor')}
                          className="mt-2 bg-[#64ffda] text-black hover:bg-[#52e0c4]"
                          disabled={loading}
                        >
                          Verify Donor
                        </Button>
                      </div>
                    ))}
                  </div>

                  {/* Hospital Verified Patients */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Patients</h4>
                    {patients.filter(p => p.hospitalVerified && !p.adminVerified).map((patient) => (
                      <div key={patient.patientAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                        <p className="font-bold">{patient.name}</p>
                        <p>Blood Type: {patient.bloodType}</p>
                        <p>Needed Organ: {patient.neededOrgan}</p>
                        <p>Urgency: {patient.urgency}</p>
                        <Button
                          onClick={() => adminVerifyUser(patient.patientAddress, 'patient')}
                          className="mt-2 bg-[#64ffda] text-black hover:bg-[#52e0c4]"
                          disabled={loading}
                        >
                          Verify Patient
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Donors Tab */}
          <TabsContent value="donors" className="space-y-4">
            <Card className="bg-[#112240] border-gray-700">
              <CardHeader>
                <CardTitle className="text-[#64ffda]">Donor Management</CardTitle>
              </CardHeader>
              <CardContent>
                {donors.map((donor) => (
                  <div key={donor.donorAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                    <p className="font-bold">{donor.name}</p>
                    <p>Blood Type: {donor.bloodType}</p>
                    <p>Location: {donor.location}</p>
                    <p>Status: {donor.deceased ? "Deceased" : "Active"}</p>
                    <p>Verification: {
                      donor.adminVerified ? "Fully Verified" :
                      donor.hospitalVerified ? "Hospital Verified" :
                      "Not Verified"
                    }</p>
                    <div className="flex space-x-2 mt-2">
                      {!donor.deceased && (
                        <Button
                          onClick={() => markDonorDeceased(donor.donorAddress)}
                          className="bg-red-500 hover:bg-red-600 text-white"
                          disabled={loading}
                        >
                          Mark as Deceased
                        </Button>
                      )}
                      {donor.deceased && (
                        <Button
                          onClick={() => initiateOrganMatching(donor.donorAddress)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                          disabled={loading}
                        >
                          Initiate Organ Matching
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Patients Tab */}
          <TabsContent value="patients" className="space-y-4">
            <Card className="bg-[#112240] border-gray-700">
              <CardHeader>
                <CardTitle className="text-[#64ffda]">Patient Management</CardTitle>
              </CardHeader>
              <CardContent>
                {patients.map((patient) => (
                  <div key={patient.patientAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                    <p className="font-bold">{patient.name}</p>
                    <p>Blood Type: {patient.bloodType}</p>
                    <p>Needed Organ: {patient.neededOrgan}</p>
                    <p>Urgency: {patient.urgency}</p>
                    <p>Verification: {
                      patient.adminVerified ? "Fully Verified" :
                      patient.hospitalVerified ? "Hospital Verified" :
                      "Not Verified"
                    }</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Donor Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Total Donors: {stats.totalDonors}</p>
                  <p>Verified Donors: {donors.filter(d => d.hospitalVerified && d.adminVerified).length}</p>
                  <p>Deceased Donors: {donors.filter(d => d.deceased).length}</p>
                </CardContent>
              </Card>

              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Patient Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Total Patients: {stats.totalPatients}</p>
                  <p>Verified Patients: {patients.filter(p => p.hospitalVerified && p.adminVerified).length}</p>
                  <p>Critical Patients: {patients.filter(p => p.urgency === "4").length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Records Tab */}
          <TabsContent value="records" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Donor Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {donors.map((donor) => (
                    <div key={donor.donorAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                      <p className="font-bold">{donor.name}</p>
                      <p>Blood Type: {donor.bloodType}</p>
                      <p>Location: {donor.location}</p>
                      <p>Status: {donor.deceased ? "Deceased" : donor.hospitalVerified && donor.adminVerified ? "Fully Verified" : "Not Verified"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Patient Records</CardTitle>
                </CardHeader>
                <CardContent>
                  {patients.map((patient) => (
                    <div key={patient.patientAddress} className="p-4 border border-gray-700 rounded-lg mb-4">
                      <p className="font-bold">{patient.name}</p>
                      <p>Blood Type: {patient.bloodType}</p>
                      <p>Needed Organ: {patient.neededOrgan}</p>
                      <p>Urgency: {patient.urgency}</p>
                      <p>Status: {patient.hospitalVerified && patient.adminVerified ? "Fully Verified" : "Not Verified"}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 