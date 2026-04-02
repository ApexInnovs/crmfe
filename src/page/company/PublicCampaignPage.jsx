import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import Loader from '../../components/common/Loader';

/**
 * Expert-level campaign landing page with professional form UI/UX
 * Features: animated hero, progress tracking, inline validation, smooth interactions
 */

const PublicCampaignPage = () => {
  const { campaignId } = useParams();
  console.log("the campaign id is ", campaignId)
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  // Track if already submitted for this campaign
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [touchedFields, setTouchedFields] = useState({});

  // Load campaign on mount
  useEffect(() => {
    // Check localStorage for already submitted campaigns
    const submittedArr = JSON.parse(localStorage.getItem('submittedCampaigns') || '[]');
    if (submittedArr.includes(campaignId)) {
      setAlreadySubmitted(true);
      setSuccess(true);
    }

    const loadCampaign = async () => {
      try {
        console.log('Loading campaign with ID:', campaignId);
        const res = await axiosInstance.get(`/campigne/${campaignId}`);
        console.log('Campaign loaded successfully:', res.data);
        const data = res.data;
        // Ensure company data is available
        if (!data.company) {
          console.warn('Campaign loaded but company data is missing:', data);
        }
        setCampaign(data);
        const initialData = {};
        (data.formStructure || []).forEach(field => {
          initialData[field.name] = field.prefilledValue || '';
        });
        setFormData(initialData);
      } catch (error) {
        console.error('Failed to load campaign:', error.response?.data || error.message);
        setCampaign(null);
      } finally {
        setLoading(false);
      }
    };
    loadCampaign();
  }, [campaignId]);

  // Validate a single field
  const validateField = (field, value) => {
    if (field.isRequired && !value?.toString().trim()) {
      return `${field.label} is required`;
    }
    if (field.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return 'Please enter a valid email address';
    }
    if (field.type === 'number' && value && isNaN(value)) {
      return 'Please enter a valid number';
    }
    if (field.type === 'date' && value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return 'Please enter a valid date';
    }
    return '';
  };

  // Handle field change with debounced validation
  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    const field = campaign.formStructure.find(f => f.name === fieldName);
    if (touchedFields[fieldName]) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
    }
  };

  // Handle field blur - trigger validation
  const handleBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    const field = campaign.formStructure.find(f => f.name === fieldName);
    const error = validateField(field, formData[fieldName]);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    campaign.formStructure.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setSubmitting(true);
    try {
      // Extract company ID - handle both object and string formats
      let companyId = null;
      if (campaign?.company) {
        if (typeof campaign.company === 'object' && campaign.company._id) {
          companyId = campaign.company._id;
        } else if (typeof campaign.company === 'string') {
          companyId = campaign.company;
        }
      }
      if (!companyId) {
        console.error('Campaign company data:', campaign?.company);
        setFieldErrors({ _form: 'Campaign company information is missing. Please refresh and try again.' });
        setSubmitting(false);
        return;
      }
      const payload = {
        campigne: campaignId,
        leadData: formData,
        company: companyId,
        status: 'created'
      };
      console.log('Submitting lead with payload:', payload);
      await axiosInstance.post('/leads', payload);
      setSuccess(true);
      // Store campaignId in localStorage array
      let submittedArr = JSON.parse(localStorage.getItem('submittedCampaigns') || '[]');
      if (!submittedArr.includes(campaignId)) {
        submittedArr.push(campaignId);
        localStorage.setItem('submittedCampaigns', JSON.stringify(submittedArr));
      }
      setAlreadySubmitted(true);
      // Reset form after success
      setTimeout(() => {
        setFormData({});
        setFieldErrors({});
        setTouchedFields({});
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit form';
      console.error('Submission error:', error.response?.data || error.message);
      setFieldErrors({ _form: errorMsg });
      console.error('Submission failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-purple-50">
        <Loader />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Campaign Not Found</h1>
          <p className="text-gray-600 text-base mb-6">
            This campaign link may have expired or is no longer available.
          </p>
          {/* Debug information - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg text-left">
              <p className="text-xs font-mono text-blue-700 mb-2 font-semibold">Debug Info:</p>
              <p className="text-xs text-blue-600 font-mono break-all">Campaign ID: {campaignId}</p>
              <p className="text-xs text-blue-600 font-mono mt-1">Check browser console (F12) for error details</p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (campaign.status !== 2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">Campaign Not Active</h1>
          <p className="text-gray-600 text-base mb-6">
            This campaign is not currently accepting responses. It may not be started yet or has ended.
          </p>
        </div>
      </div>
    );
  }

  const totalFields = campaign.formStructure?.length || 0;
  const completedFields = Object.values(touchedFields).filter(Boolean).length;
  const progressPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* ═══ Hero Section ═══ */}
        {!success && (
          <div className="mb-12 animate-fade-in">
            <div className="relative rounded-3xl overflow-hidden shadows lg">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-linear-to-br from-blue-600 via-purple-600 to-indigo-700" />
              
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-300/10 rounded-full -ml-20 -mb-20 blur-3xl" />
              
              {/* Content */}
              <div className="relative px-8 py-12 sm:px-12 sm:py-16">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/20">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
                      {campaign.title}
                    </h1>
                    {campaign.description && (
                      <p className="text-blue-100 text-lg leading-relaxed max-w-xl">
                        {campaign.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Trust indicators */}
                <div className="flex items-center gap-6 pt-8 border-t border-white/10">
                  <div>
                    <p className="text-blue-100 text-sm">Form fields</p>
                    <p className="text-white text-2xl font-bold">{totalFields}</p>
                  </div>
                  <div className="w-px h-12 bg-white/10" />
                  <div>
                    <p className="text-blue-100 text-sm">Estimated time</p>
                    <p className="text-white text-2xl font-bold">2 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Success Screen ═══ */}
        {(success || alreadySubmitted) && (
          <div className="text-center animate-fade-in py-12">
            <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-linear-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg animate-scale-in">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Thank You!</h2>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              {alreadySubmitted
                ? 'You have already submitted your information for this campaign.'
                : "Your information has been successfully submitted. We'll get back to you shortly with more details about our offerings."}
            </p>

            {/* Success badges */}
            <div className="grid grid-cols-3 gap-4 mb-8 max-w-sm mx-auto">
              <div className="p-4 bg-white rounded-xl border border-emerald-100">
                <svg className="w-6 h-6 text-emerald-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-xs font-medium text-gray-700">Submitted</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-emerald-100">
                <svg className="w-6 h-6 text-emerald-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs font-medium text-gray-700">Verified</p>
              </div>
              <div className="p-4 bg-white rounded-xl border border-emerald-100">
                <svg className="w-6 h-6 text-emerald-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2 1m2-1L12 3m2 1v2.5" />
                </svg>
                <p className="text-xs font-medium text-gray-700">Secured</p>
              </div>
            </div>

            <p className="text-sm text-gray-500">
              A confirmation email will be sent to your inbox shortly.
            </p>
          </div>
        )}

        {/* ═══ Form Section ═══ */}
        {!success && (
          <div className="bg-white rounded-2xl shadow-lg backdrop-blur-sm border border-gray-100 overflow-hidden animate-fade-in">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100 relative">
              <div
                className="h-full bg-linear-to-r from-blue-500 via-purple-500 to-indigo-600 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Form content */}
            <div className="p-8 sm:p-12">
              {/* Progress text */}
              {totalFields > 0 && (
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Share Your Details</h2>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
                      {progressPercent}%
                    </p>
                    <p className="text-xs text-gray-500 font-medium">Complete</p>
                  </div>
                </div>
              )}

              {/* Form error */}
              {fieldErrors._form && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-red-900">{fieldErrors._form}</p>
                    <p className="text-xs text-red-700 mt-1">
                      {fieldErrors._form.includes('company') 
                        ? 'The campaign seems to be missing company information. Please contact the organizer.' 
                        : 'Please check your information and try again.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-6">
                  {campaign.formStructure?.map((field, idx) => {
                    const error = fieldErrors[field.name];
                    const isTouched = touchedFields[field.name];
                    const hasValue = formData[field.name];
                    const isValid = !error && isTouched && hasValue;

                    return (
                      <div
                        key={field.name}
                        className="group animate-fade-in"
                        style={{
                          animationDelay: `${idx * 50}ms`,
                          animationFillMode: 'both'
                        }}
                      >
                        {/* Label with icon */}
                        <div className="flex items-center gap-2 mb-3">
                          <label className="text-sm font-semibold text-gray-900">
                            {field.label}
                          </label>
                          {field.isRequired && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" title="Required field" />
                          )}
                          {isValid && (
                            <svg className="w-4 h-4 text-emerald-600 shrink-0 animate-scale-in" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>

                        {/* Text input, email, number, date */}
                        {['text', 'email', 'number', 'date'].includes(field.type) && (
                          <input
                            type={field.type}
                            name={field.name}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={submitting}
                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none
                              ${error && isTouched
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                                : isValid
                                ? 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-200'
                                : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                              }
                              ${submitting ? 'opacity-60 cursor-not-allowed' : 'cursor-text'}
                            `}
                          />
                        )}

                        {/* Textarea */}
                        {field.type === 'textarea' && (
                          <textarea
                            name={field.name}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={submitting}
                            rows="4"
                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 placeholder:text-gray-400 focus:outline-none resize-none
                              ${error && isTouched
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                                : isValid
                                ? 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-200'
                                : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                              }
                              ${submitting ? 'opacity-60 cursor-not-allowed' : 'cursor-text'}
                            `}
                          />
                        )}

                        {/* Dropdown */}
                        {field.type === 'dropdown' && (
                          <select
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={submitting}
                            className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 focus:outline-none appearance-none bg-no-repeat bg-right pr-10
                              ${error && isTouched
                                ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-200'
                                : isValid
                                ? 'border-emerald-300 bg-emerald-50 focus:ring-2 focus:ring-emerald-200'
                                : 'border-gray-200 bg-gray-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
                              }
                              ${submitting ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
                            `}
                            style={{
                              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                              backgroundSize: '1.5rem',
                              backgroundPosition: 'right 0.75rem center'
                            }}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}

                        {/* Radio buttons */}
                        {field.type === 'radio' && (
                          <div className="grid grid-cols-2 gap-3">
                            {field.options?.map(opt => (
                              <label key={opt} className="relative flex items-center p-3 border-2 border-gray-200 rounded-xl cursor-pointer transition-all group hover:border-blue-400 hover:bg-blue-50"
                                style={{
                                  borderColor: formData[field.name] === opt ? '#3b82f6' : undefined,
                                  backgroundColor: formData[field.name] === opt ? '#eff6ff' : undefined
                                }}
                              >
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={opt}
                                  checked={formData[field.name] === opt}
                                  onChange={(e) => handleChange(field.name, e.target.value)}
                                  onBlur={() => handleBlur(field.name)}
                                  disabled={submitting}
                                  className="w-4 h-4 rounded-full cursor-pointer"
                                />
                                <span className="ml-3 text-sm font-medium text-gray-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Checkbox */}
                        {field.type === 'checkbox' && (
                          <div className="space-y-2">
                            {field.options?.map(opt => (
                              <label key={opt} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-xl cursor-pointer transition-all hover:border-blue-400 hover:bg-blue-50">
                                <input
                                  type="checkbox"
                                  name={field.name}
                                  value={opt}
                                  checked={(formData[field.name] || []).includes(opt)}
                                  onChange={(e) => {
                                    const newVal = formData[field.name] || [];
                                    if (e.target.checked) {
                                      handleChange(field.name, [...newVal, opt]);
                                    } else {
                                      handleChange(field.name, newVal.filter(v => v !== opt));
                                    }
                                  }}
                                  onBlur={() => handleBlur(field.name)}
                                  disabled={submitting}
                                  className="w-4 h-4 rounded cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* Error message with animation */}
                        {error && isTouched && (
                          <div className="mt-2 flex items-start gap-2 text-red-600 text-xs font-medium animate-slide-in-up">
                            <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18.101 12.93a1 1 0 00-1.414-1.414L10 17.586l-6.687-6.687a1 1 0 00-1.414 1.414l8 8a1 1 0 001.414 0l8-8z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                          </div>
                        )}

                        {/* Hint text */}
                        {!error && field.placeholder && (
                          <p className="mt-2 text-xs text-gray-500">
                            💡 {field.placeholder}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Submit button */}
                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-4 bg-linear-to-r from-blue-600 via-purple-600 to-indigo-600 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors" />
                    <div className="relative flex items-center justify-center gap-2">
                      {submitting ? (
                        <>
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit
                          <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </div>
                  </button>

                  {/* Trust text */}
                  <p className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    Your information is secure and encrypted
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-500">
          <p>Powered by <span className="font-semibold text-gray-700">CRM Lead Capture System</span></p>
        </div>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes slide-in-up {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        .animate-slide-in-up {
          animation: slide-in-up 0.3s ease-out forwards;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }

        .shadows {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .bg-linear-to-br {
          background: linear-gradient(to bottom right, var(--tw-gradient-stops));
        }

        .bg-linear-to-r {
          background: linear-gradient(to right, var(--tw-gradient-stops));
        }

        .from-slate-50 {
          --tw-gradient-from: rgb(248 250 252);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(248 250 252 / 0));
        }

        .via-blue-50 {
          --tw-gradient-stops: var(--tw-gradient-from), rgb(239 246 255), var(--tw-gradient-to, rgb(239 246 255 / 0));
        }

        .to-purple-50 {
          --tw-gradient-to: rgb(250 245 255);
        }

        .from-blue-600 {
          --tw-gradient-from: rgb(37 99 235);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(37 99 235 / 0));
        }

        .via-purple-600 {
          --tw-gradient-stops: var(--tw-gradient-from), rgb(147 51 234), var(--tw-gradient-to, rgb(147 51 234 / 0));
        }

        .to-indigo-600 {
          --tw-gradient-to: rgb(79 70 229);
        }

        .from-emerald-400 {
          --tw-gradient-from: rgb(52 211 153);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgb(52 211 153 / 0));
        }

        .to-teal-600 {
          --tw-gradient-to: rgb(13 148 136);
        }
      `}</style>
    </div>
  );
};

export default PublicCampaignPage;
