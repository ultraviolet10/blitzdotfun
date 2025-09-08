// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {ICreatorCoin} from "../interfaces/ICreatorCoin.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";

contract MockCreatorCoin is ICreatorCoin {
    address public payoutRecipient;
    uint256 private _totalSupply;
    uint256 public vestingStartTime;
    uint256 public vestingEndTime;
    uint256 public totalClaimed;
    uint256 public claimableAmount;

    string private _name;
    string private _symbol;

    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    constructor(string memory name_, string memory symbol_, address _payoutRecipient) {
        _name = name_;
        _symbol = symbol_;
        payoutRecipient = _payoutRecipient;
        vestingStartTime = block.timestamp;
        vestingEndTime = block.timestamp + 365 days;
        _totalSupply = 10000 ether;
        claimableAmount = 1000 ether;
        _balances[_payoutRecipient] = _totalSupply;
    }

    function totalSupply() external view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    function transfer(address to, uint256 value) external returns (bool) {
        require(_balances[msg.sender] >= value, "Insufficient balance");
        _balances[msg.sender] -= value;
        _balances[to] += value;
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(_allowances[from][msg.sender] >= value, "Insufficient allowance");
        require(_balances[from] >= value, "Insufficient balance");
        _allowances[from][msg.sender] -= value;
        _balances[from] -= value;
        _balances[to] += value;
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        _allowances[msg.sender][spender] = value;
        return true;
    }

    function getClaimableAmount() external view returns (uint256) {
        return claimableAmount;
    }

    function claimVesting() external pure returns (uint256) {
        return 0;
    }

    function poolManager() external pure returns (IPoolManager) {
        return IPoolManager(address(0));
    }

    function name() external view returns (string memory) {
        return _name;
    }

    function symbol() external view returns (string memory) {
        return _symbol;
    }

    // Test helper functions
    function setClaimableAmount(uint256 amount) external {
        claimableAmount = amount;
    }

    function mint(address to, uint256 amount) external {
        _totalSupply += amount;
        _balances[to] += amount;
    }

    function decimals() external pure returns (uint8) {
        return 18;
    }
}
