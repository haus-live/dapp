# Haus - Reality, in the making

Haus introduces dynamic, Real-Time Assets (RTAs) to the NFT space, bringing a revolutionary approach to digital ownership in Web3. Enter the artist's workshop and own artworks that acquire value with time.

## What are Real-Time Assets (RTAs)?

RTAs are a new class of digital assets that evolve in real-time during live performances, capturing the entire creative process. Unlike traditional NFTs that represent a static final product, RTAs represent the journey of creation itself.

The value of an RTA is determined by audience participation and appreciation during the live event, creating a more equitable and dynamic marketplace where quality and engagement determine success.

## Key Features

- **Live Streaming**: Artists can broadcast their performances directly from their browser or using OBS Studio
- **Real-Time Tipping**: Viewers can tip artists during performances, contributing to the final value of the RTA
- **Decentralized Storage**: All content is stored on IPFS, ensuring permanence and censorship resistance
- **Smart Contracts**: Solana-based contracts handle ticket sales, tipping, and RTA ownership
- **Multi-Room Support**: Multiple events can run concurrently with isolated rooms
- **Account Abstraction**: Gasless transactions for a seamless user experience

## Technology Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Blockchain**: Solana (Anchor Framework)
- **Storage**: IPFS via Pinata
- **Streaming**: WebRTC, RTMP, HLS
- **Authentication**: Wallet-based authentication (Phantom, Solana Wallet Adapter)

## Getting Started

### Prerequisites

- Node.js 16+
- Yarn or npm
- Solana CLI tools (for contract deployment)
- Anchor Framework

### Installation

1. Clone the repository

```bash
git clone https://github.com/haus/haus-platform.git
cd haus-platform
