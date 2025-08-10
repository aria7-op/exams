import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Certificates = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const queryClient = useQueryClient();

  // Fetch certificates data
  const {
    data: certificatesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['userCertificates', currentPage, limit],
    queryFn: () => examAPI.getUserCertificates({
      page: currentPage,
      limit
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: (attemptId) => examAPI.generateCertificate(attemptId),
    onSuccess: (data) => {
      toast.success('Certificate generated successfully!');
      queryClient.invalidateQueries(['userCertificates']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to generate certificate');
    }
  });

  // Auto-generate certificates mutation
  const autoGenerateCertificatesMutation = useMutation({
    mutationFn: () => examAPI.autoGenerateCertificates(),
    onSuccess: (data) => {
      toast.success(data.data?.message || 'Certificates auto-generated successfully!');
      queryClient.invalidateQueries(['userCertificates']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to auto-generate certificates');
    }
  });

  // Download certificate mutation
  const downloadCertificateMutation = useMutation({
    mutationFn: (certificateId) => examAPI.downloadCertificate(certificateId),
    onSuccess: (data, certificateId) => {
      console.log('Download response data:', data);
      console.log('Data type:', typeof data);
      console.log('Data size:', data?.size || data?.length || 'unknown');
      
      // Check if the response is actually a PDF blob
      if (data instanceof Blob) {
        // Check if it's a valid PDF by checking the first few bytes
        const reader = new FileReader();
        reader.onload = function(e) {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Check for PDF magic number (PDF files start with %PDF)
          const isPDF = uint8Array.length > 4 && 
                       uint8Array[0] === 0x25 && // %
                       uint8Array[1] === 0x50 && // P
                       uint8Array[2] === 0x44 && // D
                       uint8Array[3] === 0x46;   // F
          
          if (isPDF) {
            // Valid PDF, download it
            const url = window.URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate-${certificateId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL after a delay
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
            
            toast.success('Certificate downloaded successfully!');
          } else {
            // Not a valid PDF, might be an error response
            toast.error('Invalid certificate file received');
          }
        };
        reader.readAsArrayBuffer(data);
      } else {
        // Not a blob, create one and check
        const blob = new Blob([data], { type: 'application/pdf' });
        
        const reader = new FileReader();
        reader.onload = function(e) {
          const arrayBuffer = e.target.result;
          const uint8Array = new Uint8Array(arrayBuffer);
          
          // Check for PDF magic number
          const isPDF = uint8Array.length > 4 && 
                       uint8Array[0] === 0x25 && // %
                       uint8Array[1] === 0x50 && // P
                       uint8Array[2] === 0x44 && // D
                       uint8Array[3] === 0x46;   // F
          
          if (isPDF) {
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `certificate-${certificateId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
            
            toast.success('Certificate downloaded successfully!');
          } else {
            toast.error('Invalid certificate file received');
          }
        };
        reader.readAsArrayBuffer(blob);
      }
    },
    onError: (error) => {
      console.error('Download error:', error);
      toast.error('Failed to download certificate');
    }
  });

  // Handle errors
  if (error) {
    toast.error('Failed to load certificates');
  }

  // Extract data
  const passedAttempts = certificatesData?.data?.data?.passedAttempts || [];
  const existingCertificates = certificatesData?.data?.data?.existingCertificates || [];
  const pagination = certificatesData?.data?.data?.pagination || {};

  // Helper functions
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (percentage) => {
    if (percentage >= 80) return '#10b981';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  // Event handlers
  const handlePageChange = (newPage) => setCurrentPage(newPage);
  const handleGenerateCertificate = (attemptId) => {
    generateCertificateMutation.mutate(attemptId);
  };
  const handleAutoGenerateCertificates = () => {
    autoGenerateCertificatesMutation.mutate();
  };
  const handleDownloadCertificate = (certificateId) => {
    downloadCertificateMutation.mutate(certificateId);
  };

  if (isLoading) {
    return (
      <div className="fade-in">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
            Certificates
          </h1>
          <p style={{ color: '#64748b' }}>
            Manage and download your exam certificates
          </p>
        </div>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1e293b', marginBottom: '0.5rem' }}>
          Certificates
        </h1>
        <p style={{ color: '#64748b' }}>
          Manage and download your exam certificates
        </p>
      </div>

      {/* Stats */}
      <div className="dashboard-grid" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">Passed Exams</div>
            <div className="card-icon blue">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="card-value">{passedAttempts.length}</div>
          <div className="card-change positive">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Eligible for certificates
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">Generated Certificates</div>
            <div className="card-icon green">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
          <div className="card-value">{existingCertificates.length}</div>
          <div className="card-change positive">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Available for download
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-title">Pending Certificates</div>
            <div className="card-icon orange">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="24" height="24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="card-value">{passedAttempts.filter(attempt => !attempt.certificate).length}</div>
          <div className="card-change positive">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="16" height="16">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Ready to generate
          </div>
        </div>
      </div>

      {/* Passed Exams - Eligible for Certificates */}
      <div className="data-table" style={{ marginBottom: '2rem' }}>
        <div className="table-header">
          <div className="table-title">
            Passed Exams - Generate Certificates ({passedAttempts.length})
          </div>
                                <div className="table-actions">
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => refetch()}
                          style={{ marginRight: '0.5rem' }}
                        >
                          🔄 Refresh
                        </button>
                        <button 
                          className="btn btn-success" 
                          onClick={handleAutoGenerateCertificates}
                          disabled={autoGenerateCertificatesMutation.isPending}
                        >
                          {autoGenerateCertificatesMutation.isPending ? '🔄 Generating...' : '🏆 Auto-Generate All'}
                        </button>
                      </div>
        </div>
        
        {passedAttempts.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏆</div>
            <h3>No passed exams found</h3>
            <p>You need to pass an exam to be eligible for a certificate.</p>
            <button 
              className="btn btn-primary" 
              onClick={() => window.location.href = '/student/tests'}
              style={{ marginTop: '1rem' }}
            >
              Take an Exam
            </button>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Exam Name</th>
                    <th>Category</th>
                    <th>Score</th>
                    <th>Completion Date</th>
                    <th>Certificate Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {passedAttempts.map((attempt) => {
                    const exam = attempt.exam;
                    const category = exam?.examCategory;
                    const hasCertificate = !!attempt.certificate;
                    
                    return (
                      <tr key={attempt.id}>
                        <td>
                          <div style={{ fontWeight: '600', color: '#1e293b' }}>
                            {exam?.title || 'Unknown Exam'}
                          </div>
                          {exam?.description && (
                            <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                              {exam.description.substring(0, 50)}...
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {category?.icon && <span>{category.icon}</span>}
                            <span>{category?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ 
                            fontSize: '1.125rem', 
                            fontWeight: '700', 
                            color: getScoreColor(attempt.percentage || 0)
                          }}>
                            {attempt.percentage || 0}%
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            {attempt.obtainedMarks || 0}/{attempt.totalMarks || 0}
                          </div>
                        </td>
                        <td>
                          <div>{formatDate(attempt.completedAt || attempt.createdAt)}</div>
                        </td>
                        <td>
                          {hasCertificate ? (
                            <span className="status-badge status-active">
                              ✅ Certificate Generated
                            </span>
                          ) : (
                            <span className="status-badge status-inactive">
                              ⏳ Ready to Generate
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                                    {hasCertificate ? (
                                          <button 
                                            className="btn btn-primary" 
                                            style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                                            onClick={() => handleDownloadCertificate(attempt.certificate.id)}
                                            disabled={downloadCertificateMutation.isPending}
                                          >
                                            {downloadCertificateMutation.isPending ? 'Opening...' : '👁️ View Certificate'}
                                          </button>
                            ) : (
                              <button 
                                className="btn btn-success" 
                                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                                onClick={() => handleGenerateCertificate(attempt.id)}
                                disabled={generateCertificateMutation.isPending}
                              >
                                {generateCertificateMutation.isPending ? 'Generating...' : '🏆 Generate Certificate'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div style={{ 
                padding: '1.5rem', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <button 
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                
                <span style={{ color: '#64748b' }}>
                  Page {currentPage} of {pagination.pages}
                </span>
                
                <button 
                  className="btn btn-secondary"
                  disabled={currentPage === pagination.pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Existing Certificates */}
      {existingCertificates.length > 0 && (
        <div className="data-table">
          <div className="table-header">
            <div className="table-title">
              Generated Certificates ({existingCertificates.length})
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Certificate Number</th>
                  <th>Exam Name</th>
                  <th>Category</th>
                  <th>Score</th>
                  <th>Issued Date</th>
                  <th>Expires Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {existingCertificates.map((certificate) => {
                  const exam = certificate.exam;
                  const attempt = certificate.attempt;
                  const category = exam?.examCategory;
                  const isExpired = certificate.expiresAt && new Date(certificate.expiresAt) < new Date();
                  
                  return (
                    <tr key={certificate.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#1e293b', fontFamily: 'monospace' }}>
                          {certificate.certificateNumber}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>
                          {exam?.title || 'Unknown Exam'}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {category?.icon && <span>{category.icon}</span>}
                          <span>{category?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ 
                          fontSize: '1.125rem', 
                          fontWeight: '700', 
                          color: getScoreColor(attempt?.percentage || 0)
                        }}>
                          {attempt?.percentage || 0}%
                        </div>
                      </td>
                      <td>
                        <div>{formatDate(certificate.issuedAt)}</div>
                      </td>
                      <td>
                        <div style={{ 
                          color: isExpired ? '#ef4444' : '#10b981',
                          fontWeight: isExpired ? '600' : 'normal'
                        }}>
                          {certificate.expiresAt ? formatDate(certificate.expiresAt) : 'Never'}
                          {isExpired && <div style={{ fontSize: '0.75rem' }}>Expired</div>}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-primary" 
                          style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                          onClick={() => handleDownloadCertificate(certificate.id)}
                          disabled={downloadCertificateMutation.isPending}
                        >
                          {downloadCertificateMutation.isPending ? 'Downloading...' : '📥 Download'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Certificates; 