# 🎯 Plinko Lab - Provably Fair Gaming

A complete full-stack implementation of a provably fair Plinko game built with Next.js 14, TypeScript, and a deterministic physics engine.

## 🌟 Features

- **🔐 Provably Fair**: Full commit-reveal protocol with SHA256 hashing
- **🎮 Interactive Gameplay**: Animated ball physics with sound effects
- **📱 Responsive Design**: Works seamlessly on desktop and mobile
- **⚡ Real-time Animation**: Smooth ball drops with confetti celebrations
- **🔍 Verification System**: Complete round verification and replay
- **⌨️ Keyboard Controls**: Arrow keys + spacebar for accessibility
- **🎨 Easter Eggs**: Hidden surprises for enhanced user experience
- **🧪 Comprehensive Testing**: Full test coverage for all critical systems

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (for local development)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd plinko-lab

# Install dependencies
npm install

# Set up the database
npx prisma migrate dev --name init

# Start the development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to play!

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Framer Motion
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Animation**: Framer Motion, React Confetti
- **Audio**: Howler.js
- **Testing**: Jest, Testing Library

## 🔐 Provably Fair Protocol

Our implementation follows a strict commit-reveal scheme to ensure complete transparency and fairness.

### Protocol Steps

1. **Commit Phase**
   ```
   serverSeed = generateRandomHex()
   nonce = generateUniqueString()
   commitHash = SHA256(serverSeed + ":" + nonce)
   ```

2. **Client Input**
   ```
   clientSeed = userProvidedString
   dropColumn = userSelectedColumn (0-12)
   betAmount = userSelectedAmount
   ```

3. **Seed Combination**
   ```
   combinedSeed = SHA256(serverSeed + ":" + clientSeed + ":" + nonce)
   ```

4. **Deterministic Generation**
   ```
   prngSeed = first4Bytes(combinedSeed) // Big-endian
   rng = XORShift32(prngSeed)
   ```

### Randomness Sources

**ALL randomness comes from a single deterministic PRNG stream:**

1. **Peg Generation** (144 calls): Each peg bias = `0.5 + (rand() - 0.5) * 0.2`
2. **Ball Path** (12 calls): One decision per row

**Critical**: No external randomness is used after seed generation.

## 🎯 Game Mechanics

### Peg Map Generation

- **Rows**: 12 triangular rows
- **Pegs per row**: Row N has N+1 pegs
- **Peg bias**: `leftBias = 0.5 + (rand() - 0.5) * 0.2`, rounded to 6 decimals
- **Drop adjustment**: `bias' = clamp(leftBias + (dropColumn - 6) * 0.01, 0, 1)`

### Ball Physics

```typescript
for each row:
  pegIndex = min(currentPosition, pegCount - 1)
  adjustedBias = clamp(baseBias + dropAdjustment, 0, 1)
  randomValue = rng.next()
  
  if (randomValue < adjustedBias):
    direction = "left"
    // position stays same
  else:
    direction = "right" 
    position += 1
```

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Test Coverage

```bash
npm run test:ci
```

### Key Test Cases

- **PRNG Determinism**: Verifies XORShift32 produces expected sequences
- **Commit-Reveal**: Tests hash generation and verification
- **Engine Consistency**: Ensures deterministic gameplay
- **Verification**: Tests round replay and validation

## ⌨️ Controls & Accessibility

### Keyboard Controls

- **← →**: Change drop column
- **Space**: Drop ball
- **T**: Toggle tilt effect
- **Type "open sesame"**: Activate dark theme

## 🎨 Easter Eggs

1. **Tilt Board** (Press 'T'): Tilts board ±5° with vintage scanline effect
2. **Dark Dungeon Theme** (Type "open sesame"): Enables atmospheric dark mode

## 🌐 Environment Variables

Create `.env` file:

```bash
# Database
DATABASE_URL="file:./dev.db"

# For production PostgreSQL:
# DATABASE_URL="postgresql://username:password@localhost:5432/plinko?schema=public"
```

## 📦 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 🤖 AI Usage Disclosure

This project utilized AI assistance for:

- **Code Generation**: Initial component scaffolding and boilerplate
- **Algorithm Implementation**: XORShift32 PRNG and hash functions  
- **Test Writing**: Comprehensive test suite generation
- **Documentation**: README structure and technical explanations

**Human oversight**: All AI-generated code was reviewed, tested, and modified by humans to ensure correctness, security, and performance.

---

**Built with ❤️ for fair and transparent gaming**
