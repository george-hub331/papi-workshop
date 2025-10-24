# React PAPI Template

A modern **React + TypeScript + Vite** template for building Polkadot decentralized applications (dApps) using the PAPI SDK.

> This project was generated using [createdot.app](https://createdot.app) scaffold.

## 🚀 Features

- **React** with TypeScript support
- **Vite** for fast development and building
- **PAPI SDK** integration for Polkadot blockchain interaction
- **TailwindCSS + DaisyUI** for beautiful UI components
- **Wallet Connection** support via Talisman Connect
- **Iconify** icons integration
- Pre-configured for **multiple Polkadot chains**

## 🔗 SDK Information

This template uses **PAPI (Polkadot API)** - a modern, type-safe SDK for interacting with Polkadot-based blockchains.

📚 **PAPI Documentation**: https://papi.how/

### Ink SDK Resources:
- **Ink SDK Documentation**: https://papi.how/ink-sdk
- **Smart Contract Development**: https://papi.how/ink-sdk/contracts

### Configuration Files:
- **`src/utils/sdk.ts`** - Configures which chains to connect to and manages chain endpoints. You can modify supported networks and RPC providers here.
- **`src/utils/sdk-interface.ts`** - Provides high-level functions for onchain SDK calls.


## 🛠️ Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
src/
├── components/     # React components
├── hooks/          # Custom React hooks
├── utils/          # Utility functions and SDK setup
├── descriptors/    # Chain descriptors
├── style.css       # Global styles
└── App.tsx         # Main application component
```

## 🔧 Adding Custom Networks

### Step 1: Generate Chain Descriptors

PAPI requires type descriptors for each chain. Generate them using the PAPI CLI:

```bash
# Add a new chain using a WebSocket endpoint
npx papi add your_chain -w wss://your-rpc-endpoint.io

# Add  (PASET) testnet
npx papi add -w wss://testnet-passet-hub.polkadot.io passet

# Generate descriptors (automatically runs on postinstall)
npx papi
```

### Generating Ink Contract Descriptors

For smart contracts built with Ink!, you can generate type-safe descriptors:

```bash
# Generate descriptors for an Ink! contract
npx papi ink add ./src/deployments/todo_app.contract -k todo
```

This creates type-safe descriptors in `@polkadot-api/descriptors` that you can import.

### Step 2: Configure Your Chain

Edit `src/utils/sdk.ts` to add your chain configuration:

```typescript
import { yourChain } from '@polkadot-api/descriptors'

const CONFIG = {
  // ... existing chains
  your_chain: {
    descriptor: yourChain,
    providers: ['wss://your-rpc-endpoint.io'],
  },
}
```

You can add multiple RPC endpoints for fallback support:

```typescript
const CONFIG = {
  dot: {
    descriptor: polkadot,
    providers: [
      'wss://rpc.polkadot.io',
      'wss://polkadot-rpc.dwellir.com'
    ],
  },
}
```

📖 For more details, see the [PAPI Codegen documentation](https://papi.how/codegen).

## 📚 Learn More

- [React Documentation](https://react.dev/)
- [PAPI Documentation](https://papi.how/)
- [Polkadot Developer Portal](https://wiki.polkadot.network/)
