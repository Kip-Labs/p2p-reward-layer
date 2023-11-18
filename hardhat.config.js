require('dotenv').config();
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  defaultNetwork: "polygon_mumbai",
  networks: {
    hardhat: {},
    polygon_mumbai: {
      url: process.env.NODE_URL,
      accounts: [
        process.env.PRIVATE_KEY
      ],
    },
  },
  solidity: "0.8.19",
};