import React from 'react';
import LessonCard from '../components/LessonCard';
import QuizWidget from '../components/QuizWidget';
import '../styles/Lessons.css';

const LESSONS = {
  5: [
    { id: 1, title: '💰 What is Money?', icon: '💵', content: 'Money is how we buy things we need and want. You can earn money by doing chores or getting allowance!' },
    { id: 2, title: '🏪 Saving vs. Spending', icon: '🏦', content: 'Saving means keeping your money. Spending means using it to buy things. Smart savers buy things they really need!' },
    { id: 3, title: '💎 Wants vs. Needs', icon: '🎁', content: "Needs are things you must have (food, home, clothes). Wants are things you'd like to have (toys, games, treats)!" },
  ],
  8: [
    { id: 1, title: '💰 What is Money?', icon: '💵', content: 'Money is a medium of exchange that lets us trade goods and services. Different countries use different currencies.' },
    { id: 2, title: '📊 What Are Stocks?', icon: '📈', content: 'A stock is a small piece of ownership in a company. When you buy stock, you own a tiny part of that business!' },
    { id: 3, title: '🏦 How Banks Work', icon: '🏦', content: 'Banks store your money and help it grow. They pay you interest, which is free money for saving!' },
    { id: 4, title: '💹 Buy Low, Sell High', icon: '📊', content: 'The goal of stock trading is to buy stocks when the price is low and sell them when the price goes up!' },
  ],
  13: [
    { id: 1, title: 'Stock Fundamentals', icon: '📈', content: 'Stocks represent fractional ownership in public companies. Understanding market capitalization, P/E ratios, and earnings is key to investing.' },
    { id: 2, title: 'Diversification & Risk', icon: '⚖️', content: "Don't put all your money in one stock. Spread investments across different sectors to reduce risk." },
    { id: 3, title: 'Market Trends & Analysis', icon: '📊', content: 'Learn about bullish vs. bearish markets, support/resistance levels, and how to read stock charts.' },
    { id: 4, title: 'Long-term vs. Day Trading', icon: '⏰', content: 'Buy-and-hold investing grows wealth over decades. Day trading is risky and requires deep market knowledge.' },
    { id: 5, title: 'Compound Interest & Wealth', icon: '🌟', content: 'Einstein called compound interest the 8th wonder of the world. Time + consistent investing = exponential growth.' },
  ],
};

// Maps each age tier to the most relevant quiz categories and their labels,
// ordered by how directly they connect to the lesson content shown.
const LESSON_QUIZZES = {
  5: [
    { categoryId: 'savings', title: 'Quiz: Saving & Interest', startIndex: 0 },
    { categoryId: 'budget',  title: 'Quiz: Budgeting Basics',  startIndex: 0 },
  ],
  8: [
    { categoryId: 'trading', title: 'Quiz: Stocks & Trading',  startIndex: 0 },
    { categoryId: 'savings', title: 'Quiz: Saving & Interest', startIndex: 3 },
  ],
  13: [
    { categoryId: 'trading',  title: 'Quiz: Stock Fundamentals',     startIndex: 3 },
    { categoryId: 'markets',  title: 'Quiz: Money Markets',          startIndex: 3 },
    { categoryId: 'credit',   title: 'Quiz: Credit & Borrowing',     startIndex: 3 },
  ],
};

function Lessons({ userAge }) {
  const ageTier = Math.min(Math.max(Math.floor(userAge / 4) * 4, 5), 13);
  const lessons = LESSONS[ageTier] || LESSONS[5];
  const quizzes = LESSON_QUIZZES[ageTier] || LESSON_QUIZZES[5];
  const isYoung = userAge < 8;
  const isTeen  = userAge >= 13;

  return (
    <div className="lessons-page">
      <h1>{isYoung ? '🎓 Money Lessons' : isTeen ? '📖 Advanced Investing' : '📚 Stock Basics'}</h1>

      <div className="lessons-grid">
        {lessons.map(lesson => (
          <LessonCard key={lesson.id} lesson={lesson} userAge={userAge} />
        ))}
      </div>

      {/* Check-your-understanding quizzes, one per relevant topic */}
      <div className="lessons-quiz-section">
        <h2>{isYoung ? '🎯 Test What You Learned!' : 'Check Your Understanding'}</h2>
        <p className="lessons-quiz-subtitle">
          {isYoung
            ? 'Answer some quick questions about what you just read!'
            : 'Score below 75%? We\'ll point you to exactly the right resource to review.'}
        </p>
        <div className="lessons-quiz-list">
          {quizzes.map((qz, i) => (
            <QuizWidget
              key={i}
              categoryId={qz.categoryId}
              userAge={userAge}
              title={qz.title}
              startIndex={qz.startIndex}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Lessons;
