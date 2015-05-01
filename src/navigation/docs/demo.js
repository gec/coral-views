angular.module('greenbus.views.demo').controller('NavigationDemoCtrl', function ($scope, rest) {
  var eventId = 0,
      microgridId1 = 'microgrid-id-1'

  rest.whenGET( '/apps/operator/menus/left').
    respond([
      {
        'class': 'NavigationItemSource',
        'data': { 'label': 'Loading...', 'state': 'microgrids.dashboard', 'url': '/microgrids/$this/dashboard', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment?depth=1&rootTypes=MicroGrid', 'insertLocation': 'REPLACE', 'selected': true, 'children': [
            { 'class': 'NavigationItemSource', 'data': { 'label': 'Equipment', 'state': '.equipments', 'url': '/microgrids/$parent/equipments', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=1', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
            { 'class': 'NavigationItemSource', 'data': { 'label': 'Solar', 'state': '.pvs', 'url': '/microgrids/$parent/pvs', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=PV', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
            { 'class': 'NavigationItemSource', 'data': { 'label': 'Energy Storage', 'state': '.esses', 'url': '/microgrids/$parent/esses/', 'component': 'gb-esses', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=ESS', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
            { 'class': 'NavigationItemSource', 'data': { 'label': 'Generation', 'state': '.generations', 'url': '/microgrids/$parent/generations', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Generation', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}},
            { 'class': 'NavigationItemSource', 'data': { 'label': 'Load', 'state': '.loads', 'url': '/microgrids/$parent/loads', 'component': 'gb-measurements', 'componentType': 'COMPONENT', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Load', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}}
          ]
        }
      },
      { 'class': 'NavigationItem', 'data': { 'label': 'Endpoints', 'state': 'endpoints', 'url': '/endpoints', 'component': 'gb-endpoints', 'componentType': 'COMPONENT', 'selected': false, 'children': []}},
      { 'class': 'NavigationItem', 'data': { 'label': 'Events', 'state': 'events', 'url': '/events', 'component': '<gb-events limit="40"/>', 'componentType': 'TEMPLATE', 'selected': false, 'children': []}},
      { 'class': 'NavigationItem', 'data': { 'label': 'Alarms', 'state': 'alarms', 'url': '/alarms', 'component': '<gb-alarms limit="40"/>', 'componentType': 'TEMPLATE', 'selected': false, 'children': []}}
    ])


  rest.whenGET( '/models/1/equipment?depth=1&rootTypes=MicroGrid').
    respond([
      {'entity': {'name': 'Eugene', 'id': microgridId1, 'types': ['Root', 'MicroGrid', 'EquipmentGroup']}, 'children': []}
    ])
  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=1').
    respond([
      {'name': 'Eugene.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['ESS', 'Imported', 'Equipment']},
      {'name': 'Eugene.PCC_Util', 'id': '52f50614-ae5d-4a92-b7c3-4c5ab979d90a', 'types': ['Equipment', 'Breaker']},
      {'name': 'Eugene.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Generation', 'Equipment', 'Imported']},
      {'name': 'Eugene.PCC_Cust', 'id': 'ac674796-686c-41e5-815a-fb897514f5ce', 'types': ['Imported', 'Equipment', 'Breaker']},
      {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Equipment', 'PV', 'Generation', 'Imported']},
      {'name': 'Eugene.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Load', 'DemandResponse', 'Equipment', 'Imported']},
      {'name': 'Eugene.Grid', 'id': 'f42b850f-ceae-4809-9b84-c8e1dd072ca8', 'types': ['Grid', 'Substation', 'Equipment', 'Imported']}
    ])
  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=PV').
    respond([
      {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Imported', 'PV', 'Equipment']}
    ])
  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=ESS').
    respond([
      {'name': 'Eugene.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['Imported', 'ESS', 'Equipment']}
    ])
  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=Generation').
    respond([
      {'name': 'Eugene.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Imported', 'Equipment', 'Generation']},
      {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Equipment', 'PV', 'Generation', 'Imported']}
    ])
  rest.whenGET( '/models/1/equipment/' + microgridId1 + '/descendants?depth=0&childTypes=Load').
    respond([
      {'name': 'Eugene.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Imported', 'Equipment', 'DemandResponse', 'Load']}
    ])

});