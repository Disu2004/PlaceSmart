import React, { useState, useRef, useEffect } from 'react';
import '../CSS/Interview.css';

const Interview = () => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewType, setInterviewType] = useState('');
  const [domain, setDomain] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Backend API URL - update this to match your backend port
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL || 'http://localhost:8000';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const startInterview = async () => {
    if (!interviewType || !domain.trim()) {
      alert('Please select interview type and enter domain');
      return;
    }

    setIsLoading(true);
    setStartTime(Date.now());

    try {
      // Generate questions from Gemini using GET request with query parameters
      const response = await fetch(
        `${API_BASE_URL}/generate-questions?interviewType=${interviewType}&domain=${encodeURIComponent(domain)}&questionCount=7`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        
        // Start with first question
        const firstQuestion = data.questions[0];
        const welcomeMessage = interviewType === 'hr' 
          ? `Hello! I'm your HR interviewer for the ${domain} position. I've prepared ${data.questions.length} questions for you today. Let's begin!`
          : `Hello! I'm your Technical interviewer for the ${domain} domain. I have ${data.questions.length} questions to assess your skills. Let's get started!`;
        
        setMessages([
          { role: 'assistant', content: welcomeMessage },
          { role: 'assistant', content: `Question 1/${data.questions.length}: ${firstQuestion.question}` }
        ]);
        setInterviewStarted(true);
        setCurrentQuestionIndex(0);
      } else {
        alert('Failed to generate questions: ' + data.message);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      alert(`Failed to start interview. Please check:\n1. Backend is running on ${API_BASE_URL}\n2. GEMINI_API_KEY is set in your .env file\n\nError: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || interviewComplete) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    // Store the answer
    const currentAnswer = {
      question: questions[currentQuestionIndex].question,
      answer: input,
      category: questions[currentQuestionIndex].category
    };
    
    const updatedAnswers = [...answers, currentAnswer];
    setAnswers(updatedAnswers);
    
    setInput('');
    setIsLoading(true);

    try {
      // Check if this was the last question
      if (currentQuestionIndex >= questions.length - 1) {
        // Interview complete - generate final report
        const duration = Math.floor((Date.now() - startTime) / 1000 / 60); // in minutes
        
        const reportResponse = await fetch(`${API_BASE_URL}/evaluatecompleteinterview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            interviewType,
            domain,
            questionsAndAnswers: updatedAnswers,
            duration: `${duration} minutes`
          })
        });

        if (!reportResponse.ok) {
          throw new Error(`HTTP error! status: ${reportResponse.status}`);
        }

        const reportData = await reportResponse.json();

        if (reportData.success) {
          setFinalReport(reportData.evaluation);
          setInterviewComplete(true);
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: 'Thank you for completing the interview! Generating your detailed evaluation report...' 
          }]);
        }
      } else {
        // Ask next question
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = questions[nextIndex];
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Question ${nextIndex + 1}/${questions.length}: ${nextQuestion.question}` 
        }]);
        setCurrentQuestionIndex(nextIndex);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'I apologize, there was a technical issue. Could you please repeat your answer?' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetInterview = () => {
    setInterviewStarted(false);
    setInterviewType('');
    setDomain('');
    setMessages([]);
    setInput('');
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setInterviewComplete(false);
    setFinalReport(null);
    setStartTime(null);
  };

  const ReportView = ({ report }) => {
    return (
      <div className="report-container">
        <div className="report-header">
          <h2 className="report-title">📊 Interview Evaluation Report</h2>
          <div className="overall-score">
            <div className="score-label">Overall Score</div>
            <div className="score-value">{report.overallScore}/10</div>
          </div>
        </div>

        <div className="recommendation-badge">
          <strong>Hiring Recommendation:</strong> {report.hiringRecommendation}
        </div>

        {report.technicalLevel && (
          <div className="level-badge">
            <strong>Technical Level:</strong> {report.technicalLevel}
          </div>
        )}

        <div className="report-section">
          <h3 className="section-title">📈 Category Scores</h3>
          <div className="scores-grid">
            {Object.entries(report.categoryScores).map(([category, score]) => (
              <div key={category} className="score-item">
                <div className="category-name">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                <div className="score-bar">
                  <div 
                    className="score-bar-fill"
                    style={{ width: `${(score / 10) * 100}%` }}
                  />
                </div>
                <div className="category-score">{score}/10</div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section">
          <h3 className="section-title">✅ Strengths</h3>
          <ul className="bullet-list">
            {report.strengths.map((strength, idx) => (
              <li key={idx} className="bullet-item">{strength}</li>
            ))}
          </ul>
        </div>

        <div className="report-section">
          <h3 className="section-title">📝 Areas for Improvement</h3>
          <ul className="bullet-list">
            {report.areasForImprovement.map((area, idx) => (
              <li key={idx} className="bullet-item">{area}</li>
            ))}
          </ul>
        </div>

        {report.knowledgeGaps && (
          <div className="report-section">
            <h3 className="section-title">🎯 Knowledge Gaps</h3>
            <ul className="bullet-list">
              {report.knowledgeGaps.map((gap, idx) => (
                <li key={idx} className="bullet-item">{gap}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="report-section">
          <h3 className="section-title">💡 Detailed Feedback</h3>
          <p className="feedback-text">{report.detailedFeedback}</p>
        </div>

        {report.technicalRecommendations && (
          <div className="report-section">
            <h3 className="section-title">🔧 Technical Recommendations</h3>
            <ul className="bullet-list">
              {report.technicalRecommendations.map((rec, idx) => (
                <li key={idx} className="bullet-item">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {report.nextSteps && (
          <div className="report-section">
            <h3 className="section-title">🚀 Next Steps</h3>
            <ul className="bullet-list">
              {report.nextSteps.map((step, idx) => (
                <li key={idx} className="bullet-item">{step}</li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={resetInterview} className="new-interview-button">
          Start New Interview
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="left-panel">
        <div className="robot-container">
          <div className="robot">
            <div className="robot-head">
              <div className="antenna"></div>
              <div className="eyes-container">
                <div className={`eye ${isLoading ? 'eye-blink' : ''}`}></div>
                <div className={`eye ${isLoading ? 'eye-blink' : ''}`}></div>
              </div>
              <div className="mouth"></div>
            </div>
            <div className="robot-body">
              <div className="body-light"></div>
              <div className="body-light"></div>
              <div className="body-light"></div>
            </div>
          </div>
          <h2 className="robot-title">AI Interviewer</h2>
          <p className="robot-subtitle">
            {interviewStarted 
              ? interviewComplete
                ? 'Interview Complete!'
                : `${interviewType === 'hr' ? 'HR' : 'Technical'} Interview - ${domain}`
              : 'Ready to assess your skills'}
          </p>
          {interviewStarted && !interviewComplete && (
            <div className="progress-container">
              <div className="progress-text">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-bar-fill"
                  style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          {interviewStarted && (
            <button onClick={resetInterview} className="reset-button">
              Start New Interview
            </button>
          )}
        </div>
      </div>

      <div className="right-panel">
        {!interviewStarted ? (
          <div className="setup-container">
            <h1 className="setup-title">Interview Setup</h1>
            <p className="setup-subtitle">Configure your interview session</p>
            
            <div className="setup-form">
              <div className="form-group">
                <label className="label">Select Interview Type</label>
                <div className="button-group">
                  <button
                    onClick={() => setInterviewType('hr')}
                    className={`type-button ${interviewType === 'hr' ? 'type-button-active' : ''}`}
                  >
                    <div className="type-icon">👔</div>
                    <div className="type-title">HR Interview</div>
                    <div className="type-desc">Behavioral & Cultural Fit</div>
                  </button>
                  
                  <button
                    onClick={() => setInterviewType('tech')}
                    className={`type-button ${interviewType === 'tech' ? 'type-button-active' : ''}`}
                  >
                    <div className="type-icon">💻</div>
                    <div className="type-title">Technical Interview</div>
                    <div className="type-desc">Skills & Problem Solving</div>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Enter Domain/Position</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder={interviewType === 'hr' 
                    ? 'e.g., Software Engineer, Marketing Manager, Product Designer' 
                    : 'e.g., React Development, Data Science, Cloud Computing'}
                  className="domain-input"
                />
              </div>

              <button
                onClick={startInterview}
                className={`start-button ${(!interviewType || !domain.trim()) ? 'start-button-disabled' : ''}`}
                disabled={!interviewType || !domain.trim() || isLoading}
              >
                {isLoading ? 'Generating Questions...' : 'Start Interview'}
              </button>
            </div>
          </div>
        ) : interviewComplete && finalReport ? (
          <ReportView report={finalReport} />
        ) : (
          <>
            <div className="header">
              <div>
                <h1 className="header-title">Interview Session</h1>
                <div className="header-subtitle">
                  {interviewType === 'hr' ? '👔 HR Interview' : '💻 Technical Interview'} • {domain}
                </div>
              </div>
              <div className="status-badge">
                <span className="status-dot"></span>
                Live
              </div>
            </div>

            <div className="chat-container">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message-wrapper ${message.role === 'user' ? 'message-wrapper-user' : 'message-wrapper-ai'}`}
                >
                  <div className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}>
                    <div className="message-role">
                      {message.role === 'user' ? '👤 You' : '🤖 AI Interviewer'}
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-wrapper message-wrapper-ai">
                  <div className="message ai-message">
                    <div className="message-role">🤖 AI Interviewer</div>
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="input-container">
              <button
                onClick={toggleListening}
                className={`mic-button ${isListening ? 'mic-button-active' : ''}`}
                disabled={interviewComplete}
              >
                🎤
              </button>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit(e)}
                placeholder="Type your answer or use voice input..."
                className="input"
                disabled={isLoading || interviewComplete}
              />
              <button 
                onClick={handleSubmit}
                className={`send-button ${(isLoading || !input.trim() || interviewComplete) ? 'send-button-disabled' : ''}`}
                disabled={isLoading || !input.trim() || interviewComplete}
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Interview;