// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract OrganDonation {
    enum Role { None, Donor, Patient, Admin, Hospital }
    enum OrganType { Kidney, Liver, Heart, Lung, Pancreas }

    struct Donor {
        address donorAddress;
        string name;
        uint age;
        string bloodType;
        OrganType[] organs;
        string location;
        bool deceased;
        bool hospitalVerified;
        bool adminVerified;
        bool suspended;
        bool flagged;
        bool committed;
        string ipfsHash; // Encrypted medical data
    }

    struct Patient {
        address patientAddress;
        string name;
        uint age;
        string bloodType;
        string neededOrgan;
        string urgency;
        string location;
        bool hospitalVerified;
        bool adminVerified;
        bool suspended;
        bool flagged;
        string ipfsHash; // Encrypted medical data
    }

    struct Hospital {
        address hospitalAddress;
        string name;
        string location;
        bool isActive;
    }

    address public owner;
    mapping(address => Role) public roles;
    mapping(address => Donor) public donors;
    mapping(address => Patient) public patients;
    mapping(address => Hospital) public hospitals;
    address[] public donorList;
    address[] public patientList;
    address[] public hospitalList;

    // Events
    event OrganRegistered(address indexed donor, OrganType[] organs, uint age);
    event MatchFound(address indexed donor, address indexed patient);
    event DonorDeceased(address indexed donor);
    event UserVerified(address indexed user, Role role);
    event UserSuspended(address indexed user);
    event UserFlagged(address indexed user);
    event DonorCommitmentRevoked(address indexed donor);
    event DonorCommitmentValidated(address indexed donor);
    event HospitalRegistered(address indexed hospital, string name);
    event HospitalDeactivated(address indexed hospital);

    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Only admin");
        _;
    }

    modifier onlyHospital() {
        require(roles[msg.sender] == Role.Hospital, "Only hospital");
        require(hospitals[msg.sender].isActive, "Hospital is not active");
        _;
    }

    modifier onlyVerified(Role _role) {
        require(roles[msg.sender] == _role, "Invalid role");
        if (_role == Role.Donor) {
            require(donors[msg.sender].hospitalVerified && donors[msg.sender].adminVerified, "Not fully verified");
        }
        if (_role == Role.Patient) {
            require(patients[msg.sender].hospitalVerified && patients[msg.sender].adminVerified, "Not fully verified");
        }
        _;
    }

    constructor() {
        owner = msg.sender;
        roles[msg.sender] = Role.Admin;
    }

    function registerHospital(string memory name, string memory location) public {
        require(bytes(name).length > 0, "Name is required");
        require(bytes(location).length > 0, "Location is required");
        require(roles[msg.sender] == Role.None, "Address already registered");
        
        hospitals[msg.sender] = Hospital(msg.sender, name, location, true);
        roles[msg.sender] = Role.Hospital;
        hospitalList.push(msg.sender);
        
        emit HospitalRegistered(msg.sender, name);
    }

    function deactivateHospital(address hospital) public onlyAdmin {
        require(roles[hospital] == Role.Hospital, "Not a hospital");
        hospitals[hospital].isActive = false;
        emit HospitalDeactivated(hospital);
    }

    function reactivateHospital(address hospital) public onlyAdmin {
        require(roles[hospital] == Role.Hospital, "Not a hospital");
        hospitals[hospital].isActive = true;
    }

    function registerDonor(
        string memory name,
        uint _age,
        string memory bloodType,
        OrganType[] memory organs,
        string memory location,
        string memory ipfsHash
    ) public {
        require(bytes(name).length > 0, "Name is required");
        require(_age >= 18, "Donor must be at least 18 years old");
        require(bytes(bloodType).length > 0, "Blood type is required");
        require(organs.length > 0, "At least one organ must be specified");
        require(bytes(location).length > 0, "Location is required");
        donors[msg.sender] = Donor(msg.sender, name, _age, bloodType, organs, location, false, false, false, false, false, false, ipfsHash);
        roles[msg.sender] = Role.Donor;
        donorList.push(msg.sender);
        emit OrganRegistered(msg.sender, organs, _age);
    }

    function registerPatient(string memory name, string memory bloodType, string memory neededOrgan, string memory urgency, string memory location, string memory ipfsHash, uint _age) public {
        require(bytes(name).length > 0, "Name is required");
        require(bytes(bloodType).length > 0, "Blood type is required");
        require(bytes(neededOrgan).length > 0, "Needed organ is required");
        require(bytes(urgency).length > 0, "Urgency is required");
        require(bytes(location).length > 0, "Location is required");
        require(_age > 0, "Age must be greater than 0");
        patients[msg.sender] = Patient(msg.sender, name, _age, bloodType, neededOrgan, urgency, location, false, false, false, false, ipfsHash);
        roles[msg.sender] = Role.Patient;
        patientList.push(msg.sender);
    }

    function hospitalVerifyUser(address user, Role roleToVerify) public onlyHospital {
        require(roleToVerify == Role.Donor || roleToVerify == Role.Patient, "Can only verify Donor or Patient roles");

        if (roleToVerify == Role.Donor) {
            require(roles[user] == Role.Donor, "User is not registered as a Donor to verify");
            donors[user].hospitalVerified = true;
        } else if (roleToVerify == Role.Patient) {
            require(roles[user] == Role.Patient, "User is not registered as a Patient to verify");
            patients[user].hospitalVerified = true;
        }
        emit UserVerified(user, roleToVerify);
    }

    function adminVerifyUser(address user, Role roleToVerify) public onlyAdmin {
        require(roleToVerify == Role.Donor || roleToVerify == Role.Patient, "Can only verify Donor or Patient roles");

        if (roleToVerify == Role.Donor) {
            require(roles[user] == Role.Donor, "User is not registered as a Donor to verify");
            require(donors[user].hospitalVerified, "Donor must be hospital verified first");
            donors[user].adminVerified = true;
        } else if (roleToVerify == Role.Patient) {
            require(roles[user] == Role.Patient, "User is not registered as a Patient to verify");
            require(patients[user].hospitalVerified, "Patient must be hospital verified first");
            patients[user].adminVerified = true;
        }
        emit UserVerified(user, roleToVerify);
    }

    function suspendUser(address user) public onlyAdmin {
        if (roles[user] == Role.Donor) {
            donors[user].suspended = true;
        } else if (roles[user] == Role.Patient) {
            patients[user].suspended = true;
        }
        emit UserSuspended(user);
    }

    function flagUser(address user) public onlyAdmin {
        if (roles[user] == Role.Donor) {
            donors[user].flagged = true;
        } else if (roles[user] == Role.Patient) {
            patients[user].flagged = true;
        }
        emit UserFlagged(user);
    }

    function revokeDonorCommitment(address donor) public onlyAdmin {
        donors[donor].committed = false;
        emit DonorCommitmentRevoked(donor);
    }

    function validateDonorCommitment(address donor) public onlyAdmin {
        donors[donor].committed = true;
        emit DonorCommitmentValidated(donor);
    }

    function markOrganAsMatched(address donor, address patient) public onlyAdmin {
        emit MatchFound(donor, patient);
    }

    function markDonorDeceased(address donor) public onlyAdmin {
        donors[donor].deceased = true;
        emit DonorDeceased(donor);
    }

    function getAvailableOrgans() public view returns (Donor[] memory) {
        uint count = 0;
        for (uint i = 0; i < donorList.length; i++) {
            if (!donors[donorList[i]].deceased && donors[donorList[i]].hospitalVerified && donors[donorList[i]].adminVerified) {
                count++;
            }
        }
        Donor[] memory available = new Donor[](count);
        uint idx = 0;
        for (uint i = 0; i < donorList.length; i++) {
            if (!donors[donorList[i]].deceased && donors[donorList[i]].hospitalVerified && donors[donorList[i]].adminVerified) {
                available[idx++] = donors[donorList[i]];
            }
        }
        return available;
    }

   // function getMatches(address patientAddr) public view returns (Donor[] memory) {
        // Placeholder: Matching logic to be implemented off-chain/ML
        // For now, return all available donors
      //  return getAvailableOrgans();
    //}
    // Added function to return donor list addresses
function getDonorList() public view returns (address[] memory) {
    return donorList;
}

function getPatientDetails(address _patientAddress) public view returns (
    address patientAddress,
    string memory name,
    uint age,
    string memory bloodType,
    string memory neededOrgan,
    string memory urgency,
    string memory location,
    bool hospitalVerified,
    bool adminVerified,
    bool suspended,
    bool flagged,
    string memory ipfsHash
) {
    require(roles[_patientAddress] == Role.Patient, "Address is not a registered patient");
    Patient memory patient = patients[_patientAddress];
    return (
        patient.patientAddress,
        patient.name,
        patient.age,
        patient.bloodType,
        patient.neededOrgan,
        patient.urgency,
        patient.location,
        patient.hospitalVerified,
        patient.adminVerified,
        patient.suspended,
        patient.flagged,
        patient.ipfsHash
    );
}

function getDonorDetails(address _donorAddress) public view returns (
    address donorAddress,
    string memory name,
    uint age,
    string memory bloodType,
    OrganType[] memory organs,
    string memory location,
    bool deceased,
    bool hospitalVerified,
    bool adminVerified,
    bool suspended,
    bool flagged,
    bool committed,
    string memory ipfsHash
) {
    require(roles[_donorAddress] == Role.Donor, "Address is not a registered donor");
    Donor memory donor = donors[_donorAddress];
    return (
        donor.donorAddress,
        donor.name,
        donor.age,
        donor.bloodType,
        donor.organs,
        donor.location,
        donor.deceased,
        donor.hospitalVerified,
        donor.adminVerified,
        donor.suspended,
        donor.flagged,
        donor.committed,
        donor.ipfsHash
    );
}

function getPatientList() public view returns (address[] memory) {
    return patientList;
}

}
