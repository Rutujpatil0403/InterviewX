import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Clock, MessageSquare, Tag, FileText } from 'lucide-react';

const QuestionModal = ({
    isOpen,
    onClose,
    onSave,
    question = null,
    mode = 'add'
}) => {
    const [formData, setFormData] = useState({
        question: '',
        type: 'Technical',
        expectedDuration: 5,
        notes: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [focusedField, setFocusedField] = useState(null);

    const questionTypes = [
        { value: 'Technical', label: 'Technical', color: '#3b82f6', icon: '💻' },
        { value: 'Behavioral', label: 'Behavioral', color: '#8b5cf6', icon: '🧠' },
        { value: 'Situational', label: 'Situational', color: '#ec4899', icon: '🎯' },
        { value: 'Problem Solving', label: 'Problem Solving', color: '#f59e0b', icon: '🧩' },
        { value: 'Communication', label: 'Communication', color: '#10b981', icon: '💬' },
        { value: 'Leadership', label: 'Leadership', color: '#6366f1', icon: '👑' },
        { value: 'Cultural Fit', label: 'Cultural Fit', color: '#14b8a6', icon: '🤝' }
    ];

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && question) {
                setFormData({
                    question: question.question || question.text || '',
                    type: question.type || 'Technical',
                    expectedDuration: question.expectedDuration || 5,
                    notes: question.notes || ''
                });
            } else {
                setFormData({
                    question: '',
                    type: 'Technical',
                    expectedDuration: 5,
                    notes: ''
                });
            }
            setErrors({});
            setFocusedField(null);
        }
    }, [isOpen, mode, question]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.question.trim()) {
            newErrors.question = 'Question text is required';
        } else if (formData.question.trim().length < 10) {
            newErrors.question = 'Question must be at least 10 characters long';
        }

        if (!formData.type) {
            newErrors.type = 'Question type is required';
        }

        if (!formData.expectedDuration || formData.expectedDuration < 1) {
            newErrors.expectedDuration = 'Duration must be at least 1 minute';
        } else if (formData.expectedDuration > 60) {
            newErrors.expectedDuration = 'Duration cannot exceed 60 minutes';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving question:', error);
            setErrors({ submit: 'Failed to save question. Please try again.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen) return null;

    const selectedType = questionTypes.find(t => t.value === formData.type);

    return (
        <div
            onClick={handleOverlayClick}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '1rem',
                animation: 'fadeIn 0.2s ease-out'
            }}
        >
            <div
                style={{
                    background: 'linear-gradient(to bottom, #ffffff, #f9fafb)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    width: '100%',
                    maxWidth: '640px',
                    maxHeight: '90vh',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
            >
                {/* Header with gradient */}
                <div style={{
                    background: `linear-gradient(135deg, ${selectedType?.color || '#3b82f6'}, ${selectedType?.color || '#3b82f6'}dd)`,
                    padding: '2rem 1.5rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'radial-gradient(circle at top right, rgba(255,255,255,0.2), transparent)',
                        pointerEvents: 'none'
                    }} />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '1.75rem',
                                fontWeight: '700',
                                color: 'white',
                                letterSpacing: '-0.025em'
                            }}>
                                {mode === 'edit' ? 'Edit Question' : 'Add New Question'}
                            </h2>
                            <p style={{
                                margin: '0.5rem 0 0 0',
                                fontSize: '0.875rem',
                                color: 'rgba(255,255,255,0.9)'
                            }}>
                                {mode === 'edit' ? 'Update your interview question' : 'Create a new interview question'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '2.5rem',
                                height: '2.5rem',
                                border: 'none',
                                background: 'rgba(255,255,255,0.2)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div style={{
                    padding: '2rem 1.5rem',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {/* Question Text */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '0.75rem'
                        }}>
                            <MessageSquare size={16} style={{ color: '#6b7280' }} />
                            Question Text *
                        </label>
                        <div style={{ position: 'relative' }}>
                            <textarea
                                value={formData.question}
                                onChange={(e) => handleInputChange('question', e.target.value)}
                                onFocus={() => setFocusedField('question')}
                                onBlur={() => setFocusedField(null)}
                                placeholder="Enter the interview question..."
                                rows={4}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '0.9375rem',
                                    border: errors.question
                                        ? '2px solid #ef4444'
                                        : focusedField === 'question'
                                            ? `2px solid ${selectedType?.color || '#3b82f6'}`
                                            : '2px solid #e5e7eb',
                                    borderRadius: '12px',
                                    outline: 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit',
                                    background: 'white',
                                    boxShadow: focusedField === 'question'
                                        ? `0 0 0 4px ${selectedType?.color || '#3b82f6'}15`
                                        : 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                            <div style={{
                                position: 'absolute',
                                bottom: '0.75rem',
                                right: '0.75rem',
                                fontSize: '0.75rem',
                                color: formData.question.length < 10 ? '#ef4444' : '#9ca3af',
                                fontWeight: '500',
                                pointerEvents: 'none'
                            }}>
                                {formData.question.length} chars
                            </div>
                        </div>
                        {errors.question && (
                            <p style={{
                                color: '#ef4444',
                                fontSize: '0.8125rem',
                                marginTop: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                animation: 'shake 0.3s ease-in-out'
                            }}>
                                ⚠️ {errors.question}
                            </p>
                        )}
                    </div>

                    {/* Type Selector */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '0.75rem'
                        }}>
                            <Tag size={16} style={{ color: '#6b7280' }} />
                            Question Type *
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.75rem'
                        }}>
                            {questionTypes.map(type => (
                                <button
                                    key={type.value}
                                    type="button"
                                    onClick={() => handleInputChange('type', type.value)}
                                    style={{
                                        padding: '0.875rem',
                                        border: formData.type === type.value
                                            ? `2px solid ${type.color}`
                                            : '2px solid #e5e7eb',
                                        borderRadius: '12px',
                                        background: formData.type === type.value
                                            ? `${type.color}10`
                                            : 'white',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transform: formData.type === type.value ? 'scale(1.02)' : 'scale(1)',
                                        boxShadow: formData.type === type.value
                                            ? `0 4px 12px ${type.color}30`
                                            : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (formData.type !== type.value) {
                                            e.currentTarget.style.borderColor = type.color;
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (formData.type !== type.value) {
                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                            e.currentTarget.style.transform = 'translateY(0)';
                                        }
                                    }}
                                >
                                    <span style={{ fontSize: '1.5rem' }}>{type.icon}</span>
                                    <span style={{
                                        fontSize: '0.8125rem',
                                        fontWeight: '600',
                                        color: formData.type === type.value ? type.color : '#4b5563',
                                        textAlign: 'center'
                                    }}>
                                        {type.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Duration Slider */}
                    <div style={{ marginBottom: '1.75rem' }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '0.75rem'
                        }}>
                            <Clock size={16} style={{ color: '#6b7280' }} />
                            Expected Duration *
                        </label>
                        <div style={{
                            background: 'white',
                            border: focusedField === 'duration'
                                ? `2px solid ${selectedType?.color || '#3b82f6'}`
                                : '2px solid #e5e7eb',
                            borderRadius: '12px',
                            padding: '1.25rem',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: focusedField === 'duration'
                                ? `0 0 0 4px ${selectedType?.color || '#3b82f6'}15`
                                : 'none'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '1rem'
                            }}>
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Duration</span>
                                <span style={{
                                    fontSize: '1.5rem',
                                    fontWeight: '700',
                                    color: selectedType?.color || '#3b82f6'
                                }}>
                                    {formData.expectedDuration} min
                                </span>
                            </div>
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={formData.expectedDuration}
                                onChange={(e) => handleInputChange('expectedDuration', parseInt(e.target.value))}
                                onFocus={() => setFocusedField('duration')}
                                onBlur={() => setFocusedField(null)}
                                style={{
                                    width: '100%',
                                    height: '8px',
                                    borderRadius: '4px',
                                    background: `linear-gradient(to right, ${selectedType?.color || '#3b82f6'} 0%, ${selectedType?.color || '#3b82f6'} ${(formData.expectedDuration / 60) * 100}%, #e5e7eb ${(formData.expectedDuration / 60) * 100}%, #e5e7eb 100%)`,
                                    outline: 'none',
                                    cursor: 'pointer',
                                    WebkitAppearance: 'none',
                                    appearance: 'none'
                                }}
                            />
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '0.5rem',
                                fontSize: '0.75rem',
                                color: '#9ca3af'
                            }}>
                                <span>1 min</span>
                                <span>60 min</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#1f2937',
                            marginBottom: '0.75rem'
                        }}>
                            <FileText size={16} style={{ color: '#6b7280' }} />
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => handleInputChange('notes', e.target.value)}
                            onFocus={() => setFocusedField('notes')}
                            onBlur={() => setFocusedField(null)}
                            placeholder="Add any additional notes or guidance for this question..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                fontSize: '0.9375rem',
                                border: focusedField === 'notes'
                                    ? `2px solid ${selectedType?.color || '#3b82f6'}`
                                    : '2px solid #e5e7eb',
                                borderRadius: '12px',
                                outline: 'none',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                resize: 'vertical',
                                fontFamily: 'inherit',
                                background: 'white',
                                boxShadow: focusedField === 'notes'
                                    ? `0 0 0 4px ${selectedType?.color || '#3b82f6'}15`
                                    : 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {errors.submit && (
                        <p style={{
                            color: '#ef4444',
                            fontSize: '0.875rem',
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            borderRadius: '8px',
                            animation: 'shake 0.3s ease-in-out'
                        }}>
                            {errors.submit}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    padding: '1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    background: 'white'
                }}>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            border: '2px solid #e5e7eb',
                            background: 'white',
                            color: '#4b5563',
                            borderRadius: '12px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: isSubmitting ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.background = '#f9fafb';
                                e.currentTarget.style.borderColor = '#d1d5db';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = '#e5e7eb';
                            }
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontSize: '0.9375rem',
                            fontWeight: '600',
                            border: 'none',
                            background: isSubmitting
                                ? '#9ca3af'
                                : `linear-gradient(135deg, ${selectedType?.color || '#3b82f6'}, ${selectedType?.color || '#3b82f6'}dd)`,
                            color: 'white',
                            borderRadius: '12px',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: isSubmitting
                                ? 'none'
                                : `0 4px 12px ${selectedType?.color || '#3b82f6'}40`,
                            transform: 'scale(1)'
                        }}
                        onMouseEnter={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'scale(1.02) translateY(-1px)';
                                e.currentTarget.style.boxShadow = `0 6px 16px ${selectedType?.color || '#3b82f6'}50`;
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isSubmitting) {
                                e.currentTarget.style.transform = 'scale(1)';
                                e.currentTarget.style.boxShadow = `0 4px 12px ${selectedType?.color || '#3b82f6'}40`;
                            }
                        }}
                    >
                        {isSubmitting ? (
                            <>
                                <div style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white',
                                    borderRadius: '50%',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                {mode === 'edit' ? <Save size={16} /> : <Plus size={16} />}
                                {mode === 'edit' ? 'Update Question' : 'Add Question'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 3px solid ${selectedType?.color || '#3b82f6'};
          transition: all 0.2s;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 3px solid ${selectedType?.color || '#3b82f6'};
          transition: all 0.2s;
        }

        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
      `}</style>
        </div>
    );
};

export default QuestionModal;