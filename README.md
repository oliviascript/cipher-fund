# Cipher Fund - Confidential Fundraising Platform

A privacy-preserving fundraising platform built with Fully Homomorphic Encryption (FHE) technology, enabling transparent campaign creation while keeping donation amounts and contributor rewards completely confidential.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [Smart Contracts](#smart-contracts)
- [Frontend Application](#frontend-application)
- [Security Features](#security-features)
- [Deployment](#deployment)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)

## Overview

**Cipher Fund** is a next-generation crowdfunding platform that leverages Zama's FHEVM (Fully Homomorphic Encryption Virtual Machine) to enable confidential fundraising campaigns on the blockchain. Unlike traditional crowdfunding platforms where all donation amounts are publicly visible, Cipher Fund encrypts donation data on-chain while still allowing computation and verification without revealing sensitive information.

The platform consists of:
- **Smart Contracts**: Solidity contracts deployed on Sepolia testnet using FHEVM
- **Frontend Application**: React-based web interface with wallet integration
- **Encryption Infrastructure**: Zama's FHE technology for on-chain privacy

## Problem Statement

Traditional blockchain-based fundraising platforms face several critical privacy challenges:

### 1. **Donation Transparency Paradox**
While blockchain transparency is valuable for trust, it creates privacy concerns:
- Large donors may prefer anonymity to avoid unwanted attention
- Small donors might feel embarrassed about modest contributions
- Public donation amounts can influence subsequent donor behavior
- Competitors can analyze fundraising patterns

### 2. **Gamification and Manipulation Risks**
Visible donation data enables:
- Strategic donor behavior based on others' contributions
- Artificial urgency through visible fundraising velocity
- Competitive dynamics that may not reflect genuine support

### 3. **Contributor Privacy**
While wallet addresses provide pseudonymity, the amounts associated with addresses can:
- Be linked to real-world identities through chain analysis
- Reveal financial capacity and interests
- Create security risks for large contributors

## Zama Fund's Solution

Zama Fund addresses these challenges through **Fully Homomorphic Encryption**:

- **Encrypted Donations**: All donation amounts are encrypted on-chain using FHE
- **Private Rewards**: Contributors earn encrypted points (100 points per cETH) that remain confidential
- **Selective Disclosure**: Only authorized parties (donors, campaign creators) can decrypt their relevant data
- **Computational Privacy**: The contract can compute total raised amounts and points without decryption
- **On-Chain Privacy**: Unlike zero-knowledge proofs, FHE allows general computation on encrypted data

## Key Features

### Campaign Management
- **Easy Campaign Creation**: Create fundraising campaigns with title, description, and goal
- **Flexible Control**: Campaign creators can activate/deactivate campaigns
- **Public Metadata**: Campaign details remain transparent while financial data stays private
- **Campaign Tracking**: View all active and inactive campaigns in real-time

### Confidential Donations
- **Encrypted Transfers**: Donations use ERC-7984 confidential token standard
- **Private Amounts**: Donation amounts are encrypted end-to-end
- **Reward System**: Automatic point allocation (100 points per 1 cETH donated)
- **Flexible Precision**: Support for up to 6 decimal places (micro-units)

### Privacy-Preserving Decryption
- **Selective Reveal**: Campaign creators can decrypt total raised amounts
- **Donor Privacy**: Contributors can view their own encrypted points
- **Cryptographic Signatures**: EIP-712 signatures for secure decryption requests
- **Time-Limited Access**: Decryption permissions with configurable expiration

### User Experience
- **Wallet Integration**: Seamless connection via RainbowKit (MetaMask, WalletConnect, etc.)
- **Test Environment**: Built-in faucet for obtaining test cETH tokens
- **Real-Time Updates**: Automatic campaign refresh and status updates
- **Responsive Design**: Mobile-friendly interface with modern UI

## Technology Stack

### Blockchain & Smart Contracts
- **Solidity 0.8.27**: Smart contract development language
- **FHEVM by Zama**: Fully Homomorphic Encryption Virtual Machine
  - `@fhevm/solidity ^0.8.0`: Core FHE library
  - `@zama-fhe/oracle-solidity ^0.1.0`: Oracle integration
  - `encrypted-types ^0.0.4`: Type system for encrypted values
- **OpenZeppelin Confidential Contracts**: ERC-7984 implementation
- **Hardhat 2.26.0**: Development framework
  - `@fhevm/hardhat-plugin`: FHEVM integration
  - `hardhat-deploy`: Deployment management
  - TypeChain for type-safe contract interactions

### Frontend Technologies
- **React 19.1**: Modern UI library with latest features
- **TypeScript 5.8**: Type-safe development
- **Vite 7.1**: Fast build tool and development server
- **Ethers.js 6.15**: Ethereum library for contract interaction
- **Wagmi 2.17**: React hooks for Ethereum
- **RainbowKit 2.2.8**: Beautiful wallet connection modal
- **TanStack Query 5.89**: Powerful data synchronization
- **Zama Relayer SDK 0.2.0**: Client-side encryption toolkit

### Development Tools
- **TypeScript**: Full type safety across stack
- **ESLint & Prettier**: Code quality and formatting
- **Solhint**: Solidity linter
- **Hardhat Gas Reporter**: Gas optimization analysis
- **Solidity Coverage**: Test coverage reporting
- **Mocha & Chai**: Testing framework

### Infrastructure
- **Sepolia Testnet**: Ethereum test network deployment
- **Infura**: RPC provider for blockchain access
- **Netlify**: Frontend hosting and CDN
- **Etherscan**: Contract verification and exploration

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Browser                             │
│  ┌────────────────────────────────────────────────────────┐     │
│  │            React Frontend Application                   │     │
│  │  - RainbowKit Wallet Connection                        │     │
│  │  - Zama Instance (Client-side Encryption)              │     │
│  │  - Campaign Management UI                              │     │
│  └────────────────┬───────────────────────────────────────┘     │
└───────────────────┼─────────────────────────────────────────────┘
                    │
                    │ Web3 RPC / Signed Transactions
                    │
┌───────────────────▼─────────────────────────────────────────────┐
│                    Sepolia Testnet (FHEVM)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Smart Contract Layer                             │   │
│  │                                                          │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │   ConfidentialFundraising.sol                   │    │   │
│  │  │   - Campaign CRUD operations                    │    │   │
│  │  │   - Encrypted donation handling                 │    │   │
│  │  │   - Points calculation (encrypted)              │    │   │
│  │  │   - Access control                              │    │   │
│  │  └──────────────────┬──────────────────────────────┘    │   │
│  │                     │                                    │   │
│  │                     │ Confidential Transfers             │   │
│  │                     │                                    │   │
│  │  ┌──────────────────▼──────────────────────────────┐    │   │
│  │  │   ERC7984ETH.sol                                │    │   │
│  │  │   - ERC-7984 Confidential Token                 │    │   │
│  │  │   - Encrypted balance management                │    │   │
│  │  │   - Test faucet functionality                   │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         FHEVM Infrastructure                             │   │
│  │   - Homomorphic encryption operations                    │   │
│  │   - Encrypted state storage                              │   │
│  │   - Zama relayer for decryption requests                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Contract Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  ConfidentialFundraising                         │
├─────────────────────────────────────────────────────────────────┤
│  State Variables:                                               │
│  - IERC7984 cEthToken (immutable)                               │
│  - uint256 _nextCampaignId                                      │
│  - mapping(uint256 => Campaign) _campaigns                      │
│  - mapping(campaignId => user => euint64) _userPoints           │
│                                                                  │
│  Campaign Struct:                                               │
│  - address creator                                              │
│  - string title                                                 │
│  - string description                                           │
│  - uint256 goal (plaintext)                                     │
│  - bool active                                                  │
│  - euint64 encryptedRaised (FHE encrypted)                      │
│                                                                  │
│  Core Functions:                                                │
│  - createCampaign(title, desc, goal) → campaignId               │
│  - getCampaign(id) → CampaignInfo                               │
│  - getCampaignRaised(id) → euint64 (encrypted handle)           │
│  - getUserPoints(id, user) → euint64 (encrypted handle)         │
│  - onConfidentialTransferReceived(...) → ebool                  │
│  - setCampaignActive(id, active)                                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            │ Uses
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      ERC7984ETH                                  │
├─────────────────────────────────────────────────────────────────┤
│  Inherits: ERC7984 (Confidential Token Standard)                │
│                                                                  │
│  Functions:                                                     │
│  - faucet() → mints 1 cETH for testing                          │
│  - confidentialTransferAndCall(to, encAmount, proof, data)      │
│                                                                  │
│  Features:                                                      │
│  - Encrypted balance tracking per user                          │
│  - Confidential transfer operations                             │
│  - Callback mechanism for receiver contracts                    │
└─────────────────────────────────────────────────────────────────┘
```

## How It Works

### Campaign Creation Flow

1. **User Connects Wallet**: Via RainbowKit to Sepolia testnet
2. **Fill Campaign Form**: Title, description, and funding goal in cETH
3. **Submit Transaction**: Frontend calls `createCampaign()` on contract
4. **Smart Contract Processing**:
   - Validates input (non-empty strings, positive goal)
   - Assigns unique campaign ID
   - Initializes encrypted raised amount to 0
   - Sets campaign as active
   - Grants decryption permissions to creator
5. **Event Emission**: `CampaignCreated` event logged
6. **UI Update**: Campaign appears in the campaign list

### Donation Flow (Encrypted)

```
┌────────┐                ┌──────────┐              ┌─────────────┐
│ Donor  │                │ Frontend │              │   Contract  │
│ Wallet │                │  + Zama  │              │   (FHEVM)   │
└───┬────┘                └────┬─────┘              └──────┬──────┘
    │                          │                           │
    │ 1. Enter donation amount │                           │
    │─────────────────────────>│                           │
    │                          │                           │
    │                          │ 2. Client-side encrypt    │
    │                          │    amount using Zama SDK  │
    │                          │                           │
    │                          │ 3. Generate encrypted     │
    │                          │    input + proof          │
    │                          │                           │
    │ 4. Sign transaction      │                           │
    │<─────────────────────────│                           │
    │                          │                           │
    │ 5. Send signed tx        │                           │
    │─────────────────────────>│                           │
    │                          │                           │
    │                          │ 6. confidentialTransferAndCall()
    │                          │──────────────────────────>│
    │                          │   (encryptedAmount,       │
    │                          │    proof, campaignId)     │
    │                          │                           │
    │                          │                           │ 7. Verify proof
    │                          │                           │
    │                          │                           │ 8. Decrypt amount
    │                          │                           │    (FHE operation)
    │                          │                           │
    │                          │                           │ 9. Transfer encrypted
    │                          │                           │    tokens
    │                          │                           │
    │                          │                           │ 10. Call receiver
    │                          │                           │     hook
    │                          │                           │
    │                          │ 11. onConfidentialTransfer│
    │                          │     Received() in         │
    │                          │     Fundraising contract  │
    │                          │                           │
    │                          │                           │ 12. Add to encrypted
    │                          │                           │     raised total
    │                          │                           │
    │                          │                           │ 13. Calculate points
    │                          │                           │     (amount * 100)
    │                          │                           │
    │                          │                           │ 14. Add to user's
    │                          │                           │     encrypted points
    │                          │                           │
    │                          │                           │ 15. Grant decryption
    │                          │                           │     permissions
    │                          │                           │
    │                          │<──────────────────────────│
    │                          │   Events: DonationReceived│
    │                          │          PointsUpdated    │
    │<─────────────────────────│                           │
    │ 16. Transaction receipt  │                           │
    │                          │                           │
```

### Decryption Flow

1. **User Requests Decryption**: Clicks "Decrypt Raised" or "Decrypt My Points"
2. **Generate Keypair**: Frontend creates ephemeral keypair using Zama SDK
3. **Create EIP-712 Signature**:
   - Structure includes public key, contract addresses, validity period
   - User signs with wallet
4. **Submit Decryption Request**:
   - Sent to Zama relayer with signature and encrypted handle
5. **Relayer Verification**:
   - Validates signature
   - Checks permissions on-chain
   - Confirms request is within time bounds
6. **Homomorphic Decryption**:
   - Relayer decrypts value using FHE
   - Returns plaintext result to authorized user only
7. **Display Result**: Frontend shows decrypted value in UI

### Points System

The platform implements a simple reward mechanism:

- **Earning Rate**: 100 points per 1 cETH donated
- **Encrypted Calculation**: Points computed homomorphically on-chain
- **Privacy**: Individual point balances remain encrypted
- **Per-Campaign Tracking**: Each campaign has separate point accounting
- **Future Utility**: Points could enable:
  - Governance voting power (weighted by contribution)
  - NFT badge tiers
  - Exclusive perks from campaign creators
  - Cross-campaign reputation system

## Getting Started

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For cloning the repository
- **MetaMask** or compatible Web3 wallet
- **Sepolia ETH**: For gas fees (get from Sepolia faucet)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/zama-fund.git
   cd zama-fund
   ```

2. **Install smart contract dependencies**

   ```bash
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd src
   npm install
   cd ..
   ```

### Environment Configuration

1. **Set up smart contract environment variables**

   ```bash
   # Set your mnemonic for deployment
   npx hardhat vars set MNEMONIC
   # Example: test test test test test test test test test test test junk

   # Set your Infura API key for Sepolia access
   npx hardhat vars set INFURA_API_KEY
   # Get one at: https://infura.io

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   # Get one at: https://etherscan.io
   ```

   Alternatively, create a `.env` file in the root:

   ```env
   MNEMONIC="your twelve word mnemonic here"
   INFURA_API_KEY="your_infura_api_key"
   ETHERSCAN_API_KEY="your_etherscan_api_key"
   PRIVATE_KEY="your_private_key_without_0x"
   ```

2. **Configure frontend environment**

   Create `src/.env`:

   ```env
   VITE_INFURA_API_KEY=your_infura_api_key
   VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
   ```

### Compile Smart Contracts

```bash
npm run compile
```

This will:
- Compile Solidity contracts
- Generate TypeScript types with TypeChain
- Create artifacts in `artifacts/` directory

### Run Tests

```bash
# Run all tests on local Hardhat network
npm run test

# Generate coverage report
npm run coverage
```

### Local Development

#### Option 1: Test on Sepolia Testnet

1. **Deploy contracts to Sepolia**

   ```bash
   npm run deploy:sepolia
   ```

   This deploys:
   - `ERC7984ETH` token contract
   - `ConfidentialFundraising` contract

   Note the deployed addresses from console output.

2. **Verify contracts on Etherscan**

   ```bash
   npm run verify:sepolia
   ```

3. **Update frontend configuration**

   Edit `src/src/config/contracts.ts` with deployed addresses:

   ```typescript
   export const FUNDRAISING_ADDRESS = '0xYourDeployedFundraisingAddress';
   export const TOKEN_ADDRESS = '0xYourDeployedTokenAddress';
   ```

4. **Start frontend development server**

   ```bash
   cd src
   npm run dev
   ```

   Open `http://localhost:5173` in your browser.

#### Option 2: Local Hardhat Network (Mock Mode)

1. **Start local FHEVM node**

   ```bash
   npm run chain
   ```

2. **Deploy contracts (in another terminal)**

   ```bash
   npm run deploy:localhost
   ```

3. **Run frontend** (with mock FHEVM)

   ```bash
   cd src
   npm run dev
   ```

### Usage Examples

#### Create a Campaign

```bash
npx hardhat task:create-campaign \
  --title "Community Garden Project" \
  --description "Building a sustainable garden for our neighborhood" \
  --goal 50000000 \
  --network sepolia
```

#### Get Deployed Addresses

```bash
npx hardhat task:addresses --network sepolia
```

#### Decrypt Campaign Raised Amount

```bash
npx hardhat task:decrypt-raised \
  --campaign-id 0 \
  --network sepolia
```

#### Decrypt User Points

```bash
npx hardhat task:decrypt-points \
  --campaign-id 0 \
  --user 0xYourAddress \
  --network sepolia
```

## Smart Contracts

### ConfidentialFundraising.sol

**Purpose**: Core fundraising logic with encrypted donation handling

**Key Components**:

```solidity
struct Campaign {
    address creator;        // Campaign creator address
    string title;          // Public campaign title
    string description;    // Public campaign description
    uint256 goal;          // Public fundraising goal (in cETH base units)
    bool active;           // Campaign status flag
    euint64 encryptedRaised; // FHE encrypted total raised amount
}
```

**State Variables**:
- `IERC7984 cEthToken`: Immutable reference to confidential token
- `uint256 _nextCampaignId`: Auto-incrementing campaign counter
- `mapping(uint256 => Campaign) _campaigns`: Campaign storage
- `mapping(uint256 => mapping(address => euint64)) _userPoints`: Per-campaign user points

**Core Functions**:

1. **createCampaign**(title, description, goal)
   - Validates inputs (non-empty strings, positive goal)
   - Creates new campaign with encrypted raised amount initialized to 0
   - Grants decryption permissions to creator
   - Emits `CampaignCreated` event

2. **getCampaign**(campaignId)
   - Returns public campaign information
   - Does not expose encrypted data

3. **getCampaignRaised**(campaignId)
   - Returns encrypted handle for total raised amount
   - Can be decrypted by authorized parties

4. **getUserPoints**(campaignId, user)
   - Returns encrypted handle for user's points
   - User can decrypt their own points

5. **onConfidentialTransferReceived**(operator, from, amount, data)
   - IERC7984Receiver callback hook
   - Processes encrypted donations
   - Adds to encrypted raised total using FHE
   - Calculates and assigns encrypted points (amount × 100)
   - Grants decryption permissions
   - Emits `DonationReceived` and `PointsUpdated` events

6. **setCampaignActive**(campaignId, active)
   - Owner-only function to activate/deactivate campaigns
   - Prevents donations to inactive campaigns

**Security Features**:
- Custom errors for gas efficiency and clarity
- Access control (campaign creator only for status updates)
- Input validation (non-zero goal, non-empty strings)
- Campaign existence checks via modifiers
- Safe FHE permission management

### ERC7984ETH.sol

**Purpose**: Confidential ETH-like token for testing donations

**Inherits From**:
- `ERC7984`: OpenZeppelin's confidential token standard
- `SepoliaConfig`: Zama FHEVM configuration

**Key Features**:

1. **faucet**()
   - Public function for obtaining test tokens
   - Mints 1 cETH (1,000,000 base units) per call
   - No cooldown (for testing purposes)
   - Encrypted mint operation

2. **confidentialTransferAndCall**(to, encryptedAmount, inputProof, data)
   - Transfers encrypted tokens to recipient
   - Executes callback on receiver contract
   - Validates encryption proof
   - Enables donation flow with campaign ID in `data`

**Token Properties**:
- **Name**: cETH
- **Symbol**: cETH
- **Decimals**: 6 (implicit via base units of 1,000,000)
- **Supply**: Unlimited (faucet-based for testing)

### FHE Operations Used

The contracts leverage several FHE library functions:

```solidity
// Creating encrypted values
euint64 encryptedZero = FHE.asEuint64(0);
ebool encryptedTrue = FHE.asEbool(true);

// Converting external encrypted input
euint64 amount = FHE.fromExternal(encryptedAmount, inputProof);

// Arithmetic operations (homomorphic)
euint64 total = FHE.add(currentRaised, donationAmount);
euint64 points = FHE.mul(donationAmount, uint64(100));

// Permission management
FHE.allowThis(encryptedValue);        // Allow contract to use value
FHE.allow(encryptedValue, address);   // Grant decryption to address
FHE.allowTransient(value, address);   // Temporary permission for transaction

// Checking initialization
bool isInit = FHE.isInitialized(encryptedValue);
```

## Frontend Application

### Technology Choices

**React 19.1**: Latest React with improved concurrent features
**TypeScript 5.8**: Full type safety prevents runtime errors
**Vite**: Lightning-fast HMR and optimized production builds
**Wagmi + RainbowKit**: Best-in-class Web3 integration

### Project Structure

```
src/
├── public/              # Static assets
├── src/
│   ├── components/      # React components
│   │   ├── FundraisingApp.tsx    # Main application component
│   │   └── Header.tsx             # Navigation header
│   ├── config/          # Configuration files
│   │   ├── contracts.ts           # Contract addresses and ABIs
│   │   └── wagmi.ts               # Wagmi/RainbowKit configuration
│   ├── hooks/           # Custom React hooks
│   │   ├── useEthersSigner.ts     # Wagmi to Ethers adapter
│   │   └── useZamaInstance.ts     # Zama FHE instance manager
│   ├── styles/          # CSS stylesheets
│   │   └── FundraisingApp.css
│   ├── App.tsx          # Root application component
│   └── main.tsx         # Application entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── netlify.toml         # Netlify deployment config
```

### Key Components

#### FundraisingApp.tsx

The main application component managing:
- Campaign listing and display
- Campaign creation form
- Donation modal and flow
- Faucet interaction
- Decryption requests
- Real-time state management

**State Management**:
- TanStack Query for campaign data caching and synchronization
- React hooks for local UI state
- Wagmi for blockchain state (wallet, network, transactions)

**Key Features**:
- Encrypted amount input with decimal precision handling
- Client-side encryption using Zama SDK
- EIP-712 signature generation for decryption
- Error handling and user feedback
- Loading states for all async operations

#### useZamaInstance.ts

Custom hook for managing Zama FHE instance:

```typescript
export function useZamaInstance() {
  const { chainId } = useAccount();
  const [instance, setInstance] = useState<FhevmInstance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initFhevm() {
      if (!chainId) return;
      const fhevmInstance = await createInstance({ chainId });
      setInstance(fhevmInstance);
      setIsLoading(false);
    }
    initFhevm();
  }, [chainId]);

  return { instance, isLoading };
}
```

**Purpose**:
- Lazy initialization of FHE instance
- Network-specific configuration
- Singleton pattern for instance reuse
- Loading state for UI feedback

### Encryption Flow in Frontend

```typescript
// 1. Create encrypted input buffer
const buffer = instance.createEncryptedInput(
  TOKEN_ADDRESS,
  userAddress
);

// 2. Add value to buffer (supports multiple types)
buffer.add64(Number(donationAmount));

// 3. Encrypt and generate proof
const encryptedAmount = await buffer.encrypt();
// Returns: { handles: [bytes32], inputProof: bytes }

// 4. Use in transaction
await tokenContract.confidentialTransferAndCall(
  FUNDRAISING_ADDRESS,
  encryptedAmount.handles[0],
  encryptedAmount.inputProof,
  abi.encode(['uint256'], [campaignId])
);
```

### Decryption Flow in Frontend

```typescript
// 1. Generate ephemeral keypair
const keypair = instance.generateKeypair();

// 2. Create EIP-712 structured data
const eip712 = instance.createEIP712(
  keypair.publicKey,
  [FUNDRAISING_ADDRESS],
  startTimestamp,
  durationInDays
);

// 3. Request user signature
const signature = await signer.signTypedData(
  eip712.domain,
  { UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification },
  eip712.message
);

// 4. Submit decryption request to relayer
const result = await instance.userDecrypt(
  [{ handle: encryptedHandle, contractAddress: FUNDRAISING_ADDRESS }],
  keypair.privateKey,
  keypair.publicKey,
  signature.replace('0x', ''),
  [FUNDRAISING_ADDRESS],
  userAddress,
  startTimestamp,
  durationInDays
);

// 5. Extract plaintext value
const decryptedValue = BigInt(result[encryptedHandle]);
```

### Styling Approach

The application uses vanilla CSS with:
- CSS custom properties for theming
- Dark mode color scheme
- Responsive grid layouts
- Glassmorphism effects
- Smooth transitions and animations

**Design Principles**:
- Mobile-first responsive design
- Accessibility (ARIA labels, semantic HTML)
- Visual hierarchy through typography
- Color-coded status indicators
- Loading and error states

## Security Features

### Smart Contract Security

1. **Access Control**
   - Campaign creators have exclusive control over activation status
   - Donation processing restricted to authorized token contract only
   - Permission checks using custom errors for gas efficiency

2. **Input Validation**
   - Non-empty strings for title and description
   - Positive goal amounts
   - Campaign existence verification
   - Active status checks before accepting donations

3. **FHE Permission Management**
   - Careful granting of decryption permissions
   - `allowThis` for contract internal operations
   - `allow` for specific addresses (creator, donor)
   - `allowTransient` for temporary transaction scope

4. **Reentrancy Protection**
   - Follows checks-effects-interactions pattern
   - State updates before external calls
   - Uses OpenZeppelin's battle-tested contracts

5. **Error Handling**
   - Custom errors instead of string reverts (gas savings)
   - Descriptive error messages for debugging
   - Proper revert conditions

### Frontend Security

1. **Wallet Security**
   - RainbowKit's secure wallet connection
   - No private key handling in frontend
   - All signing happens in user's wallet

2. **Encryption Security**
   - Client-side encryption before transmission
   - Ephemeral keypairs for decryption (not reused)
   - Time-bound decryption permissions
   - EIP-712 structured signatures prevent replay attacks

3. **Input Sanitization**
   - Decimal precision limits (6 decimals max)
   - Amount validation before encryption
   - Safe integer bounds for encryption compatibility

4. **Network Security**
   - HTTPS-only communication
   - Content Security Policy headers via Netlify
   - No sensitive data in local storage
   - Secure cookie settings

### Cryptographic Security

**FHE Guarantees**:
- Computational indistinguishability: Encrypted data reveals nothing about plaintext
- Circuit privacy: Computations on encrypted data don't leak information
- Malleability protection: Encryption includes authentication

**Zama Relayer**:
- Decentralized oracle network for decryption
- Signature verification before decryption
- On-chain permission checks
- Rate limiting and abuse prevention

## Deployment

### Smart Contract Deployment

The project uses `hardhat-deploy` for deterministic deployments:

**Deployment Script** (`deploy/deploy.ts`):

```typescript
const tokenDeployment = await deploy("ERC7984ETH", {
  from: deployer,
  log: true,
});

const fundraisingDeployment = await deploy("ConfidentialFundraising", {
  from: deployer,
  args: [tokenDeployment.address],
  log: true,
});
```

**Sepolia Deployment**:

```bash
# Deploy contracts
npm run deploy:sepolia

# Verify on Etherscan
npm run verify:sepolia
```

**Deployment Addresses** (Sepolia):
- Track in `deployments/sepolia/` directory
- Automatically managed by hardhat-deploy
- JSON files contain ABI and address

### Frontend Deployment

**Netlify Configuration** (`src/netlify.toml`):

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "21"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

**Build Process**:

```bash
cd src
npm run build
```

Generates optimized production build in `src/dist/`:
- Minified JavaScript bundles
- Code splitting for optimal loading
- Tree-shaken dependencies
- Compressed assets

**Deployment Steps**:

1. **Connect Repository to Netlify**
   - Link GitHub repository
   - Set build command: `npm run build`
   - Set publish directory: `src/dist`

2. **Configure Environment Variables**
   - Set `VITE_INFURA_API_KEY` in Netlify dashboard
   - Set `VITE_WALLETCONNECT_PROJECT_ID`

3. **Deploy**
   - Push to main branch triggers automatic deployment
   - Preview deployments for pull requests
   - Atomic deployments with instant rollback

**Production URL**: [Configure after deployment]

## Future Roadmap

### Phase 1: Core Enhancements (Q2 2025)

#### Improved Token Economics
- **Multiple Token Support**: Accept various ERC-7984 tokens (cUSDC, cDAI, etc.)
- **Dynamic Point Rates**: Campaign creators set custom point multipliers
- **Point Decay**: Incentivize early contributions with time-based multipliers
- **Bonus Tiers**: Larger donations unlock higher point rates

#### Enhanced Privacy Features
- **Threshold Decryption**: Require multiple signatures for large campaign reveals
- **Anonymous Campaigns**: Optional creator privacy using ZK-SNARKs for identity
- **Confidential Goals**: Encrypt fundraising targets to prevent strategic behavior
- **Privacy Pools**: Mix donations across campaigns for enhanced anonymity

#### Campaign Management
- **Milestone-Based Releases**: Lock funds until campaign achieves specific goals
- **Refund Mechanism**: Return funds if campaign fails to reach threshold
- **Campaign Extensions**: Allow creators to extend deadlines
- **Sub-Campaigns**: Nested campaigns for multi-phase projects

### Phase 2: Governance & Utility (Q3 2025)

#### Points Utility System
- **Quadratic Voting**: Points enable governance with diminishing power
- **NFT Badge System**: Mint achievement NFTs based on point tiers
- **Reputation Score**: Cross-campaign contributor reputation
- **Staking Rewards**: Lock points to earn yield from platform fees

#### DAO Governance
- **Platform Governance**: Token holders vote on protocol parameters
- **Campaign Curation**: Community-driven featured campaigns
- **Dispute Resolution**: Decentralized arbitration for campaign issues
- **Treasury Management**: Community allocation of platform revenue

#### Advanced Features
- **Recurring Donations**: Subscription-style encrypted contributions
- **Matching Pools**: Quadratic funding with encrypted match amounts
- **Campaign Categories**: Organize by cause, region, or type
- **Social Features**: Comments, updates, and backer-only content

### Phase 3: Scalability & Interoperability (Q4 2025)

#### Layer 2 Integration
- **Optimistic Rollups**: Deploy on Optimism/Arbitrum for lower fees
- **ZK-Rollups**: Explore StarkNet/zkSync for FHE compatibility
- **Cross-Chain Bridges**: Enable donations from multiple chains
- **Hybrid Privacy**: Combine FHE with ZK-SNARKs for optimal efficiency

#### Enterprise Features
- **White-Label Solution**: Branded fundraising portals for organizations
- **Compliance Tools**: Optional KYC/AML integration for regulated entities
- **Bulk Operations**: Batch campaign creation and management
- **Advanced Analytics**: Privacy-preserving dashboard for insights

#### Developer Ecosystem
- **SDK Release**: JavaScript/Python libraries for integration
- **Plugin System**: Extend functionality with custom modules
- **API Access**: RESTful and GraphQL APIs for third-party apps
- **Mobile Apps**: Native iOS/Android applications

### Phase 4: Mainstream Adoption (2026)

#### User Experience
- **Fiat On-Ramp**: Credit card purchases of cETH via partners
- **Gasless Transactions**: Meta-transactions for better UX
- **Social Login**: Email/OAuth wallet creation for non-crypto users
- **Multilingual**: Support for 20+ languages

#### Social Impact
- **Impact Verification**: Oracle integration for real-world outcome tracking
- **Carbon Credits**: Offset campaign carbon footprints
- **Charity Partnerships**: Onboard major nonprofits
- **Education**: Learn-to-earn program for new users

#### Regulatory Compliance
- **GDPR Tools**: Right to erasure for off-chain data
- **Tax Reporting**: Donation receipt generation
- **Audit Trails**: Immutable donation history for transparency
- **Legal Framework**: Terms of service and compliance documentation

### Research Directions

- **Post-Quantum FHE**: Future-proof encryption schemes
- **MPC Integration**: Combine FHE with multi-party computation
- **Privacy-Preserving ML**: Encrypted campaign recommendation system
- **Recursive Encryption**: Nested privacy layers for advanced use cases

### Community Initiatives

- **Bug Bounty Program**: Security researcher rewards
- **Grant Program**: Fund ecosystem projects
- **Hackathons**: Developer competition for integrations
- **Ambassador Program**: Community growth incentives

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Code Contributions**
   - Fix bugs or implement new features
   - Improve test coverage
   - Optimize gas usage
   - Enhance documentation

2. **Non-Code Contributions**
   - Report bugs or suggest features via GitHub Issues
   - Improve documentation and tutorials
   - Create educational content
   - Translate to other languages

### Development Workflow

1. **Fork the repository**

   ```bash
   git clone https://github.com/yourusername/zama-fund.git
   cd zama-fund
   git remote add upstream https://github.com/originalowner/zama-fund.git
   ```

2. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

4. **Run tests and linters**

   ```bash
   npm run test
   npm run lint
   npm run prettier:check
   ```

5. **Commit with descriptive messages**

   ```bash
   git commit -m "feat: add campaign search functionality"
   ```

   Follow [Conventional Commits](https://www.conventionalcommits.org/):
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation changes
   - `test:` test additions or fixes
   - `refactor:` code refactoring
   - `chore:` maintenance tasks

6. **Push and create Pull Request**

   ```bash
   git push origin feature/your-feature-name
   ```

   Open a PR on GitHub with:
   - Clear description of changes
   - Link to related issues
   - Screenshots for UI changes
   - Test results

### Code Style Guidelines

**Solidity**:
- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public functions
- Maximum line length: 120 characters
- Use custom errors instead of revert strings

**TypeScript/React**:
- Use functional components with hooks
- Prefer named exports
- Use TypeScript strict mode
- Document complex functions with JSDoc

### Testing Requirements

All contributions must include tests:

**Smart Contracts**:
- Unit tests for all functions
- Integration tests for workflows
- Edge case coverage
- Gas optimization tests

**Frontend**:
- Component tests (if added)
- E2E tests for critical flows (if added)

### Pull Request Process

1. Ensure all tests pass
2. Update README if needed
3. Add entry to CHANGELOG (if maintained)
4. Request review from maintainers
5. Address review feedback
6. Squash commits before merge

### Community Standards

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow our Code of Conduct

## License

This project is licensed under the **BSD-3-Clause-Clear License**.

```
Copyright (c) 2025, Zama Fund Contributors
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted (subject to the limitations in the disclaimer
below) provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice,
  this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.
* Neither the name of the copyright holder nor the names of its
  contributors may be used to endorse or promote products derived from this
  software without specific prior written permission.

NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY
THIS LICENSE. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND
CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER
IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
```

See the [LICENSE](LICENSE) file for full details.

## Acknowledgments

### Built With

- **[Zama](https://zama.ai)**: FHEVM and fully homomorphic encryption technology
- **[OpenZeppelin](https://openzeppelin.com)**: Secure smart contract libraries
- **[Hardhat](https://hardhat.org)**: Ethereum development environment
- **[RainbowKit](https://rainbowkit.com)**: Beautiful wallet connection UX
- **[Wagmi](https://wagmi.sh)**: React hooks for Ethereum

### Resources

- **[FHEVM Documentation](https://docs.zama.ai/fhevm)**: Learn about Fully Homomorphic Encryption
- **[ERC-7984 Standard](https://eips.ethereum.org/EIPS/eip-7984)**: Confidential token specification
- **[Zama Community Discord](https://discord.gg/zama)**: Get help and connect with developers

### Special Thanks

- Zama team for pioneering on-chain FHE
- Ethereum community for continuous innovation
- All open-source contributors whose work made this possible

---

**Built with ❤️ for a more private blockchain future**

For questions, feedback, or support:
- GitHub Issues: [Report bugs or request features](https://github.com/yourusername/zama-fund/issues)
- Documentation: [Full documentation](https://docs.zama.ai)
- Community: [Join our Discord](https://discord.gg/zama)
