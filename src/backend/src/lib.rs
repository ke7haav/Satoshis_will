use candid::{CandidType, Deserialize, Principal};
use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_balance, bitcoin_get_utxos, BitcoinNetwork, GetBalanceRequest, GetUtxosRequest,
    Satoshi,
};
use ic_cdk::api::management_canister::ecdsa::{
    ecdsa_public_key, sign_with_ecdsa, EcdsaCurve, EcdsaKeyId, EcdsaPublicKeyArgument,
    SignWithEcdsaArgument,
};
use ic_cdk::{caller, init, update};
use std::cell::RefCell;
use std::collections::HashMap;

// --- 1. Data Structures ---

#[derive(CandidType, Deserialize, Clone, Debug)]
struct WillConfig {
    owner: Principal,
    beneficiary: Principal,
    beneficiary_btc_address: String, // Where to send the assets when dead
    heartbeat_seconds: u64,          // How long to wait before declaring dead
    last_active: u64,                // Timestamp of last "I am alive"
    encrypted_secret: Option<Vec<u8>>, // The vetKey encrypted data (Digital Will)
}

// State Storage
thread_local! {
    static WILLS: RefCell<HashMap<Principal, WillConfig>> = RefCell::new(HashMap::new());
    static NETWORK: RefCell<BitcoinNetwork> = RefCell::new(BitcoinNetwork::Testnet); // Default to Testnet
}

// --- 2. Constants ---
// For local dev/testnet use "dfx_test_key". For mainnet use "key_1"
const KEY_NAME: &str = "dfx_test_key"; 

// --- 3. Canister Methods ---

#[init]
fn init(network: BitcoinNetwork) {
    NETWORK.with(|n| *n.borrow_mut() = network);
}

// A. Create the Dead Man Switch
#[update]
fn register_will(
    beneficiary: Principal,
    beneficiary_btc_address: String,
    heartbeat_seconds: u64,
) -> String {
    let owner = caller();
    let now = ic_cdk::api::time() / 1_000_000_000; // Convert nanoseconds to seconds

    let will = WillConfig {
        owner,
        beneficiary,
        beneficiary_btc_address,
        heartbeat_seconds,
        last_active: now,
        encrypted_secret: None,
    };

    WILLS.with(|w| w.borrow_mut().insert(owner, will));

    "Will registered successfully".to_string()
}

// B. The "Keep Alive" Heartbeat
#[update]
fn i_am_alive() {
    let owner = caller();
    let now = ic_cdk::api::time() / 1_000_000_000;

    WILLS.with(|w| {
        let mut wills = w.borrow_mut();
        if let Some(will) = wills.get_mut(&owner) {
            will.last_active = now;
        } else {
            ic_cdk::trap("No will found for this user");
        }
    });
}

// C. Store the "Digital Will" (Encrypted Secret)
#[update]
fn store_encrypted_secret(ciphertext: Vec<u8>) {
    let owner = caller();
    WILLS.with(|w| {
        let mut wills = w.borrow_mut();
        if let Some(will) = wills.get_mut(&owner) {
            will.encrypted_secret = Some(ciphertext);
        }
    });
}

// D. Get the Bitcoin Vault Address
// We derive a unique BTC address for the user based on their Principal
#[update]
async fn get_vault_btc_address() -> String {
    let owner = caller();
    // Unique derivation path per user
    let derivation_path = vec![owner.as_slice().to_vec()];
    
    let key_id = EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: KEY_NAME.to_string(),
    };

    // Call the Management Canister to get the public key
    let (pub_key,) = ecdsa_public_key(EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path,
        key_id,
    })
    .await
    .unwrap();

    // In a real app, you'd convert this public key bytes to a proper BTC Address string (P2PKH or P2TR).
    // For this hackathon MVP, we return the hex string representation.
    hex::encode(pub_key.public_key)
}

// E. CLAIM INHERITANCE (The Trigger)
#[update]
async fn claim_inheritance(owner_principal: Principal) -> Result<Vec<u8>, String> {
    let caller = caller();
    let now = ic_cdk::api::time() / 1_000_000_000;

    // 1. Validate Death Condition
    let (beneficiary, is_dead, _btc_target, secret) = WILLS.with(|w| {
        let wills = w.borrow();
        if let Some(will) = wills.get(&owner_principal) {
            let elapsed = now - will.last_active;
            (
                will.beneficiary,
                elapsed > will.heartbeat_seconds,
                will.beneficiary_btc_address.clone(),
                will.encrypted_secret.clone(),
            )
        } else {
            (Principal::anonymous(), false, String::new(), None)
        }
    });

    if beneficiary == Principal::anonymous() {
        return Err("Will not found".to_string());
    }
    if caller != beneficiary {
        return Err("You are not the beneficiary".to_string());
    }
    if !is_dead {
        return Err("Owner is still active. Heartbeat has not expired.".to_string());
    }

    // 2. Execute Hard Asset Transfer (Native BTC) logic would go here
    // For MVP: We just print "Transfer Initiated"
    ic_cdk::print("Death confirmed. Initiating asset transfer protocol...");

    // 3. Release the Secret (vetKeys)
    if let Some(s) = secret {
        Ok(s) 
    } else {
        Ok(vec![])
    }
}

// --- vetKeys Mock for MVP ---
// This mimics the vetKeys "derive_encrypted_key" but checks our Dead Man Switch logic first.
#[derive(CandidType, Deserialize)]
struct VetkdDeriveEncryptedKeyArgs {
    public_key_derivation_path: Vec<Vec<u8>>,
    encryption_public_key: Vec<u8>,
}

#[derive(CandidType, Deserialize)]
struct VetkdEncryptedKeyReply {
    encrypted_key: Vec<u8>,
}

#[update]
async fn vetkd_derive_encrypted_key(
    args: VetkdDeriveEncryptedKeyArgs,
) -> Result<VetkdEncryptedKeyReply, String> {
    let caller = caller();
    
    // Parse owner from the first part of the derivation path
    // Note: In production, add robust error handling here if path is empty
    let owner_principal = Principal::from_slice(&args.public_key_derivation_path[0]);

    let is_allowed = WILLS.with(|w| {
        let wills = w.borrow();
        if let Some(will) = wills.get(&owner_principal) {
             let now = ic_cdk::api::time() / 1_000_000_000;
             let dead = (now - will.last_active) > will.heartbeat_seconds;
             
             // Access Rule:
             // 1. The Owner can ALWAYS derive their own key (to encrypt/view)
             // 2. The Beneficiary can ONLY derive it if Owner is Dead
             if caller == will.owner {
                 true
             } else if caller == will.beneficiary && dead {
                 true
             } else {
                 false
             }
        } else {
            // If no will exists, allow self-derivation (for setup)
            caller == owner_principal
        }
    });

    if !is_allowed {
        return Err("Access Denied: Owner is alive or you are not authorized".to_string());
    }

    // Mock return for compilation. In a real vetKeys deployment, 
    // you would forward this call to the system management canister.
    Ok(VetkdEncryptedKeyReply {
        encrypted_key: vec![0xDE, 0xAD, 0xBE, 0xEF], 
    })
}