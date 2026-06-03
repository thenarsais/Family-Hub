import React, { useState } from 'react';
import { useBudget, INCOME_TYPES, EXPENSE_CATEGORIES } from '../context/BudgetContext';
import '../styles/Budget.css';

function Budget({ userAge }) {
  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;
  const {
    budget, addIncome, addExpense, setMonthlyGoal,
    getTotalIncome, getTotalExpenses, getBalance, getExpenseByCategory,
  } = useBudget();

  const [tab, setTab] = useState('overview');
  const [incomeForm, setIncomeForm] = useState({ type: 'allowance', amount: '', description: '' });
  const [expenseForm, setExpenseForm] = useState({ category: 'food', amount: '', description: '' });
  const [message, setMessage] = useState('');

  const flash = msg => { setMessage(msg); setTimeout(() => setMessage(''), 3000); };

  const handleAddIncome = e => {
    e.preventDefault();
    if (!incomeForm.amount || parseFloat(incomeForm.amount) <= 0) return;
    addIncome(incomeForm.type, incomeForm.amount, incomeForm.description);
    setIncomeForm(f => ({ ...f, amount: '', description: '' }));
    flash(isYoung ? '🎉 Money added!' : 'Income recorded!');
  };

  const handleAddExpense = e => {
    e.preventDefault();
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) return;
    addExpense(expenseForm.category, expenseForm.amount, expenseForm.description);
    setExpenseForm(f => ({ ...f, amount: '', description: '' }));
    flash(isYoung ? '💸 Spending recorded!' : 'Expense recorded!');
  };

  const totalIncome = getTotalIncome();
  const totalExpenses = getTotalExpenses();
  const balance = getBalance();
  const byCategory = getExpenseByCategory();

  const availableIncomeTypes = isYoung ? INCOME_TYPES.filter(t => t.id !== 'job') : INCOME_TYPES;
  const tabs = ['overview', 'income', 'expenses', ...(isTeen ? ['goals'] : [])];

  const allActivity = [
    ...budget.income.map(i => ({ ...i, kind: 'income' })),
    ...budget.expenses.map(e => ({ ...e, kind: 'expense' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

  return (
    <div className="budget-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '💰 My Money Tracker!' : 'Budget & Income Tracker'}
      </h1>

      {message && <div className="message-banner">{message}</div>}

      <div className="budget-summary">
        <div className="summary-card summary-card--income">
          <span className="summary-icon">📥</span>
          <div>
            <p className="summary-label">{isYoung ? 'Money Earned' : 'Total Income'}</p>
            <p className="summary-amount">${totalIncome.toFixed(2)}</p>
          </div>
        </div>
        <div className="summary-card summary-card--expense">
          <span className="summary-icon">📤</span>
          <div>
            <p className="summary-label">{isYoung ? 'Money Spent' : 'Total Expenses'}</p>
            <p className="summary-amount">${totalExpenses.toFixed(2)}</p>
          </div>
        </div>
        <div className={`summary-card ${balance >= 0 ? 'summary-card--positive' : 'summary-card--negative'}`}>
          <span className="summary-icon">{balance >= 0 ? '😊' : '😟'}</span>
          <div>
            <p className="summary-label">{isYoung ? 'Left Over' : 'Balance'}</p>
            <p className="summary-amount">${balance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="budget-tabs">
        {tabs.map(t => (
          <button key={t} className={`budget-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' && (isYoung ? '📊 Summary' : 'Overview')}
            {t === 'income' && (isYoung ? '💰 Earn' : 'Add Income')}
            {t === 'expenses' && (isYoung ? '💸 Spend' : 'Add Expense')}
            {t === 'goals' && 'Budget Goals'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="overview-section">
          <h2>{isYoung ? '📊 Where Did Your Money Go?' : 'Spending by Category'}</h2>
          <div className="category-bars">
            {EXPENSE_CATEGORIES.map(cat => {
              const spent = byCategory[cat.id] || 0;
              const goal = budget.monthlyGoals[cat.id] || 1;
              const pct = Math.min((spent / goal) * 100, 100);
              const over = spent > goal;
              return (
                <div key={cat.id} className="category-bar-row">
                  <span className="category-icon">{cat.icon}</span>
                  <div className="category-bar-info">
                    <div className="category-bar-header">
                      <span className="category-bar-label">{cat.label}</span>
                      <span className="category-bar-amount">
                        ${spent.toFixed(0)}{isTeen && ` / $${goal}`}
                        {over && isTeen && <span className="over-budget"> ⚠ over</span>}
                      </span>
                    </div>
                    <div className="category-bar-bg">
                      <div className="category-bar-fill" style={{ width: `${pct}%`, background: over ? '#f44336' : '#4caf50' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {allActivity.length === 0 ? (
            <div className="empty-state">
              <p>{isYoung ? '🌟 Add your first money! Tap "Earn" above!' : 'Log your first income or expense to get started.'}</p>
            </div>
          ) : (
            <div className="recent-transactions">
              <h2>{isYoung ? '📝 Recent' : 'Recent Transactions'}</h2>
              <div className="transaction-list">
                {allActivity.map(item => {
                  const info = item.kind === 'income'
                    ? INCOME_TYPES.find(t => t.id === item.type)
                    : EXPENSE_CATEGORIES.find(c => c.id === item.category);
                  return (
                    <div key={item.id} className={`transaction-row ${item.kind}`}>
                      <span>{info?.icon} {item.description}</span>
                      <span className={item.kind === 'income' ? 'amount-in' : 'amount-out'}>
                        {item.kind === 'income' ? '+' : '-'}${item.amount.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'income' && (
        <div className="form-section">
          <h2>{isYoung ? '💰 Add Money You Earned!' : 'Log Income'}</h2>
          <form onSubmit={handleAddIncome} className="budget-form">
            <div className="form-group">
              <label>{isYoung ? 'How did you earn it?' : 'Income Source'}</label>
              <div className="type-grid">
                {availableIncomeTypes.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    className={`type-btn ${incomeForm.type === type.id ? 'selected' : ''}`}
                    onClick={() => setIncomeForm(f => ({ ...f, type: type.id }))}
                  >
                    <span className="type-icon">{type.icon}</span>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>{isYoung ? 'How much? 💵' : 'Amount ($)'}</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={incomeForm.amount}
                onChange={e => setIncomeForm(f => ({ ...f, amount: e.target.value }))}
                className={isYoung ? 'large-input' : ''} required />
            </div>
            <div className="form-group">
              <label>{isYoung ? 'What for? (optional)' : 'Note (optional)'}</label>
              <input type="text" placeholder={isYoung ? 'e.g. Cleaned my room' : 'e.g. Weekly allowance'}
                value={incomeForm.description}
                onChange={e => setIncomeForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button type="submit" className="btn-submit btn-submit--income">
              {isYoung ? '➕ Add Money!' : 'Add Income'}
            </button>
          </form>

          {budget.income.length > 0 && (
            <div className="recent-list">
              <h3>{isYoung ? 'Money I Earned 🎉' : 'Income History'}</h3>
              {budget.income.slice().reverse().slice(0, 6).map(item => {
                const type = INCOME_TYPES.find(t => t.id === item.type);
                return (
                  <div key={item.id} className="list-row">
                    <span>{type?.icon} {item.description}</span>
                    <span className="amount-in">+${item.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'expenses' && (
        <div className="form-section">
          <h2>{isYoung ? '🛒 Add Money You Spent!' : 'Log Expense'}</h2>
          <form onSubmit={handleAddExpense} className="budget-form">
            <div className="form-group">
              <label>{isYoung ? 'What did you buy?' : 'Category'}</label>
              <div className="type-grid">
                {EXPENSE_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`type-btn ${expenseForm.category === cat.id ? 'selected' : ''}`}
                    onClick={() => setExpenseForm(f => ({ ...f, category: cat.id }))}
                  >
                    <span className="type-icon">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>{isYoung ? 'How much did it cost? 💵' : 'Amount ($)'}</label>
              <input type="number" min="0.01" step="0.01" placeholder="0.00"
                value={expenseForm.amount}
                onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                className={isYoung ? 'large-input' : ''} required />
            </div>
            <div className="form-group">
              <label>{isYoung ? 'What was it? (optional)' : 'Note (optional)'}</label>
              <input type="text" placeholder={isYoung ? 'e.g. Ice cream 🍦' : 'e.g. Movie ticket'}
                value={expenseForm.description}
                onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <button type="submit" className="btn-submit btn-submit--expense">
              {isYoung ? '➕ Add Spending!' : 'Add Expense'}
            </button>
          </form>

          {budget.expenses.length > 0 && (
            <div className="recent-list">
              <h3>{isYoung ? 'Things I Bought 🛍️' : 'Expense History'}</h3>
              {budget.expenses.slice().reverse().slice(0, 6).map(item => {
                const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category);
                return (
                  <div key={item.id} className="list-row">
                    <span>{cat?.icon} {item.description}</span>
                    <span className="amount-out">-${item.amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'goals' && (
        <div className="goals-section">
          <h2>Monthly Budget Goals</h2>
          <p className="goals-description">Set your target spending per category each month.</p>
          <div className="goals-grid">
            {EXPENSE_CATEGORIES.map(cat => (
              <div key={cat.id} className="goal-item">
                <label>{cat.icon} {cat.label}</label>
                <div className="goal-input-row">
                  <span>$</span>
                  <input type="number" min="0" value={budget.monthlyGoals[cat.id] || 0}
                    onChange={e => setMonthlyGoal(cat.id, e.target.value)} />
                  <span className="goal-spent">spent: ${(byCategory[cat.id] || 0).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Budget;
