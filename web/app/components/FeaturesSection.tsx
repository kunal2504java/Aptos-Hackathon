import { Zap, Globe, Lock, Coins, Code, Shield } from "lucide-react"

export default function FeaturesSection() {
  const features = [
    {
      icon: <Code className="w-8 h-8 mb-4" />,
      title: "Move Smart Contracts",
      description: "Built with Move language for maximum security and efficiency. Resource-oriented programming ensures safe and predictable market behavior.",
    },
    {
      icon: <Zap className="w-8 h-8 mb-4" />,
      title: "LMSR Strategy",
      description: "Logarithmic Market Scoring Rule provides efficient price discovery and liquidity for all markets on Aptos blockchain.",
    },
    {
      icon: <Globe className="w-8 h-8 mb-4" />,
      title: "Aptos Native",
      description: "Fully integrated with Aptos blockchain. Leverage Aptos's high throughput, low latency, and Move's safety guarantees.",
    },
    {
      icon: <Shield className="w-8 h-8 mb-4" />,
      title: "Secure & Transparent",
      description: "All markets are secured by Move smart contracts with transparent resolution mechanisms and immutable on-chain records.",
    },
    {
      icon: <Coins className="w-8 h-8 mb-4" />,
      title: "Automated Market Maker",
      description: "Our AMM ensures there's always liquidity for your bets, powered by Aptos's efficient transaction processing.",
    },
    {
      icon: <Lock className="w-8 h-8 mb-4" />,
      title: "NFT Integration",
      description: "Unique NFT rewards system with Move-based NFT marketplace and lending capabilities for enhanced gamification.",
    },
  ]

  return (
    <section className="py-8">
      <h2 className="text-2xl font-pixel mb-8 text-center">Why OmniBets?</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-gray-800 rounded-lg pixelated-border flex flex-col items-center text-center"
          >
            {feature.icon}
            <h3 className="text-lg font-pixel mb-2">{feature.title}</h3>
            <p className="font-mono">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

