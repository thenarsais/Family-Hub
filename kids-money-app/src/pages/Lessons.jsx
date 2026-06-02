import React, { useState } from 'react';
import LessonCard from '../components/LessonCard';
import '../styles/Lessons.css';

const LESSONS = {
  5: [
    {
      id: 1,
      title: '💰 What is Money?',
      content: 'Money is how we buy things we need and want. You can earn money by doing chores or getting allowance!',
      icon: '💵',
    },
    {
      id: 2,
      title: '🏪 Saving vs. Spending',
      content: 'Saving means keeping your money. Spending means using it to buy things. Smart savers buy things they really need!',
      icon: '🏦',
    },
    {
      id: 3,
      title: '💎 Wants vs. Needs',
      content: 'Needs are things you must have (food, home, clothes). Wants are things you\'d like to have (toys, games, treats)!',
      icon: '🎁',
    },
  ],
  8: [
    {
      id: 1,
      title: '💰 What is Money?',
      content: 'Money is a medium of exchange that lets us trade goods and services. Different countries use different currencies.',
      icon: '💵',
    },
    {
      id: 2,
      title: '📊 What Are Stocks?',
      content: 'A stock is a small piece of ownership in a company. When you buy stock, you own a tiny part of that business!',
      icon: '📈',
    },
    {
      id: 3,
      title: '🏦 How Banks Work',
      content: 'Banks store your money and help it grow. They pay you interest, which is free money for saving!',
      icon: '🏦',
    },
    {
      id: 4,
      title: '💹 Buy Low, Sell High',
      content: 'The goal of stock trading is to buy stocks when the price is low and sell them when the price goes up!',
      icon: '📊',
    },
  ],
  13: [
    {
      id: 1,
      title: 'Stock Fundamentals',
      content: 'Stocks represent fractional ownership in public companies. Understanding market capitalization, P/E ratios, and earnings is key to investing.',
      icon: '📈',
    },
    {
      id: 2,
      title: 'Diversification & Risk',
      content: 'Don\'t put all your money in one stock. Spread investments across different sectors to reduce risk.',
      icon: '⚖️',
    },
    {
      id: 3,
      title: 'Market Trends & Analysis',
      content: 'Learn about bullish vs. bearish markets, support/resistance levels, and how to read stock charts.',
      icon: '📊',
    },
    {
      id: 4,
      title: 'Long-term vs. Day Trading',
      content: 'Buy-and-hold investing grows wealth over decades. Day trading is risky and requires deep market knowledge.',
      icon: '⏰',
    },
    {
      id: 5,
      title: 'Compound Interest & Wealth',
      content: 'Einstein called compound interest the 8th wonder of the world. Time + consistent investing = exponential growth.',
      icon: '🌟',
    },
  ],
};

function Lessons({ userAge }) {
  const age = Math.min(Math.max(Math.floor(userAge / 4) * 4, 5), 13);
  const lessons = LESSONS[age] || LESSONS[5];

  return (
    <div className="lessons-page">
      <h1>{age < 8 ? '🎓 Money Lessons' : age < 12 ? '📚 Stock Basics' : '📖 Advanced Investing'}</h1>

      <div className="lessons-grid">
        {lessons.map(lesson => (
          <LessonCard key={lesson.id} lesson={lesson} userAge={userAge} />
        ))}
      </div>
    </div>
  );
}

export default Lessons;
