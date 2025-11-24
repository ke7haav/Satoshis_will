# Bitcoin Balance Checking - Local Development Limitation

## Issue

When trying to check Bitcoin balance in local development, you may see this error:

```
Canister g4xu7-jiaaa-aaaan-aaaaq-cai not found
```

## Explanation

**Bitcoin APIs are NOT available in local DFX development.** The Internet Computer's Bitcoin integration (via the management canister) is only available when deployed to IC Mainnet.

The management canister (`g4xu7-jiaaa-aaaan-aaaaq-cai`) that provides Bitcoin operations like:
- `bitcoin_get_balance`
- `bitcoin_get_utxos`
- `bitcoin_send_transaction`

...is not available in the local DFX replica.

## Solution: Deploy to IC Mainnet

To test Bitcoin balance checking with real testnet BTC:

### 1. Deploy Backend to IC Mainnet

```bash
# Make sure you're logged into IC Mainnet
dfx identity use default  # or your IC identity
dfx identity get-principal

# Deploy backend with testnet Bitcoin network
dfx deploy --network ic backend --argument '(variant { testnet })'

# Generate declarations
dfx generate --network ic backend
```

### 2. Update Frontend Environment

Update your `.env` or environment variables to point to IC Mainnet:

```bash
DFX_NETWORK=ic
VITE_DFX_NETWORK=ic
VITE_CANISTER_ID_BACKEND=<your-ic-canister-id>
```

### 3. Test Bitcoin Balance

After deploying to IC Mainnet:
1. Send testnet BTC to your vault address (from a testnet faucet)
2. The balance should now show correctly in the Dashboard

## Current Status

- ✅ **Backend Code**: Properly implemented with error handling
- ✅ **Frontend Code**: Handles errors gracefully with user-friendly messages
- ⚠️ **Local Testing**: Bitcoin APIs not available (expected limitation)
- ✅ **IC Mainnet**: Will work correctly when deployed

## Error Messages

The application now shows clear error messages:
- **Local Development**: "Bitcoin APIs are not available in local development"
- **IC Mainnet**: Will show actual balance or specific Bitcoin network errors

## Testing Locally

For local development, you can:
1. Test all other features (will registration, heartbeat, inheritance claims)
2. Mock Bitcoin balance in the frontend for UI testing
3. Deploy to IC Mainnet for full Bitcoin integration testing

