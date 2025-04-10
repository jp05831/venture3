// investors.js
document.addEventListener('DOMContentLoaded', function() {
    // Sample investor data (replace with actual API calls in production)
    const investorsData = [
        {
            name: "Crypto Ventures",
            type: "VC",
            focus: ["defi", "infrastructure"],
            stage: ["seed", "series-a"],
            investments: 25,
            capital: "$50M+",
            description: "Leading VC firm focused on DeFi and blockchain infrastructure"
        },
        {
            name: "Angel Web3",
            type: "Angel",
            focus: ["nft", "gaming"],
            stage: ["pre-seed", "seed"],
            investments: 15,
            capital: "$5M+",
            description: "Experienced angel investor in NFT and gaming projects"
        },
        {
            name: "Decentral DAO",
            type: "DAO",
            focus: ["defi", "governance"],
            stage: ["seed"],
            investments: 10,
            capital: "$20M+",
            description: "Community-driven DAO investing in decentralized governance"
        }
    ];

    let displayedInvestors = 0;
    const investorsPerPage = 6;

    // Initialize page
    setupFilters();
    loadInvestors(investorsData.slice(0, investorsPerPage));
    displayedInvestors = investorsPerPage;

    // Load more investors
    const loadMoreBtn = document.getElementById('load-more-investors');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            const nextInvestors = investorsData.slice(displayedInvestors, displayedInvestors + investorsPerPage);
            loadInvestors(nextInvestors);
            displayedInvestors += nextInvestors.length;

            if (displayedInvestors >= investorsData.length) {
                loadMoreBtn.style.display = 'none';
            }
        });
    }
});

function setupFilters() {
    const filters = ['investment-focus', 'funding-stage', 'investor-type'];
    filters.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
            select.addEventListener('change', filterInvestors);
        }
    });
}

function filterInvestors() {
    const focusFilter = document.getElementById('investment-focus').value;
    const stageFilter = document.getElementById('funding-stage').value;
    const typeFilter = document.getElementById('investor-type').value;

    // This would typically call an API with filter parameters
    // For now, we'll simulate with local data
    const filteredData = investorsData.filter(investor => {
        const matchesFocus = focusFilter === 'all' || investor.focus.includes(focusFilter);
        const matchesStage = stageFilter === 'all' || investor.stage.includes(stageFilter);
        const matchesType = typeFilter === 'all' || investor.type.toLowerCase() === typeFilter;
        return matchesFocus && matchesStage && matchesType;
    });

    // Clear and reload investors
    const grid = document.querySelector('.investors-grid');
    grid.innerHTML = '';
    loadInvestors(filteredData.slice(0, investorsPerPage));
}

function loadInvestors(investors) {
    const grid = document.querySelector('.investors-grid');
    if (!grid) return;

    investors.forEach(investor => {
        const card = document.createElement('div');
        card.className = 'investor-card';
        card.innerHTML = `
            <div class="investor-logo"></div>
            <h3>${investor.name}</h3>
            <span class="investor-type">${investor.type}</span>
            <div class="investor-details">
                <p><strong>Focus:</strong> ${investor.focus.join(', ')}</p>
                <p><strong>Stage:</strong> ${investor.stage.join(', ')}</p>
                <p><strong>Investments:</strong> ${investor.investments}</p>
                <p><strong>Capital:</strong> ${investor.capital}</p>
            </div>
            <p>${investor.description}</p>
            <div class="investor-actions">
                <a href="#" class="contact-btn">Contact</a>
                <a href="#" class="view-profile-btn">View Profile</a>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Update user name in header
const userData = localStorage.getItem('venture3_user');
if (userData) {
    const user = JSON.parse(userData);
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = user.name;
    }
}