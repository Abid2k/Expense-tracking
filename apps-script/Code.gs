/**
 * Expense Tracker backend — Google Apps Script Web App.
 * Paste this whole file into Extensions > Apps Script for your Google Sheet,
 * then deploy as a Web App (Execute as: Me, Who has access: Anyone).
 * See README.md in the project root for full setup steps.
 */

var EXPENSES_SHEET = 'Expenses';
var SAVINGS_SHEET = 'Savings';
var SETTINGS_SHEET = 'Settings';

function getSpreadsheet_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getOrCreateSheet_(name, headers) {
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function ensureSheets_() {
  getOrCreateSheet_(EXPENSES_SHEET, ['ID', 'Date', 'Category', 'Amount', 'Note']);
  getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'Date', 'Amount', 'Note']);
  var settings = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var data = settings.getDataRange().getValues();
  var hasGoalName = false;
  var hasGoalAmount = false;
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === 'GoalName') hasGoalName = true;
    if (data[i][0] === 'GoalAmount') hasGoalAmount = true;
  }
  if (!hasGoalName) settings.appendRow(['GoalName', 'My Savings Goal']);
  if (!hasGoalAmount) settings.appendRow(['GoalAmount', 0]);
}

function sheetToObjects_(sheet) {
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (row.join('') === '') continue;
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    obj._row = i + 1;
    rows.push(obj);
  }
  return rows;
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  ensureSheets_();
  var action = e.parameter.action || 'getAll';

  if (action === 'getExpenses') {
    return jsonOutput_({ ok: true, expenses: sheetToObjects_(getOrCreateSheet_(EXPENSES_SHEET, [])) });
  }
  if (action === 'getSavings') {
    return jsonOutput_({ ok: true, savings: sheetToObjects_(getOrCreateSheet_(SAVINGS_SHEET, [])) });
  }
  if (action === 'getSettings') {
    return jsonOutput_({ ok: true, settings: getSettings_() });
  }

  return jsonOutput_({
    ok: true,
    expenses: sheetToObjects_(getOrCreateSheet_(EXPENSES_SHEET, [])),
    savings: sheetToObjects_(getOrCreateSheet_(SAVINGS_SHEET, [])),
    settings: getSettings_()
  });
}

function getSettings_() {
  var sheet = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var values = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < values.length; i++) {
    settings[values[i][0]] = values[i][1];
  }
  return settings;
}

function doPost(e) {
  ensureSheets_();
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonOutput_({ ok: false, error: 'Invalid JSON body' });
  }

  var action = body.action;

  try {
    if (action === 'addExpense') return addExpense_(body);
    if (action === 'deleteExpense') return deleteRowById_(EXPENSES_SHEET, body.id);
    if (action === 'addSaving') return addSaving_(body);
    if (action === 'deleteSaving') return deleteRowById_(SAVINGS_SHEET, body.id);
    if (action === 'setGoal') return setGoal_(body);
    return jsonOutput_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return jsonOutput_({ ok: false, error: String(err) });
  }
}

function addExpense_(body) {
  var sheet = getOrCreateSheet_(EXPENSES_SHEET, ['ID', 'Date', 'Category', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.date, body.category, Number(body.amount), body.note || '']);
  return jsonOutput_({ ok: true, id: id });
}

function addSaving_(body) {
  var sheet = getOrCreateSheet_(SAVINGS_SHEET, ['ID', 'Date', 'Amount', 'Note']);
  var id = Utilities.getUuid();
  sheet.appendRow([id, body.date, Number(body.amount), body.note || '']);
  return jsonOutput_({ ok: true, id: id });
}

function setGoal_(body) {
  var sheet = getOrCreateSheet_(SETTINGS_SHEET, ['Key', 'Value']);
  var values = sheet.getDataRange().getValues();
  var goalNameRow = -1;
  var goalAmountRow = -1;
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === 'GoalName') goalNameRow = i + 1;
    if (values[i][0] === 'GoalAmount') goalAmountRow = i + 1;
  }
  if (typeof body.goalName !== 'undefined') {
    if (goalNameRow > 0) sheet.getRange(goalNameRow, 2).setValue(body.goalName);
    else sheet.appendRow(['GoalName', body.goalName]);
  }
  if (typeof body.goalAmount !== 'undefined') {
    if (goalAmountRow > 0) sheet.getRange(goalAmountRow, 2).setValue(Number(body.goalAmount));
    else sheet.appendRow(['GoalAmount', Number(body.goalAmount)]);
  }
  return jsonOutput_({ ok: true });
}

function deleteRowById_(sheetName, id) {
  var sheet = getOrCreateSheet_(sheetName, []);
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (values[i][0] === id) {
      sheet.deleteRow(i + 1);
      return jsonOutput_({ ok: true });
    }
  }
  return jsonOutput_({ ok: false, error: 'ID not found' });
}
