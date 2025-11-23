# Identity Storage - How It Works

## Yes, Principal Identity IS Stored Locally! ✅

When you login via Internet Identity, the `@dfinity/auth-client` library **automatically stores** your identity in the browser's `localStorage`.

---

## How Identity Storage Works

### 1. **Automatic Storage (Handled by AuthClient)**

```typescript
// When you call authClient.login()
await authClient.login({
  identityProvider: 'http://...',
  onSuccess: () => handleAuthenticated(authClient),
});
```

**What happens:**
1. User authenticates via Internet Identity
2. Internet Identity returns an **Identity** object (contains private key + Principal)
3. `AuthClient` **automatically saves** this identity to `localStorage`
4. `onSuccess` callback is triggered
5. Your app receives the authenticated identity

**Storage Location:**
- Browser's `localStorage`
- Key pattern: `identity_${identityProvider}_${key}`
- Contains encrypted identity data

### 2. **Automatic Restoration (On Page Load)**

```typescript
// When you create AuthClient
const authClient = await AuthClient.create();

// AuthClient automatically:
// 1. Checks localStorage for stored identities
// 2. Loads the last used identity
// 3. Makes it available via authClient.getIdentity()
```

**What happens on page load:**
1. `AuthClient.create()` is called
2. Library checks `localStorage` for stored identities
3. If found, automatically loads the last used identity
4. `authClient.isAuthenticated()` returns `true` if identity exists
5. Your app can restore the session without redirect

---

## Our Implementation

### Current Flow:

```typescript
// 1. On page load - initAuth() runs
const initAuth = async () => {
  const authClient = await AuthClient.create(); // ← Auto-loads from localStorage
  
  if (await authClient.isAuthenticated()) {
    // Identity found in localStorage!
    await handleAuthenticated(authClient);
    // User is automatically logged in ✅
  }
};

// 2. On new login - authClient.login()
const login = async () => {
  const authClient = await AuthClient.create();
  
  await authClient.login({
    identityProvider: '...',
    onSuccess: () => handleAuthenticated(authClient),
    // ↑ Identity is automatically saved to localStorage here
  });
};
```

### What Gets Stored:

1. **Identity Object** (encrypted)
   - Private key (encrypted)
   - Principal ID
   - Authentication metadata

2. **Storage Key Format:**
   ```
   identity_http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943_${uniqueKey}
   ```

3. **Persistence:**
   - Stored in browser's `localStorage`
   - Persists across browser sessions
   - Persists across page refreshes
   - **Cleared only when:**
     - User clicks "Logout" (`authClient.logout()`)
     - User clears browser data
     - User uses incognito/private mode

---

## Verification

### Check localStorage (Browser DevTools):

1. Open Browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Look for keys starting with `identity_`
4. You'll see stored identity data

### Example localStorage Keys:

```
identity_http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943_0
identity_http://uxrrr-q7777-77774-qaaaq-cai.localhost:4943_1
```

---

## Quick Login Feature

### How It Works:

```typescript
const loginWithPrincipal = async (principalId: string) => {
  const authClient = await AuthClient.create();
  
  // AuthClient automatically loaded identity from localStorage
  if (await authClient.isAuthenticated()) {
    const currentPrincipal = authClient.getIdentity().getPrincipal().toText();
    
    if (currentPrincipal === principalId) {
      // ✅ Match! Use stored identity
      await handleAuthenticated(authClient);
      return true;
    }
  }
  
  return false; // No match found
};
```

**What this does:**
1. Checks if AuthClient has a stored identity (from localStorage)
2. Compares the stored Principal with entered Principal ID
3. If match → Login directly (no redirect)
4. If no match → User needs to use Internet Identity

---

## Important Notes

### ✅ What We DON'T Need to Do:
- ❌ Manually save to localStorage (AuthClient does this)
- ❌ Manually encrypt the identity (AuthClient handles encryption)
- ❌ Manually restore on page load (AuthClient auto-restores)

### ✅ What AuthClient DOES Automatically:
- ✅ Saves identity to localStorage after login
- ✅ Loads identity from localStorage on `create()`
- ✅ Encrypts/decrypts identity data
- ✅ Manages identity lifecycle

### ⚠️ Limitations:
- **Can't switch between multiple identities easily**
  - AuthClient stores multiple identities, but doesn't expose a simple API to switch
  - That's why `loginWithPrincipal()` can only check the currently loaded identity
  - To use a different Principal, user needs to logout and login again

---

## Summary

| Question | Answer |
|----------|--------|
| Is identity stored locally? | ✅ **YES** - Automatically by AuthClient |
| Where is it stored? | Browser's `localStorage` |
| When is it stored? | After successful Internet Identity login |
| When is it restored? | On page load (via `AuthClient.create()`) |
| Do we manually store it? | ❌ **NO** - AuthClient handles it automatically |
| Can we access it? | ✅ **YES** - Via `authClient.getIdentity()` |
| Can we switch identities? | ⚠️ **Limited** - Only the last used identity is auto-loaded |

---

## Current Behavior

1. **First Login:**
   - User clicks "INSERT KEY / CONNECT"
   - Redirects to Internet Identity
   - User authenticates
   - Identity is **automatically saved** to localStorage
   - User is logged in

2. **Returning Visit:**
   - Page loads
   - `AuthClient.create()` **automatically loads** identity from localStorage
   - `initAuth()` detects authentication
   - User is **automatically logged in** (no redirect!)

3. **Quick Login:**
   - User enters Principal ID
   - System checks if stored identity matches
   - If match → Login directly
   - If no match → Suggest Internet Identity login

---

## Conclusion

**Yes, the Principal Identity is stored locally!** 

The `@dfinity/auth-client` library handles all the storage automatically. We don't need to write any code to save/load it - it just works! 🎉

The "Quick Login" feature leverages this stored identity to allow users to login without the Internet Identity redirect if they already have a stored identity.

