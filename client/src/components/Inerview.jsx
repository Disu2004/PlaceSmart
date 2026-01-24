import React, { useState, useRef, useEffect } from 'react';
import '../CSS/Interview.css';
import Navbar from './Navbar';

const Interview = () => {
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewType, setInterviewType] = useState('');
  const [domain, setDomain] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [lastQuestion, setLastQuestion] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Backend API URL
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
        
        if (transcript.toLowerCase().includes('repeat question') || 
            transcript.toLowerCase().includes('repeat the question')) {
          repeatQuestion();
        } else {
          setInput(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [lastQuestion]);

  const speakText = (text) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const repeatQuestion = () => {
    if (lastQuestion) {
      speakText(lastQuestion);
    }
  };

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
      const response = await fetch(
        `${API_BASE_URL}/generate-questions?interviewType=${interviewType}&domain=${encodeURIComponent(domain)}&questionCount=7`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setQuestions(data.questions);
        
        const firstQuestion = data.questions[0];
        const welcomeMessage = interviewType === 'hr' 
          ? `Hello! I'm your HR interviewer for the ${domain} position. I've prepared ${data.questions.length} questions for you today. Let's begin!`
          : `Hello! I'm your Technical interviewer for the ${domain} domain. I have ${data.questions.length} questions to assess your skills. Let's get started!`;
        
        const questionText = `Question 1 of ${data.questions.length}: ${firstQuestion.question}`;
        
        setMessages([
          { role: 'assistant', content: welcomeMessage },
          { role: 'assistant', content: questionText }
        ]);
        
        setLastQuestion(questionText);
        setInterviewStarted(true);
        setCurrentQuestionIndex(0);

        setTimeout(() => {
          speakText(welcomeMessage + '. ' + questionText);
        }, 500);
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

    stopSpeaking();

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
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
      if (currentQuestionIndex >= questions.length - 1) {
        const duration = Math.floor((Date.now() - startTime) / 1000 / 60);
        
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
          const completeMessage = 'Thank you for completing the interview! Generating your detailed evaluation report...';
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: completeMessage
          }]);
          speakText(completeMessage);
        }
      } else {
        const nextIndex = currentQuestionIndex + 1;
        const nextQuestion = questions[nextIndex];
        const questionText = `Question ${nextIndex + 1} of ${questions.length}: ${nextQuestion.question}`;
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: questionText
        }]);
        
        setLastQuestion(questionText);
        setCurrentQuestionIndex(nextIndex);

        setTimeout(() => {
          speakText(questionText);
        }, 500);
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
    stopSpeaking();
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
    setLastQuestion('');
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

  // Get status icon based on current state
  const getStatusIcon = () => {
    if (interviewComplete) return '✅';
    if (isSpeaking) return '🎙️';
    if (isLoading) return '⏳';
    if (interviewStarted) return '💼';
    return '🎯';
  };

  const getStatusText = () => {
    if (interviewComplete) return 'Interview Complete';
    if (isSpeaking) return 'AI Speaking';
    if (isLoading) return 'Processing';
    if (interviewStarted) return 'Interview In Progress';
    return 'Ready to Start';
  };

  return (
   <>
   <Navbar/>
    <div className="container">
      <div className="left-panel">
        <div className="robot-container">
          <div className="status-display">
            <div className="status-icon-container">
              {(isSpeaking || isLoading) && <div className="status-pulse" />}
              <div className="status-icon">{getStatusIcon()}</div>
            </div>
            <div className="status-badge-large">
              {getStatusText()}
            </div>
          </div>
          
          <h2 className="robot-title">AI Interview System</h2>
          <p className="robot-subtitle">
            {interviewStarted 
              ? interviewComplete
                ? 'Your interview performance has been evaluated'
                : `${interviewType === 'hr' ? 'HR' : 'Technical'} Interview - ${domain}`
              : 'Professional interview simulation with real-time evaluation'}
          </p>
          
          {interviewStarted && !interviewComplete && (
            <>
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
              <div className="control-buttons">
                <button 
                  onClick={repeatQuestion} 
                  className="repeat-button"
                  disabled={!lastQuestion || isSpeaking}
                  title="Repeat current question"
                >
                  🔄 Repeat Question
                </button>
                <button 
                  onClick={stopSpeaking} 
                  className="stop-button"
                  disabled={!isSpeaking}
                  title="Stop speaking"
                >
                  ⏹️ Stop Audio
                </button>
              </div>
            </>
          )}
          
          {interviewStarted && (
            <button onClick={resetInterview} className="reset-button">
              🔄 Start New Interview
            </button>
          )}
        </div>
      </div>

      <div className="right-panel">
        {!interviewStarted ? (
          <div className="setup-container">
            <h1 className="setup-title">Interview Configuration</h1>
            <p className="setup-subtitle">Set up your professional interview session</p>
            
            <div className="setup-form">
              <div className="form-group">
                <label className="label">Interview Type</label>
                <div className="button-group">
                  <button
                    onClick={() => setInterviewType('hr')}
                    className={`type-button ${interviewType === 'hr' ? 'type-button-active' : ''}`}
                  >
                    <div className="type-icon">👔</div>
                    <div className="type-title">HR Interview</div>
                    <div className="type-desc">Behavioral & Cultural Assessment</div>
                  </button>
                  
                  <button
                    onClick={() => setInterviewType('tech')}
                    className={`type-button ${interviewType === 'tech' ? 'type-button-active' : ''}`}
                  >
                    <div className="type-icon">💻</div>
                    <div className="type-title">Technical Interview</div>
                    <div className="type-desc">Skills & Technical Knowledge</div>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Domain / Position</label>
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
                {isLoading ? '⏳ Preparing Interview...' : '🚀 Start Interview'}
              </button>
            </div>
          </div>
        ) : interviewComplete && finalReport ? (
          <ReportView report={finalReport} />
        ) : (
          <>
            <div className="header">
              <div className="header-left">
                <h1 className="header-title">Interview Session</h1>
                <div className="header-subtitle">
                  {interviewType === 'hr' ? '👔 HR Interview' : '💻 Technical Interview'} • {domain}
                </div>
              </div>
              <div className="header-right">
                <div className="status-badge">
                  <span className="status-dot"></span>
                  Live Interview
                </div>
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
                      {message.role === 'user' ? '👤 Candidate' : '🤖 Interviewer'}
                    </div>
                    <div className="message-content">{message.content}</div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="message-wrapper message-wrapper-ai">
                  <div className="message ai-message">
                    <div className="message-role">🤖 Interviewer</div>
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
                title="Voice input (Say 'repeat question' to hear the question again)"
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
                📤 Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
   </>
  );
};

export default Interview;