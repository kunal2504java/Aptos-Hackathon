import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="py-12 flex flex-col items-center text-center">
      <div className="mb-10 relative">
        <h1 className="text-7xl font-pixel mb-4 relative z-10">
          <span className="text-green-400">Omni</span>
          <span className="text-yellow-400">Bets</span>
        </h1>
        {/* <div className="absolute -top-4 -left-2 w-full h-full bg-gray-800 -z-10 pixelated-border "></div> */}
      </div>

      <p className="text-5xl font-mono max-w-4xl mb-8">
        The first Aptos-native prediction market powered by Move smart contracts and LMSR strategy. 
        Bet on anything with secure, transparent, and efficient markets built on Aptos blockchain.
      </p>

      <div className="flex justify-center gap-6 mt-8">
        <Link
          href="/aptos"
          className="px-6 py-3 bg-green-600 text-black font-pixel rounded pixelated-border hover:bg-green-500 transition-colors flex items-center"
        >
          🚀 Launch Aptos App <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
        <Link
          href="/markets"
          className="px-6 py-3 bg-blue-600 text-white font-pixel rounded pixelated-border hover:bg-blue-500 transition-colors flex items-center"
        >
          📊 Explore Markets <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
        <Link
          href="/aptos?tab=marketplace"
          className="px-6 py-3 bg-purple-600 text-white font-pixel rounded pixelated-border hover:bg-purple-500 transition-colors flex items-center"
        >
          🏪 NFT Marketplace
        </Link>
        <Link
          href="/aptos?tab=lending"
          className="px-6 py-3 bg-orange-600 text-white font-pixel rounded pixelated-border hover:bg-orange-500 transition-colors flex items-center"
        >
          💎 NFT Lending
        </Link>
      </div>
    </section>
  );
}
