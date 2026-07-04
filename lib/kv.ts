import { kv } from '@vercel/kv';

export type LeaseListing = {
  handleId: string;
  ownerNametag: string;
  currentHolderNametag: string | null;
  leaseDurationSeconds: number;
  leaseExpiresAt: number;
  minStartingBidUCT: string;
  highestBid: { bidderNametag: string; amountUCT: string } | null;
  status: 'open' | 'leased';
};

export const kvClient = kv;
