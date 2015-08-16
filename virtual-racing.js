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

var raceData = (function() {

	var raceData = {};

	var dataSource = "races.json";

	var races = [];

	var container;

	function getRaceData() {
		makeRequest(dataSource, populateRaces, handleError);
	}

	function getRacesContainer() {
		container = document.querySelector('.races');
	}

	function populateRaces(data) {
		var raceData = JSON.parse(data);
		for (var i = 0; i < raceData.races.length; i++) {
			races.push(new Race(raceData.races[i]));
		}
		for (var i = 0; i < races.length; i++) {
			container.appendChild(races[i].display());
		}
	}

	function handleError() {
		var messageContainer = document.createElement('p');
		var messageText = document.createTextNode('Sorry, the race information cannot be displayed right now.');
		messageContainer.appendChild(messageText);
		container.appendChild(messageContainer);
	}

	function createHttpRequestObject() {
		if (window.XMLHttpRequest) {
			return new XMLHttpRequest;
		} else if (window.ActiveXObject) {
			try {
				return new ActiveXObject("Msxml2.XMLHTTP");
			}
			catch(e) {
				try {
					return new ActiveXObject("Microsoft.XMLHTTP");
				}
				catch(e) {
					console.log(e.message);
				}
			}
			
		} 
	}

	function makeRequest(url, success, failure) {
		var httpRequest = createHttpRequestObject();
		httpRequest.onreadystatechange = function() {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200 || !failure) {
					success(httpRequest.responseText);
				} else if (failure) {
					failure();
				}
			}
		};
		httpRequest.open("GET", url, true);
	  httpRequest.send(null);
	}

	function Race(race) {
		this.name = race.name;
		this.runners = race.runners;
		this.display = function() {
			var section = document.createElement('section');
			var h1 = document.createElement('h1');
			var h1Text = document.createTextNode(this.name);
			section.setAttribute('class', 'race');
			h1.setAttribute('class', 'race-heading');
			h1.appendChild(h1Text);
			section.appendChild(h1);
			return section;
		}
	}

	raceData.init = function() {
		getRaceData();
		getRacesContainer();
	};

	return raceData;

})();

window.onload = function() {
	wallet.init();
	raceData.init();
};
