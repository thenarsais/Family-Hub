import React, { useState } from 'react';
import '../styles/Quiz.css';

const QUESTIONS = {
  young: [
    {
      q: 'What is interest?',
      options: ['A type of toy', 'Free money you earn for saving', 'Money you owe', 'A game'],
      answer: 1,
      explanation: 'Interest is bonus money the bank gives you as a reward for keeping your savings there!',
    },
    {
      q: 'Which is smarter with your allowance?',
      options: ['Spend it all right away', 'Save some of it', 'Lose it', 'Give it all away'],
      answer: 1,
      explanation: 'Saving some of your money means you\'ll have it for important things later — and it grows!',
    },
    {
      q: 'What does a bank do with your money?',
      options: ['Throws it away', 'Keeps it in a pile forever', 'Lends it to others and pays you interest', 'Spends it on toys'],
      answer: 2,
      explanation: 'Banks lend your money to other people and share some of that profit with you as interest!',
    },
    {
      q: 'If you save $10 and earn 10% interest, how much do you have?',
      options: ['$10', '$11', '$20', '$9'],
      answer: 1,
      explanation: '10% of $10 = $1. So $10 + $1 = $11! That\'s how interest works!',
    },
    {
      q: 'Where is the SAFEST place to keep your money?',
      options: ['Under your pillow', 'In a bank', 'In your backpack', 'In a jar outside'],
      answer: 1,
      explanation: 'Banks protect your money and even grow it with interest. The government insures bank accounts too!',
    },
  ],
  intermediate: [
    {
      q: 'What is a money market account?',
      options: [
        'A place to buy stocks',
        'A high-interest savings account for larger balances',
        'A type of insurance',
        'A loan from a bank',
      ],
      answer: 1,
      explanation: 'Money market accounts typically pay higher interest than regular savings accounts but may require a higher minimum balance.',
    },
    {
      q: 'What does "liquid" mean when talking about money?',
      options: [
        'Money that gets wet',
        'Money you can access quickly without penalty',
        'Money invested in stocks',
        'Money you owe to someone',
      ],
      answer: 1,
      explanation: 'Liquid assets can be converted to cash quickly. A savings account is liquid; money tied up in real estate is not.',
    },
    {
      q: 'Compound interest is different from simple interest because:',
      options: [
        'It\'s always lower',
        'It\'s harder to calculate',
        'Your interest earns interest too, snowballing over time',
        'It only applies to loans',
      ],
      answer: 2,
      explanation: 'With compound interest, the interest you earn gets added to your balance, and then that total earns even more interest!',
    },
    {
      q: 'What is a Certificate of Deposit (CD)?',
      options: [
        'A music disc',
        'A savings account where you lock money for a fixed time to earn more interest',
        'A stock certificate',
        'A type of loan',
      ],
      answer: 1,
      explanation: 'CDs pay higher interest because you agree to leave your money untouched for a set period (3 months to 5 years).',
    },
    {
      q: 'Which typically earns the MOST interest?',
      options: [
        'Money under a mattress',
        'Regular checking account',
        'High-yield savings or money market account',
        'Gift cards',
      ],
      answer: 2,
      explanation: 'High-yield savings and money market accounts earn significantly more — sometimes 10–20× more than a standard checking account!',
    },
  ],
  teen: [
    {
      q: 'What is a money market fund (not account)?',
      options: [
        'A savings account at a bank',
        'A mutual fund investing in short-term, low-risk securities like T-bills',
        'A stock index fund',
        'A long-term government bond',
      ],
      answer: 1,
      explanation: 'Money market funds invest in short-term, highly liquid instruments like Treasury bills. They\'re low-risk but NOT FDIC insured, unlike money market accounts.',
    },
    {
      q: 'What are Treasury bills (T-bills)?',
      options: [
        'Stocks issued by the government',
        'Short-term US government debt maturing in under one year',
        'Long-term savings bonds',
        'Bank certificates of deposit',
      ],
      answer: 1,
      explanation: 'T-bills are short-term government securities (4, 8, 13, 26, or 52-week maturities). Backed by the US government, they\'re the closest thing to a risk-free investment.',
    },
    {
      q: 'What does APY mean and how does it differ from APR?',
      options: [
        'APY = Annual Percentage Yield; it includes compounding effects, so it\'s higher than APR',
        'APY = Average Profit per Year; the same as APR',
        'APY and APR are interchangeable terms',
        'APY = Asset Protection Yield; unrelated to savings',
      ],
      answer: 0,
      explanation: 'APY accounts for compounding; APR doesn\'t. A 5% APR compounded monthly yields an APY of ~5.12%. Always compare APY when choosing savings products.',
    },
    {
      q: 'An inverted yield curve (short-term rates > long-term rates) typically signals:',
      options: [
        'A booming economy',
        'Rising stock prices',
        'A potential upcoming recession',
        'Lower inflation ahead',
      ],
      answer: 2,
      explanation: 'An inverted yield curve has historically preceded recessions. It signals that investors expect rates to fall in the future, meaning they anticipate an economic slowdown.',
    },
    {
      q: 'Credit utilization affects your credit score most when it is:',
      options: [
        'Above 30% of your credit limit',
        'Exactly 50% of your credit limit',
        'Below 10% of your credit limit',
        'Credit utilization doesn\'t affect credit scores',
      ],
      answer: 0,
      explanation: 'Credit utilization above 30% starts to hurt your score. Experts recommend keeping it under 10% for the best impact. This mirrors our portfolio\'s "Cash Reserve" factor.',
    },
  ],
};

function Quiz({ userAge }) {
  const isYoung = userAge < 8;
  const isTeen = userAge >= 13;
  const questionSet = isTeen ? QUESTIONS.teen : isYoung ? QUESTIONS.young : QUESTIONS.intermediate;

  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questionSet[current];

  const handleSelect = idx => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === q.answer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (current < questionSet.length - 1) {
      setCurrent(c => c + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrent(0);
    setSelected(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    const pct = Math.round((score / questionSet.length) * 100);
    return (
      <div className="quiz-page">
        <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
          {isYoung ? '🎉 Quiz Done!' : 'Quiz Complete!'}
        </h1>
        <div className="quiz-result-card">
          <div className="quiz-score-circle">
            <span className="quiz-score-num">{score}/{questionSet.length}</span>
            <span className="quiz-score-pct">{pct}%</span>
          </div>
          <p className="quiz-grade">
            {pct >= 80
              ? (isYoung ? '🌟 Amazing! You\'re a money star!' : '🌟 Excellent — you really know your stuff!')
              : pct >= 60
              ? (isYoung ? '😊 Good job! Keep learning!' : '👍 Good effort — review the explanations and try again!')
              : (isYoung ? '💪 Keep trying! You\'ll get it!' : 'Keep studying — the explanations above will help!')}
          </p>
          <button className="btn-restart" onClick={handleRestart}>
            {isYoung ? '🔄 Try Again!' : 'Retake Quiz'}
          </button>
        </div>
      </div>
    );
  }

  const answered = current + (selected !== null ? 1 : 0);

  return (
    <div className="quiz-page">
      <h1 className={isYoung ? 'text-4xl' : 'text-2xl'}>
        {isYoung ? '🎯 Money Quiz!' : isTeen ? 'Money Markets Quiz' : '💡 Finance Quiz'}
      </h1>

      <div className="quiz-progress">
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${(current / questionSet.length) * 100}%` }} />
        </div>
        <span className="quiz-progress-label">{current + 1} / {questionSet.length}</span>
      </div>

      <div className="question-card">
        <p className={`question-text ${isYoung ? 'text-2xl' : ''}`}>{q.q}</p>

        <div className="options-list">
          {q.options.map((opt, i) => {
            let cls = 'option-btn';
            if (selected !== null) {
              if (i === q.answer) cls += ' correct';
              else if (i === selected) cls += ' wrong';
              else cls += ' dimmed';
            }
            return (
              <button key={i} className={cls} onClick={() => handleSelect(i)} disabled={selected !== null}>
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className={`explanation-box ${selected === q.answer ? 'correct-box' : 'wrong-box'}`}>
            <p>
              <strong>{selected === q.answer ? '✅ Correct!' : '❌ Not quite.'}</strong>{' '}
              {q.explanation}
            </p>
          </div>
        )}

        {selected !== null && (
          <button className="btn-next" onClick={handleNext}>
            {current < questionSet.length - 1
              ? (isYoung ? 'Next Question →' : 'Next →')
              : (isYoung ? '🏁 See My Score!' : 'See Results')}
          </button>
        )}
      </div>

      <div className="quiz-score-tracker">
        {isYoung ? `⭐ Score: ${score}` : `Score: ${score} / ${answered}`}
      </div>
    </div>
  );
}

export default Quiz;
