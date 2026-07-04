import { NextResponse } from 'next/server';
import { kvClient, LeaseListing } from '@/lib/kv';
import { chargeUCT, issueLeaseToken, sendNotification } from '@/lib/sphere';

export const runtime = 'nodejs';

// Prevent caching to ensure cron always executes fresh
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // 1. Fetch all lease listings keys
    const keys = await kvClient.keys('lease:*');
    
    if (!keys || keys.length === 0) {
      return NextResponse.json({ success: true, message: 'No leases found' });
    }

    let processedCount = 0;
    const now = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

    // 2. Iterate and process expired leases
    for (const key of keys) {
      const lease = await kvClient.get<LeaseListing>(key);
      if (!lease) continue;

      // Check if expired
      if (lease.leaseExpiresAt <= now) {
        if (lease.highestBid) {
          // [AGENTIC-DECISION] We have a winner!
          const winner = lease.highestBid.bidderNametag;
          const oldHolder = lease.currentHolderNametag;
          const amount = lease.highestBid.amountUCT;

          // (a) charge UCT
          await chargeUCT(winner, amount);
          
          // (b) issue bearer token
          await issueLeaseToken(winner, lease.handleId);

          // (c) Update listing
          lease.currentHolderNametag = winner;
          lease.status = 'leased';
          lease.leaseExpiresAt = now + lease.leaseDurationSeconds;
          lease.highestBid = null; // Reset bid for the NEXT period

          await kvClient.set(key, lease);

          // (d) Send DMs
          await sendNotification(winner, `Congratulations! You won the lease for @${lease.handleId}.`);
          if (oldHolder && oldHolder !== winner) {
            await sendNotification(oldHolder, `Your lease for @${lease.handleId} has expired and was transferred to @${winner}.`);
          }

          console.log(`[Cron] Transferred lease ${lease.handleId} to ${winner}`);
        } else {
          // No bids - just wait for someone to bid, update state to open
          if (lease.status !== 'open') {
            lease.status = 'open';
            lease.currentHolderNametag = null; // Reverts back to owner effectively
            await kvClient.set(key, lease);
            console.log(`[Cron] Lease ${lease.handleId} expired with no bids. Reverted to open.`);
          }
        }
        processedCount++;
      }
    }

    return NextResponse.json({ success: true, processedCount });
  } catch (error: any) {
    console.error('[Cron] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
