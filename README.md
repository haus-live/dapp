# Haus Live dApp

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

## Setup and Development

### Requirements
- Node.js (v16+)
- pnpm or yarn
- A Solana wallet (Phantom recommended)

### Installation
```bash
pnpm install
# or
yarn install
```

### Environment Setup
Copy the example environment file and update it with your values:
```bash
cp env.example.ts env.ts
```

### Development Server
```bash
pnpm dev
# or
yarn dev
```

### Building for Production
```bash
pnpm build
# or
yarn build
```

## License
[MIT License](LICENSE) 