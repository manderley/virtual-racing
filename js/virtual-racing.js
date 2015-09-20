"use strict";
var wallet = (function() {

	var wallet = {};

	var initialBalance = {'balance': 390};
	var currency = 'GC'; // Gold Coins
	var balanceContainer;

	var storage;

	function initialiseWallet(abstractStorage) {
		storage = abstractStorage;
		balanceContainer = document.querySelector('.wallet-balance');
		displayBalance();
	}

	function displayBalance() {
		var balanceText = getBalance() + ' ' + currency;
		balanceContainer.innerHTML = balanceText;
	}

	function getBalance() {
		return storage.get('wallet', initialBalance)['balance'];
	}

	function updateWallet(newBalance) {
		var wallet = {
			balance: newBalance
		};
		storage.put('wallet', wallet);
	}

	function processNewBalance(betTotal) {
		// calculate new balance, update wallet and display new balance on page
		var newBalance = getBalance() - betTotal;
		updateWallet(newBalance);
		displayBalance();
	}

	wallet.returnBalance = function() {
		return getBalance();
	};

	wallet.updateBalance = function(betTotal) {
		processNewBalance(betTotal);
	};

	wallet.addWin = function(amount) {
		var newBalance = getBalance() + amount;
		updateWallet(newBalance);
		displayBalance();
	};

	wallet.init = function(abstractStorage) {
		initialiseWallet(abstractStorage);
	};

	Object.freeze(wallet);

	return wallet;

})();

var raceData = (function() {

	var raceData = {};

	var dataSource = 'races.json';
	var races = [];
	var container;
	var imagesPath = 'images/';

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
				return new ActiveXObject('Msxml2.XMLHTTP');
			}
			catch(e) {
				try {
					return new ActiveXObject('Microsoft.XMLHTTP');
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
		httpRequest.open('GET', url, true);
	  httpRequest.send(null);
	}

	function disableSelection(selectionButton) {
		// disable button
		// as dynamic disabled state doesn't persist after page refresh 
		// (except in Firefox), using CSS to simulate visual disabled effect
		// and setting onclick handler to null
		selectionButton.classList.add('disabled');
		selectionButton.onclick = null;
	}

	function Race(race) {
		this.name = race.name;
		this.runners = [];
		this.priceList = [];

		if (race.runners) {
			for (var i = 0; i < race.runners.length; i++) {
				this.runners.push(new Runner(race.runners[i]));
				this.priceList.push(race.runners[i].price);
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

			// use closure to capture values of this runner's id, number, name and price
			priceElement.onclick = (function(id, number, name, price, button) {
				return function() {
					raceData.addToBetslip(id, number, name, price, button);
				}
			})(this.id, this.number, this.name, this.price, priceElement);
			
			return runnerContainer;
		}

	}

	raceData.addToBetslip = function(id, number, name, price, button) {
		// create selection
		betslip.createSelection(id, number, name, price);

		// add selected class to runner
		var selectedRunner = document.getElementById('runner-' + id);
		selectedRunner.classList.add('selected');

		disableSelection(button);
	};

	raceData.disableSelections = function() {
		var selectionButtons = document.getElementsByClassName('runner-bet-button');
		for (var i = 0; i < selectionButtons.length; i++) {
			disableSelection(selectionButtons[i]);
		}
	}

	raceData.init = function() {
		getRaceData();
		getRacesContainer();
	};

	Object.freeze(raceData);

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
	var fundsErrorMessage = 'You do not have sufficient funds. Please make sure your total bet amount does not exceed your wallet balance.';
	var betsPlacedMessage = 'Your bets have been placed. Your selections are listed below.<br/><br/>Please click on the <strong>"Start Race"</strong> button to start the race. Good luck!';
	var raceSuccessfulMessage = 'Congratulations! Your horse won and your winnings have been added to your available funds.'
	var raceUnsuccessfulMessage = 'Sorry, your horse didn\'t win.'
	
	var selectionsPlaced = [];
	var selections = [];

	var totalBetAmount = 0;
	var validInput = true;

	function Selection(id, number, name, price) {
		this.id = id;
		this.elementId = 'selection-' + this.id;
		this.number = number;
		this.name = name;
		this.price = price;
		this.value = 0;
		this.potentialWin = 0;
		this.selectionContainer;
		this.nameElement;
		this.numberElement;
		this.priceElement;
		this.inputElement;
		this.removeElement;

		// display selection in betslip
		this.display = function() {
			this.selectionContainer = document.createElement('li');
			this.selectionContainer.setAttribute('id', this.elementId);
			this.selectionContainer.setAttribute('class', 'betslip-selection');

			this.nameElement = utils.createTextElement('label', 'selection-name', this.name);
			this.nameElement.setAttribute('for', this.id);
			this.numberElement = utils.createTextElement('span', 'selection-number', this.number);
			this.priceElement = utils.createTextElement('span', 'selection-price', this.price);
			this.inputElement = utils.createTextElement('input', 'selection-stake');
			this.inputElement.setAttribute('type', 'number');
			this.inputElement.setAttribute('min', '1');
			this.inputElement.setAttribute('step', '1');
			this.inputElement.setAttribute('id', this.id);
			this.removeElement = utils.createTextElement('span', 'selection-delete', 'x');

			this.selectionContainer.appendChild(this.numberElement);
			this.selectionContainer.appendChild(this.nameElement);
			this.selectionContainer.appendChild(this.priceElement);
			this.selectionContainer.appendChild(this.inputElement);
			this.selectionContainer.appendChild(this.removeElement);

			this.removeElement.onclick = (function(selection) {
				return function() {
					removeSelection(selection);
				}
			})(this);

			return this.selectionContainer;
		};

		this.setPotentialWinAmount = function() {
			this.potentialWin = calculatePotentialWin(this.price, this.value);
		}

		// update display after bet has been placed
		this.updateDisplay = function() {
			// - remove delete button
			// - disable input field
			// - display potential win amount
			this.selectionContainer.removeChild(this.removeElement);
			this.inputElement.setAttribute('disabled', 'disabled');
			var potentialWinContainer = utils.createTextElement('div', 'selection-potential-win');
			var potentialWinLabel = utils.createTextElement('span', 'selection-potential-win-label', 'Potential win amount:');
			var potentialWinAmount = utils.createTextElement('span', 'selection-potential-win-amount', this.potentialWin);
			potentialWinContainer.appendChild(potentialWinLabel);
			potentialWinContainer.appendChild(potentialWinAmount);
			this.selectionContainer.appendChild(potentialWinContainer);
		};

	}

	function getBetslipElements() {
		betslipContainer = document.querySelector('.betslip');
		selectionsContainer = document.querySelector('.betslip-selections');
		buttonsContainer = document.querySelector('.betslip-buttons');
		cancelButton = document.querySelector('.buttons-cancel');
		placeBetsButton = document.querySelector('.buttons-place-bets');
		messageContainer = document.querySelector('.betslip-message');
		disableEnterKey();
	}

	function removeSelection(selection) {
		// remove from betslip
		var selectionId = document.getElementById('selection-' + selection.id);
		selectionsContainer.removeChild(selectionId);

		// remove from selections array
		var index = selections.indexOf(selection);
		if (index > -1) {
			selections.splice(index, 1);
		}

		// re-enable button on racecard
		var buttonId = document.getElementById('button-' + selection.id);
		buttonId.classList.remove('disabled');
		buttonId.onclick = (function(id, number, name, price, button) {
			return function() {
				raceData.addToBetslip(id, number, name, price, button);
			}
		})(selection.id, selection.number, selection.name, selection.price, buttonId);

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

		// reset global variables before getting input values
		validInput = true;
		totalBetAmount = 0;

		getInputValues(); // updates validInput and totalBetAmount

		// if all inputs are valid, check total amount against wallet balance
		// if balance is sufficient, place bets and update wallet balance
		// otherwise show error message

		if (validInput) {
			if (totalBetAmount <= wallet.returnBalance()) {
				placeBets();
				wallet.updateBalance(totalBetAmount);
			} else {
				showMessage(fundsErrorMessage);
			}
		} else {
			showMessage(stakeErrorMessage);
		}
	}

	function placeBets() {

		showMessage(betsPlacedMessage);

		// update selections with potential win value and update display of selections in betslip
		for (var i = 0; i < selections.length; i++) {
			selections[i].setPotentialWinAmount();
			selections[i].updateDisplay();
		}

		removeButtons();
		raceEvent.showStartButton();
		raceData.disableSelections();

	}

	function calculatePotentialWin(price, stake) {
		var potentialWin = price * stake;
		return potentialWin;
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

	function disableEnterKey() {
		betslipContainer.onkeypress = function(e) {
			var key = (typeof e.which == "number") ? e.which : e.keyCode; 
		  if (key == 13) {
		    e.preventDefault();
		  }
		}
	}

	betslip.createSelection = function(id, number, name, price) {
		var selection = new Selection(id, number, name, price);
		selections.push(selection);
		selectionsContainer.appendChild(selection.display());
		// on adding the first selection 
		// - make sure Cancel and Place Bets buttons are displayed
		// - message regarding valid stake is displayed
		if (selections.length === 1) {
			displayButtons();
			enableMessageDisplay();
			showMessage(stakeMessage);
		}

		return selection;
	};

	betslip.processOutcome = function(winner) {
		var outcomeMessage = raceUnsuccessfulMessage;
		
		// if winner is among betslip selections:
		// - get win amount and add to wallet balance
		// - change value of outcomeMessage to successful
		for (var i = 0; i < selections.length; i++) {
			if (selections[i].number === winner) {
				var winAmount = selections[i].potentialWin;
				wallet.addWin(winAmount);
				outcomeMessage = raceSuccessfulMessage;
			}
		}

		showMessage(outcomeMessage);
	};

	// used by test
	betslip.clear = function() {
		removeAllSelections();
	}

	betslip.init = function() {
		getBetslipElements();
	}

	Object.freeze(betslip);

	return betslip;

})();

var raceEvent = (function() {

	var raceEvent = {};

	var imagesPath = 'images/'
	
	var movingHorse = imagesPath + 'moving-horse.gif';
	var stationaryHorse = imagesPath + 'stationary-horse.png';
	var raceLength = 231000;
	var maxMarginBg = 200;

	var chances = [];
	var horsesPositions = [];

	var intervalId = -1;
	var winner = -1;

	var currentMarginBg = 0;

	var startRaceButton;
	var winnerMessageContainer;
	var raceCourse;
	var horseImages;
	var startSignal;

	var priceList = [3.5, 4, 4.5, 7, 13];

	function getElements() {
		startRaceButton = document.querySelector('.start-race');
		winnerMessageContainer = document.querySelector('.display-winner');
		raceCourse = document.querySelector('.race-course');
		horseImages = document.getElementsByClassName('horse-image');
		startSignal = document.querySelector('.race-start-signal');
	}

	function displayWinner(winner) {
		winnerMessageContainer.innerHTML = 'The winner is horse number ' + winner;
	}

	function run() {
		setRaceInMotion();
		displayRaceAction();
	}

	function setRaceInMotion() {
		var fastestHorsePosition = Math.max.apply(Math, horsesPositions);

		// check for winner
		if (winner < 0 && fastestHorsePosition > raceLength) {

			winner = horsesPositions.indexOf(fastestHorsePosition) + 1;
			
			changeHorseImages(stationaryHorse);
			
			handleRaceEnd(winner);
			
			clearInterval(intervalId);
		}

		// set pace
		if (fastestHorsePosition > ((raceLength * 7) / 8)) {
			movePonderatedPace();
		} else {
			moveEqualPace();
		}

		// check to stop display
		var slowestHorsePosition = Math.min.apply(Math, horsesPositions);
		if (slowestHorsePosition > raceLength) {
			clearInterval(intervalId);
		}
	}

	// at the begining the race is equal, favourites show up at the end
	function moveEqualPace() {
		for (var i = 0; i < horsesPositions.length; i++) {
			horsesPositions[i] += Math.floor((Math.random() * 150) + 1) + 500;
		}
	}

	// better horse will go faster
	function movePonderatedPace() {
		for (var i = 0; i < horsesPositions.length; i++) {
			var baseRandom = (240 * (chances[i])) + 51;
			horsesPositions[i]+= Math.floor((Math.random() * baseRandom) + 1) + 800;
		}
	}

	function displayRaceAction() {
		currentMarginBg++;

		// move horses
		var slowestHorsePosition = Math.min.apply(Math, horsesPositions);
		for (var i = 0; i < horsesPositions.length; i++) {
			var currentHorse = ((horsesPositions[i] - slowestHorsePosition) / 20) + currentMarginBg;
			document.getElementById('horse_' + i).style.paddingLeft = currentHorse + 'px';
		}

		// move background
		var marginBg = (slowestHorsePosition / 100) - currentMarginBg;
		var newBgPosition = -marginBg + 'px 0';
		raceCourse.style.backgroundPosition = newBgPosition;
  }

	function changeHorseImages(image) {
		for (var i = 0; i < horseImages.length;i++) {
			horseImages[i].src = image;
		}
	}

	function startRace() {
		changeHorseImages(movingHorse);
  	intervalId = window.setInterval(run, 30);
	}

	function handleRaceEnd(winner) {
		displayWinner(winner);
		betslip.processOutcome(winner);
	}

	function start() {
		startSignal.play();
		window.setTimeout(startRace, 8500);
		raceEvent.hideStartButton();
	}

  function initialiseRaceEvent() {
		
		if (priceList.length != 5) {
			console.log('Program only handles 5 horses per race');
			return;
		}
		
		chances = priceList.map(function(num) {
		  return 1/num;
		});
		
		for (var i = 0; i < chances.length; i++) {
			horsesPositions[i] = 0;
		}

		startRaceButton.onclick = start;

  }

  raceEvent.showStartButton = function() {
  	startRaceButton.classList.add('show');
  };

  raceEvent.hideStartButton = function() {
  	startRaceButton.classList.remove('show');
  };

	raceEvent.init = function() {
		getElements();
		initialiseRaceEvent();
	};

	Object.freeze(raceEvent);

	return raceEvent;

})();

var raceLocalStorage = (function() {

	var raceLocalStorage = {};

	raceLocalStorage.get = function(key, defaultValue) {
		if (localStorage.getItem(key)) {
			return JSON.parse(localStorage.getItem(key));
		} 
		return defaultValue;
	};

	raceLocalStorage.put = function(key, valueObject) {
		localStorage.setItem(key, JSON.stringify(valueObject));
	};

	return raceLocalStorage;

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

	Object.freeze(utils);

	return utils;

})();

window.onload = function() {
	wallet.init(raceLocalStorage);
	raceData.init();
	betslip.init();
	raceEvent.init();
};
