import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

const AdminFAQs = () => {
    const { showConfirm } = useConfirm();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formLang, setFormLang] = useState('en'); // 'en' | 'hi'

    // Form State — includes Hindi fields
    const [formData, setFormData] = useState({
        question: '',
        answer: '',
        question_hi: '',
        answer_hi: '',
        order: 0,
        isVisible: true
    });

    useEffect(() => {
        fetchFAQs();
    }, []);

    const fetchFAQs = async () => {
        try {
            const { data } = await api.get('/content/faqs');
            setFaqs(data);
        } catch (error) {
            console.error("Failed to fetch FAQs", error);
            toast.error("Failed to load FAQs");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (faq) => {
        setFormData({
            question: faq.question || '',
            answer: faq.answer || '',
            question_hi: faq.question_hi || '',
            answer_hi: faq.answer_hi || '',
            order: faq.order || 0,
            isVisible: faq.isVisible !== false
        });
        setEditingId(faq._id);
        setIsAdding(true);
        setFormLang('en');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({ question: '', answer: '', question_hi: '', answer_hi: '', order: 0, isVisible: true });
        setEditingId(null);
        setIsAdding(false);
        setFormLang('en');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/content/faqs/${editingId}`, formData);
                toast.success("FAQ Updated!");
            } else {
                await api.post('/content/faqs', formData);
                toast.success("FAQ Created!");
            }
            resetForm();
            fetchFAQs();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save FAQ');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm("Delete FAQ?", "Are you sure you want to remove this question?");
        if (!confirmed) return;
        try {
            await api.delete(`/content/faqs/${id}`);
            toast.success("FAQ deleted!");
            fetchFAQs();
        } catch (error) {
            toast.error("Failed to delete FAQ");
        }
    };

    if (loading) return <div className="p-8 text-center">Loading FAQs...</div>;

    // Tab styles
    const tabStyle = (active) => ({
        padding: '8px 20px',
        borderRadius: '8px',
        fontWeight: 700,
        fontSize: '0.9rem',
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.2s',
        backgroundColor: active ? '#00bfa5' : '#f1f5f9',
        color: active ? 'white' : '#64748b',
    });

    return (
        <div className="admin-faqs">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>FAQ Management</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '5px 0 0 0' }}>Manage bilingual questions and answers for the home page</p>
                </div>
                <button
                    className="btn bg-primary text-white"
                    onClick={() => isAdding ? resetForm() : setIsAdding(true)}
                >
                    {isAdding ? <X size={18} /> : <Plus size={18} />}
                    {isAdding ? 'Cancel' : 'Add New FAQ'}
                </button>
            </div>

            {isAdding && (
                <div className="admin-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0 }}>{editingId ? 'Edit FAQ' : 'Create New FAQ'}</h4>
                        {/* Language Tabs */}
                        <div style={{ display: 'flex', gap: 8, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
                            <button type="button" style={tabStyle(formLang === 'en')} onClick={() => setFormLang('en')}>
                                🇬🇧 English
                            </button>
                            <button type="button" style={tabStyle(formLang === 'hi')} onClick={() => setFormLang('hi')}>
                                🇮🇳 हिंदी
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {formLang === 'en' ? (
                            <>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ fontWeight: '600' }}>Question (English)</label>
                                    <input
                                        className="form-input"
                                        placeholder="Enter the question in English..."
                                        value={formData.question}
                                        onChange={e => setFormData({ ...formData, question: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ fontWeight: '600' }}>Answer (English)</label>
                                    <textarea
                                        className="form-input"
                                        style={{ minHeight: '120px' }}
                                        placeholder="Enter the detailed answer in English..."
                                        value={formData.answer}
                                        onChange={e => setFormData({ ...formData, answer: e.target.value })}
                                        required
                                    />
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ fontWeight: '600' }}>प्रश्न (हिंदी)</label>
                                    <input
                                        className="form-input"
                                        placeholder="हिंदी में प्रश्न दर्ज करें..."
                                        value={formData.question_hi}
                                        onChange={e => setFormData({ ...formData, question_hi: e.target.value })}
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label" style={{ fontWeight: '600' }}>उत्तर (हिंदी)</label>
                                    <textarea
                                        className="form-input"
                                        style={{ minHeight: '120px' }}
                                        placeholder="हिंदी में विस्तृत उत्तर दर्ज करें..."
                                        value={formData.answer_hi}
                                        onChange={e => setFormData({ ...formData, answer_hi: e.target.value })}
                                    />
                                </div>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1rem' }}>
                                    💡 Hindi fields are optional. If left blank, English content will be shown to Hindi users.
                                </p>
                            </>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <div className="form-group">
                                <label className="form-label" style={{ fontWeight: '600' }}>Display Order</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={formData.order}
                                    onChange={e => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '25px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem', color: '#475569' }}>
                                    <input
                                        type="checkbox"
                                        style={{ marginRight: '10px', width: '18px', height: '18px' }}
                                        checked={formData.isVisible}
                                        onChange={e => setFormData({ ...formData, isVisible: e.target.checked })}
                                    />
                                    Visible on website
                                </label>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn bg-primary text-white" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                <Save size={18} />
                                {editingId ? 'Update FAQ' : 'Save FAQ'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '60px' }}>Order</th>
                            <th>Question / Answer</th>
                            <th style={{ width: '100px' }}>Hindi</th>
                            <th style={{ width: '100px' }}>Status</th>
                            <th style={{ width: '140px', textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {faqs.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    No FAQs found. Add one to get started!
                                </td>
                            </tr>
                        ) : faqs.map(faq => (
                            <tr key={faq._id}>
                                <td style={{ fontWeight: 'bold' }}>{faq.order}</td>
                                <td>
                                    <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '4px' }}>{faq.question}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                        {faq.answer}
                                    </div>
                                    {faq.question_hi && (
                                        <div style={{ marginTop: 6, fontSize: '0.82rem', color: '#6366f1', fontWeight: 600 }}>
                                            🇮🇳 {faq.question_hi}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '700',
                                        backgroundColor: faq.question_hi ? '#ede9fe' : '#f1f5f9',
                                        color: faq.question_hi ? '#6366f1' : '#94a3b8'
                                    }}>
                                        {faq.question_hi ? '✓ Added' : '— None'}
                                    </span>
                                </td>
                                <td>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '999px',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        backgroundColor: faq.isVisible ? '#ecfdf5' : '#fef2f2',
                                        color: faq.isVisible ? '#059669' : '#dc2626'
                                    }}>
                                        {faq.isVisible ? 'Visible' : 'Hidden'}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '6px', minWidth: 'auto' }}
                                            onClick={() => handleEdit(faq)}
                                            title="Edit"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className="btn btn-outline"
                                            style={{ padding: '6px', minWidth: 'auto', color: '#ef4444', borderColor: '#fee2e2' }}
                                            onClick={() => handleDelete(faq._id)}
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminFAQs;
