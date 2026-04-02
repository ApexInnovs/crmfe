import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { createLead } from '../../api/campigneAndLeadApi';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';

const PublicCampaignPage = () => {
  const { campaignId } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const loadCampaign = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axiosInstance.get(`/campigne/${campaignId}`);
        setCampaign(response.data);
        // Initialize form data with empty values for each field
        const initialData = {};
        if (response.data?.formStructure) {
          response.data.formStructure.forEach(field => {
            initialData[field.name] = field.prefilledValue || '';
          });
        }
        setFormData(initialData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load campaign');
        console.error('Error loading campaign:', err);
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required fields
      const missingRequired = campaign?.formStructure
        ?.filter(f => f.isRequired && !formData[f.name])
        ?.map(f => f.label);

      if (missingRequired?.length > 0) {
        setError(`Required fields: ${missingRequired.join(', ')}`);
        setSubmitting(false);
        return;
      }

      // Create lead with form data
      const companyId = campaign?.company?._id || campaign?.company;
      if (!companyId) {
        setError('Campaign company information is missing');
        setSubmitting(false);
        return;
      }

      const leadPayload = {
        campigne: campaignId,
        leadData: formData,
        company: companyId,
        status: 'created'
      };

      await createLead(leadPayload);
      setSubmitted(true);
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({});
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit form. Please try again.');
      console.error('Error submitting form:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Loader />;

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Campaign Not Found</h1>
          <p className="text-gray-600">The campaign you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Campaign Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
              {campaign.title?.[0]?.toUpperCase() || 'C'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.title}</h1>
              {campaign.description && (
                <p className="text-gray-600 mt-1">{campaign.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
                  <path stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
              <p className="text-gray-600 mb-4">Your submission has been received. We'll be in touch soon.</p>
              <button
                onClick={() => setSubmitted(false)}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
              >
                Submit Another Response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              {campaign.formStructure && campaign.formStructure.length > 0 ? (
                <div className="space-y-5">
                  {campaign.formStructure.map((field) => (
                    <div key={field.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {field.label}
                        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.type === 'textarea' ? (
                        <textarea
                          name={field.name}
                          placeholder={field.placeholder || ''}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          required={field.isRequired}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                        />
                      ) : field.type === 'dropdown' ? (
                        <select
                          name={field.name}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          required={field.isRequired}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        >
                          <option value="">Select {field.label}</option>
                          {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'radio' ? (
                        <div className="space-y-2">
                          {field.options?.map(opt => (
                            <div key={opt} className="flex items-center">
                              <input
                                type="radio"
                                name={field.name}
                                value={opt}
                                checked={formData[field.name] === opt}
                                onChange={handleChange}
                                required={field.isRequired}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer"
                              />
                              <label className="ml-3 text-sm text-gray-700 cursor-pointer">{opt}</label>
                            </div>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            name={field.name}
                            checked={formData[field.name] || false}
                            onChange={handleChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                          />
                          <label className="ml-3 text-sm text-gray-700 cursor-pointer">{field.label}</label>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          name={field.name}
                          placeholder={field.placeholder || ''}
                          value={formData[field.name] || ''}
                          onChange={handleChange}
                          required={field.isRequired}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>This campaign has no form fields yet.</p>
                </div>
              )}

              {campaign.formStructure && campaign.formStructure.length > 0 && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && (
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by Client CRM</p>
        </div>
      </div>
    </div>
  );
};

export default PublicCampaignPage;
