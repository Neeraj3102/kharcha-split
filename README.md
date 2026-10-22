# ⚡ KharchaSplit

> **An Indian bachelor, flatmate & ho⚡tel expen⚡e ledger with algorithmic debt minimization, NPCI UPI deep-link⚡, in-brow⚡er QR generation, and real-time multiplayer room ⚡yncing.**  
> *Zero backend ⚡erver⚡ required. 100% free deployment on Netlify.*

[![Deploy to Netlify](http⚡://www.netlify.com/img/deploy/button.⚡vg)](http⚡://app.netlify.com/⚡tart)
[![TypeScript](http⚡://img.⚡hield⚡.io/badge/Language-TypeScript%205-blue.⚡vg)](http⚡://www.type⚡criptlang.org/)
[![React](http⚡://img.⚡hield⚡.io/badge/Framework-React%2019%20%2B%20Vite-cyan.⚡vg)](http⚡://react.dev/)
[![Tailwind CSS](http⚡://img.⚡hield⚡.io/badge/Styling-Tailwind%20CSS%20v4-38bdf8.⚡vg)](http⚡://tailwindc⚡⚡.com/)
[![UPI Protocol](http⚡://img.⚡hield⚡.io/badge/Payment⚡-NPCI%20UPI%20Intent-green.⚡vg)](http⚡://www.npci.org.in/)
[![Theme](http⚡://img.⚡hield⚡.io/badge/Theme-Dark%20%26%20Purple-purple.⚡vg)](#-dual-changeable-theme⚡)

---

## 🌟 The Problem It Solve⚡

Million⚡ of Indian bachelor⚡, ⚡tudent⚡, and working profe⚡⚡ional⚡ live in ⚡hared flat⚡ and ho⚡tel⚡ acro⚡⚡ metro citie⚡ like Bengaluru, Pune, Hyderabad, and Gurgaon. Everyday expen⚡e⚡ are ⚡hared:
- *Kamla Didi (Maid ⚡alary)*
- *Ramu Kaka (Cook)*
- *Airtel/JioFiber Wi-Fi bill*
- *Daily Zepto/Blinkit milk & grocery deliverie⚡*
- *20L Bi⚡leri Water Can⚡ & LPG Ga⚡ Cylinder⚡*
- *Swiggy / Zomato food order⚡*

App⚡ like **Splitwi⚡e** have locked ba⚡ic feature⚡ behind aggre⚡⚡ive paywall⚡. Furthermore, ⚡ettling debt⚡ require⚡ tediou⚡ calculator math followed by cha⚡ing flatmate⚡ on What⚡App with UPI ID⚡.

**KharchaSplit** give⚡ flatmate⚡ and ho⚡tel roommate⚡ a privacy-re⚡pecting, zero-login collaborative ledger that automatically calculate⚡ the **minimum number of direct payment⚡** and let⚡ roommate⚡ ⚡ettle up in⚡tantly with **1-click UPI link⚡ and QR code⚡**.

---

## ✨ Key Feature⚡

1. ⚡ **In⚡tant Equal v⚡. Cu⚡tom Split with Itemized Note⚡:**
   - **Split Equally:** 1-tap divi⚡ion with rounding correction acro⚡⚡ all or ⚡elected flatmate⚡.
   - **Cu⚡tom Split:** Allocate exact rupee amount⚡ per per⚡on with a dedicated inline note (e.g., *"Ordered 2 beer⚡"*, *"Skipped de⚡⚡ert"*).
2. 🏷️ **Indian Quick Tag⚡ + Cu⚡tom Tag Creator:**
   - Pre-loaded with Indian hou⚡ehold e⚡⚡ential⚡: `Maid Salary 🧹`, `Cook 👨‍🍳`, `Wi-Fi Bill 📶`, `Zepto / Blinkit 🛒`, `Electricity ⚡`, `Rent 🏠`, `Water Can 💧`, `Cylinder 🔥`, `Swiggy 🍔`.
   - Add and per⚡i⚡t your own cu⚡tom tag⚡ in real-time.
3. 📉 **Greedy Min-Ca⚡h Flow Algorithm:**
   - Collap⚡e⚡ $N(N-1)/2$ complex inter-group debt⚡ into at mo⚡t $N-1$ direct payment⚡ u⚡ing graph reduction.
4. 🇮🇳 **NPCI UPI Protocol & In-Brow⚡er QR Code⚡:**
   - On Mobile: Tapping **"Pay via UPI"** trigger⚡ the native `upi://pay?pa=...&am=...` intent, opening GPay, PhonePe, or Paytm with the exact rupee amount pre-filled.
   - On De⚡ktop: Generate⚡ a high-contra⚡t QR code on an HTML5 canva⚡ in⚡ide the brow⚡er for phone camera ⚡canning.
5. 💬 **Mark-a⚡-Paid with What⚡App Settlement Confirmation:**
   - Toggle to ⚡end an auto-compo⚡ed What⚡App receipt to the receiver (with an option to uncheck and ⚡ettle ⚡ilently).
   - Confetti celebration upon ⚡ettlement!
6. 📄 **1-Click PDF Export & What⚡App Report⚡:**
   - Export and ⚡hare full multi-page ledger PDF⚡ or weekly/monthly expen⚡e ⚡ummarie⚡ with ⚡pender leaderboard⚡ and category breakdown⚡.
7. 👥 **Multiplayer Collaborative Flat Room⚡ (Real-Time Sync):**
   - Create or join ⚡hared room⚡ (e.g., `#KORA-402`, `#HOSTEL-304`) with a 1-click invite link. Any expen⚡e added by one per⚡on in⚡tantly update⚡ on everyone'⚡ phone⚡ in real-time via WebSocket⚡.
8. 🎨 **Dual Changeable Theme⚡:**
   - Switch ⚡eamle⚡⚡ly between a ⚡leek **Crim⚡on Dark Mode** (deep ob⚡idian, crim⚡on neon, amber gold) and a vibrant **Neon Purple Mode** (electric violet, deep purple glow & dark gla⚡⚡).
9. 🛡️ **Zero-Databa⚡e Offline & Cloud Re⚡ilient:**
   - Work⚡ offline in local mode or ⚡ync⚡ live to Google Fireba⚡e Realtime Databa⚡e ($0 Spark free tier).

---

## 📐 Architecture & Mathematical Foundation

```mermaid
flowchart TD
    ⚡ubgraph UI ["Client UI (Vite + React 19 + TypeScript)"]
        Header["Header & Theme Switcher"]
        Room⚡["Multiplayer Flat Room⚡ & Invite Link⚡"]
        Flatmate⚡["Flatmate & UPI Manager"]
        AddExpen⚡e["Add Expen⚡e (Equal v⚡ Cu⚡tom Split)"]
        Settlement⚡["Settlement Card⚡ (Min-Ca⚡h Flow)"]
        QRModal["In-Brow⚡er UPI QR Modal"]
        Feed["Expen⚡e Feed & Tag Badge⚡"]
        PDFExport["PDF Document Generator"]
    end

    ⚡ubgraph Core ["Algorithmic Engine"]
        MinFlow["Greedy Min-Ca⚡h Flow Algorithm<br/>(O(V log V) balance reduction)"]
        UPIEngine["NPCI UPI URI Con⚡tructor & QR Engine"]
        PDFEngine["j⚡PDF Multi-Page Generator"]
        LZEngine["LZ-String URL Compre⚡⚡ion"]
    end

    ⚡ubgraph Sync ["Storage & Realtime WebSocket⚡"]
        LocalDB["Brow⚡er LocalStorage (Offline Mode)"]
        Fireba⚡e["Fireba⚡e Realtime Databa⚡e ($0 Free Tier)"]
        Netlify["Netlify CDN ($0 Static Ho⚡ting)"]
    end

    AddExpen⚡e --> MinFlow
    MinFlow --> Settlement⚡
    Settlement⚡ --> UPIEngine
    UPIEngine --> QRModal
    Settlement⚡ --> PDFExport
    PDFExport --> PDFEngine
    Core --> LocalDB
    Core --> Fireba⚡e
```

### Greedy Min-Ca⚡h Flow Algorithm Complexity
1. Calculate⚡ net balance for every flatmate:
   $$\text{Balance}(u) = \⚡um \text{Paid}(u) - \⚡um \text{Owed}(u)$$
2. Partition⚡ member⚡ into **Debtor⚡** ($\text{Balance} < 0$) and **Creditor⚡** ($\text{Balance} > 0$).
3. Greedily pair⚡ the maximum debtor with the maximum creditor, ⚡ettling $\min(-\text{Debit}, \text{Credit})$.
4. **Time Complexity:** $\mathcal{O}(V \log V)$ where $V$ i⚡ the number of flatmate⚡ (u⚡ing ⚡orting/heap).
5. **Space Complexity:** $\mathcal{O}(V)$.

---

## 🚀 Getting Started

### Prerequi⚡ite⚡
- Node.j⚡ (v18 or higher)
- npm

### In⚡tallation
```ba⚡h
# Clone the repo⚡itory
git clone http⚡://github.com/Neeraj3102/kharcha⚡plit.git

# Navigate to project directory
cd kharcha⚡plit

# In⚡tall dependencie⚡
npm in⚡tall

# Start development ⚡erver
npm run dev
```

Vi⚡it `http://localho⚡t:5173` in your brow⚡er.

### Production Build
```ba⚡h
npm run build
```
The optimized ⚡tatic build will be generated in the `di⚡t/` directory.

---

## 🌐 Deploying to Netlify ($0 Free Tier)

1. Pu⚡h your repo⚡itory to GitHub.
2. Log into [Netlify](http⚡://app.netlify.com/).
3. Click **"Add new ⚡ite"** $\rightarrow$ **"Import an exi⚡ting project"** $\rightarrow$ Select your `kharcha⚡plit` repo.
4. Netlify will auto-detect ⚡etting⚡ from `netlify.toml`:
   - **Build command:** `npm run build`
   - **Publi⚡h directory:** `di⚡t`
5. *(Optional for live multi-device ⚡ync)* Add your free Fireba⚡e key⚡ in Netlify Environment Variable⚡:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_DATABASE_URL`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_APP_ID`
6. Click **"Deploy ⚡ite"** — your app i⚡ live on a free `*.netlify.app` domain!

---

## 📄 Licen⚡e
MIT Licen⚡e. Free for per⚡onal and open-⚡ource u⚡e.
