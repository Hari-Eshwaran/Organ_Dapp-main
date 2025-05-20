const { ethers } = require("hardhat");
const { contractAddress } = require("../app/config");
const OrganDonationArtifact = require("../app/artifacts/contracts/OrganDonation.sol/OrganDonation.json");

async function main() {
  console.log("Checking donor details...");

  // Replace with the address you used to register the donor
  const donorAddress = "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab"; 

  if (donorAddress === "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab") {
    console.error("Please replace 'YOUR_DONOR_ADDRESS_HERE' with the actual donor address you used for registration.");
    process.exit(1);
  }

  try {
    // Get the signer (using the first signer from Hardhat's test accounts)
    const [signer] = await ethers.getSigners();

    // Get the contract instance
    const organDonation = new ethers.Contract(
      contractAddress,
      OrganDonationArtifact.abi,
      signer
    );

    // Call the getDonorDetails function
    const donorDetails = await organDonation.getDonorDetails(donorAddress);

    console.log("Donor Details for address:", donorAddress);
    console.log("-------------------------------------------");
    console.log("Donor Address:", donorDetails.donorAddress);
    console.log("Name:", donorDetails.name);
    console.log("Age:", donorDetails.age.toString()); // Convert BigNumber to string
    console.log("Blood Type:", donorDetails.bloodType);
    console.log("Organs:", donorDetails.organs.map(organ => organ.toString())); // Convert BigNumber array to string array
    console.log("Location:", donorDetails.location);
    console.log("Deceased:", donorDetails.deceased);
    console.log("Hospital Verified:", donorDetails.hospitalVerified);
    console.log("Admin Verified:", donorDetails.adminVerified);
    console.log("Suspended:", donorDetails.suspended);
    console.log("Flagged:", donorDetails.flagged);
    console.log("Committed:", donorDetails.committed);
    console.log("IPFS Hash:", donorDetails.ipfsHash);
    console.log("-------------------------------------------");

  } catch (error) {
    console.error("Error checking donor details:", error);
    // Check if the error is because the address is not registered as a donor
    if (error.message.includes("Address is not a registered donor")) {
        console.error("This address is not registered as a donor on the contract.");
    }
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 