import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { Plus, Edit, Trash2, Search, HelpCircle, Eye, EyeOff } from 'lucide-react';
import './AdminDoctorFaq.css';

const AdminDoctorFaq = () => {
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [activeLang, setActiveLang] = useState('en');

    const [formData, setFormData] = useState({
        question: '',
        question_hi: '',
        answer: '',
        answer_hi: '',
        order: 0,
        isVisible: true
    });

    useEffect(() => {
        fetchFaqs();
    }, []);

    const fetchFaqs = async () => {
        try {
            const response = await api.get('/doctor-faqs');
            setFaqs(response.data);
        } catch (error) {
            toast.error('Failed to fetch FAQs');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.question.trim()) return toast.error('Question is required');
        if (!formData.answer.trim()) return toast.error('Answer is required');

        try {
            if (editingFaq) {
                await api.put(`/doctor-faqs/${editingFaq._id}`, formData);
                toast.success('FAQ updated successfully!');
            } else {
                await api.post('/doctor-faqs', formData);
                toast.success('FAQ created successfully!');
            }
            fetchFaqs();
            closeModal();
        } catch (error) {
            const msg = error.response?.data?.message || 'Error saving FAQ';
            toast.error(msg);
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;

        try {
            await api.delete(`/doctor-faqs/${id}`);
            toast.success('FAQ deleted successfully');
            fetchFaqs();
        } catch (error) {
            toast.error('Failed to delete FAQ');
            console.error(error);
        }
    };

    const toggleVisibility = async (faq) => {
        try {
            const updatedFaq = { ...faq, isVisible: !faq.isVisible };
            await api.put(`/doctor-faqs/${faq._id}`, updatedFaq);
            toast.success(`FAQ visibility updated`);
            fetchFaqs();
        } catch (error) {
            toast.error('Failed to update FAQ visibility');
            console.error(error);
        }
    };

    const openModal = (faq = null) => {
        if (faq) {
            setEditingFaq(faq);
            setFormData({
                question: faq.question || '',
                question_hi: faq.question_hi || '',
                answer: faq.answer || '',
                answer_hi: faq.answer_hi || '',
                order: faq.order !== undefined ? faq.order : 0,
                isVisible: faq.isVisible !== undefined ? faq.isVisible : true
            });
        } else {
            setEditingFaq(null);
            // Default order to next available
            const nextOrder = faqs.length > 0 ? Math.max(...faqs.map(f => f.order || 0)) + 1 : 1;
            setFormData({
                question: '',
                question_hi: '',
                answer: '',
                answer_hi: '',
                order: nextOrder,
                isVisible: true
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingFaq(null);
        setActiveLang('en');
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const filteredFaqs = faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (faq.question_hi && faq.question_hi.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (faq.answer_hi && faq.answer_hi.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return <div className="admin-faq-loading">Loading Doctor FAQs...</div>;
    }

    return (
        <div className="admin-faq">
            <div className="admin-faq-header">
                <div>
                    <h1>Doctor FAQs Management</h1>
                    <p className="subtitle">Configure Frequently Asked Questions shown on the Doctor Availability page</p>
                </div>
                <button className="btn-add-faq" onClick={() => openModal()}>
                    <Plus size={20} /> Add New FAQ
                </button>
            </div>

            {/* Toolbar Filters */}
            <div className="faq-toolbar">
                <div className="search-input-wrapper">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search FAQs by keywords..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {/* List Table / Cards Display */}
            {filteredFaqs.length === 0 ? (
                <div className="no-faqs-found">
                    <HelpCircle size={48} className="no-faqs-icon" />
                    <p>No FAQs found matching the search criteria.</p>
                </div>
            ) : (
                <div className="faq-list">
                    {filteredFaqs.map(faq => (
                        <div key={faq._id} className={`faq-card-admin ${!faq.isVisible ? 'hidden-faq' : ''}`}>
                            <div className="faq-card-header-admin">
                                <div className="faq-info-group">
                                    <span className="faq-order-badge">Order: {faq.order}</span>
                                    <span className={`visibility-badge ${faq.isVisible ? 'visible' : 'hidden'}`}>
                                        {faq.isVisible ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
                                    </span>
                                </div>
                                <div className="faq-actions-admin">
                                    <button 
                                        className="btn-toggle-visibility" 
                                        onClick={() => toggleVisibility(faq)}
                                        title={faq.isVisible ? 'Hide FAQ' : 'Show FAQ'}
                                    >
                                        {faq.isVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <button className="btn-edit-faq" onClick={() => openModal(faq)} title="Edit FAQ">
                                        <Edit size={16} />
                                    </button>
                                    <button className="btn-delete-faq" onClick={() => handleDelete(faq._id)} title="Delete FAQ">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="faq-card-body-admin">
                                <h3>Q: {faq.question}</h3>
                                {faq.question_hi && <h4 style={{ fontSize: '0.95rem', color: '#475569', marginTop: '2px', fontWeight: 'normal' }}>Q (Hindi): {faq.question_hi}</h4>}
                                <p style={{ marginTop: '8px' }}>A: {faq.answer}</p>
                                {faq.answer_hi && <p style={{ fontSize: '0.9rem', color: '#475569', marginTop: '2px' }}>A (Hindi): {faq.answer_hi}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                <h2>{editingFaq ? 'Edit Doctor FAQ' : 'Add New Doctor FAQ'}</h2>
                                <button className="modal-close" onClick={closeModal}>&times;</button>
                            </div>
                            
                            {/* Language Toggle */}
                            <div style={{ background: '#f1f5f9', borderRadius: '999px', padding: '4px', display: 'flex', border: '1px solid #cbd5e1' }}>
                                <button
                                    type="button"
                                    onClick={() => setActiveLang('en')}
                                    style={{
                                        padding: '6px 18px', borderRadius: '999px', border: 'none',
                                        background: activeLang === 'en' ? 'white' : 'transparent',
                                        color: activeLang === 'en' ? 'var(--primary)' : '#64748b',
                                        fontWeight: activeLang === 'en' ? '700' : '500',
                                        cursor: 'pointer', fontSize: '0.85rem',
                                        boxShadow: activeLang === 'en' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    English
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveLang('hi')}
                                    style={{
                                        padding: '6px 18px', borderRadius: '999px', border: 'none',
                                        background: activeLang === 'hi' ? 'white' : 'transparent',
                                        color: activeLang === 'hi' ? 'var(--primary)' : '#64748b',
                                        fontWeight: activeLang === 'hi' ? '700' : '500',
                                        cursor: 'pointer', fontSize: '0.85rem',
                                        boxShadow: activeLang === 'hi' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                    }}
                                >
                                    Hindi
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="faq-form">
                            {activeLang === 'en' ? (
                                <>
                                    <div className="form-group">
                                        <label>Question * (English)</label>
                                        <input
                                            type="text"
                                            name="question"
                                            value={formData.question}
                                            onChange={handleChange}
                                            placeholder="e.g. Do I need an appointment for the Government Hospital?"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Answer * (English)</label>
                                        <textarea
                                            name="answer"
                                            value={formData.answer}
                                            onChange={handleChange}
                                            placeholder="Enter the detailed answer in English..."
                                            rows="5"
                                            required
                                        />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="form-group">
                                        <label>Question (Hindi)</label>
                                        <input
                                            type="text"
                                            name="question_hi"
                                            value={formData.question_hi || ''}
                                            onChange={handleChange}
                                            placeholder="e.g. क्या मुझे सरकारी अस्पताल के लिए अपॉइंटमेंट की आवश्यकता है?"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Answer (Hindi)</label>
                                        <textarea
                                            name="answer_hi"
                                            value={formData.answer_hi || ''}
                                            onChange={handleChange}
                                            placeholder="विवरण हिंदी में दर्ज करें..."
                                            rows="5"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-row-admin-faq">
                                <div className="form-group">
                                    <label>Display Order</label>
                                    <input
                                        type="number"
                                        name="order"
                                        value={formData.order}
                                        onChange={handleChange}
                                        min="0"
                                        placeholder="0"
                                    />
                                    <small className="help-text">Lowest order numbers appear first</small>
                                </div>

                                <div className="form-group checkbox-admin">
                                    <label className="checkbox-label-admin">
                                        <input
                                            type="checkbox"
                                            name="isVisible"
                                            checked={formData.isVisible}
                                            onChange={handleChange}
                                        />
                                        <span>Show on Doctor Page</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-actions-admin">
                                <button type="button" className="btn-cancel-admin" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-submit-admin">
                                    {editingFaq ? 'Update FAQ' : 'Create FAQ'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDoctorFaq;
