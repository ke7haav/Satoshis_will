# Principal ID, Authentication, and Multi-Beneficiary Scenarios

## Question 1: Is Principal ID like a Public Key?

**Answer: YES** ✅

### What is a Principal ID?
- A **Principal ID** is a public identifier in the Internet Computer (IC) ecosystem
- It's derived from a public key and can be safely shared publicly
- Similar to how you can share a Bitcoin address or Ethereum address
- Examples: `6kbp3-k3vff-...`, `qjgd7-...gt-zqe`

### Can it be shared?
- ✅ **YES** - Principal IDs are meant to be public
- You can share your Principal ID with anyone
- It's used to identify you in transactions and smart contracts
- However, it doesn't give anyone access to your account

### Security Model:
```
Public (Safe to Share):
  ✅ Principal ID (like a username/public key)
  ✅ Bitcoin Address
  ✅ Ethereum Address

Private (Never Share):
  ❌ Private Keys
  ❌ Seed Phrases
  ❌ Internet Identity Passphrase
```

---

## Question 2: How Do We Check if a Principal ID is Logged In?

**Answer: Using `caller()` and Cryptographic Authentication**

### The Authentication Flow:

```
┌─────────────────────────────────────────────────────────┐
│ 1. User Logs In (Frontend)                              │
├─────────────────────────────────────────────────────────┤
│ User clicks "Connect Wallet"                           │
│ → Internet Identity authentication popup                │
│ → User authenticates (Face ID, Touch ID, etc.)          │
│ → Frontend receives authenticated identity              │
│ → All subsequent API calls are SIGNED with this identity│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 2. Backend Call (Signed Request)                        │
├─────────────────────────────────────────────────────────┤
│ Frontend makes call: backend.claim_inheritance(...)     │
│ → Request is SIGNED with user's private key            │
│ → Backend receives signed request                       │
│ → Backend verifies signature                            │
│ → Backend extracts Principal from signature: caller()   │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 3. Backend Validation                                   │
├─────────────────────────────────────────────────────────┤
│ let caller = caller();  // Gets Principal from signature│
│                                                          │
│ if caller != beneficiary {                              │
│     return Err("You are not the beneficiary");          │
│ }                                                       │
└─────────────────────────────────────────────────────────┘
```

### Key Points:

1. **`caller()` is NOT just a parameter** - It's extracted from the **cryptographic signature** of the request
2. **Cannot be spoofed** - The signature proves the user's identity
3. **Automatic** - The IC framework handles signature verification
4. **No password needed** - Uses public-key cryptography

### Example:

```rust
// In backend/lib.rs
#[update]
async fn claim_inheritance(owner_principal: Principal) -> Result<Vec<u8>, String> {
    let caller = caller();  // ← Extracted from request signature
    // caller is the authenticated Principal making the request
    
    // This is cryptographically verified, cannot be faked
    if caller != beneficiary {
        return Err("You are not the beneficiary");
    }
}
```

### Why This Works:

- **Internet Identity** uses WebAuthn (biometric authentication)
- Each request is signed with the user's private key
- The backend verifies the signature and extracts the Principal
- **You cannot fake being someone else** - the signature won't match

---

## Question 3: Multiple Owners, Same Beneficiary

**Current Situation:**
- Owner A registers will → `{owner: A, beneficiary: C}`
- Owner B registers will → `{owner: B, beneficiary: C}`
- Both wills exist independently in the HashMap

**Current Problem:**
- Beneficiary C can only claim one will at a time
- They need to know which owner's Principal ID to enter
- No way to see all pending inheritances

**Solution Needed:**
1. Add backend method: `get_my_inheritances()` - returns all wills where caller is beneficiary
2. Update UI to show list of pending inheritances
3. Allow claiming from the list

---

## Question 4: What is "THE DIGITAL WILL"?

**Purpose:**
The Digital Will is meant to store **encrypted secrets** that get revealed when the inheritance is claimed:
- Seed phrases
- Private keys
- Passwords
- Instructions
- Any sensitive information

**Current Problem:**
- The textarea exists in the UI ✅
- But it's **NOT being sent to the backend** ❌
- The `store_encrypted_secret()` method exists but is never called

**What Should Happen:**
1. User enters secret in "THE DIGITAL WILL" textarea
2. Frontend encrypts it (or sends to backend for encryption)
3. Backend stores it in `will.encrypted_secret`
4. When inheritance is claimed, the secret is revealed

**Current Implementation Gap:**
- SetupForm collects `digitalWill` but doesn't send it
- Need to call `store_encrypted_secret()` after registration

---

## Summary

| Question | Answer | Status |
|----------|--------|--------|
| Principal ID is public? | ✅ Yes, like a public key | ✅ Correct |
| How to check if logged in? | ✅ `caller()` from signature | ✅ Working |
| Multiple owners, same beneficiary? | ⚠️ Works but UX needs improvement | 🔧 Needs fix |
| Digital Will purpose? | ✅ Store encrypted secrets | ❌ Not wired up |

---

## Recommended Fixes

1. **Wire up Digital Will** - Send textarea content to `store_encrypted_secret()`
2. **Add `get_my_inheritances()` method** - List all wills where user is beneficiary
3. **Update ClaimView UI** - Show list of pending inheritances instead of manual input
4. **Better UX** - Show owner names, timer status, etc.

