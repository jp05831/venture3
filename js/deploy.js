const hre = require("hardhat");

async function main() {
  const SPVFund = await hre.ethers.getContractFactory("SPVFund");
  const goal = hre.ethers.parseEther("1"); // 1 MATIC goal
  const durationInDays = 7; // 7 days
  const minContribution = hre.ethers.parseEther("0.01"); // Minimum contribution of 0.01 MATIC
  const spvFund = await SPVFund.deploy(goal, durationInDays, minContribution);

  await spvFund.waitForDeployment();
  console.log("SPVFund deployed to:", spvFund.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});