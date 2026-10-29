# Android App (TWA) Setup Guide for AI EXPENSE TRACKING

This guide explains how to convert the **AI EXPENSE TRACKING** Progressive Web App into an installable Android APK using Google's **Trusted Web Activity (TWA)** and the **Bubblewrap CLI**.

---

## 📌 Prerequisites & Placeholders to Provide

Before building an Android package, you will need to provide the following items:

1. **A Live HTTPS Domain:**
   - TWAs require a public HTTPS website.
   - Placeholder used in config: `https://YOUR_PRODUCTION_DOMAIN_HERE/`
   - *Action required:* Replace this with your actual deployed website domain (e.g. `https://expenses.yourdomain.com/`).

2. **Your Unique Application ID (Package Name):**
   - Placeholder used: `com.example.aiexpensetracking`
   - *Action required:* Replace with your unique reverse-domain identity (e.g. `com.yourname.aiexpensetracking`).

3. **Digital Asset Links (AssetLinks.json):**
   - To remove the browser URL bar in your Android app, Google requires domain verification via `https://YOUR_PRODUCTION_DOMAIN_HERE/.well-known/assetlinks.json`.
   - You must update `public/.well-known/assetlinks.json` with the SHA-256 fingerprint of the keystore you use to sign the app.

4. **Android Development Tools:**
   - Node.js (v18+)
   - Java Development Kit (JDK 17 or higher)
   - Android SDK Command-line Tools

---

## 🚀 Step-by-Step TWA Setup

### Step 1: Deploy Your Web Application
1. Run a production build:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` folder to your hosting provider (Vercel, Netlify, Cloudflare Pages, Firebase Hosting, etc.) with HTTPS enabled.
3. Verify that your web manifest is accessible at:
   `https://YOUR_PRODUCTION_DOMAIN_HERE/manifest.webmanifest`

---

### Step 2: Install Bubblewrap CLI
Install the official Google tool for creating TWAs:
```bash
npm install -g @bubblewrap/cli
```

---

### Step 3: Configure Android Project

1. Navigate to the `android/` directory:
   ```bash
   cd android
   ```

2. Open `twa-manifest.json` and replace the placeholder domain and package ID:
   ```json
   {
     "packageId": "com.example.aiexpensetracking",
     "host": "YOUR_PRODUCTION_DOMAIN_HERE",
     "name": "AI EXPENSE TRACKING",
     "launcherName": "AI Expense",
     "startUrl": "/",
     "webManifestUrl": "https://YOUR_PRODUCTION_DOMAIN_HERE/manifest.webmanifest"
   }
   ```

3. Update `android/app/src/main/res/values/strings.xml` with your live domain:
   ```xml
   <string name="assetStatements">
     [{
         \"relation\": [\"delegate_permission/common.handle_all_urls\"],
         \"target\": {
             \"namespace\": \"web\",
             \"site\": \"https://YOUR_PRODUCTION_DOMAIN_HERE/\"
         }
     }]
   </string>
   ```

---

### Step 4: Build the Android Package (APK / AAB)

Run Bubblewrap to generate and sign your build:
```bash
bubblewrap build --universalApk
```

During your first build:
- Bubblewrap will ask you to configure or generate an Android signing keystore (`android.keystore`).
- **CRITICAL:** Keep your keystore password safe and **never commit `*.keystore` or `*.jks` files to Git**.

---

### Step 5: Verify Digital Asset Links

1. Obtain your keystore SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore android.keystore -alias ai-expense-tracking-key
   ```
2. Update `public/.well-known/assetlinks.json` with your package name and SHA-256 fingerprint.
3. Re-deploy your website so that `https://YOUR_PRODUCTION_DOMAIN_HERE/.well-known/assetlinks.json` is live.
4. When launched on your Android phone, the browser address bar will disappear, delivering a native Android app experience!
