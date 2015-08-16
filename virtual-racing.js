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
	var imagesPath = "images/"

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
		this.runners = [];

		if (race.runners) {
			for (var i = 0; i < race.runners.length; i++) {
				this.runners.push(new Runner(race.runners[i]));
			}
		}
		
		this.display = function() {
			var raceContainer = document.createElement('section');
			raceContainer.setAttribute('class', 'race');
			
			// display race name
			var nameElement = utils.createTextElement('h1', 'race-heading', this.name);
			raceContainer.appendChild(nameElement);

			// display race runners
			if (this.runners.length) {
				var runnersContainer = document.createElement('ol');
				runnersContainer.setAttribute('class', 'race-runners');
				for (var i = 0; i < this.runners.length; i++) {
					runnersContainer.appendChild(this.runners[i].display());
				}
				raceContainer.appendChild(runnersContainer);
			}
			
			return raceContainer;
		}
	}

	function Runner(runner) {
		this.id = runner.id;
		this.number = runner.number;
		this.name = runner.name;
		this.jockey = runner.jockey;
		this.colours = runner.colours;
		this.price = runner.price;
		this.display = function() {
			var runnerContainer = document.createElement('li');
			runnerContainer.setAttribute('id', this.id);

			var numberElement = utils.createTextElement('span', 'runner-number', this.number);
			var nameElement = utils.createTextElement('span', 'runner-name', this.name);
			var jockeyElement = utils.createTextElement('span', 'runner-jockey', this.jockey);
			var colours = new Image();
			colours.src = imagesPath + this.colours;
			colours.setAttribute('alt', this.jockey);
			var priceElement = utils.createTextElement('button', 'runner-bet-button', this.price);
			
			// use closure to capture values of this runner's id, name and price
			priceElement.onclick = (function(id, name, price, button) {
				return function() {
					addToBetslip(id, name, price, button);
				}
			})(this.id, this.name, this.price, priceElement);
			
			runnerContainer.appendChild(numberElement);
			runnerContainer.appendChild(colours);
			runnerContainer.appendChild(nameElement);
			runnerContainer.appendChild(jockeyElement);
			runnerContainer.appendChild(priceElement);
			
			return runnerContainer;
		}
	}

	function addToBetslip(id, name, price, button) {
		// create selection
		betslip.createSelection(id, name, price);

		// add selected class to runner
		var selectedRunner = document.getElementById(id);
		selectedRunner.classList.add('selected');

		// disable button
		// as dynamic disabled state doesn't persist after page refresh 
		// (except in Firefox), using CSS to simulate visual disabled effect
		// and setting onclick handler to null 
		button.classList.add('disabled');
		button.onclick = null;

	}

	raceData.init = function() {
		getRaceData();
		getRacesContainer();
	};

	return raceData;

})();

var betslip = (function() {

	var betslip = {};

	var selectionsContainer;

	var bets = [];
	var selections = [];

	function Selection(id, name, price) {
		this.id = id;
		this.name = name;
		this.price = price;

		this.display = function() {
			var selectionContainer = document.createElement('li');
			selectionContainer.setAttribute('id', this.id);

			var nameElement = utils.createTextElement('label', 'selection-name', this.name);
			nameElement.setAttribute('for', 'selection' + this.id);
			var priceElement = utils.createTextElement('span', 'selection-price', this.price);
			var inputElement = utils.createTextElement('input', 'selection-stake');
			inputElement.setAttribute('type', 'text');
			inputElement.setAttribute('id', 'selection' + this.id);

			selectionContainer.appendChild(nameElement);
			selectionContainer.appendChild(priceElement);
			selectionContainer.appendChild(inputElement);

			return selectionContainer;
		};

		this.save = function() {

		}

	}

	function getSelectionsContainer() {
		selectionsContainer = document.querySelector('.betslip-selections');
	}

	betslip.createSelection = function(id, name, price) {
		console.log('create selection');
		var selection = new Selection(id, name, price);
		selections.push(selection);
		selectionsContainer.appendChild(selection.display());
	};

	betslip.init = function() {
		getSelectionsContainer();
	}

	return betslip;

})();

var utils = (function() {

	var utils = {};

	utils.createTextElement = function (el, cssClass, text) {
		var element = document.createElement(el);
		if (text) {
			var elementContent = document.createTextNode(text);
			element.appendChild(elementContent);
		}
		element.setAttribute('class', cssClass);
		return element;
	};

	return utils;

})();

window.onload = function() {
	wallet.init();
	raceData.init();
	betslip.init();
};
