// jasmine matcher for expecting an element to have a css class
// https://github.com/angular/angular.js/blob/master/test/matchers.js

var customMatchers = {
  toHaveClass: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected) {
        var result = {};
        result.pass = actual.hasClass(expected)
        if (result.pass) {
          result.message = 'Expected element with classes "' + actual[0].className + '" not to have class "' + expected + '"';
        } else {
          result.message = 'Expected element with classes "' + actual[0].className + '" to have class "' + expected + '"';
        }
        return result;
      }
    }
  },
  toBeHidden: function(util, customEqualityTesters) {
    return {
      compare: function(actual, expected) {
        var result = {};
        var element = angular.element(actual);
        results.pass = element.hasClass('ng-hide') || element.css('display') == 'none'
        if (result.pass) {
          result.message = 'Expected ' + actual + ' to be have "class:ng-hide" or "display:none" and it did';
        } else {
          result.message = 'Expected ' + actual + ' to be have "class:ng-hide" or "display:none"';
        }
        return result;
      }
    }
  }
}


beforeEach(function() {
  jasmine.addMatchers(customMatchers);
});

