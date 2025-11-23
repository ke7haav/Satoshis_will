import * as bitcoin from 'bitcoinjs-lib';
import { Buffer } from 'buffer';

/**
 * Converts a hex-encoded public key to a Bitcoin address
 * @param publicKeyHex - Hex string of the public key (compressed or uncompressed)
 * @param network - 'testnet' or 'mainnet' (default: 'testnet')
 * @returns Bitcoin address string
 */
export function publicKeyToBitcoinAddress(
  publicKeyHex: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): string {
  try {
    // Convert hex string to Buffer
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    
    // Select network
    const btcNetwork = network === 'mainnet' 
      ? bitcoin.networks.bitcoin 
      : bitcoin.networks.testnet;

    // Validate public key length (compressed: 33 bytes, uncompressed: 65 bytes)
    if (publicKeyBuffer.length !== 33 && publicKeyBuffer.length !== 65) {
      throw new Error(`Invalid public key length: ${publicKeyBuffer.length} bytes. Expected 33 (compressed) or 65 (uncompressed).`);
    }

    // Create P2PKH address (legacy format - most compatible)
    // Hash the public key and create a P2PKH script
    const { address: p2pkhAddress } = bitcoin.payments.p2pkh({
      pubkey: publicKeyBuffer,
      network: btcNetwork,
    });

    if (!p2pkhAddress) {
      throw new Error('Failed to generate P2PKH address');
    }

    // Also create P2WPKH address (native SegWit - modern, lower fees)
    const { address: p2wpkhAddress } = bitcoin.payments.p2wpkh({
      pubkey: publicKeyBuffer,
      network: btcNetwork,
    });

    // Return P2WPKH if available (preferred), otherwise P2PKH
    return p2wpkhAddress || p2pkhAddress;
  } catch (error: any) {
    console.error('Error converting public key to Bitcoin address:', error);
    throw new Error(`Failed to convert public key to Bitcoin address: ${error.message}`);
  }
}

/**
 * Converts a hex-encoded public key to multiple Bitcoin address formats
 * @param publicKeyHex - Hex string of the public key
 * @param network - 'testnet' or 'mainnet' (default: 'testnet')
 * @returns Object with different address formats
 */
export function publicKeyToBitcoinAddresses(
  publicKeyHex: string,
  network: 'testnet' | 'mainnet' = 'testnet'
): {
  p2pkh: string;    // Legacy (starts with 1 or m/n)
  p2wpkh: string;  // Native SegWit (starts with bc1 or tb1)
  p2sh?: string;   // P2SH-wrapped SegWit (starts with 3 or 2)
} {
  try {
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const btcNetwork = network === 'mainnet' 
      ? bitcoin.networks.bitcoin 
      : bitcoin.networks.testnet;

    // P2PKH (Legacy)
    const { address: p2pkh } = bitcoin.payments.p2pkh({
      pubkey: publicKeyBuffer,
      network: btcNetwork,
    });

    // P2WPKH (Native SegWit)
    const { address: p2wpkh } = bitcoin.payments.p2wpkh({
      pubkey: publicKeyBuffer,
      network: btcNetwork,
    });

    // P2SH-wrapped SegWit (P2WPKH in P2SH)
    const { address: p2sh } = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: publicKeyBuffer,
        network: btcNetwork,
      }),
      network: btcNetwork,
    });

    if (!p2pkh || !p2wpkh) {
      throw new Error('Failed to generate Bitcoin addresses');
    }

    return {
      p2pkh,
      p2wpkh,
      p2sh: p2sh || undefined,
    };
  } catch (error: any) {
    console.error('Error converting public key to Bitcoin addresses:', error);
    throw new Error(`Failed to convert public key: ${error.message}`);
  }
}

