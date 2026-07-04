import { NextResponse } from 'next/server';
import { kvClient, LeaseListing } from '@/lib/kv';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { handleId, bidderNametag, amountUCT } = body;

    if (!handleId || !bidderNametag || !amountUCT) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const key = `lease:${handleId}`;
    const lease = await kvClient.get<LeaseListing>(key);
    
    if (!lease) {
      return NextResponse.json({ success: false, error: 'Lease not found' }, { status: 404 });
    }

    const bidAmount = parseFloat(amountUCT);
    const currentHigh = lease.highestBid ? parseFloat(lease.highestBid.amountUCT) : 0;
    const minBid = parseFloat(lease.minStartingBidUCT);

    if (bidAmount < minBid) {
      return NextResponse.json({ success: false, error: `Bid must be at least ${minBid} UCT` }, { status: 400 });
    }

    if (bidAmount <= currentHigh) {
      return NextResponse.json({ success: false, error: `Bid must be higher than current highest bid (${currentHigh} UCT)` }, { status: 400 });
    }

    lease.highestBid = {
      bidderNametag,
      amountUCT: bidAmount.toString()
    };

    await kvClient.set(key, lease);

    return NextResponse.json({ success: true, data: lease });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
