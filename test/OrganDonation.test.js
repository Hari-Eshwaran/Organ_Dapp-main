const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("OrganDonation", function () {
  let organDonation;
  let owner;
  let donor;
  let patient;
  let hospital;

  beforeEach(async function () {
    [owner, donor, patient, hospital] = await ethers.getSigners();

    const OrganDonation = await ethers.getContractFactory("OrganDonation");
    organDonation = await OrganDonation.deploy();
    await organDonation.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await organDonation.owner()).to.equal(owner.address);
    });

    it("Should set the owner as admin", async function () {
      expect(await organDonation.roles(owner.address)).to.equal(3); // Admin role
    });
  });

  describe("Hospital Registration", function () {
    it("Should allow hospital registration", async function () {
      await organDonation.connect(hospital).registerHospital("Test Hospital", "Test Location");
      const hospitalDetails = await organDonation.getHospitalDetails(hospital.address);
      expect(hospitalDetails.name).to.equal("Test Hospital");
      expect(hospitalDetails.location).to.equal("Test Location");
      expect(hospitalDetails.isActive).to.be.true;
    });

    it("Should prevent duplicate hospital registration", async function () {
      await organDonation.connect(hospital).registerHospital("Test Hospital", "Test Location");
      await expect(
        organDonation.connect(hospital).registerHospital("Another Hospital", "Another Location")
      ).to.be.revertedWith("Address already registered");
    });

    it("Should prevent empty hospital name", async function () {
      await expect(
        organDonation.connect(hospital).registerHospital("", "Test Location")
      ).to.be.revertedWith("Name is required");
    });
  });

  describe("Donor Registration", function () {
    it("Should allow donor registration", async function () {
      const organs = [0, 1]; // Kidney, Liver
      await organDonation.connect(donor).registerDonor(
        "Test Donor",
        25,
        "O+",
        organs,
        "Test Location",
        "ipfs://test"
      );
      const donorDetails = await organDonation.getDonorDetails(donor.address);
      expect(donorDetails.name).to.equal("Test Donor");
      expect(donorDetails.age).to.equal(25);
      expect(donorDetails.bloodType).to.equal("O+");
      expect(donorDetails.organs).to.deep.equal(organs);
    });

    it("Should prevent donor registration under 18", async function () {
      const organs = [0];
      await expect(
        organDonation.connect(donor).registerDonor(
          "Test Donor",
          17,
          "O+",
          organs,
          "Test Location",
          "ipfs://test"
        )
      ).to.be.revertedWith("Donor must be at least 18 years old");
    });

    it("Should prevent empty donor name", async function () {
      const organs = [0];
      await expect(
        organDonation.connect(donor).registerDonor(
          "",
          25,
          "O+",
          organs,
          "Test Location",
          "ipfs://test"
        )
      ).to.be.revertedWith("Name is required");
    });
  });

  describe("Patient Registration", function () {
    it("Should allow patient registration", async function () {
      await organDonation.connect(patient).registerPatient(
        "Test Patient",
        "O+",
        "Kidney",
        "Urgent",
        "Test Location",
        "ipfs://test",
        30
      );
      const patientDetails = await organDonation.getPatientDetails(patient.address);
      expect(patientDetails.name).to.equal("Test Patient");
      expect(patientDetails.bloodType).to.equal("O+");
      expect(patientDetails.neededOrgan).to.equal("Kidney");
      expect(patientDetails.urgency).to.equal("Urgent");
    });

    it("Should prevent empty patient name", async function () {
      await expect(
        organDonation.connect(patient).registerPatient(
          "",
          "O+",
          "Kidney",
          "Urgent",
          "Test Location",
          "ipfs://test",
          30
        )
      ).to.be.revertedWith("Name is required");
    });

    it("Should prevent invalid age", async function () {
      await expect(
        organDonation.connect(patient).registerPatient(
          "Test Patient",
          "O+",
          "Kidney",
          "Urgent",
          "Test Location",
          "ipfs://test",
          0
        )
      ).to.be.revertedWith("Age must be greater than 0");
    });
  });

  describe("Verification System", function () {
    beforeEach(async function () {
      // Register hospital
      await organDonation.connect(hospital).registerHospital("Test Hospital", "Test Location");
      
      // Register donor
      const organs = [0];
      await organDonation.connect(donor).registerDonor(
        "Test Donor",
        25,
        "O+",
        organs,
        "Test Location",
        "ipfs://test"
      );
    });

    it("Should allow hospital to verify donor", async function () {
      await organDonation.connect(hospital).hospitalVerifyUser(donor.address, 1); // Donor role
      const donorDetails = await organDonation.getDonorDetails(donor.address);
      expect(donorDetails.hospitalVerified).to.be.true;
    });

    it("Should allow admin to verify donor after hospital verification", async function () {
      await organDonation.connect(hospital).hospitalVerifyUser(donor.address, 1);
      await organDonation.connect(owner).adminVerifyUser(donor.address, 1);
      const donorDetails = await organDonation.getDonorDetails(donor.address);
      expect(donorDetails.adminVerified).to.be.true;
    });

    it("Should prevent admin verification without hospital verification", async function () {
      await expect(
        organDonation.connect(owner).adminVerifyUser(donor.address, 1)
      ).to.be.revertedWith("Donor must be hospital verified first");
    });
  });

  describe("Admin Controls", function () {
    beforeEach(async function () {
      // Register donor
      const organs = [0];
      await organDonation.connect(donor).registerDonor(
        "Test Donor",
        25,
        "O+",
        organs,
        "Test Location",
        "ipfs://test"
      );
    });

    it("Should allow admin to suspend user", async function () {
      await organDonation.connect(owner).suspendUser(donor.address);
      const donorDetails = await organDonation.getDonorDetails(donor.address);
      expect(donorDetails.suspended).to.be.true;
    });

    it("Should allow admin to flag user", async function () {
      await organDonation.connect(owner).flagUser(donor.address);
      const donorDetails = await organDonation.getDonorDetails(donor.address);
      expect(donorDetails.flagged).to.be.true;
    });

    it("Should prevent non-admin from suspending user", async function () {
      await expect(
        organDonation.connect(donor).suspendUser(patient.address)
      ).to.be.revertedWith("Only admin");
    });
  });
}); 