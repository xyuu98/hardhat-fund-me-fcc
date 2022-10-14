// SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
import "./PriceConverter.sol";

error notOwner();

contract FundMe{

    using PriceConverter for uint256;

    uint256 public constant minimunUsd = 50 * 1e18;// use constant can save some gas fee

    address[] public funders;
    mapping (address => uint256) public addressToAmountFunded;

    address public immutable i_owner;// use immutable can save some gas fee

    AggregatorV3Interface public priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner{
        // require(msg.sender == i_owner,"U R NOT THE OWNER!");
        if(msg.sender != i_owner){ revert notOwner(); }// use this can save some gas fee
        _;
    }

    function fund() public payable {
        require (msg.value.getConversionRate(priceFeed) >= minimunUsd,"U need to send more ETH!");
        addressToAmountFunded[msg.sender] += msg.value;
        funders.push(msg.sender);
    }

    function withdraw() public onlyOwner{
        for(uint256 funderIndex = 0;funderIndex < funders.length;funderIndex++){
            address funder = funders[funderIndex];
            addressToAmountFunded[funder] = 0;
        }
        funders = new address[](0);

        // payable(msg.sender).transfer(address(this).balance);

        // bool sendSuc = payable(msg.sender).send(address(this).balance);
        // require(sendSuc,"Failed");

        (bool sendSuc, ) = payable(msg.sender).call{value:address(this).balance}("");
        require(sendSuc,"Failed");
    }

    receive() payable external{
        fund();
    }

    fallback() payable external{
        fund();
    }  

}