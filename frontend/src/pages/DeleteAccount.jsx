import React, { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import api from '../services/api';
import './DeleteAccount.css';

export default function DeleteAccount() {
  const [formStep, setFormStep] = useState('info'); // 'info' | 'form' | 'submitted'
  const [formData, setFormData] = useState({ name: '', mobile: '', reason: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.mobile) {
      setError('Name and mobile number are required.');
      return;
    }
    if (!/^[6-9]\d{9}$/.test(formData.mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await api.post('/users/request-account-deletion', formData);
      setFormStep('submitted');
    } catch (err) {
      const status = err.response?.status;
      if (status >= 500 || !err.response) {
        setError('Our server is temporarily unavailable. Please try again later or email us directly at thedharmarth@gmail.com');
      } else {
        setError(err.response?.data?.message || 'Submission failed. Please email us directly at thedharmarth@gmail.com');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="da-page">
      <Navbar />

      {/* Page Title Strip */}
      <div className="da-page-title-strip">
        <span className="da-page-title-label">Account &amp; Data Deletion Policy</span>
      </div>

      <div className="da-container">

        {/* Intro */}
        <div className="da-intro-card">
          <div className="da-intro-icon">🗑️</div>
          <h2 className="da-section-title">Account &amp; Data Deletion</h2>
          <p className="da-intro-text">
            We respect your right to control your personal data. If you have an account with The DharmArth Foundation
            mobile app, you can request permanent deletion of your account and associated personal data at any time.
          </p>
        </div>

        {/* How to delete from app */}
        <div className="da-card">
          <h3 className="da-card-title">
            <span className="da-step-num">📱</span> Delete From the App (Fastest)
          </h3>
          <p className="da-card-desc">
            The easiest way to delete your account is directly from our mobile app:
          </p>
          <ol className="da-steps">
            <li><strong>Open</strong> the DharmArth Foundation app</li>
            <li>Tap the <strong>Profile</strong> tab from the bottom navigation</li>
            <li>Scroll down to find the <strong>"Danger Zone"</strong> section</li>
            <li>Tap <strong>"Delete My Account"</strong></li>
            <li>Read the important information and enter your <strong>reason (optional)</strong></li>
            <li>Tap <strong>"Send OTP to Confirm"</strong> — you'll receive an OTP on your registered WhatsApp</li>
            <li>Enter the OTP and confirm deletion</li>
            <li>Your account will be deleted immediately</li>
          </ol>
        </div>

        {/* What gets deleted */}
        <div className="da-card">
          <h3 className="da-card-title">📋 What Happens to Your Data</h3>

          <div className="da-data-grid">
            <div className="da-data-col da-deleted">
              <div className="da-data-col-header">
                <span className="da-badge da-badge-red">Permanently Deleted</span>
              </div>
              <ul>
                <li>✗ Your profile (name, email, phone)</li>
                <li>✗ Login credentials and password</li>
                <li>✗ Prescriptions and medical records</li>
                <li>✗ Saved delivery addresses</li>
                <li>✗ App notifications</li>
                <li>✗ Profile photo</li>
                <li>✗ Bank account details</li>
              </ul>
            </div>

            <div className="da-data-col da-retained">
              <div className="da-data-col-header">
                <span className="da-badge da-badge-amber">Retained for Legal Records</span>
              </div>
              <ul>
                <li>📋 Donation history (required for 80G tax certificates)</li>
                <li>📋 Commission and referral transaction records</li>
                <li>📋 Completed order history (pharmacy audit)</li>
                <li>📋 Financial transaction logs</li>
              </ul>
              <p className="da-retained-note">
                Financial and donation records are retained as required by Indian tax law (IT Act) and to protect
                other users who received 80G donation certificates.
              </p>
            </div>
          </div>
        </div>

        {/* Wallet balance */}
        <div className="da-notice da-notice-purple">
          <span className="da-notice-icon">💜</span>
          <div>
            <strong>Wallet Balance on Deletion</strong>
            <p>
              If you have any remaining wallet balance at the time of account deletion, it will be automatically
              donated to The DharmArth Foundation. You will be informed of this amount before confirming deletion.
            </p>
          </div>
        </div>

        {/* Blockers */}
        <div className="da-card">
          <h3 className="da-card-title">⚠️ Conditions for Deletion</h3>
          <p className="da-card-desc">Account deletion may be temporarily blocked if:</p>
          <ul className="da-block-list">
            <li>
              <span className="da-block-icon">📦</span>
              <div>
                <strong>Active Orders:</strong> You have pending or in-transit medicine orders. Please wait for delivery or contact support to cancel.
              </div>
            </li>
            <li>
              <span className="da-block-icon">💰</span>
              <div>
                <strong>Pending Payouts:</strong> You are a Motivator with pending withdrawal requests. Please wait for processing.
              </div>
            </li>
            <li>
              <span className="da-block-icon">🔄</span>
              <div>
                <strong>Active Subscriptions:</strong> You have an active monthly donation subscription. Please cancel it first from the Subscriptions section.
              </div>
            </li>
          </ul>
        </div>

        {/* Deletion timeline */}
        <div className="da-notice da-notice-teal">
          <span className="da-notice-icon">⏱️</span>
          <div>
            <strong>Processing Time</strong>
            <p>Account deletion takes effect immediately upon OTP confirmation. Financial records may be retained indefinitely as required by law.</p>
          </div>
        </div>

        {/* Manual request form */}
        <div className="da-card da-form-card" id="manual-request">
          <h3 className="da-card-title">📝 Request Manual Deletion</h3>
          <p className="da-card-desc">
            Don't have app access? Submit a manual deletion request below and our team will process it within <strong>7 working days</strong>.
          </p>

          {formStep === 'info' && (
            <button className="da-btn da-btn-outline" onClick={() => setFormStep('form')}>
              Submit Manual Request
            </button>
          )}

          {formStep === 'form' && (
            <form className="da-form" onSubmit={handleSubmit}>
              <div className="da-form-group">
                <label>Full Name <span className="da-required">*</span></label>
                <input
                  type="text"
                  placeholder="Enter your registered name"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div className="da-form-group">
                <label>Registered Mobile Number <span className="da-required">*</span></label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.mobile}
                  onChange={e => setFormData(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                  maxLength={10}
                  required
                />
              </div>
              <div className="da-form-group">
                <label>Reason (Optional)</label>
                <textarea
                  placeholder="Tell us why you'd like to delete your account..."
                  value={formData.reason}
                  onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
                  maxLength={300}
                  rows={3}
                />
              </div>
              {error && <p className="da-form-error">{error}</p>}
              <div className="da-form-actions">
                <button type="button" className="da-btn da-btn-ghost" onClick={() => setFormStep('info')}>
                  Cancel
                </button>
                <button type="submit" className="da-btn da-btn-danger" disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Deletion Request'}
                </button>
              </div>
            </form>
          )}

          {formStep === 'submitted' && (
            <div className="da-success">
              <div className="da-success-icon">✅</div>
              <h4>Request Received</h4>
              <p>
                We've received your account deletion request. Our team will verify your identity and process it
                within <strong>7 working days</strong>. You will receive a WhatsApp confirmation.
              </p>
            </div>
          )}
        </div>

        {/* Contact */}
        <div className="da-contact">
          <p>Questions? Email us at <a href="mailto:thedharmarth@gmail.com">thedharmarth@gmail.com</a></p>
          <p className="da-contact-sub">The DharmArth Foundation · Registered Non-Profit · India</p>
        </div>

      </div>
    </div>
  );
}
