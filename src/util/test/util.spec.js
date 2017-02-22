describe('greenbus-util', function () {

  beforeEach(module('greenbus.views.util'));


  describe('toFixed', function() {

    it('should handle numbers', inject(function (toFixedFilter) {
      expect(toFixedFilter('9', 1)).toBe('9.0')
      expect(toFixedFilter('9', 0)).toBe('9')
      expect(toFixedFilter(99.99, 0)).toBe('100')
      expect(toFixedFilter(99.99)).toBe(99.99)
      expect(toFixedFilter(9.042)).toBe(9.042)
      expect(toFixedFilter('9..9', 0)).toBe('9')
    }));

    it('should return NaN when not a number', inject(function (toFixedFilter) {
      expect(toFixedFilter('abc', 0)).toBe('NaN')
      expect(toFixedFilter(',9', 0)).toBe('NaN')
    }));

  })

  describe('toFixedOrString', function() {

    it('should handle numbers', inject(function (toFixedOrStringFilter) {
      expect(toFixedOrStringFilter('9', 1)).toBe('9.0')
      expect(toFixedOrStringFilter('9', 0)).toBe('9')
      expect(toFixedOrStringFilter(99.99, 0)).toBe('100')
      expect(toFixedOrStringFilter(9.042)).toBe(9.042)
    }));

    it('should handle strings', inject(function (toFixedOrStringFilter) {
      expect(toFixedOrStringFilter('9.001')).toBe('9.001')
      expect(toFixedOrStringFilter('abc', 0)).toBe('abc')
    }));

  })

});

