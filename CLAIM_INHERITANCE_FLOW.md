# Claim Inheritance Flow - Complete Documentation

## Overview
This document explains how the claim inheritance process works, including authentication, validation, and common error scenarios.

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: OWNER REGISTERS WILL                                    │
├─────────────────────────────────────────────────────────────────┤
│ Owner (Principal A) logs in                                    │
│ → Opens "INITIALIZE_PROTOCOL.EXE"                              │
│ → Enters:                                                       │
│   • Beneficiary Principal ID: Principal B                      │
│   • BTC Address: bc1q...                                       │
│   • Heartbeat Timer: 30 seconds / 90 days / etc.               │
│ → Clicks "INITIALIZE PROTOCOL"                                 │
│                                                                 │
│ Backend stores:                                                 │
│   HashMap<Principal A, WillConfig {                            │
│     owner: Principal A,                                        │
│     beneficiary: Principal B,  ← Stored here                   │
│     heartbeat_seconds: 30,                                     │
│     last_active: timestamp,                                    │
│     ...                                                         │
│   }>                                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: BENEFICIARY CLAIMS INHERITANCE                         │
├─────────────────────────────────────────────────────────────────┤
│ Beneficiary (Principal B) logs in                             │
│ → Opens "CRITICAL_ALERT" window                                │
│ → Enters: OWNER'S Principal ID: Principal A                    │
│ → Clicks "CLAIM INHERITANCE"                                   │
│                                                                 │
│ Frontend sends:                                                 │
│   claimInheritance("Principal A")                              │
│                                                                 │
│ Backend receives:                                               │
│   • caller() = Principal B (logged-in user)                    │
│   • owner_principal = Principal A (from input)                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: BACKEND VALIDATION (3 Checks)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ CHECK 1: Will Exists?                                           │
│   ┌─────────────────────────────────────┐                     │
│   │ wills.get(&owner_principal)          │                     │
│   │   → Looks up will by OWNER's ID      │                     │
│   └─────────────────────────────────────┘                     │
│   ✅ PASS: Will found                                           │
│   ❌ FAIL: "Will not found"                                     │
│                                                                 │
│ CHECK 2: Caller is Beneficiary?                                 │
│   ┌─────────────────────────────────────┐                     │
│   │ caller == will.beneficiary           │                     │
│   │   → Is logged-in user (Principal B) │                     │
│   │     equal to stored beneficiary?     │                     │
│   └─────────────────────────────────────┘                     │
│   ✅ PASS: caller matches beneficiary                           │
│   ❌ FAIL: "You are not the beneficiary"                        │
│                                                                 │
│ CHECK 3: Owner is Dead?                                          │
│   ┌─────────────────────────────────────┐                     │
│   │ elapsed = now - will.last_active     │                     │
│   │ is_dead = elapsed > heartbeat_seconds│                     │
│   └─────────────────────────────────────┘                     │
│   ✅ PASS: Timer expired (owner is dead)                         │
│   ❌ FAIL: "Owner is still active. Heartbeat has not expired." │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: SUCCESS - Return Secret                                 │
├─────────────────────────────────────────────────────────────────┤
│ If all 3 checks pass:                                           │
│ → Returns will.encrypted_secret (Vec<u8>)                       │
│ → Frontend displays the decrypted secret                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Code Flow

### `claim_inheritance(owner_principal: Principal)` in `lib.rs`

```rust
#[update]
async fn claim_inheritance(owner_principal: Principal) -> Result<Vec<u8>, String> {
    let caller = caller();  // ← Currently logged-in user (Principal B)
    let now = ic_cdk::api::time() / 1_000_000_000;

    // Step 1: Look up will by OWNER's principal
    let (beneficiary, is_dead, _btc_target, secret) = WILLS.with(|w| {
        let wills = w.borrow();
        if let Some(will) = wills.get(&owner_principal) {  // ← Lookup by owner
            let elapsed = now - will.last_active;
            (
                will.beneficiary,                           // ← Stored beneficiary
                elapsed > will.heartbeat_seconds,
                will.beneficiary_btc_address.clone(),
                will.encrypted_secret.clone(),
            )
        } else {
            (Principal::anonymous(), false, String::new(), None)
        }
    });

    // Step 2: Validate will exists
    if beneficiary == Principal::anonymous() {
        return Err("Will not found".to_string());
    }
    
    // Step 3: Validate caller is the beneficiary
    if caller != beneficiary {  // ← caller (Principal B) == beneficiary (Principal B)?
        return Err("You are not the beneficiary".to_string());
    }
    
    // Step 4: Validate owner is dead
    if !is_dead {
        return Err("Owner is still active. Heartbeat has not expired.".to_string());
    }

    // Step 5: Return secret
    if let Some(s) = secret {
        Ok(s)
    } else {
        Ok(vec![])
    }
}
```

---

## Common Error Scenarios

### ❌ Error 1: "You are not the beneficiary"

**What happened:**
- You entered the **OWNER's Principal ID** ✅ (correct)
- But you are **NOT logged in as the BENEFICIARY** ❌

**Example:**
```
Owner registered will with:
  owner: Principal A
  beneficiary: Principal B

You are logged in as: Principal C
You enter: Principal A (owner's ID)

Backend checks:
  caller (Principal C) == beneficiary (Principal B)?  ❌ NO
  → Error: "You are not the beneficiary"
```

**Solution:**
1. **Log out** from your current account
2. **Log in as the BENEFICIARY** (Principal B)
3. Enter the **OWNER's Principal ID** (Principal A)
4. Click "CLAIM INHERITANCE"

---

### ❌ Error 2: "Will not found"

**What happened:**
- You entered the **BENEFICIARY's Principal ID** ❌ (wrong!)
- Backend looks for a will where **owner = beneficiary's ID**
- No such will exists (wills are stored by owner's ID)

**Example:**
```
Owner registered will with:
  owner: Principal A
  beneficiary: Principal B

You are logged in as: Principal B ✅ (correct)
You enter: Principal B ❌ (wrong - this is beneficiary, not owner)

Backend checks:
  wills.get(&Principal B)  → None (will is stored under Principal A)
  → Error: "Will not found"
```

**Solution:**
- Enter the **OWNER's Principal ID**, not the beneficiary's
- The will is stored in a HashMap keyed by the **owner's Principal**

---

### ❌ Error 3: "Owner is still active. Heartbeat has not expired."

**What happened:**
- All validations passed ✅
- But the timer hasn't expired yet

**Solution:**
- Wait for the heartbeat timer to expire
- Or use the 30-second timer option for testing

---

## Correct Usage Example

### Setup Phase (Owner):
```
1. Owner (Principal A) logs in
2. Opens "INITIALIZE_PROTOCOL.EXE"
3. Enters:
   - Beneficiary Principal ID: Principal B
   - BTC Address: bc1q...
   - Timer: 30 seconds (for testing)
4. Clicks "INITIALIZE PROTOCOL"
```

### Claim Phase (Beneficiary):
```
1. Beneficiary (Principal B) logs in  ← Must be logged in as beneficiary!
2. Waits for timer to expire (or uses 30-second timer)
3. Opens "CRITICAL_ALERT" window
4. Enters: Principal A  ← Owner's Principal ID (not beneficiary's!)
5. Clicks "CLAIM INHERITANCE"
6. ✅ Success! Secret is revealed
```

---

## Key Points to Remember

1. **Wills are stored by OWNER's Principal ID**
   - `HashMap<Owner Principal, WillConfig>`
   - Not by beneficiary's ID

2. **You must be logged in as the BENEFICIARY**
   - The backend checks: `caller() == will.beneficiary`
   - `caller()` is the currently logged-in user

3. **You enter the OWNER's Principal ID**
   - The backend looks up the will using this ID
   - This is the person who registered the will (the deceased)

4. **The timer must be expired**
   - `(current_time - last_active) > heartbeat_seconds`
   - Use 30-second timer for testing

---

## Testing Checklist

To test the claim inheritance flow:

- [ ] Owner logs in (Principal A)
- [ ] Owner registers will with beneficiary (Principal B)
- [ ] Owner sets timer to 30 seconds (for quick testing)
- [ ] Wait 30+ seconds (or don't send heartbeat)
- [ ] **Log out** from Owner account
- [ ] **Log in as Beneficiary** (Principal B)
- [ ] Open "CRITICAL_ALERT" window
- [ ] Enter **Owner's Principal ID** (Principal A)
- [ ] Click "CLAIM INHERITANCE"
- [ ] ✅ Should succeed!

---

## Summary

**The flow is:**
1. **Owner** (Principal A) registers will → stores `{owner: A, beneficiary: B}`
2. **Beneficiary** (Principal B) logs in → enters **Owner's ID** (Principal A)
3. Backend validates:
   - Will exists for Principal A? ✅
   - Caller (Principal B) == beneficiary? ✅
   - Timer expired? ✅
4. Returns secret ✅

**Common mistakes:**
- ❌ Logged in as wrong user (not beneficiary)
- ❌ Entered beneficiary's ID instead of owner's ID
- ❌ Timer hasn't expired yet

