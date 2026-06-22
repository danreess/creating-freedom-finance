"use client";

import { useState, useCallback } from "react";
import Navbar from "@/components/Navbar";
import NetWorthCard from "@/components/NetWorthCard";
import AllocationChart from "@/components/AllocationChart";
import CoinSpotCard from "@/components/coinspot/CoinSpotCard";
import BankAccountsCard from "@/components/ing/BankAccountsCard";
import PearlerCard from "@/components/pearler/PearlerCard";
import MortgageCard from "@/components/mortgage/MortgageCard";

export default function Home() {
  const [coinspotTotal, setCoinspotTotal] = useState(0);
  const [ingTotal, setIngTotal] = useState(0);
  const [pearlerTotal, setPearlerTotal] = useState(0);
  const [mortgageTotal, setMortgageTotal] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCoinspotTotal = useCallback((v: number) => { setCoinspotTotal(v); setLastUpdated(new Date()); }, []);
  const handleIngTotal = useCallback((v: number) => { setIngTotal(v); setLastUpdated(new Date()); }, []);
  const handleMortgageTotal = useCallback((v: number) => { setMortgageTotal(v); setLastUpdated(new Date()); }, []);

  const handleRefresh = useCallback(() => {
    setCoinspotTotal(0); setIngTotal(0); setMortgageTotal(0);
    setRefreshKey((k) => k + 1); setLastUpdated(null);
  }, []);

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar onRefresh={handleRefresh} lastUpdated={lastUpdated} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <NetWorthCard
              coinspotTotal={coinspotTotal}
              ingTotal={ingTotal}
              pearlerTotal={pearlerTotal}
              mortgageTotal={mortgageTotal}
              isLoading={lastUpdated === null}
            />
          </div>
          <AllocationChart coinspotTotal={coinspotTotal} ingTotal={ingTotal} pearlerTotal={pearlerTotal} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <CoinSpotCard key={`coinspot-${refreshKey}`} onTotalChange={handleCoinspotTotal} />
          <BankAccountsCard key={`banks-${refreshKey}`} onTotalChange={handleIngTotal} />
          <PearlerCard onTotalChange={setPearlerTotal} />
          <MortgageCard key={`mortgage-${refreshKey}`} onTotalChange={handleMortgageTotal} />
        </div>
      </main>
    </div>
  );
}
