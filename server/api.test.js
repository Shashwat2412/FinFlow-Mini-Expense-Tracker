const test = require('node:test');
const assert = require('node:assert');
const app = require('./server');
const fs = require('fs');
const path = require('path');

let server;
let baseUrl;

test.before(async () => {
  // Run on random free port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('POST /api/expenses creates new expense and GET /api/expenses returns it', async () => {
  const payload = {
    amount: 50,
    category: 'Food',
    date: '2026-06-01',
    note: 'Test Pizza'
  };

  const postRes = await fetch(`${baseUrl}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(postRes.status, 201);
  const created = await postRes.json();
  assert.ok(created.id);
  assert.strictEqual(created.amount, 50);
  assert.strictEqual(created.category, 'Food');
  assert.strictEqual(created.date, '2026-06-01');
  assert.strictEqual(created.note, 'Test Pizza');

  // Verify in GET list
  const getRes = await fetch(`${baseUrl}/api/expenses`);
  assert.strictEqual(getRes.status, 200);
  const expenses = await getRes.json();
  const found = expenses.find(e => e.id === created.id);
  assert.ok(found);
  assert.strictEqual(found.amount, 50);
  assert.strictEqual(found.note, 'Test Pizza');
});

test('POST /api/expenses fails with invalid date in the future', async () => {
  const payload = {
    amount: 100,
    category: 'Transport',
    date: '2099-12-31',
    note: 'Future trip'
  };

  const postRes = await fetch(`${baseUrl}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(postRes.status, 400);
  const data = await postRes.json();
  assert.ok(data.errors);
  assert.ok(data.errors.some(err => err.toLowerCase().includes('future')));
});

test('POST /api/expenses fails with negative amount', async () => {
  const payload = {
    amount: -15,
    category: 'Bills',
    date: '2026-06-01'
  };

  const postRes = await fetch(`${baseUrl}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(postRes.status, 400);
  const data = await postRes.json();
  assert.ok(data.errors);
  assert.ok(data.errors.some(err => err.toLowerCase().includes('positive')));
});

test('GET /api/budgets and PUT /api/budgets adjust settings correctly', async () => {
  // Read current budgets
  const getRes = await fetch(`${baseUrl}/api/budgets`);
  assert.strictEqual(getRes.status, 200);
  const budgets = await getRes.json();
  assert.ok(budgets.Food);

  // Update a budget
  const updatePayload = { Food: 750, Transport: 200 };
  const putRes = await fetch(`${baseUrl}/api/budgets`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatePayload)
  });
  assert.strictEqual(putRes.status, 200);
  const updatedBudgets = await putRes.json();
  assert.strictEqual(updatedBudgets.Food, 750);
  assert.strictEqual(updatedBudgets.Transport, 200);
});
