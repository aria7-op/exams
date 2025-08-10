import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examAPI, categoryAPI, adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const Tests = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    duration: 60,
    totalQuestions: 20,
    passingScore: 70,
    difficulty: 'EASY',
    status: 'DRAFT',
    instructions: '',
    maxAttempts: 3,
    isPublic: false,
    startDate: '',
    endDate: '',
    price: 0,
    currency: 'USD',
    // Question type distribution
    essayQuestionsCount: 0,
    multipleChoiceQuestionsCount: 0,
    shortAnswerQuestionsCount: 0,
    fillInTheBlankQuestionsCount: 0,
    trueFalseQuestionsCount: 0,
    matchingQuestionsCount: 0,
    orderingQuestionsCount: 0
  });

  // Fetch all exams
  const { data: examsData, isLoading: examsLoading, error: examsError } = useQuery({
    queryKey: ['exams', searchTerm, selectedCategory, selectedStatus, selectedDifficulty],
    queryFn: () => adminAPI.getAllExams({ 
      search: searchTerm, 
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      difficulty: selectedDifficulty !== 'all' ? selectedDifficulty : undefined
    }),
    refetchInterval: 30000
  });

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryAPI.getAllCategories(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Create exam mutation
  const createExamMutation = useMutation({
    mutationFn: (examData) => adminAPI.createExam(examData),
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      toast.success('Exam created successfully!');
      setShowAddModal(false);
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        duration: 60,
        totalQuestions: 20,
        passingScore: 70,
        difficulty: 'EASY',
        status: 'DRAFT',
        instructions: '',
        maxAttempts: 3,
        isPublic: false,
        startDate: '',
        endDate: '',
        price: 0,
        currency: 'USD',
        // Question type distribution
        essayQuestionsCount: 0,
        multipleChoiceQuestionsCount: 0,
        shortAnswerQuestionsCount: 0,
        fillInTheBlankQuestionsCount: 0,
        trueFalseQuestionsCount: 0,
        matchingQuestionsCount: 0,
        orderingQuestionsCount: 0
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create exam');
    }
  });

  // Update exam mutation
  const updateExamMutation = useMutation({
    mutationFn: ({ examId, examData }) => adminAPI.updateExam(examId, examData),
    onSuccess: () => {
      queryClient.invalidateQueries(['exams']);
      toast.success('Exam updated successfully!');
      setShowAddModal(false);
      setEditingTest(null);
      setFormData({
        title: '',
        description: '',
        categoryId: '',
        duration: 60,
        totalQuestions: 20,
        passingScore: 70,
        difficulty: 'EASY',
        status: 'DRAFT',
        instructions: '',
        maxAttempts: 3,
        isPublic: false,
        startDate: '',
        endDate: '',
        price: 0,
        currency: 'USD',
        // Question type distribution
        essayQuestionsCount: 0,
        multipleChoiceQuestionsCount: 0,
        shortAnswerQuestionsCount: 0,
        fillInTheBlankQuestionsCount: 0,
        trueFalseQuestionsCount: 0,
        matchingQuestionsCount: 0,
        orderingQuestionsCount: 0
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update exam');
    }
  });

  // Delete exam mutation
  const deleteExamMutation = useMutation({
    mutationFn: (examId) => adminAPI.deleteExam(examId),
    onSuccess: () => {
      toast.success('Exam deleted successfully!');
      examsQuery.refetch();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete exam');
    }
  });

  // Publish/Unpublish exam mutation
  const publishExamMutation = useMutation({
    mutationFn: ({ examId, action }) => action === 'publish' ? adminAPI.publishExam(examId) : adminAPI.unpublishExam(examId),
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries(['exams']);
      toast.success(`Exam ${action === 'publish' ? 'published' : 'unpublished'} successfully!`);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update exam status');
    }
  });

  const handleAddExam = () => {
    if (formData.title && formData.categoryId) {
      createExamMutation.mutate(formData);
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handleEditExam = (exam) => {
    setEditingTest(exam);
    setFormData({
      title: exam.title,
      description: exam.description || '',
      categoryId: exam.categoryId,
      duration: exam.duration || 60,
      totalQuestions: exam.totalQuestions || 20,
      passingScore: exam.passingScore || 70,
      difficulty: exam.difficulty || 'EASY',
      status: exam.status || 'DRAFT',
      instructions: exam.instructions || '',
      maxAttempts: exam.maxAttempts || 3,
      isPublic: exam.isPublic || false,
      startDate: exam.startDate ? new Date(exam.startDate).toISOString().split('T')[0] : '',
      endDate: exam.endDate ? new Date(exam.endDate).toISOString().split('T')[0] : '',
      price: exam.price || 0,
      currency: exam.currency || 'USD',
      // Question type distribution
      essayQuestionsCount: exam.essayQuestionsCount || 0,
      multipleChoiceQuestionsCount: exam.multipleChoiceQuestionsCount || 0,
      shortAnswerQuestionsCount: exam.shortAnswerQuestionsCount || 0,
      fillInTheBlankQuestionsCount: exam.fillInTheBlankQuestionsCount || 0,
      trueFalseQuestionsCount: exam.trueFalseQuestionsCount || 0,
      matchingQuestionsCount: exam.matchingQuestionsCount || 0,
      orderingQuestionsCount: exam.orderingQuestionsCount || 0
    });
    setShowAddModal(true);
  };

  const handleUpdateExam = () => {
    if (formData.title && formData.categoryId) {
      updateExamMutation.mutate({ examId: editingTest.id, examData: formData });
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePublishExam = (examId, action) => {
    publishExamMutation.mutate({ examId, action });
  };

  // Debug: Log the exams data structure
  console.log('examsData:', examsData);
  console.log('examsData?.data:', examsData?.data);
  console.log('examsData?.data?.data:', examsData?.data?.data);
  
  // Debug: Log the categories data structure
  console.log('categoriesData:', categoriesData);
  console.log('categoriesData?.data:', categoriesData?.data);
  console.log('categoriesLoading:', categoriesLoading);
  console.log('categoriesError:', categoriesError);
  
  const filteredExams = examsData?.data?.data?.exams || examsData?.data?.exams || [];
  const categories = Array.isArray(categoriesData?.data?.data) ? categoriesData.data.data : [];
  
  console.log('Final categories array:', categories);

  if (examsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', color: 'var(--secondary-600)' }}>Loading exams...</div>
      </div>
    );
  }

  if (examsError) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '24px', color: 'var(--danger-600)' }}>Error loading exams</div>
        <div style={{ fontSize: '16px', color: 'var(--secondary-600)', marginTop: '8px' }}>
          {examsError.message}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="data-table-container">
        <div className="data-table-header">
          <h2 className="data-table-title">Exams Management</h2>
          <div className="data-table-actions">
            <input
              type="text"
              placeholder="Search exams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--secondary-300)',
                borderRadius: '6px',
                marginRight: '12px'
              }}
            >
              <option value="all">All Difficulties</option>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
            <button 
              className="btn btn-primary"
              style={{
                opacity: currentUser?.role === 'MODERATOR' ? 0.5 : 1,
                cursor: currentUser?.role === 'MODERATOR' ? 'not-allowed' : 'pointer'
              }}
              onClick={() => {
                if (currentUser?.role === 'MODERATOR') {
                  toast.error('Access restricted for your role');
                  return;
                }
                setEditingTest(null);
                setFormData({
                  title: '',
                  description: '',
                  categoryId: '',
                  duration: 60,
                  totalQuestions: 20,
                  passingScore: 70,
                  difficulty: 'EASY',
                  status: 'DRAFT',
                  instructions: '',
                  maxAttempts: 3,
                  isPublic: false,
                  startDate: '',
                  endDate: '',
                  price: 0,
                  currency: 'USD'
                });
                setShowAddModal(true);
              }}
              title={currentUser?.role === 'MODERATOR' ? 'Access restricted for your role' : ''}
            >
              ➕ Add Exam
            </button>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Questions</th>
              <th>Difficulty</th>
              <th>Price</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.map((exam) => (
              <tr key={exam.id}>
                <td>
                  <div style={{ fontWeight: '600', color: 'var(--secondary-900)' }}>
                    {exam.title}
                  </div>
                  {exam.description && (
                    <div style={{ fontSize: '12px', color: 'var(--secondary-600)', marginTop: '4px' }}>
                      {exam.description.substring(0, 50)}...
                    </div>
                  )}
                </td>
                <td>
                  <span className="badge badge-primary">
                    {categories.find(c => c.id === exam.categoryId)?.name || 'Unknown'}
                  </span>
                </td>
                <td>{exam.duration} min</td>
                <td>{exam.totalQuestions}</td>
                <td>
                  <span className={`badge ${
                    exam.difficulty === 'EASY' ? 'badge-success' :
                    exam.difficulty === 'MEDIUM' ? 'badge-warning' : 'badge-danger'
                  }`}>
                    {exam.difficulty}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: '600', color: exam.price > 0 ? 'var(--success-600)' : 'var(--secondary-600)' }}>
                    {exam.currency || 'USD'} {exam.price || 0}
                  </div>
                  {exam.price > 0 && (
                    <div style={{ fontSize: '12px', color: 'var(--secondary-500)' }}>
                      Paid Exam
                    </div>
                  )}
                </td>
                <td>
                  <span className={`badge ${
                    exam.status === 'PUBLISHED' ? 'badge-success' :
                    exam.status === 'DRAFT' ? 'badge-warning' : 'badge-secondary'
                  }`}>
                    {exam.status}
                  </span>
                </td>
                <td>{exam.attemptsCount || 0}</td>
                <td>{new Date(exam.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="data-table-actions-cell">
                    <button 
                      className="btn btn-secondary" 
                      style={{ 
                        padding: '4px 8px', 
                        fontSize: '12px',
                        opacity: currentUser?.role === 'MODERATOR' ? 0.5 : 1,
                        cursor: currentUser?.role === 'MODERATOR' ? 'not-allowed' : 'pointer'
                      }}
                      onClick={() => {
                        if (currentUser?.role === 'MODERATOR') {
                          toast.error('Access restricted for your role');
                          return;
                        }
                        handleEditExam(exam);
                      }}
                      title={currentUser?.role === 'MODERATOR' ? 'Access restricted for your role' : ''}
                    >
                      ✏️ Edit
                    </button>
                    {exam.status === 'DRAFT' ? (
                      <button 
                        className="btn btn-success" 
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '12px',
                          opacity: currentUser?.role === 'MODERATOR' ? 0.5 : 1,
                          cursor: currentUser?.role === 'MODERATOR' ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => {
                          if (currentUser?.role === 'MODERATOR') {
                            toast.error('Access restricted for your role');
                            return;
                          }
                          handlePublishExam(exam.id, 'publish');
                        }}
                        title={currentUser?.role === 'MODERATOR' ? 'Access restricted for your role' : ''}
                      >
                        📤 Publish
                      </button>
                    ) : exam.status === 'PUBLISHED' ? (
                      <button 
                        className="btn btn-warning" 
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '12px',
                          opacity: currentUser?.role === 'MODERATOR' ? 0.5 : 1,
                          cursor: currentUser?.role === 'MODERATOR' ? 'not-allowed' : 'pointer'
                        }}
                        onClick={() => {
                          if (currentUser?.role === 'MODERATOR') {
                            toast.error('Access restricted for your role');
                            return;
                          }
                          handlePublishExam(exam.id, 'unpublish');
                        }}
                        title={currentUser?.role === 'MODERATOR' ? 'Access restricted for your role' : ''}
                      >
                        📥 Unpublish
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredExams.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-600)' }}>
            No exams found
          </div>
        )}
      </div>

      {/* Add/Edit Exam Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: '600' }}>
              {editingTest ? 'Edit Exam' : 'Add New Exam'}
            </h3>
            
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Exam Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Category *
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    min="15"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 60 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Total Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.totalQuestions}
                    onChange={(e) => setFormData({ ...formData, totalQuestions: parseInt(e.target.value) || 20 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.passingScore}
                    onChange={(e) => setFormData({ ...formData, passingScore: parseInt(e.target.value) || 70 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Max Attempts
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxAttempts}
                    onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value) || 3 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Price
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Currency
                  </label>
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="AUD">AUD (A$)</option>
                    <option value="JPY">JPY (¥)</option>
                    <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>

              {/* Question Type Distribution */}
              <div>
                <h4 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600', color: 'var(--primary-600)' }}>
                  Question Type Distribution
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Essay Questions
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.essayQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, essayQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Multiple Choice
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.multipleChoiceQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, multipleChoiceQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Short Answer
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.shortAnswerQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, shortAnswerQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Fill in the Blank
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.fillInTheBlankQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, fillInTheBlankQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      True/False
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.trueFalseQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, trueFalseQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Matching
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.matchingQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, matchingQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                  
                  <div>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      Ordering
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.orderingQuestionsCount}
                      onChange={(e) => setFormData({ ...formData, orderingQuestionsCount: parseInt(e.target.value) || 0 })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '1px solid var(--secondary-300)',
                        borderRadius: '6px'
                      }}
                    />
                  </div>
                </div>
                
                {/* Total validation */}
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  backgroundColor: (() => {
                    const total = formData.essayQuestionsCount + formData.multipleChoiceQuestionsCount + 
                                 formData.shortAnswerQuestionsCount + formData.fillInTheBlankQuestionsCount + 
                                 formData.trueFalseQuestionsCount + formData.matchingQuestionsCount + 
                                 formData.orderingQuestionsCount;
                    if (total === formData.totalQuestions) {
                      return 'var(--success-100)';
                    } else if (total > formData.totalQuestions) {
                      return 'var(--error-100)';
                    } else {
                      return 'var(--warning-100)';
                    }
                  })(),
                  color: (() => {
                    const total = formData.essayQuestionsCount + formData.multipleChoiceQuestionsCount + 
                                 formData.shortAnswerQuestionsCount + formData.fillInTheBlankQuestionsCount + 
                                 formData.trueFalseQuestionsCount + formData.matchingQuestionsCount + 
                                 formData.orderingQuestionsCount;
                    if (total === formData.totalQuestions) {
                      return 'var(--success-600)';
                    } else if (total > formData.totalQuestions) {
                      return 'var(--error-600)';
                    } else {
                      return 'var(--warning-600)';
                    }
                  })(),
                  border: '1px solid',
                  borderColor: (() => {
                    const total = formData.essayQuestionsCount + formData.multipleChoiceQuestionsCount + 
                                 formData.shortAnswerQuestionsCount + formData.fillInTheBlankQuestionsCount + 
                                 formData.trueFalseQuestionsCount + formData.matchingQuestionsCount + 
                                 formData.orderingQuestionsCount;
                    if (total === formData.totalQuestions) {
                      return 'var(--success-300)';
                    } else if (total > formData.totalQuestions) {
                      return 'var(--error-300)';
                    } else {
                      return 'var(--warning-300)';
                    }
                  })()
                }}>
                  <strong>Total:</strong> {formData.essayQuestionsCount + formData.multipleChoiceQuestionsCount + 
                                          formData.shortAnswerQuestionsCount + formData.fillInTheBlankQuestionsCount + 
                                          formData.trueFalseQuestionsCount + formData.matchingQuestionsCount + 
                                          formData.orderingQuestionsCount} / {formData.totalQuestions} questions
                  {(() => {
                    const total = formData.essayQuestionsCount + formData.multipleChoiceQuestionsCount + 
                                 formData.shortAnswerQuestionsCount + formData.fillInTheBlankQuestionsCount + 
                                 formData.trueFalseQuestionsCount + formData.matchingQuestionsCount + 
                                 formData.orderingQuestionsCount;
                    if (total === formData.totalQuestions) {
                      return ' ✅ Perfect match!';
                    } else if (total > formData.totalQuestions) {
                      return ' ❌ Too many questions specified';
                    } else {
                      return ' ⚠️ Some questions will be randomly selected';
                    }
                  })()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid var(--secondary-300)',
                      borderRadius: '6px'
                    }}
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '24px' }}>
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    style={{ marginRight: '8px' }}
                  />
                  <label htmlFor="isPublic" style={{ fontWeight: '500' }}>
                    Public Exam
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Instructions
                </label>
                <textarea
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  rows={4}
                  placeholder="Instructions for students taking this exam..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid var(--secondary-300)',
                    borderRadius: '6px',
                    resize: 'vertical'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowAddModal(false)}
                disabled={createExamMutation.isPending || updateExamMutation.isPending}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={editingTest ? handleUpdateExam : handleAddExam}
                disabled={createExamMutation.isPending || updateExamMutation.isPending}
              >
                {createExamMutation.isPending || updateExamMutation.isPending ? 'Saving...' : (editingTest ? 'Update Exam' : 'Add Exam')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests; 