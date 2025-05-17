# HAUS dApp

HAUS is a decentralized application for live event ticketing and streaming built on Solana.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/en/) v16.0.0 or higher
- [npm](https://www.npmjs.com/), [yarn](https://yarnpkg.com/), or [pnpm](https://pnpm.io/) package manager
- [Git](https://git-scm.com/)
- [Phantom](https://phantom.app/) or another Solana wallet extension for your browser

### Clone the Repository

```bash
# Clone the repository
git clone https://github.com/haus-live/dapp.git

# Navigate to the project directory
cd dapp/haus-dapp
```

### Install Dependencies

```bash
# Using npm
npm install

# OR using yarn
yarn install

# OR using pnpm (recommended)
pnpm install
```

### Environment Setup

1. Create a new `env.ts` file in the `lib` directory:

```bash
# Create env.ts file in the lib directory
touch lib/env.ts
```

2. Add the following content to the `lib/env.ts` file:

```typescript
/**
 * Environment variables for the application
 * Provides centralized access to configuration values
 */

// Solana RPC URL - using environment variable with fallback
export const SOLANA_RPC_URL = process.env.NEXT_PUBLIC_ALCHEMY_RPC || 'https://solana-devnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY';

// Solana program ID - using environment variable with fallback
export const SOLANA_PROGRAM_ID = 'GZtbVznhmHTqn6PbiSN6PdJNPBboMW5gkCYszq9caNQ1';

// Pinata IPFS gateway URL for content retrieval
export const PINATA_GATEWAY_URL = `https://${process.env.NEXT_PUBLIC_PINATA_URL || 'YOUR_PINATA_URL'}/ipfs`;

// Pinata API credentials for IPFS uploads
export const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || 'YOUR_PINATA_API_KEY';
export const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET || 'YOUR_PINATA_API_SECRET';

// Pinata JWT for authentication (optional, used when available)
export const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || 'YOUR_PINATA_JWT';

// Export all environment variables for easier imports
export const ENV = {
  SOLANA_RPC_URL,
  SOLANA_PROGRAM_ID,
  PINATA_GATEWAY_URL,
  PINATA_API_KEY,
  PINATA_API_SECRET,
  PINATA_JWT
};
```

3. Replace the placeholder values with your actual API keys and credentials:
   - Get a free Alchemy API key from [Alchemy](https://www.alchemy.com/)
   - Get Pinata API credentials from [Pinata](https://www.pinata.cloud/)

### Running the Development Server

```bash
# Using npm
npm run dev

# OR using yarn
yarn dev

# OR using pnpm
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Building for Production

```bash
# Using npm
npm run build

# OR using yarn
yarn build

# OR using pnpm
pnpm build
```

To start the production server:

```bash
# Using npm
npm run start

# OR using yarn
yarn start

# OR using pnpm
pnpm start
```

## Codebase Improvements

We've consolidated the Solana-related functionality to improve maintainability and reduce duplication:

- All Solana functionality is now centralized in `lib/solana/utils.ts`, which includes:
  - Provider/program initialization
  - Event minting and direct transactions
  - Ticket collection creation
  - Borsh serialization helpers
  - Art category utilities
  - PDA (Program Derived Address) derivation

This consolidation removes redundancy, improves consistency, and makes the codebase more maintainable.

## Environmental Variables

The application requires the following environment variables:

```
# Solana RPC URL
NEXT_PUBLIC_SOLANA_RPC_URL=

# Solana program ID
NEXT_PUBLIC_SOLANA_PROGRAM_ID=

# Pinata IPFS configuration
NEXT_PUBLIC_PINATA_API_KEY=
NEXT_PUBLIC_PINATA_API_SECRET=
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_PINATA_GATEWAY_URL=
```

See `env.md` for more details.

## Learn More

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deployment

The app is ready to be deployed on platforms that support Next.js applications, such as Vercel.

## Overview
Haus Live is a platform for creating and attending live events, using Solana blockchain for ticketing and ownership.

## Documentation

For comprehensive documentation of the project structure, files, and architecture, please see:
- [Project Documentation](docs/project-documentation.md) - Complete codebase overview
- [System Architecture](docs/system-architecture.md) - Technical architecture details
- [OBS Streaming Guide](docs/obs-streaming.md) - Setting up streaming with OBS
- [IPFS Integration](docs/ipfs-integration.md) - How IPFS is used for content storage
- [RTA Mechanism](docs/rta-mechanism.md) - Real-Time Asset implementation details
- [RTA Game Theory](docs/rta-game-theory.md) - Theory behind Real-Time Assets
- [Why Solana](docs/why-solana.md) - Rationale for using Solana blockchain

## Ticket Collection and Event NFT System

### Overview
The application uses a two-part system for events:
1. **Event NFT**: A real-time asset (RTA) that represents the event itself
2. **Ticket Collection**: A Metaplex Core Candy Machine that manages the tickets for the event

### Technical Implementation

#### Event Creation Flow
1. User fills out event details in the Event Factory UI
2. System uploads event metadata to IPFS
3. A Metaplex Core Candy Machine is created for ticket minting
4. The event NFT is created with a reference to the ticket collection
5. The newly created event appears in the Event Market

#### Production Ticket System
The ticket collection system uses Metaplex Core Candy Machine for robust ticketing functionality including:

- Minting limits based on ticket quantity
- Configurable ticket price in SOL
- Creator royalties (5%)
- Sequential ticket numbering

### Development Notes

#### Working with the Ticket Collection
- The ticket collection is created in `lib/solana/event-minter.ts` via the `createTicketCollection` function
- Implementation uses `@metaplex-foundation/mpl-core-candy-machine` for production-ready ticket management
- Ticket metadata and pricing are derived from the event details
- Each ticket is named according to the event with sequential numbering

#### Error Resolution
If you encounter the error `Cannot read properties of undefined (reading 'size')`, it's likely related to the IDL account definitions. The solution is in `program-client.ts` where we ensure all accounts have a proper size property.

## License
[MIT License](LICENSE) 