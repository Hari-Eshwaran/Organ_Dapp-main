# Organ Donation DApp

A decentralized platform for organ donation built with Next.js, Hardhat, and Solidity.

## Features

- Donor registration and management
- Patient registration and matching
- Hospital verification system
- Admin dashboard
- Smart contract-based organ matching
- IPFS integration for medical data
- Multi-step verification process
- Role-based access control

## Prerequisites

- Node.js (v16 or higher)
- MetaMask browser extension
- Git
- A code editor (VS Code recommended)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd organ-donation-dapp
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory with the following variables:
```
NEXT_PUBLIC_CONTRACT_ADDRESS=<your-contract-address>
NEXT_PUBLIC_NETWORK_ID=1337
NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545
ETHERSCAN_API_KEY=<your-etherscan-api-key>  # For contract verification
```

## Development

1. Start the local blockchain:
```bash
npm run node
```

2. In a new terminal, deploy the smart contract:
```bash
npm run deploy
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the test suite:
```bash
npm run test
```

Run specific test file:
```bash
npx hardhat test test/OrganDonation.test.js
```

Run tests with gas reporting:
```bash
REPORT_GAS=true npx hardhat test
```

## Smart Contract

The main smart contract (`OrganDonation.sol`) includes:
- Donor registration and management
- Patient registration and matching
- Hospital verification system
- Admin controls
- Event emissions for important state changes
- Role-based access control
- Multi-step verification process

### Contract Architecture

1. **Roles**:
   - Admin (3)
   - Hospital (2)
   - Donor (1)
   - Patient (0)

2. **Verification Process**:
   - Hospital verification
   - Admin verification
   - Suspension and flagging system

3. **Data Structures**:
   - Donor profiles
   - Patient profiles
   - Hospital profiles
   - Organ matching system

## Frontend

The frontend is built with:
- Next.js 14
- Chakra UI
- Ethers.js v6
- Web3 React

### Key Components

1. **Web3 Integration**:
   - Contract interaction utilities
   - Network management
   - Account management

2. **User Interface**:
   - Responsive design
   - Role-based views
   - Form validation
   - Error handling

3. **Data Management**:
   - IPFS integration
   - Local storage
   - State management

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── artifacts/         # Contract artifacts
│   ├── components/        # React components
│   ├── context/          # React context providers
│   └── utils/            # Utility functions
├── contracts/             # Smart contracts
├── scripts/              # Deployment and utility scripts
└── test/                 # Contract tests
```

## Deployment

### Local Development
1. Start local blockchain
2. Deploy contract
3. Update config.js with contract address
4. Start development server

### Testnet Deployment
1. Configure network in hardhat.config.js
2. Add private key to .env
3. Run deployment script
4. Verify contract on Etherscan

### Mainnet Deployment
1. Configure network in hardhat.config.js
2. Add private key to .env
3. Run deployment script with mainnet flag
4. Verify contract on Etherscan

## Troubleshooting

### Common Issues

1. **Contract Deployment Fails**
   - Check network connection
   - Verify account balance
   - Check gas price

2. **Frontend Connection Issues**
   - Verify MetaMask connection
   - Check network ID
   - Clear browser cache

3. **Test Failures**
   - Check test environment
   - Verify contract state
   - Check test accounts

### Debugging

1. **Smart Contract**
   - Use console.log in tests
   - Check event logs
   - Use Hardhat console

2. **Frontend**
   - Check browser console
   - Verify Web3 connection
   - Check network status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for smart contract libraries
- IPFS/Filecoin for decentralized storage solutions
- The Ethereum community for blockchain infrastructure
