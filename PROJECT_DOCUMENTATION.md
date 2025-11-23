# Satoshi's Will - Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Complete Flow](#complete-flow)
6. [Backend Implementation](#backend-implementation)
7. [Frontend Implementation](#frontend-implementation)
8. [Authentication Flow](#authentication-flow)
9. [Protocol Flow](#protocol-flow)
10. [Key Features](#key-features)
11. [Setup & Deployment](#setup--deployment)

---

## Project Overview

**Satoshi's Will** is a Dead Man Switch protocol built on the Internet Computer (ICP) blockchain. It allows users to:

1. **Register a Digital Will**: Set up a beneficiary, Bitcoin address, and heartbeat timer
2. **Send Heartbeats**: Prove they're alive by periodically sending "I am alive" signals
3. **Claim Inheritance**: Beneficiaries can claim inheritance when the owner's heartbeat expires
4. **Secure Secret Storage**: Store encrypted secrets (seed phrases, keys) that are only revealed upon death

The application features a retro Windows 95-style UI with a desktop-like interface where multiple windows can be open simultaneously.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Login    │  │ Setup    │  │ Dashboard│             │
│  │ Window   │  │ Form     │  │          │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                          │
│  ┌──────────────────────────────────────────┐          │
│  │         useSatoshi Hook                    │          │
│  │  (Authentication + Backend Communication) │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
                        │
                        │ HTTP/Agent Calls
                        ▼
┌─────────────────────────────────────────────────────────┐
│              Internet Computer (ICP)                   │
│  ┌──────────────────────────────────────────┐          │
│  │      Backend Canister (Rust)              │          │
│  │  ┌────────────────────────────────────┐  │          │
│  │  │  Will Storage (HashMap)            │  │          │
│  │  │  - Owner Principal                 │  │          │
│  │  │  - Beneficiary Principal           │  │          │
│  │  │  - BTC Address                     │  │          │
│  │  │  - Heartbeat Timer                 │  │          │
│  │  │  - Last Active Timestamp           │  │          │
│  │  │  - Encrypted Secret                 │  │          │
│  │  └────────────────────────────────────┘  │          │
│  └──────────────────────────────────────────┘          │
│                                                        │
│  ┌──────────────────────────────────────────┐          │
│  │  Internet Identity Canister              │          │
│  │  (Authentication Provider)               │          │
│  └──────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────┘
```

### Component Architecture

**Frontend:**
- **App.tsx**: Main application container, manages window state and authentication
- **useSatoshi Hook**: Centralized state management for authentication and backend communication
- **Components**: 
  - `LoginWindow.tsx`: Authentication interface
  - `SetupForm.tsx`: Register will configuration
  - `Dashboard.tsx`: Heartbeat and status monitoring
  - `ClaimView.tsx`: Beneficiary inheritance claim interface
  - `Header.tsx`: Taskbar/start bar navigation

**Backend:**
- **lib.rs**: Rust canister with all protocol logic
- **State Management**: Thread-local storage using `RefCell` and `HashMap`
- **Bitcoin Integration**: ECDSA key derivation for BTC addresses
- **Protocol Methods**: Register, heartbeat, claim, and secret storage

---

## Technology Stack

### Frontend
- **React 18**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Styling
- **Dfinity SDK**: 
  - `@dfinity/agent`: HTTP agent for canister communication
  - `@dfinity/auth-client`: Internet Identity authentication
  - `@dfinity/identity`: Identity management
  - `@dfinity/candid`: Candid interface definitions
  - `@dfinity/principal`: Principal ID handling
- **Lucide React**: Icons
- **Framer Motion**: Animations (optional)

### Backend
- **Rust**: Canister language
- **IC CDK 0.13**: Internet Computer development kit
- **Candid**: Interface definition language
- **Serde**: Serialization/deserialization
- **Hex**: Hexadecimal encoding
- **SHA2**: Cryptographic hashing

### Infrastructure
- **DFX**: Internet Computer development framework
- **Internet Identity**: Decentralized authentication
- **Bitcoin Integration**: ECDSA key derivation for BTC addresses

---

## Project Structure

```
satoshi_will/
├── dfx.json                    # DFX configuration
├── Cargo.toml                  # Rust workspace config
├── .gitignore                  # Git ignore rules
│
├── src/
│   ├── backend/
│   │   ├── Cargo.toml         # Backend dependencies
│   │   ├── backend.did        # Candid interface definition
│   │   └── src/
│   │       └── lib.rs         # Main backend logic
│   │
│   ├── frontend/
│   │   ├── package.json       # Frontend dependencies
│   │   ├── vite.config.ts     # Vite configuration
│   │   ├── tailwind.config.js # Tailwind config
│   │   ├── tsconfig.json      # TypeScript config
│   │   └── src/
│   │       ├── main.tsx       # React entry point
│   │       ├── App.tsx        # Main app component
│   │       ├── index.css      # Global styles
│   │       ├── hooks/
│   │       │   └── useSatoshi.ts  # Custom hook for backend logic
│   │       └── components/
│   │           ├── LoginWindow.tsx
│   │           ├── SetupForm.tsx
│   │           ├── Dashboard.tsx
│   │           ├── ClaimView.tsx
│   │           └── Header.tsx
│   │
│   └── declarations/          # Generated Candid bindings
│       ├── backend/
│       └── internet_identity/
│
├── .dfx/                       # DFX local state (gitignored)
├── dist/                       # Frontend build output
└── target/                     # Rust build artifacts
```

---

## Complete Flow

### 1. User Registration & Setup Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User Opens Application                         │
│ - Sees LoginWindow (ACCESS_TERMINAL.EXE)               │
│ - Clicks "INSERT KEY / CONNECT"                         │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Internet Identity Authentication              │
│ - Redirects to Internet Identity canister             │
│ - User authenticates (Passkey/WebAuthn)               │
│ - Returns with Principal ID                             │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Backend Actor Creation                         │
│ - useSatoshi hook creates Actor                        │
│ - Connects to backend canister                         │
│ - Sets isAuthenticated = true                           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Dashboard Opens                                 │
│ - All windows become visible                            │
│ - Dashboard shows in center                            │
│ - SetupForm (top-left)                                 │
│ - ClaimView (bottom-right)                              │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: User Registers Will                            │
│ - Opens SetupForm window                                │
│ - Enters:                                               │
│   • Beneficiary Principal ID                           │
│   • Beneficiary BTC Address                             │
│   • Heartbeat Timer (30/90/365 days)                   │
│   • Digital Will (encrypted secret)                    │
│ - Clicks "INITIALIZE PROTOCOL"                          │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 6: Backend Processing                             │
│ - register_will() called                                │
│ - Creates WillConfig struct                             │
│ - Stores in HashMap<Principal, WillConfig>             │
│ - Sets last_active = current timestamp                  │
│ - Returns success message                               │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 7: Success Feedback                                │
│ - Alert: "✓ PROTOCOL INITIALIZED"                      │
│ - Form clears after 3 seconds                          │
│ - User can now send heartbeats                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Heartbeat Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: User Opens Dashboard                            │
│ - Sees "BROADCAST PROOF OF LIFE" button                  │
│ - Vault BTC Address displayed (fetched on mount)        │
│ - Countdown timer showing time remaining                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: User Clicks Heartbeat Button                    │
│ - Button shows loading state                            │
│ - Calls sendHeartbeat() from useSatoshi                 │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Backend Updates Timestamp                       │
│ - i_am_alive() called                                   │
│ - Updates will.last_active = current_time               │
│ - Resets death timer                                    │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Visual Feedback                                 │
│ - Button pulse animation                                │
│ - Countdown timer resets to 90 days                     │
│ - Success confirmation                                  │
└─────────────────────────────────────────────────────────┘
```

### 3. Inheritance Claim Flow

```
┌─────────────────────────────────────────────────────────┐
│ Step 1: Owner's Heartbeat Expires                      │
│ - Time elapsed > heartbeat_seconds                      │
│ - Owner is considered "DECEASED"                        │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: Beneficiary Opens ClaimView                     │
│ - Sees "CRITICAL_ALERT" window                          │
│ - Protocol status shows "PROTOCOL ACTIVATED"            │
│ - Enters owner's Principal ID                           │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: Beneficiary Clicks "CLAIM INHERITANCE"          │
│ - Calls claimInheritance(ownerPrincipalId)             │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 4: Backend Validation                              │
│ - Checks:                                                │
│   1. Will exists for owner                              │
│   2. Caller is the beneficiary                          │
│   3. Heartbeat timer has expired                        │
│ - If all valid, returns encrypted secret                │
└─────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│ Step 5: Secret Revealed                                 │
│ - Encrypted secret displayed                            │
│ - Beneficiary can copy/show/hide secret                 │
│ - Warning about sensitive information                  │
└─────────────────────────────────────────────────────────┘
```

---

## Backend Implementation

### Data Structures

```rust
struct WillConfig {
    owner: Principal,                    // Who owns the will
    beneficiary: Principal,              // Who inherits
    beneficiary_btc_address: String,     // Where to send BTC
    heartbeat_seconds: u64,              // Time until death declaration
    last_active: u64,                    // Last heartbeat timestamp
    encrypted_secret: Option<Vec<u8>>,    // Digital will data
}
```

### State Storage

```rust
thread_local! {
    static WILLS: RefCell<HashMap<Principal, WillConfig>> = ...;
    static NETWORK: RefCell<BitcoinNetwork> = ...;
}
```

### Key Methods

#### 1. `register_will(beneficiary, btc_address, heartbeat_seconds)`
- **Purpose**: Create a new dead man switch
- **Process**:
  1. Gets caller's Principal (owner)
  2. Creates WillConfig with current timestamp
  3. Stores in HashMap keyed by owner Principal
  4. Returns success message

#### 2. `i_am_alive()`
- **Purpose**: Reset death timer
- **Process**:
  1. Gets caller's Principal
  2. Updates `last_active` to current time
  3. Resets countdown

#### 3. `get_vault_btc_address()`
- **Purpose**: Generate unique BTC address for owner
- **Process**:
  1. Derives ECDSA public key from owner Principal
  2. Uses Management Canister's `ecdsa_public_key`
  3. Returns hex-encoded public key (BTC address)

#### 4. `claim_inheritance(owner_principal)`
- **Purpose**: Allow beneficiary to claim inheritance
- **Validation**:
  1. Will exists for owner
  2. Caller is the beneficiary
  3. `(current_time - last_active) > heartbeat_seconds`
- **Returns**: Encrypted secret if valid

#### 5. `store_encrypted_secret(ciphertext)`
- **Purpose**: Store encrypted digital will
- **Process**: Updates `encrypted_secret` field in WillConfig

#### 6. `vetkd_derive_encrypted_key(args)`
- **Purpose**: Mock vetKeys integration
- **Access Rules**:
  - Owner can always derive their own key
  - Beneficiary can only derive if owner is dead

---

## Frontend Implementation

### useSatoshi Hook

The `useSatoshi` hook is the central state management and communication layer:

```typescript
{
  isAuthenticated: boolean,      // Auth state
  principal: string | null,       // User's Principal ID
  login: () => Promise<void>,    // Initiate login
  logout: () => Promise<void>,    // Logout
  registerWill: (beneficiary, btc, days) => Promise,
  sendHeartbeat: () => Promise<void>,
  getVaultAddress: () => Promise<string>,
  claimInheritance: (ownerId) => Promise<blob>,
  loading: boolean,               // Operation in progress
  error: string | null            // Error message
}
```

### Authentication Flow

1. **Initialization**: Hook loads Candid declarations asynchronously
2. **Auth Check**: Checks if user is already authenticated
3. **Actor Creation**: Creates Dfinity Actor for backend communication
4. **Login**: Redirects to Internet Identity, then creates Actor
5. **Logout**: Clears auth state and Actor

### Window Management

- **State**: `activeWindow` tracks which window is focused
- **Z-Index**: Active window has `zIndex: 1000`, others have lower values
- **Click Handling**: Clicking window title bar brings it to front
- **Layout**: 
  - SetupForm: Top-left
  - Dashboard: Center
  - ClaimView: Bottom-right

### Component Responsibilities

#### LoginWindow
- Displays when `!isAuthenticated`
- Shows "SECURITY CLEARANCE REQUIRED" message
- Triggers `login()` on button click

#### SetupForm
- Form for registering will
- Fields: Beneficiary ID, BTC Address, Timer, Digital Will
- Calls `registerWill()` on submit
- Shows loading state and success/error messages

#### Dashboard
- Heartbeat button with pulse animation
- Fetches and displays vault BTC address
- Countdown timer (mock implementation)
- Status indicators

#### ClaimView
- Beneficiary interface
- Input for owner's Principal ID
- Calls `claimInheritance()` on claim
- Reveals encrypted secret with show/hide/copy options

#### Header
- Taskbar/start bar at bottom
- Window toggle buttons
- System tray with clock and login/logout
- Disabled state when not authenticated

---

## Authentication Flow

### Internet Identity Integration

```
User Clicks "CONNECT"
    │
    ▼
useSatoshi.login()
    │
    ▼
AuthClient.create()
    │
    ▼
authClient.login({
  identityProvider: "http://127.0.0.1:4943/?canisterId=..."
})
    │
    ▼
Redirect to Internet Identity
    │
    ▼
User Authenticates (Passkey/WebAuthn)
    │
    ▼
Callback with Identity
    │
    ▼
handleAuthenticated()
    │
    ├─► Get Principal from Identity
    ├─► Create HttpAgent with Identity
    ├─► Fetch root key (local dev only)
    ├─► Create Actor with canister ID
    └─► Set isAuthenticated = true
```

### Environment Variables

- `VITE_CANISTER_ID_BACKEND`: Backend canister ID
- `VITE_CANISTER_ID_INTERNET_IDENTITY`: Internet Identity canister ID
- `VITE_DFX_NETWORK`: Network (local/ic)

---

## Protocol Flow

### Complete Lifecycle

```
┌─────────────────────────────────────────────────────────┐
│                    PROTOCOL LIFECYCLE                    │
└─────────────────────────────────────────────────────────┘

1. REGISTRATION PHASE
   Owner → register_will()
   ├─► Stores WillConfig
   ├─► Sets last_active = now
   └─► Returns success

2. MAINTENANCE PHASE
   Owner → i_am_alive() (periodically)
   ├─► Updates last_active = now
   └─► Resets death timer

3. DEATH DETECTION
   Time Check: (now - last_active) > heartbeat_seconds
   └─► Owner considered DECEASED

4. CLAIM PHASE
   Beneficiary → claim_inheritance(owner_principal)
   ├─► Validates: Will exists
   ├─► Validates: Caller is beneficiary
   ├─► Validates: Timer expired
   └─► Returns: encrypted_secret

5. ASSET TRANSFER (Future)
   └─► Transfer BTC from vault to beneficiary address
```

### Security Considerations

1. **Principal-Based Access Control**: Only owner can update their will
2. **Beneficiary Validation**: Only registered beneficiary can claim
3. **Timer Enforcement**: Claims only allowed after timer expiration
4. **Encrypted Secrets**: Digital will stored as encrypted blob
5. **Internet Identity**: Decentralized authentication, no passwords

---

## Key Features

### 1. Dead Man Switch Protocol
- Automatic inheritance after heartbeat expiration
- Configurable timer (30/90/365 days)
- Secure beneficiary designation

### 2. Bitcoin Integration
- Unique BTC address per user (derived from Principal)
- ECDSA key derivation via Management Canister
- Future: Native BTC transfer capability

### 3. Encrypted Secret Storage
- Store sensitive data (seed phrases, keys)
- Only revealed upon death
- Beneficiary access after timer expiration

### 4. Retro UI/UX
- Windows 95-style interface
- Desktop-like window management
- Multiple windows visible simultaneously
- Z-index based window focus

### 5. Real-Time Status
- Heartbeat countdown timer
- Vault address display
- Protocol status indicators
- Visual feedback for all operations

---

## Setup & Deployment

### Prerequisites
- Node.js 18+
- Rust 1.70+
- DFX SDK
- Internet Identity canister (auto-deployed)

### Local Development

```bash
# 1. Install dependencies
cd src/frontend && npm install
cd ../..

# 2. Start local Internet Computer
dfx start

# 3. Deploy Internet Identity
dfx deploy internet_identity

# 4. Generate declarations
dfx generate backend

# 5. Deploy backend
dfx deploy backend

# 6. Start frontend dev server
cd src/frontend && npm run dev
```

### Production Deployment

```bash
# 1. Build frontend
cd src/frontend && npm run build

# 2. Deploy to IC
dfx deploy --network ic
```

### Environment Variables

Create `.env` file (auto-generated by `dfx generate`):
```
VITE_CANISTER_ID_BACKEND=...
VITE_CANISTER_ID_INTERNET_IDENTITY=...
VITE_DFX_NETWORK=local
```

---

## Future Enhancements

1. **Native BTC Transfers**: Implement actual Bitcoin transfer on claim
2. **vetKeys Integration**: Replace mock with real vetKeys canister
3. **Multiple Beneficiaries**: Support multiple beneficiaries per will
4. **Notification System**: Alert beneficiaries when timer expires
5. **Heartbeat Automation**: Automatic heartbeat reminders
6. **Secret Decryption**: Client-side decryption of encrypted secrets
7. **Multi-Asset Support**: Support for other cryptocurrencies
8. **Time-Locked Secrets**: Additional time locks on secret release
9. **Recovery Mechanisms**: Emergency recovery options
10. **Analytics Dashboard**: Protocol statistics and monitoring

---

## Troubleshooting

### Common Issues

1. **"Backend declarations not loaded"**
   - Solution: Run `dfx generate backend`

2. **"Canister ID not found"**
   - Solution: Check `.env` file, ensure `dfx generate` was run

3. **"Internet Identity canister ID undefined"**
   - Solution: Deploy Internet Identity: `dfx deploy internet_identity`

4. **"Failed to create actor"**
   - Solution: Ensure backend canister is deployed and running

5. **Blank screen on load**
   - Solution: Check browser console, ensure declarations are loaded

---

## Conclusion

Satoshi's Will is a complete Dead Man Switch protocol implementation on the Internet Computer, featuring:

- ✅ Secure authentication via Internet Identity
- ✅ Configurable heartbeat timers
- ✅ Bitcoin address generation
- ✅ Encrypted secret storage
- ✅ Beneficiary inheritance claims
- ✅ Retro Windows 95 UI
- ✅ Full TypeScript/React frontend
- ✅ Rust canister backend

The protocol provides a trustless, decentralized way to manage digital inheritance and ensure assets are transferred to beneficiaries after death.

---

**Last Updated**: 2024
**Version**: 1.0.0
**License**: MIT (assumed)

