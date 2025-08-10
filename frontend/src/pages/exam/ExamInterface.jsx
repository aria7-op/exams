import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { examAPI, attemptAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ExamInterface = () => {
  console.log('🎯 ExamInterface Component - MOUNTING');
  const { testId } = useParams();
  const navigate = useNavigate();
  
  console.log('🎯 ExamInterface - testId:', testId);
  
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(3600); // 60 minutes in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [attemptId, setAttemptId] = useState(null);

  // Fetch real exam data
  const [examData, setExamData] = useState(null);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState(null);

  useEffect(() => {
    if (testId) {
      console.log('🔍 useEffect - Fetching exam data for testId:', testId);
      console.log('🔍 examAPI object:', examAPI);
      console.log('🔍 examAPI.getExamDetails:', examAPI?.getExamDetails);
      setExamLoading(true);
      setExamError(null);
      
      examAPI.getExamById(testId)
        .then(response => {
          console.log('🔍 API Response:', response);
          console.log('🔍 Response data structure:', {
            data: response.data,
            'data.data': response.data?.data,
            'data.data.exam': response.data?.data?.exam,
            'data.exam': response.data?.exam
          });
          setExamData(response);
          setExamLoading(false);
        })
        .catch(error => {
          console.error('🔍 API Error:', error);
          setExamError(error);
          setExamLoading(false);
        });
    }
  }, [testId]);
  
  console.log('🔍 React Query Debug:', {
    testId,
    enabled: !!testId,
    examLoading,
    examError
  });

  // Start exam attempt
  const startAttemptMutation = useMutation({
    mutationFn: (examId) => attemptAPI.startAttempt(examId),
    onSuccess: (data) => {
      console.log('🔍 Start attempt success:', data);
      setAttemptId(data.data?.data?.attempt?.id);
      setTimeLeft(data.data?.data?.attempt?.duration * 60 || 3600);
      
      // Get questions from the start attempt response
      const startQuestions = data.data?.data?.questions || [];
      if (startQuestions.length > 0) {
        setExamData(prev => ({
          ...prev,
          data: {
            ...prev?.data,
            data: {
              ...prev?.data?.data,
              questions: startQuestions
            }
          }
        }));
      }
      
      toast.success('Exam started successfully!');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to start exam';
      toast.error(errorMessage);
      console.error('Start exam error:', error);
      
      // If attempts exceeded, show detailed message
      if (error.response?.data?.attemptsUsed && error.response?.data?.attemptsAllowed) {
        toast.error(
          `Attempts exceeded: ${error.response.data.attemptsUsed}/${error.response.data.attemptsAllowed} attempts used`,
          { duration: 5000 }
        );
      }
    }
  });

  // Submit exam attempt
  const submitAttemptMutation = useMutation({
    mutationFn: (data) => attemptAPI.submitAttempt(data.attemptId, data.responses),
    onSuccess: (data) => {
      console.log('🔍 Submit attempt success:', data);
      setIsSubmitted(true);
      toast.success('Exam submitted successfully!');
      
      // Show detailed success message with analytics preview
      const results = data.data?.data?.results;
      const attempt = data.data?.data?.attempt;
      
      if (results) {
        const score = results.percentage || 0;
        const actualScore = results.score || 0;
        const grade = results.grade || 'N/A';
        const correctAnswers = results.correctAnswers || 0;
        const totalQuestions = results.totalQuestions || 0;
        
        toast.success(
          `Exam completed! Score: ${actualScore.toFixed(1)}/${totalQuestions} (${score.toFixed(1)}%) - Grade: ${grade}`,
          { duration: 4000 }
        );
      }
      
      // Navigate to results page after a delay
      setTimeout(() => {
        const attemptId = attempt?.id || data.data?.data?.attempt?.id;
        if (attemptId) {
          navigate(`/exam/results/${attemptId}`);
        } else {
          toast.error('Failed to get attempt ID for results');
          navigate('/student/tests');
        }
      }, 3000);
    },
    onError: (error) => {
      toast.error('Failed to submit exam');
      console.error('Submit exam error:', error);
    }
  });

  // Extract exam data
  const exam = examData?.data?.data?.exam || examData?.data?.exam || {};
  const questions = examData?.data?.data?.questions || exam.questions || [];
  
  console.log('🔍 ExamInterface Debug:', {
    examData,
    examLoading,
    examError,
    examErrorMessage: examError?.message,
    examErrorStack: examError?.stack,
    exam,
    questionsCount: questions.length
  });

  useEffect(() => {
    console.log('🔍 useEffect - exam.id:', exam.id, 'attemptId:', attemptId);
    if (exam.id && !attemptId) {
      // Check attempts before starting
      const attemptsInfo = exam.attemptsInfo;
      if (attemptsInfo && !attemptsInfo.canTakeExam) {
        toast.error(
          `You have used all ${attemptsInfo.attemptsUsed}/${attemptsInfo.attemptsAllowed} attempts for this exam. No more attempts allowed.`,
          { duration: 5000 }
        );
        // Navigate back to exams list
        setTimeout(() => {
          navigate('/student/tests');
        }, 3000);
        return;
      }
      
      console.log('🔍 Starting exam attempt for exam ID:', exam.id);
      startAttemptMutation.mutate(exam.id);
    }
  }, [exam.id, attemptId, exam.attemptsInfo, navigate]);

  useEffect(() => {
    if (!attemptId || isSubmitted) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attemptId, isSubmitted]);

  const handleAnswerSelect = (questionId, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleSubmit = () => {
    console.log('🔍 handleSubmit - attemptId:', attemptId, 'answers:', answers);
    console.log('🔍 handleSubmit - CALLED! This function is being executed');
    if (!attemptId) {
      toast.error('No active exam attempt');
      return;
    }

    // Show confirmation dialog
    const answeredCount = Object.keys(answers).length;
    const totalQuestions = questions.length;
    const unansweredCount = totalQuestions - answeredCount;
    
    let confirmMessage = `Are you sure you want to submit your exam?\n\n📊 Progress: ${answeredCount}/${totalQuestions} questions answered`;
    
    if (unansweredCount > 0) {
      confirmMessage += `\n⚠️ ${unansweredCount} question(s) unanswered`;
    }
    
    confirmMessage += '\n\nThis action cannot be undone.';
    
    if (window.confirm(confirmMessage)) {
      // Convert answers to the format expected by the backend
      const responses = Object.entries(answers).map(([questionId, answer]) => {
        const currentQuestion = questions.find(q => q.id === questionId);
        
        if (currentQuestion?.type === 'ESSAY' || currentQuestion?.type === 'SHORT_ANSWER') {
          return {
            questionId,
            selectedOptions: [],
            essayAnswer: answer,
            timeSpent: 0
          };
        } else {
          return {
            questionId,
            selectedOptions: Array.isArray(answer) ? answer.map(String) : [String(answer)],
            timeSpent: 0
          };
        }
      });

      console.log('🔍 About to call submitAttemptMutation with:', { attemptId, responses });
      submitAttemptMutation.mutate({
        attemptId,
        responses
      });
    }
  };

  // Handle errors
  if (examError) {
    return (
      <div className="error-container">
        <h3>Error loading exam</h3>
        <p>Failed to load exam data. Please try again later.</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (examLoading) {
    return (
      <div className="loading-container">
        <h3>Loading exam...</h3>
        <p>Please wait while we prepare your exam.</p>
      </div>
    );
  }

  // Check if attempts exceeded
  const attemptsInfo = exam.attemptsInfo;
  if (attemptsInfo && !attemptsInfo.canTakeExam) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--danger-50) 0%, var(--warning-50) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>
            ⚠️
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--danger-700)',
            marginBottom: '16px'
          }}>
            Attempts Exceeded
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'var(--secondary-600)',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            You have used all {attemptsInfo.attemptsUsed}/{attemptsInfo.attemptsAllowed} attempts for this exam.
            No more attempts are allowed.
          </p>
          
          <div style={{
            background: 'var(--danger-50)',
            border: '1px solid var(--danger-200)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--danger-700)',
              marginBottom: '12px'
            }}>
              What you can do:
            </h3>
            <ul style={{
              textAlign: 'left',
              fontSize: '14px',
              color: 'var(--danger-600)',
              lineHeight: '1.8'
            }}>
              <li>📊 View your previous exam results</li>
              <li>📝 Take other available exams</li>
              <li>📈 Check your performance analytics</li>
              <li>🏆 View your certificates</li>
            </ul>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary" 
              onClick={() => navigate('/student/tests')}
            >
              📝 Browse Other Exams
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => navigate('/student/history')}
            >
              📊 View Exam History
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--success-50) 0%, var(--primary-50) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '48px',
          boxShadow: 'var(--shadow)',
          textAlign: 'center',
          maxWidth: '500px',
          width: '100%'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '24px'
          }}>
            ✅
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '600',
            color: 'var(--success-700)',
            marginBottom: '16px'
          }}>
            Exam Submitted Successfully!
          </h2>
          <p style={{
            fontSize: '16px',
            color: 'var(--secondary-600)',
            marginBottom: '32px',
            lineHeight: '1.6'
          }}>
            Your answers have been recorded and your exam is being processed. 
            You'll be redirected to your detailed results in a few seconds.
          </p>
          
          <div style={{
            background: 'var(--success-50)',
            border: '1px solid var(--success-200)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--success-700)',
              marginBottom: '12px'
            }}>
              What happens next?
            </h3>
            <ul style={{
              textAlign: 'left',
              fontSize: '14px',
              color: 'var(--success-600)',
              lineHeight: '1.8'
            }}>
              <li>✅ Your answers are being scored</li>
              <li>📊 Detailed analytics are being calculated</li>
              <li>📈 Performance metrics are being generated</li>
              <li>🎯 Difficulty breakdown is being analyzed</li>
              <li>🏆 Certificate will be issued if you passed</li>
            </ul>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: 'var(--secondary-500)',
            fontSize: '14px'
          }}>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid var(--primary-300)',
              borderTop: '2px solid var(--primary-600)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Redirecting to results...
          </div>
        </div>
      </div>
    );
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestionData = questions[currentQuestion];
  
  console.log('🔍 Current Question Debug:', {
    currentQuestion,
    questionsLength: questions.length,
    currentQuestionData,
    questions
  });

  // Safety check - if no questions or current question is undefined, show loading
  if (!questions.length || !currentQuestionData) {
    return (
      <div className="loading-container">
        <h3>Loading questions...</h3>
        <p>Please wait while we prepare your exam questions.</p>
        <p>Questions loaded: {questions.length}</p>
        <p>Current question index: {currentQuestion}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--secondary-50) 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)', margin: '0 0 8px' }}>
              {exam.title || exam.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <p style={{ color: 'var(--secondary-600)', margin: 0 }}>
                Question {currentQuestion + 1} of {questions.length}
              </p>
              
              {/* Attempts Status */}
              {attemptsInfo && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: attemptsInfo.attemptsUsed >= attemptsInfo.attemptsAllowed ? 'var(--danger-100)' : 'var(--warning-100)',
                  border: `1px solid ${attemptsInfo.attemptsUsed >= attemptsInfo.attemptsAllowed ? 'var(--danger-300)' : 'var(--warning-300)'}`,
                  fontSize: '12px',
                  fontWeight: '500',
                  color: attemptsInfo.attemptsUsed >= attemptsInfo.attemptsAllowed ? 'var(--danger-700)' : 'var(--warning-700)'
                }}>
                  <span>🎯</span>
                  <span>Attempt {attemptsInfo.attemptsUsed + 1} of {attemptsInfo.attemptsAllowed}</span>
                </div>
              )}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '60px',
                  height: '6px',
                  backgroundColor: 'var(--secondary-200)',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(Object.keys(answers).length / questions.length) * 100}%`,
                    height: '100%',
                    backgroundColor: 'var(--success-500)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--secondary-500)', fontWeight: '500' }}>
                  {Math.round((Object.keys(answers).length / questions.length) * 100)}%
                </span>
              </div>
            </div>
          </div>
          <div style={{
            background: timeLeft < 300 ? 'linear-gradient(135deg, var(--danger-500), var(--danger-600))' : 'linear-gradient(135deg, var(--warning-500), var(--warning-600))',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '18px'
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Question Area */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--secondary-900)', lineHeight: '1.6' }}>
                {currentQuestionData.text}
              </h2>
              
              {/* Question Images */}
              {currentQuestionData.images && currentQuestionData.images.length > 0 && (
                <div style={{ marginTop: '16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {currentQuestionData.images.map((image, index) => (
                      <div
                        key={index}
                        style={{
                          border: '1px solid var(--secondary-200)',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          maxWidth: '300px',
                          maxHeight: '200px'
                        }}
                      >
                        <img
                          src={`${process.env.REACT_APP_API_URL || ''}${image.imageUrl}`}
                          alt={image.altText || `Question image ${index + 1}`}
                          style={{
                            width: '100%',
                            height: 'auto',
                            maxHeight: '200px',
                            objectFit: 'contain',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            // Open image in new tab for full view
                            window.open(`${process.env.REACT_APP_API_URL || ''}${image.imageUrl}`, '_blank');
                          }}
                          title="Click to view full size"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Handle different question types */}
              {currentQuestionData.type === 'ESSAY' ? (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '500',
                    fontSize: '16px',
                    color: 'var(--secondary-900)'
                  }}>
                    Your Answer (Essay)
                  </label>
                  <textarea
                    value={answers[currentQuestionData.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestionData.id]: e.target.value }))}
                    placeholder="Write your detailed essay answer here..."
                    rows={12}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid var(--secondary-200)',
                      borderRadius: '8px',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--secondary-500)', 
                    marginTop: '8px' 
                  }}>
                    Minimum 100 words recommended. Be detailed and comprehensive in your response.
                  </div>
                </div>
              ) : currentQuestionData.type === 'SHORT_ANSWER' ? (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '500',
                    fontSize: '16px',
                    color: 'var(--secondary-900)'
                  }}>
                    Your Answer (Short Answer)
                  </label>
                  <textarea
                    value={answers[currentQuestionData.id] || ''}
                    onChange={(e) => setAnswers(prev => ({ ...prev, [currentQuestionData.id]: e.target.value }))}
                    placeholder="Write your short answer here..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '2px solid var(--secondary-200)',
                      borderRadius: '8px',
                      fontSize: '16px',
                      lineHeight: '1.6',
                      resize: 'vertical',
                      fontFamily: 'inherit'
                    }}
                  />
                  <div style={{ 
                    fontSize: '14px', 
                    color: 'var(--secondary-500)', 
                    marginTop: '8px' 
                  }}>
                    Provide a concise but complete answer.
                  </div>
                </div>
              ) : currentQuestionData.type === 'FILL_IN_THE_BLANK' ? (
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '12px', 
                    fontWeight: '500',
                    fontSize: '16px',
                    color: 'var(--secondary-900)'
                  }}>
                    Fill in the blanks
                  </label>
                  {currentQuestionData.options.map((option, index) => (
                    <div key={index} style={{ marginBottom: '12px' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '4px', 
                        fontSize: '14px',
                        color: 'var(--secondary-700)'
                      }}>
                        Blank {index + 1}:
                      </label>
                      <input
                        type="text"
                        value={answers[currentQuestionData.id]?.[index] || ''}
                        onChange={(e) => {
                          const newAnswers = { ...answers };
                          if (!newAnswers[currentQuestionData.id]) {
                            newAnswers[currentQuestionData.id] = [];
                          }
                          newAnswers[currentQuestionData.id][index] = e.target.value;
                          setAnswers(newAnswers);
                        }}
                        placeholder={`Answer for blank ${index + 1}`}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid var(--secondary-200)',
                          borderRadius: '6px',
                          fontSize: '16px'
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                /* Multiple choice questions */
                currentQuestionData.options.map((option, index) => (
                  <div
                    key={index}
                    onClick={() => handleAnswerSelect(currentQuestionData.id, index)}
                    style={{
                      padding: '16px',
                      border: `2px solid ${answers[currentQuestionData.id] === index ? 'var(--primary-500)' : 'var(--secondary-200)'}`,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'var(--transition-normal)',
                      backgroundColor: answers[currentQuestionData.id] === index ? 'var(--primary-50)' : 'white'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: `2px solid ${answers[currentQuestionData.id] === index ? 'var(--primary-500)' : 'var(--secondary-300)'}`,
                        backgroundColor: answers[currentQuestionData.id] === index ? 'var(--primary-500)' : 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        fontWeight: '600'
                      }}>
                        {answers[currentQuestionData.id] === index ? '✓' : String.fromCharCode(65 + index)}
                      </div>
                      <span style={{ fontSize: '16px', color: 'var(--secondary-900)' }}>
                        {option.text}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Navigation Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
              >
                ← Previous
              </button>
              
              {currentQuestion === questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                  disabled={isSubmitted}
                >
                  📤 Submit Test
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                >
                  Next →
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: 'var(--shadow)',
            height: 'fit-content'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '16px' }}>
              Question Navigation
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px', marginBottom: '24px' }}>
              {questions.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => setCurrentQuestion(index)}
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'var(--transition-normal)',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: currentQuestion === index ? 'var(--primary-500)' : 
                                   answers[question.id] !== undefined ? 'var(--success-100)' : 'white',
                    color: currentQuestion === index ? 'white' : 
                          answers[question.id] !== undefined ? 'var(--success-700)' : 'var(--secondary-700)',
                    borderColor: currentQuestion === index ? 'var(--primary-500)' : 
                               answers[question.id] !== undefined ? 'var(--success-300)' : 'var(--secondary-300)'
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--success-500)' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--secondary-300)' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Unanswered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--primary-500)' }}></div>
                <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Current</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--secondary-200)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: 'var(--secondary-600)' }}>Progress:</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--secondary-900)' }}>
                  {Object.keys(answers).length}/{questions.length}
                </span>
              </div>
              <div style={{
                width: '100%',
                height: '8px',
                backgroundColor: 'var(--secondary-200)',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(Object.keys(answers).length / questions.length) * 100}%`,
                  height: '100%',
                  backgroundColor: 'var(--primary-500)',
                  transition: 'width 0.3s ease'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface; 