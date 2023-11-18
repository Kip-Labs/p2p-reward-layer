// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const newContract = await hre.ethers.deployContract("Testtoken");

  await newContract.waitForDeployment();
  console.log("deployed");
  console.log(newContract);

  console.log("contract address: " + newContract.target);
  // console.log(
  //   `Lock with ${ethers.formatEther(
  //     lockedAmount
  //   )}ETH and unlock timestamp ${unlockTime} deployed to ${lock.target}`
  // );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


// var ethers = require('ethers');  
// async function main() {

//   const [deployer] = await ethers.getSigners();

//   console.log("Deploying contracts with the account:", deployer.address);

//   const HelloWorld = await ethers.getContractFactory("HelloWorld");
//   const contract = await HelloWorld.deploy();

//   console.log("Contract deployed at:", contract.address);

//   const saySomething = await contract.speak();
  
//   console.log("saySomething value:", saySomething);
// }

// main()
// .then(() => process.exit(0))
// .catch(error => {
//   console.error(error);
//   process.exit(1);
