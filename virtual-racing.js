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

	var selectionsPlaced = [];
	var selections = [];

	function Selection(id, name, price) {
		this.id = id;
		this.name = name;
		this.price = price;

		this.display = function() {
			var selectionContainer = document.createElement('li');
			selectionContainer.setAttribute('id', 'selection-' + this.id);

			var nameElement = utils.createTextElement('label', 'selection-name', this.name);
			nameElement.setAttribute('for', 'selection' + this.id);
			var priceElement = utils.createTextElement('span', 'selection-price', this.price);
			var inputElement = utils.createTextElement('input', 'selection-stake');
			inputElement.setAttribute('type', 'number');
			inputElement.setAttribute('min', '1');
			inputElement.setAttribute('step', '1');
			inputElement.setAttribute('id', 'selection' + this.id);
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

		this.save = function() {

		}

	}

	function getBetslipElements() {
		betslipContainer = document.querySelector('.betslip');
		selectionsContainer = document.querySelector('.betslip-selections');
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
		if (!selections.length) {
			removeButtons();
		}
	}

	function removeAllSelections() {
		// don't need to increment the value of i as each call to removeSelection()
		// removes an item from the selections array; so on each iteration we want 
		// to operate on the first item in the selections array
		for (var i = 0; i < selections.length;) {
			removeSelection(selections[i]);
		}
	}

	function displayButtons() {
		var buttonsContainer = utils.createTextElement('fieldset', 'betslip-buttons');
		var cancelButton = utils.createTextElement('button', 'buttons-cancel', 'Cancel');
		var placeBetsButton = utils.createTextElement('button', 'buttons-place-bets', 'Place Bets');
		buttonsContainer.appendChild(cancelButton);
		buttonsContainer.appendChild(placeBetsButton);
		betslipContainer.appendChild(buttonsContainer);
		cancelButton.onclick = removeAllSelections;
	}

	function removeButtons() {
		var buttonsContainer = document.querySelector('.betslip-buttons');
		betslipContainer.removeChild(buttonsContainer);
	}

	betslip.createSelection = function(id, name, price) {
		var selection = new Selection(id, name, price);
		selections.push(selection);
		selectionsContainer.appendChild(selection.display());
		// on adding the first selection make sure Cancel and Place Bets buttons are displayed
		if (selections.length === 1) {
			displayButtons();
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
