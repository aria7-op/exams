import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { billingAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';

const BillModal = ({ bill, onClose, onPrint }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();
  if (!bill) return null;

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handlePrint = async () => {
    try {
      setIsProcessing(true);
      
      // Process payment first
      const response = await paymentAPI.processPaymentOnPrint(bill.booking.id);
      
      // Update the bill status to reflect the payment
      if (response.data?.success) {
        if (response.data.data?.bill) {
          // Update the bill object with the new bill data
          Object.assign(bill, response.data.data.bill);
        } else {
          // Fallback: Update the bill object to show paid status
          bill.status = 'PAID';
          bill.payment = {
            method: 'CASH',
            paidAt: new Date().toISOString()
          };
        }
      }
      
      // Then print the bill
      window.print();
      
      // Refresh bookings data to show updated status
      queryClient.invalidateQueries(['user-bookings']);
      queryClient.invalidateQueries(['admin-bookings']);
      
      // Show success message
      const message = response.data?.message || 'Payment processed and bill printed successfully!';
      toast.success(message);
      
      if (onPrint) onPrint();
    } catch (error) {
      console.error('❌ Payment processing error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await billingAPI.downloadBill(bill.booking.id);
      // For now, just show a success message
      // In the future, this could trigger a PDF download
      toast.success('Bill download initiated');
    } catch (error) {
      toast.error('Failed to download bill');
    }
  };

  return (
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
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-900)' }}>
            Invoice
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                      className="btn btn-secondary"
                      onClick={handlePrint}
                      disabled={isProcessing}
                    >
                      {isProcessing ? '⏳ Processing...' : '🖨️ Print'}
                    </button>
            <button 
              className="btn btn-primary"
              onClick={handleDownload}
            >
              📥 Download
            </button>
            <button 
              className="btn btn-outline"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Bill Content */}
        <div style={{ border: '1px solid var(--secondary-200)', borderRadius: '8px', padding: '24px' }}>
          {/* Bill Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '8px' }}>
                Mock Exam System
              </h3>
              <p style={{ color: 'var(--secondary-600)', marginBottom: '4px' }}>
                123 Education Street
              </p>
              <p style={{ color: 'var(--secondary-600)', marginBottom: '4px' }}>
                Learning City, LC 12345
              </p>
              <p style={{ color: 'var(--secondary-600)' }}>
                contact@mockexam.com
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '18px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '8px' }}>
                INVOICE
              </div>
              <div style={{ color: 'var(--secondary-600)', marginBottom: '4px' }}>
                Bill #: {bill.billNumber}
              </div>
              <div style={{ color: 'var(--secondary-600)', marginBottom: '4px' }}>
                Date: {formatDate(bill.billDate)}
              </div>
              <div style={{ color: 'var(--secondary-600)' }}>
                Due: {formatDate(bill.dueDate)}
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '12px' }}>
              Bill To:
            </h4>
            <div style={{ color: 'var(--secondary-700)' }}>
              <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                {bill.customer.name}
              </div>
              <div style={{ marginBottom: '4px' }}>
                {bill.customer.email}
              </div>
            </div>
          </div>

          {/* Exam Details */}
          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--secondary-900)', marginBottom: '12px' }}>
              Exam Details:
            </h4>
            <div style={{ 
              border: '1px solid var(--secondary-200)', 
              borderRadius: '6px', 
              padding: '16px',
              backgroundColor: 'var(--secondary-50)'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--secondary-600)', marginBottom: '4px' }}>
                    Exam Title
                  </div>
                  <div style={{ fontWeight: '500', color: 'var(--secondary-900)' }}>
                    {bill.exam.title}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--secondary-600)', marginBottom: '4px' }}>
                    Category
                  </div>
                  <div style={{ fontWeight: '500', color: 'var(--secondary-900)' }}>
                    {bill.exam.category}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--secondary-600)', marginBottom: '4px' }}>
                    Duration
                  </div>
                  <div style={{ fontWeight: '500', color: 'var(--secondary-900)' }}>
                    {bill.exam.duration} minutes
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: 'var(--secondary-600)', marginBottom: '4px' }}>
                    Total Marks
                  </div>
                  <div style={{ fontWeight: '500', color: 'var(--secondary-900)' }}>
                    {bill.exam.totalMarks}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount Details */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ 
              border: '1px solid var(--secondary-200)', 
              borderRadius: '6px', 
              overflow: 'hidden'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--secondary-50)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid var(--secondary-200)' }}>
                      Description
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--secondary-200)' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '12px', borderBottom: '1px solid var(--secondary-200)' }}>
                      {bill.exam.title} - Exam Fee
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--secondary-200)' }}>
                      {formatCurrency(bill.amount.subtotal, bill.amount.currency)}
                    </td>
                  </tr>
                  {bill.amount.tax > 0 && (
                    <tr>
                      <td style={{ padding: '12px', borderBottom: '1px solid var(--secondary-200)' }}>
                        Tax
                      </td>
                      <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid var(--secondary-200)' }}>
                        {formatCurrency(bill.amount.tax, bill.amount.currency)}
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--primary-50)' }}>
                    <td style={{ padding: '12px', fontWeight: '600', color: 'var(--primary-900)' }}>
                      Total
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: 'var(--primary-900)' }}>
                      {formatCurrency(bill.amount.total, bill.amount.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Status */}
          <div style={{ 
            padding: '16px', 
            borderRadius: '6px', 
            backgroundColor: bill.status === 'PAID' ? 'var(--success-50)' : 'var(--warning-50)',
            border: `1px solid ${bill.status === 'PAID' ? 'var(--success-200)' : 'var(--warning-200)'}`,
            marginBottom: '24px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: bill.status === 'PAID' ? 'var(--success-700)' : 'var(--warning-700)'
            }}>
              <span style={{ fontSize: '18px' }}>
                {bill.status === 'PAID' ? '✅' : '⏳'}
              </span>
              <span style={{ fontWeight: '500' }}>
                Status: {bill.status === 'PAID' ? 'PAID' : 'PENDING PAYMENT'}
              </span>
            </div>
            {bill.payment && (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                Payment Method: {bill.payment.method}
                {bill.payment.paidAt && (
                  <span style={{ marginLeft: '16px' }}>
                    Paid on: {formatDate(bill.payment.paidAt)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ 
            borderTop: '1px solid var(--secondary-200)', 
            paddingTop: '16px',
            textAlign: 'center',
            color: 'var(--secondary-600)',
            fontSize: '14px'
          }}>
            <p>Thank you for choosing Mock Exam System!</p>
            <p>For any questions, please contact us at support@mockexam.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillModal; 