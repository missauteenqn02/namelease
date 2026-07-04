'use client';

import { useState, useEffect } from 'react';

type LeaseListing = {
  handleId: string;
  ownerNametag: string;
  currentHolderNametag: string | null;
  leaseDurationSeconds: number;
  leaseExpiresAt: number;
  minStartingBidUCT: string;
  highestBid: { bidderNametag: string; amountUCT: string } | null;
  status: 'open' | 'leased';
};

function Countdown({ expiresAt }: { expiresAt: number }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calcTime = () => {
      const now = Math.floor(Date.now() / 1000);
      return Math.max(0, expiresAt - now);
    };
    
    setTimeLeft(calcTime());
    
    const interval = setInterval(() => {
      setTimeLeft(calcTime());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  
  if (timeLeft === 0) return <span className="text-red-400 font-bold">Expired (Waiting for Agent)</span>;
  
  return (
    <span className="font-mono bg-white/10 px-2 py-1 rounded text-blue-300">
      {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </span>
  );
}

export default function Dashboard() {
  const [leases, setLeases] = useState<LeaseListing[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Registration form
  const [newHandle, setNewHandle] = useState('');
  const [ownerName, setOwnerName] = useState('');
  
  // Bidding states
  const [bidInputs, setBidInputs] = useState<Record<string, {name: string, amount: string}>>({});

  const fetchLeases = async () => {
    try {
      const res = await fetch('/api/lease/status');
      const data = await res.json();
      if (data.success) {
        setLeases(data.data.filter(Boolean)); // Filter out nulls if any
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeases();
    const interval = setInterval(fetchLeases, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/lease/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handleId: newHandle,
        ownerNametag: ownerName,
        leaseDurationSeconds: 120, // 2 minutes for demo
        minStartingBidUCT: '10'
      })
    });
    setNewHandle('');
    setOwnerName('');
    fetchLeases();
  };

  const handleBid = async (handleId: string) => {
    const bid = bidInputs[handleId];
    if (!bid || !bid.name || !bid.amount) return alert('Please enter name and amount');
    
    try {
      const res = await fetch('/api/lease/bid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handleId,
          bidderNametag: bid.name,
          amountUCT: bid.amount
        })
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.error);
      } else {
        fetchLeases();
      }
    } catch (e) {
      alert('Error placing bid');
    }
  };

  const updateBidInput = (handleId: string, field: 'name' | 'amount', value: string) => {
    setBidInputs(prev => ({
      ...prev,
      [handleId]: {
        ...(prev[handleId] || { name: '', amount: '' }),
        [field]: value
      }
    }));
  };

  return (
    <div className="w-full flex flex-col gap-12 animate-in fade-in duration-500">
      <section className="glass-panel w-full">
        <h2 className="text-2xl font-bold mb-4">Register Handle for Lease</h2>
        <form onSubmit={handleRegister} className="flex gap-4 items-end flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-1">Handle ID (e.g. alice-lease)</label>
            <input 
              required
              type="text" 
              className="input-field" 
              value={newHandle}
              onChange={e => setNewHandle(e.target.value)}
              placeholder="Handle name"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm text-gray-400 mb-1">Owner Nametag</label>
            <input 
              required
              type="text" 
              className="input-field"
              value={ownerName}
              onChange={e => setOwnerName(e.target.value)}
              placeholder="@yourname"
            />
          </div>
          <button type="submit" className="btn-primary h-[46px]">Register Pool</button>
        </form>
      </section>

      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          Active Markets
          {loading && <span className="text-sm font-normal text-gray-400 animate-pulse">Syncing...</span>}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {leases.length === 0 && !loading && (
            <div className="col-span-full text-center py-12 text-gray-500 glass-panel">
              No handles currently available for lease.
            </div>
          )}
          
          {leases.map(lease => {
            const currentHigh = lease.highestBid?.amountUCT || lease.minStartingBidUCT;
            
            return (
              <div key={lease.handleId} className="glass-panel flex flex-col gap-4 relative overflow-hidden">
                {lease.status === 'leased' && (
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    LEASED
                  </div>
                )}
                {lease.status === 'open' && (
                  <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                    OPEN
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-bold text-white">@{lease.handleId}</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Owner: {lease.ownerNametag}
                  </p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-3 grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-400">Current Holder:</div>
                  <div className="font-medium text-right text-purple-400">{lease.currentHolderNametag || 'None'}</div>
                  
                  <div className="text-gray-400">Time Left:</div>
                  <div className="text-right">
                    {lease.status === 'leased' ? (
                      <Countdown expiresAt={lease.leaseExpiresAt} />
                    ) : (
                      <span className="text-gray-500">Waiting for bids</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-400">Highest Bid for Next Cycle:</span>
                    <span className="font-bold text-green-400">{currentHigh} UCT</span>
                  </div>
                  
                  {lease.highestBid && (
                    <div className="text-xs text-right text-gray-500 mb-3">
                      by {lease.highestBid.bidderNametag}
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <input 
                      type="text" 
                      placeholder="Your Agent ID" 
                      className="input-field text-sm"
                      value={bidInputs[lease.handleId]?.name || ''}
                      onChange={e => updateBidInput(lease.handleId, 'name', e.target.value)}
                    />
                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder={`> ${currentHigh} UCT`} 
                        className="input-field text-sm flex-1"
                        value={bidInputs[lease.handleId]?.amount || ''}
                        onChange={e => updateBidInput(lease.handleId, 'amount', e.target.value)}
                      />
                      <button 
                        onClick={() => handleBid(lease.handleId)}
                        className="btn-primary text-sm whitespace-nowrap"
                      >
                        Place Bid
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
