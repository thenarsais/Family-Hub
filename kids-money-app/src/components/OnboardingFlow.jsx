import React, { useState } from 'react';
import { useTutorial } from '../context/TutorialContext';
import '../styles/Tutorial.css';

const SLIDES = {
  young: [
    { icon: '💰', title: 'Welcome to Money World!', body: 'Hi! You\'re about to learn how money works — by actually playing with it. You get $10,000 of pretend money to start your adventure!' },
    { icon: '📈', title: 'Buy Your Favourite Companies!', body: 'You can buy tiny pieces of companies like Pizza Palace and Toy Kingdom. When they do well, your money grows!' },
    { icon: '💸', title: 'Track What You Earn & Spend', body: 'Write down your allowance and what you buy in the Budget tracker. It\'s like a money diary that helps you save for big things!' },
    { icon: '⭐', title: 'Earn Money Stars!', body: 'The smarter you are with money — saving some, owning different companies — the more Money Stars you earn. Try to get all 5!' },
    { icon: '🚀', title: 'Ready? Let\'s Go!', body: 'Start by buying your first stock on the Trading page. It\'s pretend money so have fun, make mistakes, and learn — that\'s the whole point!' },
  ],
  intermediate: [
    { icon: '👋', title: 'Welcome to Stock Trader!', body: 'You have $10,000 in virtual cash to invest in 5 fictional companies. Your goals: grow your portfolio, budget your money, and build a strong credit score.' },
    { icon: '📊', title: 'Trade Stocks', body: 'Buy shares in companies you believe in. Sell them for a profit when prices rise. Prices update every 30 seconds, simulating real market movement.' },
    { icon: '💰', title: 'Budget Your Money', body: 'Track income from allowance, chores, or gifts. Log your spending by category — food, entertainment, savings. See exactly where every dollar goes.' },
    { icon: '🏦', title: 'Build Your Credit Score', body: 'Your credit score shows how responsible you are with money. Keep cash reserves, invest in multiple companies, and stay active to boost your score.' },
    { icon: '🎓', title: 'Learn the Real Stuff', body: 'Use the compound interest calculator to see how money grows over time. Take the money markets quiz. Every skill here translates directly to real-life finance.' },
  ],
  teen: [
    { icon: '📈', title: 'Financial Simulation Platform', body: 'This app mirrors real financial mechanics: portfolio management, FICO-style credit scoring (300–850), budgeting, and compound interest math. Every decision maps to a real-world concept.' },
    { icon: '💼', title: 'Paper Trading With Real Mechanics', body: 'You start with $10,000 in virtual cash. The 5 stocks simulate real market volatility (±2% every 30 seconds). Treat every trade like it\'s real money — because the habits you build here are.' },
    { icon: '💳', title: 'Credit Score Breakdown', body: 'Your score is built from 4 factors: Cash Reserve 25% (= credit utilization), Diversification 25% (= credit mix), Portfolio Growth 35% (= payment history proxy), Trading Activity 15% (= credit history length).' },
    { icon: '📊', title: 'Budget + Compound Interest', body: 'Track real income and expenses. The compound interest calculator shows the Rule of 72 in action: at 7% return, money doubles every ~10 years. Starting at 20 vs. 30 makes a million-dollar difference.' },
    { icon: '🎯', title: '6 Guided Scenarios', body: 'Walk through: Save for a Bike, Buy Your First Stock, Monthly Budget, Build Credit Responsibly, Day Trade Simulation, and Emergency Fund First. Each ends with a real-world financial lesson.' },
  ],
};

function OnboardingFlow({ userAge }) {
  const { onboardingComplete, completeOnboarding } = useTutorial();
  const [step, setStep] = useState(0);

  if (onboardingComplete) return null;

  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;
  const slides = isYoung ? SLIDES.young : isTeen ? SLIDES.teen : SLIDES.intermediate;
  const slide = slides[step];
  const isLast = step === slides.length - 1;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`onboarding-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              onClick={() => setStep(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="onboarding-icon">{slide.icon}</div>
        <h2 className="onboarding-title">{slide.title}</h2>
        <p className="onboarding-body">{slide.body}</p>

        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn-onboard-back" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          {!isLast
            ? <button className="btn-onboard-next" onClick={() => setStep(s => s + 1)}>Next →</button>
            : <button className="btn-onboard-done" onClick={completeOnboarding}>
                {isYoung ? "Let's Go! 🚀" : 'Get Started →'}
              </button>
          }
        </div>

        <button className="btn-onboard-skip" onClick={completeOnboarding}>Skip intro</button>
      </div>
    </div>
  );
}

export default OnboardingFlow;
