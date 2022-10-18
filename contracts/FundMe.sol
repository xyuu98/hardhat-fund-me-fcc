// SPDX-License-Identifier:MIT

pragma solidity ^0.8.7;
import "./PriceConverter.sol";

error FundMe_notOwner();

contract FundMe{

    using PriceConverter for uint256;

    uint256 public constant minimunUsd = 50 * 1e18;// use constant can save some gas fee

    address[] public s_funders;
    mapping (address => uint256) public s_addressToAmountFunded;

    address public immutable i_owner;// use immutable can save some gas fee

    AggregatorV3Interface public s_priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner{
        // require(msg.sender == i_owner,"U R NOT THE OWNER!");
        if(msg.sender != i_owner){ revert FundMe_notOwner(); }// use this can save some gas fee
        _;
    }

    function fund() public payable {
        require (msg.value.getConversionRate(s_priceFeed) >= minimunUsd,"U need to send more ETH!");
        s_addressToAmountFunded[msg.sender] += msg.value;
        s_funders.push(msg.sender);
    }

    function withdraw() public onlyOwner{
        for(uint256 funderIndex = 0;funderIndex < s_funders.length;funderIndex++){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);

        // payable(msg.sender).transfer(address(this).balance);

        // bool sendSuc = payable(msg.sender).send(address(this).balance);
        // require(sendSuc,"Failed");

        (bool sendSuc, ) = payable(msg.sender).call{value:address(this).balance}("");
        require(sendSuc,"Failed");
    }

    function cheaperWithdraw() public payable onlyOwner{
        address[] memory funders = s_funders;

        for(uint256 funderIndex = 0;funderIndex < funders.length;funderIndex++){
            address funder = s_funders[funderIndex];
            s_addressToAmountFunded[funder] = 0;
        }
        s_funders = new address[](0);
        (bool sendSuc, ) = payable(msg.sender).call{value:address(this).balance}("");
        require(sendSuc,"Failed");

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

    receive() payable external{
        fund();
    }

    fallback() payable external{
        fund();
    }  

}