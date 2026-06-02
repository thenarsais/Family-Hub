import React, { useState } from 'react';
import '../styles/LessonCard.css';

function LessonCard({ lesson, userAge }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isYoung = userAge < 8;

  return (
    <div className={`lesson-card ${isExpanded ? 'expanded' : ''}`}>
      <div className="lesson-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className={isYoung ? 'emoji-large' : 'emoji'}>{lesson.icon}</span>
        <h3 className={isYoung ? 'text-2xl' : ''}>{lesson.title}</h3>
        <span className="expand-icon">{isExpanded ? '▼' : '▶'}</span>
      </div>

      {isExpanded && (
        <div className={`lesson-content ${isYoung ? 'large-text' : ''}`}>
          <p>{lesson.content}</p>
        </div>
      )}
    </div>
  );
}

export default LessonCard;
