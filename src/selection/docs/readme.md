## gb-select-all
Three state checkbox for selecting multiple items. Each object in the model array is annotated with a `checked`
property. The parent template needs to call `selectItem` when a checkbox is clicked. This directive calls
`selectAllChanged(state)` when the selectAll state has changed.

### Attributes
#### model
The array of items that will be selected. This directive will add a `checked` property to each object.

#### notify
Called when the selectAll state has changed. Ex: notify="selectAllChanged(state)"

#### select-item
Name of function injected on parent controller. It needs to be called by each row in the parent's template.
Defaults to `selectItem`. See **ng-click="selectItem(item)"** in following example. The parameter for `selectItem()`
needs to be the variable in the ng-repeat.

    <div class="gb-checkbox-container" ng-click="selectItem(item)" role="checkbox" aria-labelledby=":2f" dir="ltr" aria-checked="true" tabindex="-1">
        <i ng-class="item.checked | selectItemClass"></i>
    </div> 

### Filters
#### selectItemClass
Returns the checkbox icon class for the given checkbox state. Example:

    <i ng-class="item.checked | selectItemClass"></i>

### Dependencies
* greenbus-views-&lt;version&gt;.css
* Font Awesome for checkboxes.
