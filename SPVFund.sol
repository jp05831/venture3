// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SPVFund {
    address public creator;
    uint256 public goal;
    uint256 public deadline;
    uint256 public totalRaised;
    uint256 public minContribution; // New: Minimum contribution amount
    mapping(address => uint256) public contributions;
    bool public isFunded;
    bool public isClosed;
    bool public isPaused; // New: Pause functionality

    // Events for frontend integration
    event Contributed(address indexed contributor, uint256 amount);
    event FundsWithdrawn(address indexed creator, uint256 amount);
    event Refunded(address indexed contributor, uint256 amount);
    event Paused(address indexed creator);
    event Unpaused(address indexed creator);

    constructor(uint256 _goal, uint256 _durationInDays, uint256 _minContribution) {
        creator = msg.sender;
        goal = _goal;
        deadline = block.timestamp + (_durationInDays * 1 days);
        minContribution = _minContribution; // Set minimum contribution
        isFunded = false;
        isClosed = false;
        isPaused = false;
    }

    function contribute() external payable {
        require(!isPaused, "Campaign is paused");
        require(block.timestamp < deadline, "Fundraising period has ended");
        require(!isClosed, "Fundraising is closed");
        require(msg.value >= minContribution, "Contribution below minimum");

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        if (totalRaised >= goal) {
            isFunded = true;
        }

        emit Contributed(msg.sender, msg.value);
    }

    function withdrawFunds() external {
        require(msg.sender == creator, "Only the creator can withdraw");
        require(isFunded, "Funding goal not met");
        require(!isClosed, "Funds already withdrawn");

        isClosed = true;
        uint256 amount = address(this).balance;
        payable(creator).transfer(amount);

        emit FundsWithdrawn(creator, amount);
    }

    function refund() external {
        require(block.timestamp >= deadline, "Fundraising period not ended");
        require(!isFunded, "Funding goal was met");
        require(contributions[msg.sender] > 0, "No contributions to refund");

        uint256 amount = contributions[msg.sender];
        contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);

        emit Refunded(msg.sender, amount);
    }

    function pause() external {
        require(msg.sender == creator, "Only the creator can pause");
        require(!isPaused, "Already paused");
        isPaused = true;
        emit Paused(creator);
    }

    function unpause() external {
        require(msg.sender == creator, "Only the creator can unpause");
        require(isPaused, "Not paused");
        isPaused = false;
        emit Unpaused(creator);
    }

    receive() external payable {
        contribute();
    }
}