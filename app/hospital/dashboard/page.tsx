"use client";

import { useState, useEffect } from 'react';
import { useWallet } from '../../context/WalletContext';
import { ethers } from 'ethers';
import OrganDonationArtifact from '../../artifacts/contracts/OrganDonation.sol/OrganDonation.json';
import { contractAddress } from '../../config';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function HospitalDashboard() {
  const { address } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('verification');
  const [donors, setDonors] = useState<Donor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState({
    totalDonors: 0,
    totalPatients: 0,
    pendingVerifications: 0
  });

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      if (!window.ethereum) throw new Error('MetaMask is not installed');

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        contractAddress,
        OrganDonationArtifact.abi,
        signer
      );

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

      setStats({
        totalDonors: donorsData.length,
        totalPatients: patientsData.length,
        pendingVerifications: 
          donorsData.filter(d => !d.hospitalVerified).length + 
          patientsData.filter(p => !p.hospitalVerified).length
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
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddress, OrganDonationArtifact.abi, signer);
      
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

  useEffect(() => {
    if (address) {
      loadDashboardData();
    }
  }, [address]);

  return (
    <div className="bg-[#0a192f] text-white min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-[#64ffda]">Hospital Dashboard</h1>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
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
              <CardTitle className="text-[#64ffda]">Pending Verifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.pendingVerifications}</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-[#112240]">
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="donors">Donors</TabsTrigger>
            <TabsTrigger value="patients">Patients</TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Donor Verification Section */}
              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Donor Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">Pending Donor Verifications</h3>
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
                </CardContent>
              </Card>

              {/* Patient Verification Section */}
              <Card className="bg-[#112240] border-gray-700">
                <CardHeader>
                  <CardTitle className="text-[#64ffda]">Patient Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <h3 className="text-lg font-semibold mb-4">Pending Patient Verifications</h3>
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
        </Tabs>
      </div>
    </div>
  );
} 