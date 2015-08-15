var wallet = (function() {

	var wallet = {};

	var initialBalance = 390;
	var currency = "GC"; // Gold Coins
	var balanceContainer;

	// on loading page, check if wallet is already in storage
	// if it is, display the balance
	// if it isn't, create wallet and display the balance
	function initialiseWallet() {
		if (!localStorage.getItem('wallet')) {
			createWallet(initialBalance);
		}
		displayBalance();
	}
	
	function createWallet(initialBalance) {
		var wallet = {
			balance: initialBalance
		}
		localStorage.setItem('wallet', JSON.stringify(wallet));
	}

	function displayBalance() {
		balanceContainer = document.querySelector('.wallet-balance');
		var balance = getBalance();
		var balanceText = document.createTextNode(balance + ' ' + currency);
		balanceContainer.appendChild(balanceText);
	}

	function getBalance() {
		// check if it's in local storage, otherwise use initialBalance
		var balance = initialBalance;
		
		if (localStorage.getItem('wallet')) {
			var wallet = JSON.parse(localStorage.getItem('wallet'));
			if (wallet.balance) {
				balance = wallet.balance;
			}
		}

		return balance;
	}

	wallet.init = function() {
		initialiseWallet()
	};

	return wallet;

})();

window.onload = function() {
	wallet.init();
};
