var ethers = require('ethers');  


// specifying the deployed contract address on Ropsten
let contractaddress = "0xADf699D3584117F488B36EE69F1fbdb906AE7F4F";

async function TestContract(wallet)
{
    // make an API call to the ABIs endpoint 
    const response = await fetch('https://api-testnet.polygonscan.com/api?module=contract&action=getabi&address=' + contractaddress + '&apikey=YourApiKeyToken');
    const data = await response.json();
    let abi = data.result;

    /// print the contracts inputs and outputs
    console.log(abi);

    // initiating a new Contract
    let contract = new ethers.Contract(contractaddress, abi, wallet);

    let balanceOld = await contract.getBalance(wallet.address);
    console.log("Old balance: " + balanceOld.toString());

    // calling the "retrieve" function to read the stored value
    let mint = await contract.mint(1234);
    mint.wait(2).then(async () => {  
        // read the contract again, similar to above
        let balance = await contract.getBalance(wallet.address);
        console.log("Updated balance stored in contract is " + balance.toString());
    });    
  
}


exports.TestContract = TestContract;
