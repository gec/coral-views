angular.module('gec.views.demo').controller('NavigationDemoCtrl', function ($scope, rest) {
  var eventId = 0

  rest.whenGET( '/coral/menus/operator').
    respond([
      {'type': 'item', 'label': 'Loading...', 'id': 'equipment', 'route': '#/someRoute', 'sourceUrl': '/models/1/equipment?depth=1&rootTypes=Root', 'insertLocation': 'REPLACE', 'selected': true, 'children': [
        {'type': 'item', 'label': 'Equipment', 'id': 'equipment', 'route': '/measurements/equipment', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=1', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Solar', 'id': 'solar', 'route': '/measurements/solar', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=PV', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Energy Storage', 'id': 'ceses', 'route': '/ceses/', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=CES', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Generator', 'id': 'generator', 'route': '/measurements/generator', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Generator', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Load', 'id': 'load', 'route': '/measurements/load', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Load', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}
      ]},
      {'type': 'item', 'label': 'Endpoints', 'id': 'endpoints', 'route': '/endpoints', 'selected': false, 'children': []},
      {'type': 'item', 'label': 'Events', 'id': 'events', 'route': '/events', 'selected': false, 'children': []},
      {'type': 'item', 'label': 'Alarms', 'id': 'alarms', 'route': '/alarms', 'selected': false, 'children': []}
    ])


  rest.whenGET( '/models/1/equipment?depth=1&rootTypes=Root').
    respond([
      {'entity': {'name': 'Eugene', 'id': 'a6be3d8e-7862-4ff8-b096-4c87f2939bd0', 'types': ['Root', 'MicroGrid', 'EquipmentGroup']}, 'children': []}
    ])
  rest.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1').
    respond([
      {'name': 'Eugene.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['ESS', 'Imported', 'Equipment', 'CES']},
      {'name': 'Eugene.PCC_Util', 'id': '52f50614-ae5d-4a92-b7c3-4c5ab979d90a', 'types': ['Equipment', 'Breaker']},
      {'name': 'Eugene.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Generator', 'Equipment', 'Imported']},
      {'name': 'Eugene.PCC_Cust', 'id': 'ac674796-686c-41e5-815a-fb897514f5ce', 'types': ['Imported', 'Equipment', 'Breaker']},
      {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Equipment', 'PV', 'Imported']},
      {'name': 'Eugene.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Load', 'DemandResponse', 'Equipment', 'Imported']},
      {'name': 'Eugene.Grid', 'id': 'f42b850f-ceae-4809-9b84-c8e1dd072ca8', 'types': ['Grid', 'Substation', 'Equipment', 'Imported']}
    ])
  rest.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=PV').
    respond([
      {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Imported', 'PV', 'Equipment']}
    ])
  rest.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=CES').
    respond([
      {'name': 'Eugene.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['Imported', 'ESS', 'CES', 'Equipment']}
    ])
  rest.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Generator').
    respond([
      {'name': 'Eugene.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Imported', 'Equipment', 'Generator']}
    ])
  rest.whenGET( '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Load').
    respond([
      {'name': 'Eugene.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Imported', 'Equipment', 'DemandResponse', 'Load']}
    ])



  var init = {
    request: '/coral/menus/operator',
    reply: [
      {'type': 'item', 'label': 'Loading...', 'id': 'equipment', 'route': '#/someRoute', 'sourceUrl': '/models/1/equipment?depth=1&rootTypes=Root', 'insertLocation': 'REPLACE', 'selected': true, 'children': [
        {'type': 'item', 'label': 'Equipment', 'id': 'equipment', 'route': '/measurements/equipment', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=1', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Solar', 'id': 'solar', 'route': '/measurements/solar', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=PV', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Energy Storage', 'id': 'ceses', 'route': '/ceses/', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=CES', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Generator', 'id': 'generator', 'route': '/measurements/generator', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Generator', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []},
        {'type': 'item', 'label': 'Load', 'id': 'load', 'route': '/measurements/load', 'sourceUrl': '/models/1/equipment/$parent/descendants?depth=0&childTypes=Load', 'insertLocation': 'CHILDREN', 'selected': false, 'children': []}
      ]},
      {'type': 'item', 'label': 'Endpoints', 'id': 'endpoints', 'route': '/endpoints', 'selected': false, 'children': []},
      {'type': 'item', 'label': 'Events', 'id': 'events', 'route': '/events', 'selected': false, 'children': []},
      {'type': 'item', 'label': 'Alarms', 'id': 'alarms', 'route': '/alarms', 'selected': false, 'children': []}
    ]
  }

  var descendents = [
    { request: 'models/1/equipment?depth=1&rootTypes=Root',
      response: [
        {'entity': {'name': 'Eugene', 'id': 'a6be3d8e-7862-4ff8-b096-4c87f2939bd0', 'types': ['Root', 'MicroGrid', 'EquipmentGroup']}, 'children': []}
      ]
    },

    {
      request:  '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=1',
      response: [
        {'name': 'Eugene.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['ESS', 'Imported', 'Equipment', 'CES']},
        {'name': 'Eugene.PCC_Util', 'id': '52f50614-ae5d-4a92-b7c3-4c5ab979d90a', 'types': ['Equipment', 'Breaker']},
        {'name': 'Eugene.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Generator', 'Equipment', 'Imported']},
        {'name': 'Eugene.PCC_Cust', 'id': 'ac674796-686c-41e5-815a-fb897514f5ce', 'types': ['Imported', 'Equipment', 'Breaker']},
        {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Equipment', 'PV', 'Imported']},
        {'name': 'Eugene.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Load', 'DemandResponse', 'Equipment', 'Imported']},
        {'name': 'Eugene.Grid', 'id': 'f42b850f-ceae-4809-9b84-c8e1dd072ca8', 'types': ['Grid', 'Substation', 'Equipment', 'Imported']}
      ]
    },
    {
      request: '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=PV',
      response: [
        {'name': 'Eugene.PVUnit', 'id': 'c0a2e729-e5e8-4d54-9b89-8f9d3130d1b9', 'types': ['Imported', 'PV', 'Equipment']}
      ]
    },
    {
      request: '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=CES',
      response: [
        {'name': 'Eugene.ESS', 'id': '4e9a2bca-593d-491f-b8a4-1ed4ae2b6633', 'types': ['Imported', 'ESS', 'CES', 'Equipment']}
      ]
    },
    {
      request: '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Generator',
      response: [
        {'name': 'Eugene.CHP', 'id': '60901f24-910e-422b-bc4b-04d5f8de3964', 'types': ['Imported', 'Equipment', 'Generator']}
      ]
    },
    {
      request: '/models/1/equipment/a6be3d8e-7862-4ff8-b096-4c87f2939bd0/descendants?depth=0&childTypes=Load',
      response: [
        {'name': 'Eugene.Building', 'id': 'ec50507e-50d2-4705-a64c-328d3df48599', 'types': ['Imported', 'Equipment', 'DemandResponse', 'Load']}
      ]
    }
  ]

});