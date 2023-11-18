// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// import "./IERC20.sol";

contract Testtoken {
    address public owner;
    uint public totalSupply;
    mapping(address => uint) public balanceOf;
    string public name = "CacheRewardTest";
    string public symbol = "CARETE";
    uint8 public decimals = 18;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        owner = msg.sender;
        balanceOf[msg.sender] = 10000;
        totalSupply = 10000;
        emit Transfer(address(0), msg.sender, 10000);
    }

    function transfer(address recipient, uint amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint amount
    ) external returns (bool) {
        require(msg.sender == owner, "Only the owner can mint");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    function mint(uint amount) external {
        require(msg.sender == owner, "Only the owner can mint");
        balanceOf[msg.sender] += amount;
        totalSupply += amount;
        emit Transfer(address(0), msg.sender, amount);
    }

    function getBalance(address account) public view virtual returns (uint) {
        return balanceOf[account];
    }
}