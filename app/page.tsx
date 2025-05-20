"use client";

import { useWallet } from './context/WalletContext';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export default function LandingPage() {
  const { address, connectWallet } = useWallet();
  const router = useRouter();

  return (
    <div className="bg-[#0a192f] text-white min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-8 py-4 bg-[#0a2540] shadow-md">
        <h1 className="text-2xl font-bold text-[#64ffda]">Organ DApp</h1>
        <ul className="flex gap-6 font-medium">
          <li className="hover:text-[#64ffda] cursor-pointer">Home</li>
          <li className="hover:text-[#64ffda] cursor-pointer">About</li>
          <li className="hover:text-[#64ffda] cursor-pointer">Contact</li>
        </ul>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center text-center py-16 px-4">
        <h2 className="text-4xl font-bold mb-4">
          Decentralized Organ Donation Platform
        </h2>
        <p className="text-lg max-w-xl text-gray-300 mb-6">
          Transparent, secure, and efficient management of organ donation using
          blockchain technology.
        </p>
        <Button 
          onClick={connectWallet}
          className="bg-[#64ffda] text-black hover:bg-[#52e0c4] px-6 py-2"
        >
          {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
        </Button>
      </section>

      {/* Login Cards */}
      <section className="flex flex-col items-center justify-center py-12 px-4">
        <Link href="/login">
          <Button className="bg-[#64ffda] text-black text-lg px-10 py-4 rounded-xl shadow-lg hover:bg-[#52e0c4] transition-all">
            Login / Sign Up
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-[#0a2540] text-gray-400 py-6 text-center text-sm mt-auto">
        © {new Date().getFullYear()} Organ Donation DApp. All rights reserved.
      </footer>
    </div>
  );
}
