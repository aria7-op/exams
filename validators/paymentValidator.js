const Joi = require('joi');

const validatePayment = (data) => {
  const schema = Joi.object({
    bookingId: Joi.string().required().messages({
      'string.empty': 'Booking ID is required',
      'any.required': 'Booking ID is required'
    }),
    paymentMethod: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH').required().messages({
      'string.empty': 'Payment method is required',
      'any.required': 'Payment method is required',
      'any.only': 'Payment method must be one of: CREDIT_CARD, DEBIT_CARD, PAYPAL, BANK_TRANSFER, CASH'
    }),
    description: Joi.string().max(500).optional().messages({
      'string.max': 'Description cannot exceed 500 characters'
    })
  });

  return schema.validate(data);
};

const validatePaymentProcessing = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED').required().messages({
      'string.empty': 'Payment status is required',
      'any.required': 'Payment status is required',
      'any.only': 'Payment status must be one of: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED'
    }),
    metadata: Joi.object().optional().messages({
      'object.base': 'Metadata must be an object'
    })
  });

  return schema.validate(data);
};

const validateRefund = (data) => {
  const schema = Joi.object({
    amount: Joi.number().positive().required().messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'any.required': 'Amount is required'
    }),
    reason: Joi.string().max(500).required().messages({
      'string.empty': 'Refund reason is required',
      'string.max': 'Refund reason cannot exceed 500 characters',
      'any.required': 'Refund reason is required'
    })
  });

  return schema.validate(data);
};

module.exports = {
  validatePayment,
  validatePaymentProcessing,
  validateRefund
}; 