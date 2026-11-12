# 🎬 OmniReel AI Video Studio — Multi-Language Generative Video & SVG/FFmpeg Pipeline

**OmniReel AI Video Studio** is a full-stack generative AI video creation platform engineered around the **"AI Suggests → User Decides"** workflow paradigm. It combines multi-model AI orchestration (**Claude, GPT, Gemini, Kling, Seedance, Hailuo, ElevenLabs**), a **Server-Side Multi-Language SVG Typesetting Engine** (**Vietnamese, Korean, English**), **Headless Chromium & FFmpeg video synthesis**, **Prompt A/B Regression Testing**, and a **Self-Healing Render Queue** across **Web (Next.js App Router)** and **Mobile (Bare React Native CLI)**.

---

## 🏗️ 1. Technology Stack & Architecture

| Layer | Technologies Used | Location |
| :--- | :--- | :--- |
| **Generative Text LLMs** | **Claude 3.7 Sonnet** (XML Tags), **GPT-4o** (Strict JSON Schema), **Gemini 2.5 Pro** (System Grounding) with **Single-Pass Structured Batching** (cuts token cost & API calls by 62%) | `apps/backend/src/ai/ai-gateway.service.ts` |
| **Generative Image AI** | **Gemini 2.5 Flash Image / Imagen 3** (Synthesizes 9:16 keyframes with low-luminance negative space so overlaid SVG typography achieves WCAG AAA 14.8:1 contrast) | `apps/backend/src/ai/ai-gateway.service.ts` |
| **Generative Video AI** | **Kling v2.0 Master**, **Seedance 1.0 Pro**, **Hailuo I2V-01** via unified AI Video Gateway with automatic rule-based model failover | `apps/backend/src/render/video-renderer.service.ts` |
| **Voice & Music AI** | **ElevenLabs Multilingual v2** (Word-level subtitle timestamp alignment + `-14dB` sidechain BGM ducking) | `apps/backend/src/studio/studio.resolver.ts` |
| **Content Rendering & Processing** | **Server-Side SVG Typesetting Engine**, **Headless Chromium**, **FFmpeg (`ffmpeg-static`)** producing 9:16 H.264/AAC `.mp4` videos with `xfade` transitions (`zoompan`, `wipeleft`, `circleopen`, `fade`) | `apps/backend/src/render/svg-typesetter.service.ts`<br>`apps/backend/src/render/video-renderer.service.ts` |
| **Web Frontend** | **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Apollo Client** | `apps/web` |
| **Mobile App** | **React Native CLI (No Expo)**, **TypeScript**, **Apollo Client**, `react-native-svg`, `react-native-video` | `apps/mobile-rn` |
| **Backend & Task Queue** | **NestJS**, **GraphQL (Apollo Server)**, **Prisma ORM**, **PostgreSQL 16 / SQLite**, **Redis 7 & Task Queue** | `apps/backend` |
| **Multi-Language Engine** | **Vietnamese (`vi`)**, **Korean (`ko`)**, and **English (`en`)** with language-aware line breaking, compound-word preservation, diacritic headroom, and TikTok/Reels 9:16 safe-zone enforcement | `apps/backend/src/render/svg-typesetter.service.ts` |

---

## ✨ 2. Core Product & Engineering Highlights

### 2.1. AI Content Development & Quality Optimization
- **Server-Side Multi-Language SVG Typesetting (`SvgTypesetterService`)**:
  - **Vietnamese (`vi`)**: Preserves multi-syllable compound words (e.g., *"trí tuệ nhân tạo"*, *"thương hiệu"*, *"chuyển đổi số"*) using non-breaking phrase tokens so compounds never split awkwardly across lines; enforces `+22px` vertical diacritic headroom so stacked tone marks (`ắ`, `ể`, `ữ`, `ợ`) are never clipped.
  - **Korean (`ko`)**: Implements Hangul `어절 (eojeol / keep-all)` phrase-boundary breaking with optical tracking (`-0.025em`) on `Pretendard / Noto Sans KR`.
  - **English (`en`)**: Applies optical kerning (`-0.02em`) and widow/orphan prevention on the final line.
- **Model-Specific Prompt Compiler & Prompt A/B Regression Lab**:
  - Compiles creative briefs into model-optimized syntax (Claude XML, GPT Strict JSON Schema, Gemini Grounded Instructions, and Kling/Seedance/Hailuo Camera Motion DSL).
  - Evaluates candidate prompts against operational datasets (Typography Score, Brand Consistency, Subtitle Sync, Cost, Latency) with **1-Click Auto-Rollback** if quality drops below threshold.

### 2.2. UI/UX: "AI Suggests → User Decides" Studio
- Eliminates complex multi-field forms: AI proposes **3 grounded, data-backed concept cards** with predicted retention impact, confidence scores, and cost deltas that users can preview and apply in **one click**.
- Interactive **TikTok / Reels 9:16 Safe-Zone Overlay** and **Line-Break Inspector** on the live studio canvas.
- **100% Web & Mobile Visual Parity**: Both `apps/web` (Next.js) and `apps/mobile-rn` (Bare React Native CLI) consume the same GraphQL `SceneModel` and render the exact same server-typeset SVG markup.

### 2.3. Self-Healing Render Pipeline & Queue Reliability
- Built-in **Chaos & Failure Recovery Testing**:
  - **`KLING_TIMEOUT_503`**: Automatically detects upstream timeout on `kling-v2.0` and fails over to `seedance-1.0` or `hailuo-i2v` with translated motion vectors.
  - **`SVG_TEXT_OVERFLOW`**: Automatically scales down headline font size by 10% and reflows within the `Y=[420..1240]` vertical safe zone.
  - **`ELEVENLABS_RATE_LIMIT`**: Applies exponential jitter backoff and recovers voiceover synchronization without dropping the render job.

---

## 📂 3. Monorepo Structure

```text
AIAgentVideo/
├── apps/
│   ├── backend/                  # NestJS + GraphQL + Prisma + AI Gateway + SVG/FFmpeg Renderer
│   │   ├── prisma/
│   │   │   ├── schema.prisma             # Zero-config local SQLite Prisma schema
│   │   │   └── schema.postgresql.prisma  # Production PostgreSQL 16 Prisma schema
│   │   └── src/
│   │       ├── ai/ai-gateway.service.ts          # Multi-model LLM/Image/Video/TTS prompt compiler
│   │       ├── render/svg-typesetter.service.ts  # VI/KO/EN Server-Side SVG Typesetting Engine
│   │       ├── render/video-renderer.service.ts  # FFmpeg MP4 synthesis & auto-recovery queue
│   │       ├── studio/studio.resolver.ts         # GraphQL Queries & Mutations
│   │       └── verify-e2e.ts                     # End-to-End SVG & FFmpeg verification script
│   ├── web/                      # Next.js 15 (App Router) + React 19 + Tailwind + Apollo Client
│   │   └── src/
│   │       ├── app/page.tsx                      # Interactive AI Video Studio, QA Lab & Queue Monitor
│   │       └── lib/graphql-queries.ts            # Shared GraphQL documents
│   └── mobile-rn/                # Bare React Native CLI (No Expo) Mobile App
│       ├── react-native.config.js                # Native CLI configuration & font assets
│       └── src/screens/MobileStudioScreen.tsx    # Native mobile studio consuming shared GraphQL & SVG
├── docker-compose.yml            # PostgreSQL 16 + Redis 7 production containers
├── .env.example                  # Environment variables template (Hybrid & Live API modes)
└── package.json                  # Root workspace scripts
```

---

## ⚙️ 4. Prerequisites & Environment Setup

### Prerequisites
- **Node.js**: `v20.x` or later (tested on `v22+` / `v26+`)
- **npm**: `v10.x` or later
- **FFmpeg**: Automatically installed via `ffmpeg-static` (no manual system installation required)
- **Optional (for Production DB / Queue)**: Docker & Docker Compose (PostgreSQL 16 + Redis 7)
- **Optional (for Mobile Native Builds)**: Xcode + CocoaPods (for iOS) or Android Studio + JDK 17 + Android SDK (for Android)

### Environment Variables (`.env`)
By default, the project runs out-of-the-box in **Smart Hybrid Mode** (deterministic structured AI responses + real Server-Side SVG typesetting + real FFmpeg MP4 video synthesis). To connect live external AI APIs, copy `.env.example` to `apps/backend/.env`:

```bash
cp .env.example apps/backend/.env
```

You can optionally populate your live API keys in `apps/backend/.env`:
- `GEMINI_API_KEY` (Google Gemini Text & Image models)
- `ANTHROPIC_API_KEY` (Claude models)
- `OPENAI_API_KEY` (GPT models)
- `AI_VIDEO_GATEWAY_KEY` (Kling / Seedance / Hailuo gateway)
- `ELEVENLABS_API_KEY` (ElevenLabs TTS & Music)

---

## 🚀 5. How to Build & Run on Web (Backend + Next.js Web Studio)

### Step 1: Install Dependencies & Initialize Binaries
From the root directory (`AIAgentVideo/`), install all workspace dependencies and ensure the local `esbuild` and `ffmpeg-static` binaries are initialized:

```bash
npm install --legacy-peer-deps
node node_modules/esbuild/install.js
node node_modules/ffmpeg-static/install.js
```

### Step 2: Initialize & Seed the Database (Prisma)
Push the Prisma schema to initialize the database and seed initial multi-language (`VI`, `KO`, `EN`) studio projects, grounded AI suggestions, and Prompt A/B experiments:

```bash
npm run db:push
npm run db:seed
```

*(Optional: If you prefer running against PostgreSQL 16 + Redis 7 via Docker instead of zero-config SQLite, run `docker compose up -d`, copy `apps/backend/prisma/schema.postgresql.prisma` to `apps/backend/prisma/schema.prisma`, update `DATABASE_URL` in `apps/backend/.env`, and run `npm run db:push`.)*

### Step 3: Run in Development Mode (Hot-Reload)
Start both the **NestJS GraphQL Backend** (`port 4000`) and the **Next.js Web Studio** (`port 3000`) concurrently with a single command:

```bash
npm run dev
```

Or run each service in a separate terminal:

```bash
# Terminal 1 — Start NestJS + GraphQL + FFmpeg Backend (http://localhost:4000/graphql)
npm run dev:backend

# Terminal 2 — Start Next.js 15 App Router Web Studio (http://localhost:3000)
npm run dev:web
```

- **Web Studio UI**: Open [http://localhost:3000](http://localhost:3000)
- **GraphQL Playground**: Open [http://localhost:4000/graphql](http://localhost:4000/graphql)

### Step 4: Production Build & Start (Web + Backend)
To compile TypeScript and create an optimized production build for both `@omnireel/backend` and `@omnireel/web`:

```bash
# Build both Backend and Web Frontend
npm run build

# Start Backend in production mode (Port 4000)
npm run start --workspace=apps/backend

# Start Next.js Web Studio in production mode (Port 3000)
npm run start --workspace=apps/web
```

---

## 📱 6. How to Build & Run the Mobile Application (React Native CLI — No Expo)

The mobile application is located in `apps/mobile-rn` and uses **Bare React Native CLI** (without Expo) to render the exact same GraphQL `SceneModel` and server-typeset SVG frames (`react-native-svg`) as the Web Studio.

### Step 1: Ensure the NestJS GraphQL Backend is Running
The mobile client connects to the NestJS GraphQL server on port `4000`:
- **iOS Simulator**: Uses `http://localhost:4000/graphql`
- **Android Emulator**: Uses `http://10.0.2.2:4000/graphql` (or run `adb reverse tcp:4000 tcp:4000` so `localhost:4000` resolves directly inside the Android emulator)
- **Physical Device**: Use your computer's LAN IP address (e.g., `http://192.168.1.x:4000/graphql`)

Make sure the backend is active:

```bash
npm run dev:backend
```

### Step 2: Install Mobile Dependencies
Navigate to `apps/mobile-rn` and install packages:

```bash
cd apps/mobile-rn
npm install --legacy-peer-deps
```

> **Note for New Native Shell Initialization**: If `ios/` and `android/` native platform folders have not yet been generated on your machine, initialize the bare React Native native shell once using:
> ```bash
> npx @react-native-community/cli@latest init OmniReelMobile --directory ./temp-rn --skip-install
> mv ./temp-rn/ios ./temp-rn/android ./
> rm -rf ./temp-rn
> ```

### Step 3: Build & Run on iOS (macOS + Xcode Required)
1. Install native CocoaPods dependencies:
   ```bash
   cd ios && pod install && cd ..
   ```
2. Start the Metro JavaScript bundler:
   ```bash
   npm run start
   ```
3. In a new terminal inside `apps/mobile-rn`, build and launch the iOS app in the iOS Simulator:
   ```bash
   npm run ios
   ```

### Step 4: Build & Run on Android (Android Studio + SDK + JDK 17 Required)
1. Start an Android Virtual Device (AVD) from Android Studio or connect a physical Android device with USB Debugging enabled.
2. Forward port `4000` so the emulator can reach the local NestJS GraphQL backend:
   ```bash
   adb reverse tcp:4000 tcp:4000
   ```
3. Start Metro and launch the Android build from `apps/mobile-rn`:
   ```bash
   npm run android
   ```

### Step 5: Instant Web & Mobile Parity Preview Inside the Web Studio
If you want to inspect the mobile layout and shared GraphQL/SVG behavior immediately without booting Xcode or Android Studio, open the Web Studio at `http://localhost:3000` and click the **"Web + React Native Parity View" (`So sánh Web & React Native`)** toggle button above the 9:16 viewport.

---

## 🧪 7. End-to-End Verification & Chaos Testing

To verify Server-Side SVG typesetting across all 3 languages (`VI`, `KO`, `EN`), run a real FFmpeg MP4 synthesis, and test automatic failover from `kling-v2.0` to `seedance-1.0` via CLI:

```bash
cd apps/backend
npx tsx src/verify-e2e.ts
```

This script outputs:
1. Line-break diagnostics for **Vietnamese** (compound words preserved, `+22px` diacritic headroom), **Korean** (`eojeol` keep-all), and **English** (orphan/widow guard).
2. Real `.mp4` video file generation verified on disk at `apps/backend/public/renders/`.
3. Automated recovery from simulated `KLING_TIMEOUT_503` upstream errors.
