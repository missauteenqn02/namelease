import { NextResponse } from 'next/server';
import { kvClient, LeaseListing } from '@/lib/kv';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handleId, ownerNametag, leaseDurationSeconds, minStartingBidUCT } = body;

    if (!handleId || !ownerNametag || !leaseDurationSeconds || !minStartingBidUCT) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const key = `lease:${handleId}`;
    const existing = await kvClient.get(key);
    
    if (existing) {
      return NextResponse.json({ success: false, error: 'Handle already registered in pool' }, { status: 400 });
    }

    const newListing: LeaseListing = {
      handleId,
      ownerNametag,
      currentHolderNametag: null,
      leaseDurationSeconds: parseInt(leaseDurationSeconds),
      leaseExpiresAt: Math.floor(Date.now() / 1000) + parseInt(leaseDurationSeconds),
      minStartingBidUCT,
      highestBid: null,
      status: 'open'
    };

    await kvClient.set(key, newListing);

    return NextResponse.json({ success: true, data: newListing });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
