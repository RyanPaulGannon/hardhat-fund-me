// SPDX-License-Identifier: MIT

// Pragma
pragma solidity ^0.8.0;

// Imports
import "hardhat/console.sol";
import "./PriceConverter.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// Error Codes
error FundMe__NotOwner();
error FundMe__NotEnoughEth();

// Interfaces, Libraries

// Contract

/** @title A contract for crowd funding
 * @author Ryan Paul Gannon
 * @notice This is a demo contract
 * @dev This implements price feeds as our library
 */

contract FundMe {
  // Type Declarations
  using PriceConverter for uint256;

  // State Variables
  uint256 public constant MINIMUM_USD = 5 * 10**18; // Constant value syntax usually "CAPS_CAPS"
  address private immutable i_owner; // Immutable value syntax usually "i_..."
  address[] private s_funders;
  mapping(address => uint256) private s_addressToAmountFunded; // Storage variables syntax usually "s_var"
  AggregatorV3Interface private s_priceFeed;

  // Modifiers
  modifier onlyOwner() {
    // require(msg.sender == i_owner); Revert and require do the same thing
    if (msg.sender != i_owner) {
      revert FundMe__NotOwner();
    } // Saves gas by remove strings as errors
    _; // This represents doing the rest of the code
  }

  // Functions
  constructor(address priceFeed) {
    i_owner = msg.sender;
    s_priceFeed = AggregatorV3Interface(priceFeed);
  }

  receive() external payable {
    fund();
  }

  fallback() external payable {
    fund();
  }

  /**
   * @notice This function calls the contract
   * @dev This implements the price feeds as our library
   */

  function fund() public payable {
    // Create custom error
    require(
      msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
      "You need to spend more ETH!"
    );
    // if (msg.value.getConversionRate(priceFeed) >= MINIMUM_USD) {
    //   revert FundMe__NotEnoughEth();
    // }
    s_addressToAmountFunded[msg.sender] += msg.value;
    s_funders.push(msg.sender);
  }

  function withdraw() public onlyOwner {
    for (
      uint256 fundersIndex = 0;
      fundersIndex < s_funders.length;
      fundersIndex++
    ) {
      address funder = s_funders[fundersIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    // Reset the array
    s_funders = new address[](0);
    // Withdraw the funds

    // Three ways: Transfer, send, call. Transfer easiest way.

    // Transfer (capped at 2300 gas, throws error)
    // payable (msg.sender).transfer(address(this).balance);

    // Send (capped at 2300 gas, returns boolean)
    // bool sendSuccess = payable(msg.sender).send(address(this).balance);
    // require(sendSuccess, "Send Failed");

    // Call (one of the first lower level commands, can be used to call almost any function without
    // needing abi. Looks similar to send.
    (bool success, ) = i_owner.call{value: address(this).balance}("");
    require(success);
  }

  function cheaperWithdraw() public onlyOwner {
    address[] memory funders = s_funders;
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      s_addressToAmountFunded[funder] = 0;
    }
    s_funders = new address[](0);
    (bool Success, ) = i_owner.call{value: address(this).balance}("");
    require(Success);
  }

  function getAddressToAmountFunded(address fundingAddress)
        public
        view
        returns (uint256)
    {
        return s_addressToAmountFunded[fundingAddress];
    }

    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    function getFunder(uint256 index) public view returns (address) {
        return s_funders[index];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }
}