import React from 'react';
import { Link } from 'react-router-dom';

const AuthFooter = () => {
    return (
        <div className="auth-footer">
            <div className="auth-footer-links">
                <Link to="/privacy-policy" className="auth-footer-link">Privacy Policy</Link>
                <span className="divider">•</span>
                <Link to="/terms-conditions" className="auth-footer-link">Terms & Conditions</Link>
                <span className="divider">•</span>
                <Link to="/support" className="auth-footer-link">Support</Link>
            </div>
            <p className="auth-footer-copy">© {new Date().getFullYear()} The Dharmarth Foundation. All rights reserved.</p>
        </div>
    );
};

export default AuthFooter;
