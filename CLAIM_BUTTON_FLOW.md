# What Happens When You Click "CLAIM INHERITANCE"

## Complete Flow Explanation

This document explains step-by-step what happens when a beneficiary clicks the "CLAIM INHERITANCE" button.

---

## Step-by-Step Flow

### **Step 1: User Clicks "CLAIM INHERITANCE" Button**

**Location:** `ClaimView.tsx` → `handleClaim()` function

```typescript
const handleClaim = async () => {
  // 1. Check if user is authenticated
  if (!isAuthenticated) {
    alert('Please login first');
    return;
  }
  
  // 2. Check if an inheritance is selected
  if (!selectedOwner.trim()) {
    alert('Please select an inheritance to claim');
    return;
  }
  
  // 3. Call the claim function
  const result = await claimInheritance(selectedOwner);
  // selectedOwner = "Principal A" (the owner who registered the will)
}
```

**What happens:**
- User clicks the button
- Frontend checks: Is user logged in? ✅
- Frontend checks: Is an inheritance selected? ✅
- Frontend calls `claimInheritance(selectedOwner)` where `selectedOwner` is the owner's Principal ID

---

### **Step 2: Frontend Hook Processes the Request**

**Location:** `useSatoshi.ts` → `claimInheritance()` function

```typescript
const claimInheritance = async (ownerId: string) => {
  if (!backend) return;
  setLoading(true);
  try {
    // Convert string Principal ID to Principal object
    const ownerPrincipal = await import('@dfinity/principal')
      .then(p => p.Principal.fromText(ownerId));
    
    // Call backend method
    const result = await backend.claim_inheritance(ownerPrincipal);
    
    // Backend returns: { Ok: Vec<u8> } or { Err: string }
    if ('Ok' in result) {
      return result.Ok; // This is the encrypted secret (as bytes)
    } else {
      throw new Error(result.Err);
    }
  } catch (err: any) {
    setError(err.toString());
    throw err;
  } finally {
    setLoading(false);
  }
}
```

**What happens:**
- Converts the owner's Principal ID string to a Principal object
- Makes an authenticated call to the backend
- The call is **signed** with the beneficiary's identity (automatic via IC)
- Backend receives the request with:
  - `caller()` = Beneficiary's Principal (from signature)
  - `owner_principal` = Owner's Principal (from parameter)

---

### **Step 3: Backend Receives and Validates the Request**

**Location:** `lib.rs` → `claim_inheritance()` function

```rust
#[update]
async fn claim_inheritance(owner_principal: Principal) -> Result<Vec<u8>, String> {
    // Extract the caller (beneficiary) from the signed request
    let caller = caller();  // ← Beneficiary's Principal (from signature)
    let now = ic_cdk::api::time() / 1_000_000_000;
    
    // Step 3.1: Look up the will by owner's Principal
    let (beneficiary, is_dead, _btc_target, secret) = WILLS.with(|w| {
        let wills = w.borrow();
        if let Some(will) = wills.get(&owner_principal) {  // ← Lookup by owner
            let elapsed = now - will.last_active;
            (
                will.beneficiary,        // ← Stored beneficiary Principal
                elapsed > will.heartbeat_seconds,  // ← Is timer expired?
                will.beneficiary_btc_address.clone(),
                will.encrypted_secret.clone(),  // ← The Digital Will secret
            )
        } else {
            (Principal::anonymous(), false, String::new(), None)
        }
    });
```

**What happens:**
- Backend extracts `caller()` = Beneficiary's Principal (from cryptographic signature)
- Backend receives `owner_principal` = Owner's Principal (from function parameter)
- Backend looks up the will in the HashMap using `owner_principal` as the key
- Backend calculates: `elapsed = current_time - last_active`
- Backend checks: `is_dead = elapsed > heartbeat_seconds`

**Example:**
```
Owner registered will:
  owner: Principal A
  beneficiary: Principal B
  last_active: 1763902502
  heartbeat_seconds: 30
  current_time: 1763902535
  
elapsed = 1763902535 - 1763902502 = 33 seconds
is_dead = 33 > 30 = true ✅
```

---

### **Step 4: Backend Performs 3 Security Checks**

```rust
    // CHECK 1: Will exists?
    if beneficiary == Principal::anonymous() {
        return Err("Will not found".to_string());
    }
    
    // CHECK 2: Caller is the beneficiary?
    if caller != beneficiary {  // ← caller (Principal B) == beneficiary (Principal B)?
        return Err("You are not the beneficiary".to_string());
    }
    
    // CHECK 3: Owner is dead (timer expired)?
    if !is_dead {
        return Err("Owner is still active. Heartbeat has not expired.".to_string());
    }
```

**Validation Logic:**

| Check | What It Validates | Why It Matters |
|-------|------------------|----------------|
| **Check 1** | Will exists for owner? | Prevents claiming non-existent wills |
| **Check 2** | `caller()` == `will.beneficiary`? | **Prevents unauthorized access** - Only the designated beneficiary can claim |
| **Check 3** | Timer expired? | Prevents claiming while owner is still alive |

**Security Note:**
- `caller()` is **cryptographically verified** - cannot be faked
- The request signature proves the caller's identity
- Even if someone knows the owner's Principal ID, they cannot claim unless they are the beneficiary

---

### **Step 5: Backend Returns the Secret**

```rust
    // 2. Execute Hard Asset Transfer (Native BTC) logic would go here
    // For MVP: We just print "Transfer Initiated"
    ic_cdk::print("Death confirmed. Initiating asset transfer protocol...");

    // 3. Release the Secret (vetKeys)
    if let Some(s) = secret {
        Ok(s)  // ← Returns the encrypted_secret as Vec<u8>
    } else {
        Ok(vec![])  // ← Returns empty if no secret was stored
    }
}
```

**What happens:**
- All validations passed ✅
- Backend returns `Ok(encrypted_secret)` where `encrypted_secret` is `Vec<u8>`
- This is the "Digital Will" that was stored during registration
- In a production system, this would also trigger BTC transfer logic

---

### **Step 6: Frontend Receives and Displays the Secret**

**Location:** `ClaimView.tsx` → `handleClaim()` function

```typescript
try {
  const result = await claimInheritance(selectedOwner);
  if (result) {
    // result is Uint8Array (the encrypted secret bytes)
    
    // Convert bytes to readable text
    const decoder = new TextDecoder();
    const decoded = decoder.decode(new Uint8Array(result));
    
    // Display the secret
    setSecretData(decoded || 'Encrypted secret data received. Decryption required.');
    setIsClaimed(true);
  }
} catch (err: any) {
  console.error('Failed to claim inheritance:', err);
  alert(err.message || 'Failed to claim inheritance');
}
```

**What happens:**
- Frontend receives `Vec<u8>` (array of bytes)
- Converts bytes to text using `TextDecoder`
- Displays the secret in the UI
- User can now copy/show/hide the revealed secret

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: User Clicks "CLAIM INHERITANCE"                   │
├─────────────────────────────────────────────────────────────┤
│ 1. handleClaim() called                                     │
│ 2. claimInheritance(selectedOwner) called                    │
│    selectedOwner = "Principal A" (owner's ID)               │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: useSatoshi Hook                                   │
├─────────────────────────────────────────────────────────────┤
│ 3. Convert string to Principal object                       │
│ 4. backend.claim_inheritance(ownerPrincipal) called         │
│    Request is SIGNED with beneficiary's identity            │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND: claim_inheritance() Method                         │
├─────────────────────────────────────────────────────────────┤
│ 5. Extract caller() from signature = Beneficiary Principal  │
│ 6. Look up will: HashMap.get(owner_principal)               │
│ 7. Calculate: elapsed = now - last_active                   │
│ 8. Check: is_dead = elapsed > heartbeat_seconds              │
│                                                                 │
│ VALIDATION:                                                  │
│   ✅ Will exists?                                            │
│   ✅ caller == beneficiary?                                 │
│   ✅ Timer expired?                                          │
│                                                                 │
│ 9. Return: Ok(encrypted_secret)                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ FRONTEND: Receives Result                                    │
├─────────────────────────────────────────────────────────────┤
│ 10. Decode bytes to text: TextDecoder.decode(result)        │
│ 11. Display secret in UI                                    │
│ 12. User can copy/show/hide the secret                      │
└─────────────────────────────────────────────────────────────┘
```

---

## What the Console Shows

When you see this in the console:

```javascript
Inheritances received: Array [ {…} ]
  0: Object {
    is_expired: true,
    beneficiary_btc_address: "tb1qkdujnu09j3ms05lp8gnjt52d93ydzl858pj6vx",
    last_active: 1763902502n,
    heartbeat_seconds: 30n,
    owner_principal: Object { _arr: Uint8Array(29), _isPrincipal: true },
    time_remaining: 0n
  }
```

**This is from `getMyInheritances()`** - NOT from the claim action. This shows:
- The list of inheritances where you are the beneficiary
- Which ones are expired (`is_expired: true`)
- The owner's Principal (as a Principal object, not a string)

**When you click "CLAIM INHERITANCE":**
1. The selected `owner_principal` is sent to the backend
2. Backend validates and returns the `encrypted_secret`
3. Frontend decodes it and displays it
4. You see the "DIGITAL WILL UNLOCKED" section with the secret

---

## Security Guarantees

1. **Authentication:** `caller()` is cryptographically verified - cannot be faked
2. **Authorization:** Only the designated beneficiary can claim
3. **Timing:** Only expired timers can be claimed
4. **Data Integrity:** The secret is stored encrypted and only released when all conditions are met

---

## Summary

**What happens when you click "CLAIM INHERITANCE":**

1. ✅ Frontend sends owner's Principal ID to backend
2. ✅ Backend looks up the will
3. ✅ Backend validates 3 things:
   - Will exists?
   - You are the beneficiary?
   - Timer expired?
4. ✅ If all pass, backend returns the encrypted secret
5. ✅ Frontend decodes and displays the secret
6. ✅ You can now copy/show/hide the revealed Digital Will

The inheritance data you see in the console is just the **list** of available inheritances. The actual **claiming** happens when you click the button and the backend returns the secret.

