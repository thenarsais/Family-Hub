import React, { createContext, useContext, useState, useEffect } from 'react';

const BudgetContext = createContext();

export const INCOME_TYPES = [
  { id: 'allowance', label: 'Allowance', icon: '💰' },
  { id: 'chores', label: 'Chores', icon: '🧹' },
  { id: 'job', label: 'Part-time Job', icon: '💼' },
  { id: 'gift', label: 'Gift', icon: '🎁' },
  { id: 'other', label: 'Other Income', icon: '✨' },
];

export const EXPENSE_CATEGORIES = [
  { id: 'food', label: 'Food & Snacks', icon: '🍕' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎮' },
  { id: 'clothes', label: 'Clothes', icon: '👕' },
  { id: 'savings', label: 'Savings Goal', icon: '🏦' },
  { id: 'education', label: 'Education', icon: '📚' },
  { id: 'other', label: 'Other', icon: '💸' },
];

export function BudgetProvider({ children }) {
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('budget');
    return saved ? JSON.parse(saved) : {
      income: [],
      expenses: [],
      monthlyGoals: { food: 50, entertainment: 30, clothes: 40, savings: 100, education: 20, other: 30 },
    };
  });

  useEffect(() => {
    localStorage.setItem('budget', JSON.stringify(budget));
  }, [budget]);

  const addIncome = (type, amount, description) => {
    setBudget(prev => ({
      ...prev,
      income: [...prev.income, {
        id: Date.now(),
        type,
        amount: parseFloat(amount),
        description: description || type,
        date: new Date().toISOString(),
      }],
    }));
  };

  const addExpense = (category, amount, description) => {
    setBudget(prev => ({
      ...prev,
      expenses: [...prev.expenses, {
        id: Date.now(),
        category,
        amount: parseFloat(amount),
        description: description || category,
        date: new Date().toISOString(),
      }],
    }));
  };

  const setMonthlyGoal = (category, amount) => {
    setBudget(prev => ({
      ...prev,
      monthlyGoals: { ...prev.monthlyGoals, [category]: parseFloat(amount) || 0 },
    }));
  };

  const getTotalIncome = () => budget.income.reduce((sum, e) => sum + e.amount, 0);
  const getTotalExpenses = () => budget.expenses.reduce((sum, e) => sum + e.amount, 0);
  const getBalance = () => getTotalIncome() - getTotalExpenses();

  const getExpenseByCategory = () => {
    const totals = {};
    EXPENSE_CATEGORIES.forEach(c => { totals[c.id] = 0; });
    budget.expenses.forEach(e => {
      totals[e.category] = (totals[e.category] || 0) + e.amount;
    });
    return totals;
  };

  return (
    <BudgetContext.Provider value={{
      budget, addIncome, addExpense, setMonthlyGoal,
      getTotalIncome, getTotalExpenses, getBalance, getExpenseByCategory,
    }}>
      {children}
    </BudgetContext.Provider>
  );
}

export function useBudget() {
  const ctx = useContext(BudgetContext);
  if (!ctx) throw new Error('useBudget must be used within BudgetProvider');
  return ctx;
}
