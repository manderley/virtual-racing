"use strict";

var wallet = (function() {

	var wallet = {};

	var initialBalance = 390;
	var currency = "GC"; // Gold Coins
	var balanceContainer;

	// on loading page, check if wallet is already in storage
	// if it is, display the balance
	// if it isn't, create wallet and display the balance
	function initialiseWallet() {
		balanceContainer = document.querySelector('.wallet-balance');

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

	// newBalance will only be passed if updating balance after placing bet
	function displayBalance(newBalance) {
		var balance = newBalance ? newBalance : getBalance();
		var balanceText = balance + ' ' + currency;
		balanceContainer.innerHTML = balanceText;
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

	function updateWallet(newBalance) {
		var wallet = {
			balance: newBalance
		};
		localStorage.setItem('wallet', JSON.stringify(wallet));
	}

	function processNewBalance(betTotal) {
		// calculate new balance, update wallet and display new balance on page
		var newBalance = getBalance() - betTotal;
		updateWallet(newBalance);
		displayBalance(newBalance);
	}

	wallet.returnBalance = function() {
		return getBalance();
	};

	wallet.updateBalance = function(betTotal) {
		processNewBalance(betTotal);
	};

	wallet.init = function() {
		initialiseWallet();
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
			runnerContainer.setAttribute('id', 'runner-' + this.id);

			var numberElement = utils.createTextElement('span', 'runner-number', this.number);
			var nameElement = utils.createTextElement('span', 'runner-name', this.name);
			var jockeyElement = utils.createTextElement('span', 'runner-jockey', this.jockey);
			var colours = new Image();
			colours.src = imagesPath + this.colours;
			colours.setAttribute('alt', this.jockey);
			var priceElement = utils.createTextElement('button', 'runner-bet-button', this.price);
			priceElement.setAttribute('id', 'button-' + this.id);
			
			runnerContainer.appendChild(numberElement);
			runnerContainer.appendChild(colours);
			runnerContainer.appendChild(nameElement);
			runnerContainer.appendChild(jockeyElement);
			runnerContainer.appendChild(priceElement);

			// use closure to capture values of this runner's id, name and price
			priceElement.onclick = (function(id, name, price, button) {
				return function() {
					raceData.addToBetslip(id, name, price, button);
				}
			})(this.id, this.name, this.price, priceElement);
			
			return runnerContainer;
		}
	}

	raceData.addToBetslip = function(id, name, price, button) {
		// create selection
		betslip.createSelection(id, name, price);

		// add selected class to runner
		var selectedRunner = document.getElementById('runner-' + id);
		selectedRunner.classList.add('selected');

		// disable button
		// as dynamic disabled state doesn't persist after page refresh 
		// (except in Firefox), using CSS to simulate visual disabled effect
		// and setting onclick handler to null 
		button.classList.add('disabled');
		button.onclick = null;

	};

	raceData.init = function() {
		getRaceData();
		getRacesContainer();
	};

	return raceData;

})();

var betslip = (function() {

	var betslip = {};

	var betslipContainer;
	var selectionsContainer;
	var buttonsContainer;
	var cancelButton;
	var placeBetsButton;
	var messageContainer;

	var stakeMessage = 'Enter a stake and then place your bets. The stake must be a whole number. If it includes decimal places it will be rounded down to the nearest whole number.';
	var stakeErrorMessage = 'Please enter a valid stake amount for each selection.';
	var fundsErrorMessage = 'You do not have sufficient funds. Please make sure your total bets amount does not exceed your wallet balance.';

	var selectionsPlaced = [];
	var selections = [];

	var totalBetAmount = 0;
	var validInput = true;

	function Selection(id, name, price) {
		this.id = id;
		this.name = name;
		this.price = price;

		this.display = function() {
			var selectionContainer = document.createElement('li');
			selectionContainer.setAttribute('id', 'selection-' + this.id);
			selectionContainer.setAttribute('class', 'betslip-selection');

			var nameElement = utils.createTextElement('label', 'selection-name', this.name);
			nameElement.setAttribute('for', this.id);
			var priceElement = utils.createTextElement('span', 'selection-price', this.price);
			var inputElement = utils.createTextElement('input', 'selection-stake');
			inputElement.setAttribute('type', 'number');
			inputElement.setAttribute('min', '1');
			inputElement.setAttribute('step', '1');
			inputElement.setAttribute('id', this.id);
			var removeElement = utils.createTextElement('span', 'selection-delete', 'x');

			selectionContainer.appendChild(nameElement);
			selectionContainer.appendChild(priceElement);
			selectionContainer.appendChild(inputElement);
			selectionContainer.appendChild(removeElement);

			removeElement.onclick = (function(selection) {
				return function() {
					removeSelection(selection);
				}
			})(this);

			return selectionContainer;
		};

	}

	function getBetslipElements() {
		betslipContainer = document.querySelector('.betslip');
		selectionsContainer = document.querySelector('.betslip-selections');
		buttonsContainer = document.querySelector('.betslip-buttons');
		cancelButton = document.querySelector('.buttons-cancel');
		placeBetsButton = document.querySelector('.buttons-place-bets');
		messageContainer = document.querySelector('.betslip-message');
	}

	function removeSelection(selection) {
		// remove from betslip
		var selectionId = document.getElementById('selection-' + selection.id);
		selectionsContainer.removeChild(selectionId);

		// remove from selections array
		var index = selections.indexOf(selection);
		if (index > -1) {
			console.log('removing selection from array');
			selections.splice(index, 1);
		}

		// re-enable button on racecard
		var buttonId = document.getElementById('button-' + selection.id);
		buttonId.classList.remove('disabled');
		buttonId.onclick = (function(id, name, price, button) {
			return function() {
				raceData.addToBetslip(id, name, price, button);
			}
		})(selection.id, selection.name, selection.price, buttonId);

		// remove selected class from runner
		var runnerId = document.getElementById('runner-' + selection.id);
		runnerId.classList.remove('selected');

		// if removal of selection results in empty betslip, remove Cancel and Place Bets buttons
		// and stake message
		if (!selections.length) {
			removeButtons();
			messageContainer.classList.remove('show');
		}
	}

	function removeAllSelections() {
		// don't need to increment the value of i as each call to removeSelection()
		// removes an item from the selections array; so on each iteration we want 
		// to operate on the first item in the selections array
		console.log('removing all selections');
		for (var i = 0; i < selections.length;) {
			removeSelection(selections[i]);
		}
		messageContainer.classList.remove('show');
	}

	function displayButtons() {
		buttonsContainer.classList.add('show');

		cancelButton.onclick = function(event) {
			event.preventDefault();
			removeAllSelections();
		};

		placeBetsButton.onclick = function(event) {
			event.preventDefault();
			validateBets();
		};
	}

	function removeButtons() {
		buttonsContainer.classList.remove('show');
		cancelButton.onclick = null;
		placeBetsButton.onclick = null;
	}

	function validateBets() {
		//console.log('validating bets');

		// if all inputs are valid, check total amount against wallet balance
		// if balance is sufficient, place bets and update wallet balance
		// otherwise show error message

		// reset global variables before getting input values
		validInput = true;
		totalBetAmount = 0;

		getInputValues();
		console.log('validInput: ', validInput);
		console.log('totalBetAmount: ', totalBetAmount);

		if (validInput) {
			console.log('input is valid');
			console.log('wallet balance: ', wallet.returnBalance());
			if (totalBetAmount <= wallet.returnBalance()) {
				console.log('and we have sufficient funds');
				placeBets();
				wallet.updateBalance(totalBetAmount);
			} else {
				console.log('but we do not have sufficient funds');
				showMessage(fundsErrorMessage);
			}
		} else {
			showMessage(stakeErrorMessage);
		}
	}

	function placeBets() {
		console.log('placing bets');
		// save selections in local storage?

		// display placed bets

	}

	function enableMessageDisplay() {
		messageContainer.classList.add('show');
	}

	function showMessage(message) {
		messageContainer.innerHTML = message;
	}

	function getInputValues() {
		// iterate over selections in betslip
		// if stake input value is valid, add to relevant item in selections array
		// and add value to totalBetAmount
		// otherwise set invalidInput flag to true
		var betslipSelections = document.getElementsByClassName('selection-stake');
		for (var i = 0; i < betslipSelections.length; i++) {
			var stakeValue = parseInt(betslipSelections[i].value, 10);
			var stakeId = betslipSelections[i].id;
			if (isValid(stakeValue)) {
				for (var j = 0; j < selections.length; j++) {
					if (selections[j].id === stakeId) {
						selections[j].value = stakeValue;
						totalBetAmount = totalBetAmount + stakeValue;
					}
				}
			} else {
				betslipSelections[i].value = 0;
				validInput = false;
			}

		}

	}

	function isValid(stake) {
		// check that stake is a positive integer
		return /^([1-9]\d*)$/.test(stake);
	}

	betslip.createSelection = function(id, name, price) {
		var selection = new Selection(id, name, price);
		selections.push(selection);
		selectionsContainer.appendChild(selection.display());
		// on adding the first selection make sure Cancel and Place Bets buttons are displayed
		if (selections.length === 1) {
			displayButtons();
			enableMessageDisplay();
			showMessage(stakeMessage);
		}
	};

	betslip.init = function() {
		getBetslipElements();
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
