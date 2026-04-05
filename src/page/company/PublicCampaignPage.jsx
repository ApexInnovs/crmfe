import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const PublicCampaignPage = () => {
  const { campaignId } = useParams();
  console.log("the campaign id is ", campaignId);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [touchedFields, setTouchedFields] = useState({});
  const [focusedField, setFocusedField] = useState(null);

  useEffect(() => {
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

  const handleChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    const field = campaign.formStructure.find(f => f.name === fieldName);
    if (touchedFields[fieldName]) {
      const error = validateField(field, value);
      setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
    }
  };

  const handleBlur = (fieldName) => {
    setFocusedField(null);
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    const field = campaign.formStructure.find(f => f.name === fieldName);
    const error = validateField(field, formData[fieldName]);
    setFieldErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const validateForm = () => {
    const newErrors = {};
    campaign.formStructure.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) newErrors[field.name] = error;
    });
    setFieldErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
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
      toast.success('Response submitted successfully!');
      setSuccess(true);
      let submittedArr = JSON.parse(localStorage.getItem('submittedCampaigns') || '[]');
      if (!submittedArr.includes(campaignId)) {
        submittedArr.push(campaignId);
        localStorage.setItem('submittedCampaigns', JSON.stringify(submittedArr));
      }
      setAlreadySubmitted(true);
      setTimeout(() => {
        setFormData({});
        setFieldErrors({});
        setTouchedFields({});
      }, 2000);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to submit form';
      console.error('Submission error:', error.response?.data || error.message);
      toast.error(errorMsg);
      setFieldErrors({ _form: errorMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF' }}>
        <Loader />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: '1.5rem' }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ textAlign: 'center', maxWidth: '28rem' }} className="cmp-fadein">
          <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1.5rem', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1.875rem', fontWeight: 700, color: '#1C1917', marginBottom: '0.75rem' }}>Campaign Not Found</h1>
          <p style={{ fontFamily: "'Roboto', sans-serif", color: '#78716C', fontSize: '1rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            This campaign link may have expired or is no longer available.
          </p>
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '0.75rem', textAlign: 'left' }}>
              <p style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#1D4ED8', marginBottom: '0.25rem', fontWeight: 600 }}>Debug Info:</p>
              <p style={{ fontSize: '0.75rem', fontFamily: "'Roboto Mono', monospace", color: '#2563EB', wordBreak: 'break-all' }}>Campaign ID: {campaignId}</p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button onClick={() => window.location.href = '/'} className="cmp-btn-primary">Go to Dashboard</button>
            <button onClick={() => window.location.reload()} className="cmp-btn-outline">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  if (campaign.status !== 2) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', padding: '1.5rem' }}>
        <style>{GLOBAL_STYLES}</style>
        <div style={{ textAlign: 'center', maxWidth: '28rem' }} className="cmp-fadein">
          <div style={{ width: '4rem', height: '4rem', margin: '0 auto 1.5rem', borderRadius: '50%', background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1.875rem', fontWeight: 700, color: '#1C1917', marginBottom: '0.75rem' }}>Campaign Not Started</h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: '#78716C', fontSize: '1rem', lineHeight: 1.6 }}>
            This campaign is not currently accepting responses. It may not have started yet or has ended.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFFFFF 0%, #FAFAF9 50%, #F5F3F0 100%)', padding: '2.5rem 1rem 3rem' }}>
      <style>{GLOBAL_STYLES}</style>

      <div style={{ maxWidth: '38rem', margin: '0 auto' }}>

        {/* ── Hero ── */}
        {!success && (
          <div className="cmp-fadein" style={{ marginBottom: '1.75rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={{ width: '2.5rem', height: '2px', background: 'linear-gradient(90deg, #86EFAC, #16A34A)', borderRadius: '1px', marginBottom: '1rem' }} />
              <h1 style={{ fontFamily: "'Roboto', sans-serif", fontSize: '1.75rem', fontWeight: 700, color: '#1C1917', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>{campaign.title}</h1>
              {campaign.description && (
                <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.9375rem', color: '#78716C', margin: '0', lineHeight: 1.55 }}>{campaign.description}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Success Screen ── */}
        {(success || alreadySubmitted) && (
          <div className="cmp-fadein" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ width: '5rem', height: '5rem', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'cmp-scalein 0.45s cubic-bezier(.34,1.56,.64,1) both' }}>
              <img src="/image.png" alt="success" style={{ width: '48px', height: '48px' }} />
            </div>
            <h2 style={{ fontFamily: "'Roboto', sans-serif", fontSize: '2rem', fontWeight: 700, color: '#1C1917', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>
              Thank You!
            </h2>
            <p style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.9375rem', color: '#78716C', maxWidth: '26rem', margin: '0 auto 2rem', lineHeight: 1.6 }}>
              {alreadySubmitted
                ? 'You have already submitted your information for this campaign.'
                : "Your response has been recorded. We'll be in touch shortly."}
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 1rem', background: '#F0FDF4', border: '1px solid #d7edda', borderRadius: '999px' }}>
              <img src="/image.png" alt="verified" style={{ width: '16px', height: '16px' }} />
              <span style={{ fontFamily: "'Roboto', sans-serif", fontSize: '0.75rem', color: '#16A34A', fontWeight: 500 }}>Securely recorded</span>
            </div>
          </div>
        )}

        {/* ── Form Card ── */}
        {!success && (
          <div className="cmp-card cmp-fadein" style={{ animationDelay: '0.1s' }}>

            {/* Card header */}
            <div className="cmp-card-header">
              <h2 className="cmp-card-title">Share Your Details</h2>
              <p className="cmp-card-subtitle">All fields marked <span style={{ color: '#DC2626', fontWeight: 600 }}>*</span> are required</p>
            </div>

            {/* Form error */}
            {fieldErrors._form && (
              <div className="cmp-form-error cmp-shake">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px' }}>
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <div>
                  <p style={{ fontWeight: 600, color: '#991B1B' }}>{fieldErrors._form}</p>
                  <p style={{ fontSize: '0.75rem', color: '#B91C1C', marginTop: '0.2rem' }}>
                    {fieldErrors._form.includes('company')
                      ? 'The campaign has missing company info. Please contact the organizer.'
                      : 'Please check your information and try again.'}
                  </p>
                </div>
              </div>
            )}

            {/* Fields */}
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {campaign.formStructure?.map((field, idx) => {
                  const error = fieldErrors[field.name];
                  const isTouched = touchedFields[field.name];
                  const hasValue = formData[field.name] && (Array.isArray(formData[field.name]) ? formData[field.name].length > 0 : String(formData[field.name]).trim() !== '');
                  const isValid = !error && isTouched && hasValue;
                  const showError = error && isTouched;

                  const inputState = showError ? 'error' : isValid ? 'valid' : 'default';

                  return (
                    <div
                      key={field.name}
                      className="cmp-field-fadein"
                      style={{ animationDelay: `${0.15 + idx * 0.06}s` }}
                    >
                      {/* Label */}
                      <label className="cmp-label">
                        {field.label}
                        {field.isRequired && <span style={{ color: '#DC2626', marginLeft: '3px' }}>*</span>}
                        {isValid && (
                          <span className="cmp-valid-badge cmp-scalein">
                            <img src="/image.png" alt="valid" style={{ width: '20px', height: '20px' }} />
                          </span>
                        )}
                      </label>

                      {/* ── text / email / number / date ── */}
                      {['text', 'email', 'number', 'date'].includes(field.type) && (
                        <input
                          type={field.type}
                          name={field.name}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          onBlur={() => handleBlur(field.name)}
                          disabled={submitting}
                          className={`cmp-input cmp-input--${inputState}`}
                        />
                      )}

                      {/* ── textarea ── */}
                      {field.type === 'textarea' && (
                        <textarea
                          name={field.name}
                          placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                          value={formData[field.name] || ''}
                          onChange={(e) => handleChange(field.name, e.target.value)}
                          onBlur={() => handleBlur(field.name)}
                          disabled={submitting}
                          rows={4}
                          className={`cmp-input cmp-textarea cmp-input--${inputState}`}
                        />
                      )}

                      {/* ── dropdown ── */}
                      {field.type === 'dropdown' && (
                        <div className="cmp-select-wrap">
                          <select
                            name={field.name}
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={submitting}
                            className={`cmp-input cmp-select cmp-input--${inputState}`}
                          >
                            <option value="">Select {field.label}</option>
                            {field.options?.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                          <div className="cmp-select-arrow">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="6 9 12 15 18 9" />
                            </svg>
                          </div>
                        </div>
                      )}

                      {/* ── radio ── */}
                      {field.type === 'radio' && (
                        <div className="cmp-option-grid">
                          {field.options?.map(opt => {
                            const checked = formData[field.name] === opt;
                            return (
                              <label key={opt} className={`cmp-option-item${checked ? ' cmp-option-item--selected' : ''}`}>
                                <span className={`cmp-radio-dot${checked ? ' cmp-radio-dot--checked' : ''}`} />
                                <input
                                  type="radio"
                                  name={field.name}
                                  value={opt}
                                  checked={checked}
                                  onChange={(e) => handleChange(field.name, e.target.value)}
                                  onBlur={() => handleBlur(field.name)}
                                  disabled={submitting}
                                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                                />
                                <span className="cmp-option-label">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* ── checkbox ── */}
                      {field.type === 'checkbox' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                          {field.options?.map(opt => {
                            const checked = (formData[field.name] || []).includes(opt);
                            return (
                              <label key={opt} className={`cmp-option-item${checked ? ' cmp-option-item--selected' : ''}`}>
                                <span className={`cmp-checkbox-box${checked ? ' cmp-checkbox-box--checked' : ''}`}>
                                  {checked && (
                                    <img src="/image.png" alt="checked" style={{ width: '16px', height: '16px' }} />
                                  )}
                                </span>
                                <input
                                  type="checkbox"
                                  name={field.name}
                                  value={opt}
                                  checked={checked}
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
                                  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
                                />
                                <span className="cmp-option-label">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* Error */}
                      {showError && (
                        <div className="cmp-error-msg cmp-slidein">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                          </svg>
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Submit */}
              <div style={{ marginTop: '2rem' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cmp-submit"
                >
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem' }}>
                      <svg className="cmp-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting…
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                      Submit Response
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="cmp-submit-arrow">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  )}
                </button>

                <p style={{ marginTop: '1rem', textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: '0.75rem', color: '#A8A29E', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#A8A29E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Your information is private and secure
                </p>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontFamily: "'Satisfy', cursive", fontSize: '0.7rem', color: '#C1BAB3' }}>
          Cally
        </p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────
   Global styles — scoped via .cmp- prefix
───────────────────────────────────────────────────────────────── */
const GLOBAL_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&family=Roboto+Mono:wght@400;500&display=swap');

  /* ── Animations ── */
  @keyframes cmp-fadein {
    from { opacity: 0; transform: translateY(14px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes cmp-scalein {
    from { opacity: 0; transform: scale(0.7); }
    to   { opacity: 1; transform: scale(1);   }
  }
  @keyframes cmp-slidein {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes cmp-shake {
    0%,100% { transform: translateX(0);   }
    20%     { transform: translateX(-6px);}
    40%     { transform: translateX(6px); }
    60%     { transform: translateX(-4px);}
    80%     { transform: translateX(4px); }
  }
  @keyframes cmp-spin {
    to { transform: rotate(360deg); }
  }

  .cmp-fadein       { animation: cmp-fadein  0.55s cubic-bezier(.22,1,.36,1) both; }
  .cmp-scalein      { animation: cmp-scalein 0.3s  cubic-bezier(.34,1.56,.64,1) both; }
  .cmp-slidein      { animation: cmp-slidein 0.25s ease-out both; }
  .cmp-shake        { animation: cmp-shake   0.4s  ease-in-out; }
  .cmp-field-fadein { animation: cmp-fadein  0.5s  cubic-bezier(.22,1,.36,1) both; opacity: 0; }
  .cmp-spinner      { animation: cmp-spin    0.8s  linear infinite; }

  /* ── Hero ── */
  .cmp-hero {
    position: relative;
    background: transparent;
    border-radius: 0;
    padding: 0;
    overflow: visible;
  }

  /* ── Card (shadcn style) ── */
  .cmp-card {
    background: linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%);
    border-radius: 0.5rem;
    border: 1px solid #E7E1D8;
    box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.4) inset;
    overflow: hidden;
  }
  .cmp-card-header {
    padding: 1.5rem 1.75rem 1.25rem;
    border-bottom: 1px solid #EFEBE8;
  }
  @media (max-width: 480px) {
    .cmp-card-header { padding: 1.25rem 1.125rem 1rem; }
    .cmp-card form, .cmp-card > form { padding: 1.25rem 1.125rem 1.5rem; }
  }
  .cmp-card-title {
    font-family: 'Roboto', sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #1C1917;
    margin: 0 0 0.25rem;
    letter-spacing: -0.015em;
  }
  .cmp-card-subtitle {
    font-family: 'Roboto', sans-serif;
    font-size: 0.75rem;
    color: #A8A29E;
    margin: 0;
  }
  .cmp-card form {
    padding: 1.75rem;
  }
  @media (max-width: 480px) {
    .cmp-card form { padding: 1.25rem 1.125rem 1.5rem; }
  }

  /* ── Form error banner (shadcn style) ── */
  .cmp-form-error {
    margin: 0 1.75rem 1.25rem;
    padding: 0.875rem 1rem;
    background: #FFFAFB;
    border: 1px solid #F87171;
    border-radius: 0.4rem;
    display: flex;
    align-items: flex-start;
    gap: 0.625rem;
    font-family: 'Roboto', sans-serif;
    font-size: 0.8125rem;
  }
  @media (max-width: 480px) {
    .cmp-form-error { margin: 0 1.125rem 1rem; }
  }

  /* ── Label (shadcn style) ── */
  .cmp-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-family: 'Roboto', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #1C1917;
    margin-bottom: 0.5rem;
    letter-spacing: 0.003em;
  }
  .cmp-valid-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.375rem;
    height: 1.375rem;
    border-radius: 50%;
    background: transparent;
    color: #fff;
    margin-left: 0.25rem;
    flex-shrink: 0;
  }

  /* ── Input base (shadcn style) ── */
  .cmp-input {
    width: 100%;
    box-sizing: border-box;
    font-family: 'Roboto', sans-serif;
    font-size: 0.9375rem;
    font-weight: 400;
    color: #1C1917;
    padding: 0.75rem 0.875rem;
    border: 1px solid #D4D3CF;
    border-radius: 0.375rem;
    background: linear-gradient(180deg, #FAFAF9 0%, #FFFFFF 100%);
    transition: all 0.18s ease;
    outline: none;
    appearance: none;
  }
  .cmp-input::placeholder { color: #A8A29E; font-weight: 400; }
  .cmp-input:hover { 
    border-color: #C1BAB3; 
    background: linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%);
  }
  .cmp-input:focus {
    border-color: #78716C;
    background: linear-gradient(180deg, #FEFDFB 0%, #FFFAF8 100%);
    box-shadow: 0 0 0 3px rgba(120, 113, 108, 0.05), 0 0 0 1px rgba(255,255,255,0.3) inset;
  }
  .cmp-input:disabled { 
    opacity: 0.5; 
    cursor: not-allowed; 
    background: linear-gradient(180deg, #F5F0E8 0%, #EEEBE8 100%); 
  }

  .cmp-input--error {
    border-color: #F87171;
    background: linear-gradient(180deg, #FFFAFB 0%, #FFFBF9 100%);
  }
  .cmp-input--error:focus {
    border-color: #DC2626;
    background: linear-gradient(180deg, #FFFBF9 0%, #FFFDFC 100%);
    box-shadow: 0 0 0 3px rgba(220,38,38,0.05), 0 0 0 1px rgba(255,255,255,0.3) inset;
  }
  .cmp-input--valid {
    border-color: #86EFAC;
    background: linear-gradient(180deg, #F7FFFE 0%, #FFFBFD 100%);
  }
  .cmp-input--valid:focus {
    border-color: #16A34A;
    background: linear-gradient(180deg, #FFFCFB 0%, #FFFEF9 100%);
    box-shadow: 0 0 0 3px rgba(22,163,74,0.05), 0 0 0 1px rgba(255,255,255,0.3) inset;
  }

  .cmp-textarea { resize: vertical; min-height: 5.5rem; line-height: 1.5; }

  /* ── Select ── */
  .cmp-select-wrap { position: relative; }
  .cmp-select { padding-right: 2.5rem; cursor: pointer; }
  .cmp-select-arrow {
    position: absolute;
    right: 0.875rem;
    top: 50%;
    transform: translateY(-50%);
    color: #78716C;
    pointer-events: none;
    display: flex;
    align-items: center;
  }

  /* ── Radio & Checkbox option items ── */
  .cmp-option-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
    gap: 0.5rem;
  }
  @media (max-width: 360px) {
    .cmp-option-grid { grid-template-columns: 1fr; }
  }
  .cmp-option-item {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 0.875rem;
    border: 1px solid #D4D3CF;
    border-radius: 0.375rem;
    background: linear-gradient(180deg, #FAFAF9 0%, #FFFFFF 100%);
    cursor: pointer;
    transition: all 0.15s ease;
    user-select: none;
  }
  .cmp-option-item:hover {
    border-color: #78716C;
    background: linear-gradient(180deg, #FFFFFF 0%, #FAFAF9 100%);
    box-shadow: 0 0 0 1px rgba(120, 113, 108, 0.05) inset;
  }
  .cmp-option-item--selected {
    border-color: #78716C;
    background: linear-gradient(180deg, #FFFCF9 0%, #FAFAF9 100%);
    box-shadow: 0 0 0 2.5px rgba(120,113,108,0.06), 0 0 0 1px rgba(255,255,255,0.4) inset;
  }
  .cmp-option-label {
    font-family: 'Roboto', sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    color: #1C1917;
  }

  /* Radio dot */
  .cmp-radio-dot {
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    border: 1.5px solid #D4D3CF;
    background: #fff;
    flex-shrink: 0;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cmp-radio-dot--checked {
    border-color: #78716C;
    background: #78716C;
    box-shadow: inset 0 0 0 2.5px #fff;
  }

  /* Checkbox box */
  .cmp-checkbox-box {
    width: 1rem;
    height: 1rem;
    border-radius: 0.25rem;
    border: 1.5px solid #D4D3CF;
    background: #fff;
    flex-shrink: 0;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .cmp-checkbox-box--checked {
    border-color: #78716C;
    background: #78716C;
  }

  /* ── Error message (shadcn style) ── */
  .cmp-error-msg {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-top: 0.4rem;
    font-family: 'Roboto', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    color: #DC2626;
  }

  /* ── Submit button (shadcn style) ── */
  .cmp-submit {
    width: 100%;
    padding: 0.625rem 1.25rem;
    background: linear-gradient(180deg, #2D2926 0%, #1C1917 100%);
    color: #FAFAF9;
    font-family: 'Roboto', sans-serif;
    font-size: 0.9375rem;
    font-weight: 500;
    border: 1px solid #1C1917;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
    box-shadow: 0 1px 2px rgba(28,25,23,0.05);
    letter-spacing: 0.003em;
  }
  .cmp-submit:hover:not(:disabled) {
    background: linear-gradient(180deg, #3D3935 0%, #2D2926 100%);
    border-color: #2D2926;
    box-shadow: 0 3px 8px rgba(28,25,23,0.12), 0 0 0 1px rgba(255,255,255,0.1) inset;
  }
  .cmp-submit:active:not(:disabled) {
    box-shadow: 0 1px 2px rgba(28,25,23,0.05), 0 0 0 1px rgba(255,255,255,0.08) inset;
  }
  .cmp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .cmp-submit-arrow { transition: transform 0.15s ease; }
  .cmp-submit:hover:not(:disabled) .cmp-submit-arrow { transform: translateX(2px); }

  /* ── Utility buttons (error/inactive screens) ── */
  .cmp-btn-primary {
    padding: 0.625rem 1.25rem;
    background: #1C1917;
    color: #FAFAF9;
    font-family: 'Roboto', sans-serif;
    font-size: 0.9375rem;
    font-weight: 500;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .cmp-btn-primary:hover { background: #292524; }
  .cmp-btn-outline {
    padding: 0.625rem 1.25rem;
    background: transparent;
    color: #57534E;
    font-family: 'Roboto', sans-serif;
    font-size: 0.9375rem;
    font-weight: 500;
    border: 1px solid #D4D3CF;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;
  }
  .cmp-btn-outline:hover { background: #FAF9F7; border-color: #78716C; }
`;

export default PublicCampaignPage;
