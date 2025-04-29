# RTA Mechanism: Technical Implementation and User Flow

This document provides a comprehensive explanation of the Real-Time Asset (RTA) mechanism, including its technical implementation, user flows, and contract interactions.

## Overview

A Real-Time Asset (RTA) is a new type of NFT that acquires value during a live event through audience participation. Unlike traditional NFTs that represent a static final product, RTAs capture the entire creative process and derive their value from audience engagement.

## Core Components

The RTA mechanism consists of several interconnected components:

### 1. Smart Contracts

Three primary Solana programs handle the RTA lifecycle:

- **EventFactory**: Creates and manages events, mints initial RTA NFTs
- **TicketFactory**: Handles ticket sales and verification for event access
- **LiveTipping**: Processes tips during events and tracks the highest tipper

### 2. Metadata Schema

Each RTA has a rich metadata structure:

```json
{
  "name": "Event Title",
  "description": "Event description",
  "image": "ipfs://CID_OF_THUMBNAIL",
  "animation_url": "ipfs://CID_OF_MANIFEST",
  "attributes": [
    { "trait_type": "Category", "value": "live-painting" },
    { "trait_type": "Artist", "value": "artist.eth" },
    { "trait_type": "Duration", "value": "60 minutes" },
    { "trait_type": "Total Tips", "value": "25 SOL" }
  ],
  "properties": {
    "eventId": "123",
    "startTime": 1625097600,
    "endTime": 1625101200,
    "manifestCid": "QmXyZ...",
    "status": "completed"
  }
}
