// Initialize Sphere SDK for Unicity Testnet v2
import { Sphere } from '@unicitylabs/sphere-sdk';

const mnemonic = process.env.NAMELEASE_SYSTEM_WALLET_MNEMONIC || '';

// Singleton SDK instance for server-side usage
export const sphere = new Sphere({
  network: 'testnet-v2',
  wallet: {
    mnemonic: mnemonic,
  }
});

/**
 * Mocks or implements the transfer of UCT
 * @param fromNametag The nametag to charge
 * @param amountUCT The amount to charge
 */
export async function chargeUCT(fromNametag: string, amountUCT: string) {
  // In a real implementation this would create a payment request or 
  // require the user to sign a tx. Since NameLease automatically executes,
  // we assume we have pre-approved allowances or we send a payment request.
  // Using sphere.payments as described in prompt.
  try {
    console.log(`[Sphere] Sending payment request/charging ${amountUCT} UCT from ${fromNametag}`);
    // await sphere.payments.send({ to: 'namelease-system', from: fromNametag, amount: amountUCT, token: 'UCT' });
  } catch (error) {
    console.error('[Sphere] Error charging UCT:', error);
    throw error;
  }
}

/**
 * Issues a bearer token for the lease
 * @param winnerNametag The user who won the lease
 * @param handleId The handle being leased
 */
export async function issueLeaseToken(winnerNametag: string, handleId: string) {
  try {
    console.log(`[Sphere] Issuing LEASE-${handleId} token to ${winnerNametag}`);
    // Example SDK call based on prompt context
    // await sphere.tokens.mint({ to: winnerNametag, coinId: `LEASE-${handleId}`, amount: 1 });
  } catch (error) {
    console.error('[Sphere] Error issuing lease token:', error);
    throw error;
  }
}

/**
 * Sends a DM via Sphere communications
 * @param toNametag Recipient
 * @param message Message content
 */
export async function sendNotification(toNametag: string, message: string) {
  try {
    console.log(`[Sphere] Sending DM to ${toNametag}: ${message}`);
    // await sphere.communications.sendDM({ to: toNametag, message });
  } catch (error) {
    console.error('[Sphere] Error sending notification:', error);
  }
}
