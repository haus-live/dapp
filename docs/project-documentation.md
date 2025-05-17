# Haus Live dApp - Comprehensive Documentation

## Project Overview

Haus Live is a platform for creating and attending live events, leveraging the Solana blockchain for ticketing and ownership. The application is built with Next.js, React, and integrates with Solana for blockchain functionality.

## Directory Structure and File Documentation

### Root Directory

- **package.json**: Defines project dependencies and scripts. Key dependencies include Next.js, React, Solana Web3 libraries, Metaplex Foundation libraries for NFT functionality, and UI components from Radix UI.
- **next.config.mjs**: Next.js configuration file for custom server settings and environment configurations.
- **tailwind.config.ts**: Tailwind CSS configuration defining custom themes, colors, and component styles.
- **tsconfig.json**: TypeScript configuration specifying compiler options and paths.
- **env.md**: Documentation for environment variables required by the application.
- **postcss.config.mjs**: PostCSS configuration for processing CSS with plugins.
- **components.json**: Defines UI component configurations for the shadcn/ui library integration.

### `/app` Directory - Next.js Application Routes

- **layout.tsx**: Main layout component that wraps all pages, includes global providers (auth, wallet, themes) and UI elements like navigation.
- **page.tsx**: Home page of the application displaying featured events, statistics, and entry points to different sections.
- **globals.css**: Global CSS styles applying Tailwind directives and custom global styles.
- **loading.tsx**: Loading state component displayed during Next.js page transitions.
- **manifest.json**: Web app manifest file containing app metadata for PWA functionality.

#### `/app/event-factory` 
Contains components for creating new events, including multi-step forms, validation, metadata uploading, and NFT minting integration.

#### `/app/event-room`
Components for the live event experience, including video streaming integration, chat functionality, tipping mechanisms, and ticket verification.

#### `/app/event-market`
Marketplace interface for discovering, browsing, filtering, and purchasing event tickets with sorting options and category filtering.

#### `/app/profile`
User profile management, ticket collection display, event history, settings page, and wallet connection management.

### `/components` Directory - Reusable UI Components

- **auth-guard.tsx**: Access control component for protecting routes based on authentication state and ticket ownership.
- **login-modal.tsx**: Authentication modal for user login with wallet connection, social auth options, and registration flow.
- **navbar.tsx**: Main navigation bar component with search, navigation links, and user account menu.
- **tv-player.tsx**: Video player for live streaming content with controls, quality selection, and fullscreen support.
- **event-chat.tsx**: Real-time chat interface for live events with message formatting and user identification.
- **event-video-player.tsx**: Specialized video player for event content with event-specific controls and information overlay.
- **user-nav.tsx**: User navigation dropdown with profile links, settings, and logout functionality.
- **wallet-delegation-settings.tsx**: Settings interface for configuring wallet delegation permissions and limits.
- **ticket-verification.tsx**: Component that verifies ticket ownership against the blockchain before granting access.
- **tip-modal.tsx**: Interface for sending tips to creators during events with amount selection and transaction processing.
- **logo.tsx**: Logo component with variants for different sizes and contexts.
- **footer.tsx**: Site footer with links, social media, and copyright information.
- **breadcrumbs.tsx**: Navigation breadcrumbs showing the current location in the application hierarchy.
- **toaster.tsx**: Toast notification container for displaying alerts and messages.
- **tooltip-helper.tsx**: Helper component for displaying contextual tooltips.
- **theme-provider.tsx**: Provider component for theme management using next-themes.
- **art-category-icons.tsx**: Icon components for different art/event categories.
- **web3-innovation-graphic.tsx**: Decorative graphic component for Web3 innovation sections.

#### `/components/artist`
Components specific to artist profiles and management, including profile cards, statistics, and event listings.

#### `/components/event`
Event-specific UI components like event cards, detail views, calendar displays, and interactive controls.

#### `/components/ui`
Generic UI components built on Radix UI primitives, including buttons, inputs, modals, dropdowns, and other design system elements.

### `/contexts` Directory - React Context Providers

- **auth-context.tsx**: Authentication context provider managing user state, login/logout flows, and session persistence.
- **events-context.tsx**: Context for global event state management, caching, and real-time updates.
- **solana-wallet-context.tsx**: Context for Solana wallet connection, transaction signing, and wallet state.
- **delegation-context.tsx**: Context for wallet delegation functionality and permission management.

### `/hooks` Directory - Custom React Hooks

- **use-auth.ts**: Hook for accessing authentication state and methods throughout the application.
- **use-event.ts**: Hook for fetching and managing single event data, metadata, and related operations.
- **use-events.ts**: Hook for listing, filtering, searching, and sorting multiple events.
- **use-event-chat.ts**: Hook for managing event chat connections, message sending, and history.
- **use-mobile.tsx**: Hook for responsive design detection and mobile-specific logic.
- **use-toast.ts**: Hook for displaying and managing toast notifications across the application.

### `/lib` Directory - Core Logic and Utilities

- **api-client.ts**: Client for interacting with backend APIs, handling authentication and error management.
- **constants.ts**: Application-wide constants including endpoints, configuration values, and static data.
- **env.ts**: Environment variable management and validation for different deployment environments.
- **event-metadata.ts**: Functions for handling event metadata creation, validation, and processing.
- **transactions.ts**: Generic transaction handling utilities for blockchain interactions.
- **types.ts**: Core TypeScript type definitions shared across the application.
- **utils.ts**: General utility functions for common tasks like formatting, validation, and conversion.
- **alchemy.ts**: Integration with Alchemy API for enhanced blockchain access and indexing.
- **design-tokens.ts**: Design system tokens defining colors, spacing, typography for consistent styling.

#### `/lib/solana` - Solana Blockchain Integration

- **event-minter.ts**: Core functionality for minting event NFTs, handling metadata, and creating on-chain representations.
- **candy-machine.ts**: Integration with Metaplex Candy Machine for creating and managing ticket collections.
- **connection.ts**: Solana connection management with fallback and retry mechanisms.
- **program-client.ts**: Client for interacting with custom Solana programs and instructions.
- **metaplex-client.ts**: Client for Metaplex operations including NFT creation and metadata management.
- **anchor-utils.ts**: Utilities for working with Anchor framework including account serialization.
- **idl.ts**: Interface Definition Language for Solana program interactions defining program interface.
- **direct-transaction.ts**: Utilities for direct transaction execution without using the Anchor framework.
- **borsh-helper.ts**: Helpers for Borsh serialization and deserialization of transaction data.
- **art-category.ts**: Management and validation of art categories for event classification.
- **idl-types.ts**: TypeScript types generated from the Solana program IDL.

### `/services` Directory - External Service Integrations

- **event-service.ts**: Service for event CRUD operations, data fetching, and state management.
- **chat-service.ts**: Real-time chat service integration using WebSockets for event communication.
- **rtmp-server.ts**: Integration with RTMP protocol for live video streaming ingest and distribution.
- **streaming-service.ts**: Service for managing video streams, playback, and stream health monitoring.
- **pinata-service.ts**: Integration with Pinata for IPFS content storage and retrieval.
- **tipping-service.ts**: Service for handling creator tips, payment processing, and confirmation.

### `/idl` Directory

Contains Interface Definition Language files for Solana program interactions, defining the contract interfaces and account structures used by the application.

### `/utils` Directory

General utility functions and helpers used throughout the application, organized by domain or functionality type.

### `/data` Directory

Contains static data, enumerations, and possibly mock data for development and testing.

### `/docs` Directory

Project documentation including:
- **README.md**: Overview documentation with basic setup instructions.
- **ipfs-integration.md**: Documentation for IPFS storage integration.
- **obs-streaming.md**: Guide for setting up OBS for streaming to the platform.
- **rta-game-theory.md**: Explanation of Real-Time Asset game theory concepts.
- **rta-mechanism.md**: Technical details of the RTA mechanism implementation.
- **system-architecture.md**: Overall system architecture documentation.
- **why-solana.md**: Rationale for using Solana blockchain.

### `/public` Directory

Static assets for the web application including images, fonts, and other media files.

### `/styles` Directory

Additional styling beyond Tailwind configuration, possibly containing SCSS modules or CSS-in-JS patterns.

### `/types` Directory

TypeScript type definitions specific to the application domain, extending base types with business logic.

## Core Functionality and Relationships

### Event Creation Flow

1. Users interact with `/app/event-factory` components to fill event details
2. Form data is validated and processed by `event-service.ts`
3. Event artwork and metadata are stored via `pinata-service.ts` to IPFS
4. The event metadata contains links to artwork, event details, and ticket information
5. The event NFT (Real-Time Asset) is minted using `lib/solana/event-minter.ts`
6. A ticket collection (Candy Machine) is created using `lib/solana/candy-machine.ts`
7. The two are linked on-chain to establish the relationship between event and tickets
8. The new event appears in the event marketplace

### Event Participation Flow

1. Users browse events in `/app/event-market` with filtering and search capabilities
2. Event details are shown with date, time, creator information, and ticket availability
3. Users purchase tickets via Solana transactions processed through `lib/solana/program-client.ts`
4. Purchased tickets appear in the user's profile accessed via `/app/profile`
5. When the event goes live, ticket holders can join via `/app/event-room`
6. Authentication is verified through `components/ticket-verification.tsx`
7. Video content is streamed using `services/streaming-service.ts` and rendered by `components/event-video-player.tsx`
8. Users interact with chat via `components/event-chat.tsx` connected to `services/chat-service.ts`
9. Optionally, viewers can tip creators using `components/tip-modal.tsx` and `services/tipping-service.ts`

### Authentication Flow

1. User authentication state is managed by `contexts/auth-context.tsx`
2. Initial login is handled by `components/login-modal.tsx` 
3. Wallet connection is managed by `contexts/solana-wallet-context.tsx`
4. Protected routes are secured by `components/auth-guard.tsx`
5. Session persistence is handled through secure storage and token management
6. User profile data is stored and retrieved through the auth context

## Technical Architecture

The application follows a Next.js architecture with:
- React component hierarchy for UI organization
- Context-based state management for global state
- Custom hooks for reusable logic and data fetching
- Services for external API integrations and business logic
- Library modules for core business logic and utilities
- Solana integration for blockchain functionality

This dApp implements a two-tier NFT system:
1. Event NFTs (Real-Time Assets) representing the event itself, created through `lib/solana/event-minter.ts`
2. Ticket collections using Metaplex Candy Machine, managed through `lib/solana/candy-machine.ts`

The Real-Time Asset (RTA) mechanism allows for ownership of time-sensitive content and experiences, with the following characteristics:
- On-chain verification of ownership
- Programmable access control based on ticket ownership
- Creator royalties for secondary market sales
- Transparent record of event history and participation

Users can create, discover, and participate in events, with all ownership and transactions secured on the Solana blockchain, providing:
- Verifiable ticket ownership
- Immutable event records
- Secure payment processing
- Decentralized content access

## Development and Deployment

### Local Development
The application can be run locally using:
```bash
pnpm dev
# or
yarn dev
```

This starts the Next.js development server with hot reloading enabled.

### Building for Production
```bash
pnpm build
# or
yarn build
```

This creates an optimized production build in the `.next` directory.

### Environment Configuration
Environment variables should be configured as described in `env.md` with appropriate values for:
- Solana RPC endpoints
- IPFS gateway and API keys
- Authentication service endpoints
- Media streaming configuration 