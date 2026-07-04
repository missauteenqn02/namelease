# NameLease - Unicity Identity Leasing Marketplace

NameLease is a fully automated, decentralized marketplace allowing users to lease their Unicity identity nametags for fixed durations. When a lease expires, the highest bidder automatically wins the next lease cycle via an agentic chron-job.

## ⚠️ Important Architectural Note: "Leased Sub-Handle" Model

According to the `@unicitylabs/sphere-sdk` documentation, a Unicity ID (nametag) is permanently bound to the wallet that claimed it via on-chain minting. **The SDK does not natively support transferring or re-assigning the root nametag to another wallet**.

To implement a leasing marketplace, **NameLease operates on a "Leased Sub-Handle" model at the application layer:**
1. NameLease acts as the central authority for its managed pool of handles (e.g., `@alice-lease` registered by the NameLease system wallet).
2. When a user wins an auction to lease the handle, NameLease issues them a **Bearer Token** (`CoinId` like `LEASE-alice`) representing the right to use the handle.
3. Within the NameLease ecosystem, the owner of this Bearer Token is recognized as the current lessee.
4. The payment of rent (in UCT) and the issuance of the bearer token are executed via real, on-chain Unicity Protocol transactions (`sphere.payments.send`, `sphere.tokens.mint`). Only the namespace resolution is abstract.

This architecture correctly demonstrates a fully agentic lifecycle, automated escrow, and bearer-token identity management without falsely claiming native Unicity ID re-assignment.

## Setup and Deployment (Vercel)

1. Clone this repository.
2. Initialize Vercel project: `vercel init` (or just deploy from dashboard).
3. Add a Vercel KV (Upstash Redis) integration in the Vercel Dashboard to store application state.
4. Add the required Environment Variables:
   ```bash
   vercel env add KV_REST_API_URL
   vercel env add KV_REST_API_TOKEN
   vercel env add CRON_SECRET
   vercel env add NAMELEASE_SYSTEM_WALLET_MNEMONIC
   ```
5. Deploy to production:
   ```bash
   vercel --prod
   ```

## Demo Scenario

1. Open the deployed application dashboard.
2. Under "Register Handle for Lease", enter a handle name (e.g., `test-handle`) and the owner's nametag (`@owner`). Click "Register Pool".
3. The dashboard will now show the handle as "OPEN" and waiting for bids.
4. In the bidding section of the handle, Agent A bids `15` UCT. Agent B outbids Agent A with `20` UCT.
5. Wait for the Cron Job to trigger (runs every 1 minute).
6. **Agentic Action**: The system automatically charges `20` UCT from Agent B, issues the `LEASE-test-handle` bearer token, and updates the dashboard. The handle status is now "LEASED" with a new countdown.

## Proof of No Human-in-the-Loop

The entire application state transitions through the agentic Vercel Cron endpoint. No human intervention is required or possible to force close an auction or transfer rights.

### Endpoints
- `POST /api/lease/register`: Only creates the initial pool.
- `POST /api/lease/bid`: Only registers a user's intent to pay for the *next* cycle.
- `GET /api/lease/status`: Read-only.
- `GET /api/cron/expire-check`: **The ONLY route that mutates a lease state to 'leased' and executes payments/token transfers.** This route is triggered exclusively by Vercel Cron (`vercel.json`) every minute. There is no manual "transfer" button or API.
