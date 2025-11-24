# Quick Enhancements for Hackathon Demo

## 1. Add Fee Percentiles (5 minutes) ⚡

This adds the "fee percentiles" requirement to Direct Bitcoin Access.

**File:** `src/backend/src/lib.rs`

**Add to imports (line 3):**
```rust
use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_balance, bitcoin_get_utxos, bitcoin_send_transaction, 
    bitcoin_get_current_fee_percentiles, // ADD THIS
    BitcoinNetwork, GetBalanceRequest, GetUtxosRequest, SendTransactionRequest, Satoshi,
};
```

**Add new function (after `get_vault_balance`, around line 252):**
```rust
// Get current Bitcoin fee percentiles
#[update]
async fn get_btc_fee_percentiles() -> Result<Vec<u64>, String> {
    let network = NETWORK.with(|n| *n.borrow());
    
    let (fee_percentiles,) = bitcoin_get_current_fee_percentiles(network)
        .await
        .map_err(|e| format!("Failed to get fee percentiles: {:?}", e))?;
    
    Ok(fee_percentiles)
}
```

**Add to `backend.did` (after `get_vault_balance`):**
```candid
"get_btc_fee_percentiles": () -> (variant { Ok: vec nat64; Err: text });
```

**Then run:**
```bash
dfx generate backend
```

---

## 2. Add UTXO Retrieval Demo (10 minutes) ⚡

This completes the UTXO requirement for Direct Bitcoin Access.

**File:** `src/backend/src/lib.rs`

**Update `transfer_btc` function (around line 69-76):**

Replace the placeholder UTXO code with:
```rust
// 2. Get UTXOs from vault address
let vault_btc_address = hex::encode(pub_key.public_key); // For now, using hex
// TODO: Convert to actual Bitcoin address

let get_utxos_request = GetUtxosRequest {
    address: vault_btc_address.clone(),
    network,
    filter: None,
    min_confirmations: None,
};

let (utxos_response,) = bitcoin_get_utxos(get_utxos_request)
    .await
    .map_err(|e| format!("Failed to get UTXOs: {:?}", e))?;

ic_cdk::print(format!("Found {} UTXOs for address {}", utxos_response.utxos.len(), vault_btc_address));
```

**Note:** This will work once you have the actual Bitcoin address (not just public key hex).

---

## 3. Add ckBTC Balance to Frontend (10 minutes) ⚡

**File:** `src/frontend/src/components/Dashboard.tsx`

**Add state:**
```typescript
const [ckbtcBalance, setCkbtcBalance] = useState<BigInt | null>(null);
```

**Add fetch function:**
```typescript
const fetchCkbtcBalance = useCallback(async () => {
  if (!isAuthenticated || !getVaultCkbtcBalance) return;
  try {
    const result = await getVaultCkbtcBalance();
    if (result && 'Ok' in result) {
      setCkbtcBalance(result.Ok);
    }
  } catch (err) {
    console.error('Failed to fetch ckBTC balance:', err);
  }
}, [isAuthenticated, getVaultCkbtcBalance]);
```

**Add to UI (in the vault address fieldset):**
```typescript
{ckbtcBalance !== null && (
  <div className="mt-2 text-xs">
    <div className="text-gray-600">ckBTC Balance:</div>
    <div className="text-green-600 font-bold">
      {Number(ckbtcBalance) / 100_000_000} ckBTC
    </div>
  </div>
)}
```

---

## 4. Add Block Headers (Optional - 15 minutes) ⚡

**File:** `src/backend/src/lib.rs`

**Add to imports:**
```rust
use ic_cdk::api::management_canister::bitcoin::bitcoin_get_headers;
```

**Add function:**
```rust
#[update]
async fn get_btc_headers() -> Result<Vec<Vec<u8>>, String> {
    let network = NETWORK.with(|n| *n.borrow());
    
    // Get last 10 block headers
    let (headers,) = bitcoin_get_headers(network, Some(10))
        .await
        .map_err(|e| format!("Failed to get headers: {:?}", e))?;
    
    Ok(headers)
}
```

**Add to `backend.did`:**
```candid
"get_btc_headers": () -> (variant { Ok: vec vec nat8; Err: text });
```

---

## Priority Order for Demo:

1. **Fee Percentiles** (5 min) - Easy win, shows Direct Bitcoin Access
2. **ckBTC Balance Display** (10 min) - Shows ckBTC integration visually
3. **UTXO Retrieval** (10 min) - Completes Direct Bitcoin Access
4. **Block Headers** (15 min) - Nice to have, not critical

---

## Quick Test After Changes:

```bash
# Rebuild backend
cargo build --manifest-path src/backend/Cargo.toml

# Redeploy
dfx deploy backend --argument '(variant { testnet })'

# Regenerate
dfx generate backend
```

