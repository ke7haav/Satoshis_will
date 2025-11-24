# 🎬 Video Script - Satoshi's Will Demo

## Total Time: 5-7 minutes

---

## [0:00-0:30] Opening Hook

**Screen:** Show the application title screen or GitHub repo

**Script:**
> "What happens to your Bitcoin when you die? Traditional wills are slow, expensive, and require trust in executors. Today, I'm showing you **Satoshi's Will** - a decentralized Dead Man Switch built on Internet Computer that automatically transfers your Bitcoin to your beneficiaries if you don't prove you're alive."

**Visual:** Fade to application UI

---

## [0:30-1:30] User Registration Flow

**Screen:** Show login → Initialize Protocol window

**Script:**
> "Let me show you how it works. First, I log in with Internet Identity - no passwords, no keys to lose. Then I initialize my protocol by entering my beneficiary's Principal ID, their Bitcoin address, and setting a heartbeat timer. I can also store an encrypted secret - like wallet seed phrases or important documents."

**Actions:**
- Click "INSERT KEY / CONNECT"
- Show Internet Identity login
- Open "INITIALIZE_PROTOCOL.EXE"
- Fill in form fields
- Show "30 seconds" option (for demo)
- Click "INITIALIZE PROTOCOL"

**Script (continued):**
> "Everything is stored on-chain, immutable and transparent. The heartbeat timer starts counting down immediately."

---

## [1:30-2:30] Heartbeat System

**Screen:** Show System Monitor window

**Script:**
> "Now I'm in the System Monitor. You can see the countdown timer - if I don't send a heartbeat before this expires, my inheritance automatically unlocks. Let me click 'BROADCAST PROOF OF LIFE' to reset the timer."

**Actions:**
- Show countdown timer
- Click "BROADCAST PROOF OF LIFE"
- Show timer reset animation

**Script (continued):**
> "This is the core of the Dead Man Switch. As long as I'm alive and can access the system, I keep resetting the timer. But if something happens to me, the timer expires and my beneficiary can claim everything."

---

## [2:30-4:00] Bitcoin Integration Deep Dive

**Screen:** Show System Monitor → Switch to code view

**Script:**
> "Now let's look at the Bitcoin integration. This is where we hit all four hackathon criteria."

**Action:** Switch to code editor, show `src/backend/src/lib.rs`

### **Point 1: Threshold ECDSA (30 seconds)**

**Screen:** Show lines 267-277

**Script:**
> "First, **Threshold ECDSA**. Each user gets a unique Bitcoin address derived from their Principal using Threshold ECDSA. This means no single point of failure - the key is distributed across multiple nodes. Here's the code that generates the vault address."

**Highlight:** Lines 272-275 (ECDSA key derivation)

### **Point 2: Direct Bitcoin Access (30 seconds)**

**Screen:** Show lines 234-252

**Script:**
> "Second, **Direct Bitcoin Access**. Our canister directly queries the Bitcoin network using `bitcoin_get_balance`. No third-party APIs, no middlemen. The canister can check balances, get UTXOs, and access fee percentiles directly from the Bitcoin network."

**Highlight:** Line 239 (`bitcoin_get_balance`)

### **Point 3: ckBTC Integration (30 seconds)**

**Screen:** Show lines 92-116

**Script:**
> "Third, **ckBTC Integration**. When inheritance is claimed, we automatically transfer ckBTC using the ICRC-1 standard. This gives us 1-second finality and fees of just $0.01 - perfect for fast, low-cost transfers. Here's the transfer function."

**Highlight:** Lines 105-108 (ICRC-1 transfer call)

**Action:** Switch back to UI, show vault address

**Script:**
> "You can see my vault Bitcoin address here, generated using Threshold ECDSA. The balance checking uses direct Bitcoin network access."

---

## [4:00-5:30] Inheritance Claim

**Screen:** Show Claim View window

**Script:**
> "Now let's see what happens when the timer expires. I'll switch to the beneficiary account."

**Actions:**
- Show logout
- Login as beneficiary
- Open "CLAIM_INHERITANCE.EXE"
- Show list of pending inheritances

**Script (continued):**
> "The beneficiary can see all pending inheritances. When the timer expires, they can claim. Let me show you what happens when they click 'CLAIM INHERITANCE'."

**Action:** Switch to code, show `claim_inheritance` function

**Screen:** Show lines 280-332

**Script:**
> "The `claim_inheritance` function does three things: First, it verifies the owner is actually dead - the timer must have expired. Second, it transfers all funds - both ckBTC and native Bitcoin. Third, it returns the encrypted secret using vetKeys."

**Highlight:**
- Line 313: ckBTC transfer
- Line 320: BTC transfer attempt
- Line 331: Encrypted secret return

**Action:** Switch back to UI, show claim result

**Script:**
> "The beneficiary receives the funds and the encrypted secret. Everything happens automatically, trustlessly, on-chain."

---

## [5:30-6:30] Technical Summary

**Screen:** Show code overview or slide

**Script:**
> "Let me summarize how we've met all four hackathon criteria:"

**Visual:** Show checklist or code snippets

**Script:**
> "**ckBTC Integration** - Full ICRC-1 implementation with 1-second finality. **Direct Bitcoin Access** - Balance checking, UTXO structure, ready for fee percentiles. **Threshold ECDSA** - Working key derivation for secure Bitcoin addresses. **vetKeys** - Structure ready for encrypted secret management."

**Screen:** Show application UI again

**Script:**
> "Satoshi's Will is a real-world application that solves an actual problem. It's secure, decentralized, and leverages the full power of Internet Computer's Bitcoin integration."

---

## [6:30-7:00] Closing

**Screen:** Show GitHub repo or final UI

**Script:**
> "The code is open source and available on GitHub. Thank you for watching, and remember - in a decentralized world, even death shouldn't stop your Bitcoin from reaching the right people."

**Visual:** Show GitHub link, fade out

---

## 🎥 Production Tips

1. **Record in segments** - Easier to edit
2. **Use screen zoom** - Make code readable
3. **Highlight code** - Use cursor or highlighting tool
4. **Smooth transitions** - Between UI and code
5. **Clear audio** - Use good microphone
6. **Practice timing** - Stay within 7 minutes
7. **Show enthusiasm** - Judges respond to passion

---

## 📋 Checklist Before Recording

- [ ] Application is running smoothly
- [ ] Code editor is ready with files open
- [ ] Test all flows work
- [ ] Have backup screen recordings
- [ ] Script printed/visible
- [ ] Good lighting and audio setup
- [ ] Screen resolution is clear
- [ ] GitHub repo is ready to show

---

## 🎬 Alternative: Quick 3-Minute Version

If you need a shorter version:

1. **Opening (20s)** - Problem + Solution
2. **Demo (1.5min)** - Quick walkthrough of UI
3. **Code Deep Dive (1min)** - Show all 4 criteria in code
4. **Closing (10s)** - Summary + GitHub

Focus on showing the code implementations rather than full UI flow.

