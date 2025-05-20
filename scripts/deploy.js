const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("Deploying OrganDonation contract...");
  
  try {
    // Get network configuration
    const network = await ethers.provider.getNetwork();
    console.log(`Network: ${network.name} (${network.chainId})`);

    // Get deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // Get the contract factory with gas optimization
    const OrganDonation = await ethers.getContractFactory("OrganDonation", {
      signer: deployer,
      gasPrice: await ethers.provider.getGasPrice()
    });
    
    // Deploy the contract
    console.log("Deploying contract...");
    const organDonation = await OrganDonation.deploy();
    
    // Wait for deployment to finish
    console.log("Waiting for deployment to finish...");
    await organDonation.waitForDeployment();
    
    // Get the deployed contract address
    const contractAddress = await organDonation.getAddress();
    console.log("OrganDonation contract deployed to:", contractAddress);

    // Update the config file
    const configPath = path.join(__dirname, '../app/config.js');
    let configContent = fs.readFileSync(configPath, 'utf8');
    
    // Update network-specific configurations
    configContent = configContent.replace(
      /export const contractAddress = ".*";/,
      `export const contractAddress = "${contractAddress}";`
    );
    configContent = configContent.replace(
      /export const networkId = .*;/,
      `export const networkId = ${network.chainId};`
    );
    
    fs.writeFileSync(configPath, configContent);
    console.log("Updated contract address and network ID in config.js");

    // Verify contract on Etherscan (if not on local network)
    if (network.name !== "localhost" && network.name !== "hardhat") {
      console.log("Waiting for block confirmations...");
      await organDonation.deployTransaction.wait(6); // Wait for 6 block confirmations
      
      console.log("Verifying contract...");
      try {
        await hre.run("verify:verify", {
          address: contractAddress,
          constructorArguments: [],
        });
        console.log("Contract verified successfully");
      } catch (error) {
        console.error("Error verifying contract:", error);
      }
    }

    // Save deployment info
    const deploymentInfo = {
      contractAddress,
      network: network.name,
      chainId: network.chainId,
      deployer: deployer.address,
      deployerBalance: (await deployer.getBalance()).toString(),
      timestamp: new Date().toISOString(),
      gasPrice: (await ethers.provider.getGasPrice()).toString()
    };

    const deploymentPath = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentPath)) {
      fs.mkdirSync(deploymentPath);
    }

    fs.writeFileSync(
      path.join(deploymentPath, `${network.name}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("Deployment info saved");

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

// Run the deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 