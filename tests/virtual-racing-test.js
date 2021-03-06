"use strict";

var testSuite = (function() {

  var testSuite = {};

  // wallet
  testSuite.wallet = function(testWallet) {
    var balanceContainerElement = document.querySelector('.wallet-balance');

    var initialTestBalance = null;

    // test init
    testWallet.init(testLocalStorage);

    assertEquals(testWallet.returnBalance(), 390, 'Checking initial wallet after init');
    assertEquals(balanceContainerElement.innerHTML, '390 GC', 'Check display wallet after init');

    // test add bet
    testWallet.updateBalance(150);

    assertEquals(testWallet.returnBalance(), 240, 'Checking initial wallet after update');
    assertEquals(balanceContainerElement.innerHTML, '240 GC', 'Check display wallet after update');
  };

  testSuite.betslip = function(testBetslip) {
    console.log("Testing the betslip. First clearing it.");
    testBetslip.clear();

    var testSelection = betslip.createSelection("r1h2", 2, "Test Horse", 3.5);
    testSelection.value = 11;
    testSelection.setPotentialWinAmount();

    assertEquals(testSelection.potentialWin, 38.5, 'Check potential win calculation');

    // to avoid null when trying to remove class from button
    document.getElementById('button-r1h2').classList.add('disabled');

    assertTrue(document.getElementById('button-r1h2').className.indexOf('disabled') !== -1,'Button is disabled before calling clear bets');
    testBetslip.clear();
    assertTrue(document.getElementById('button-r1h2').className.indexOf('disabled') === -1,'Button has been enabled after removing bet from betslip');
  }

  testSuite.run = function() {
    testSuite.wallet(wallet);
    testSuite.betslip(betslip);
  };

  function assertEquals(actualValue, expectedValue, message) {
    if (actualValue === expectedValue) {
      console.log('%cOK: %s', 'background: #eee; color: #33dd55', message);
    } else {
      console.log('%cFAIL: %s', 'background: #eee; color: #dd5555', message);
      console.log("Actual: " + actualValue);
      console.log("Expected: " + expectedValue);
    }
  }

  function assertTrue(value, message) {
    if (value === true) {
      console.log('%cOK: %s', 'background: #eee; color: #33dd55', message);
    } else {
      console.log('%cFAIL: %s', 'background: #eee; color: #dd5555', message);
    }
  }
  return testSuite;
})();

// mock of raceLocalStorage
var testLocalStorage = (function() {

  var testLocalStorage = {};

  var testValues = {};

  testLocalStorage.get = function(key, defaultValue) {
    if (testValues[key]) {
      return testValues[key];
    } 
    return defaultValue;
  };

  testLocalStorage.put = function(key, valueObject) {
    testValues[key] = valueObject;
  };

  return testLocalStorage;

})();
