import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useConfirm } from '../../context/ConfirmContext';
import toast from 'react-hot-toast';
import { Trash2, Edit, Plus, X, Save, Image as ImageIcon, Globe } from 'lucide-react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import DOMPurify from 'dompurify';

const AdminCrowdfunding = () => {
    const { showAlert, showConfirm } = useConfirm();
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [activeLang, setActiveLang] = useState('en');
    const [uploading, setUploading] = useState(false);

    const [formData, setFormData] = useState({
        title: '', title_hi: '', text: '', text_hi: '', imageUrl: '', order: 0, isVisible: true
    });

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            const { data } = await api.get('/content/crowdfunding');
            setSections(data);
        } catch (error) {
            console.error("Failed to fetch crowdfunding content", error);
            toast.error("Failed to load content");
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setUploading(true);
        try {
            const { data } = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, imageUrl: data.imageUrl });
            toast.success("Image uploaded!");
        } catch (error) {
            console.error('Upload failed', error);
            toast.error('Image upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleEdit = (section) => {
        setFormData({
            title: section.title || '',
            title_hi: section.title_hi || '',
            text: section.text || '',
            text_hi: section.text_hi || '',
            imageUrl: section.imageUrl || '',
            order: section.order || 0,
            isVisible: section.isVisible !== false
        });
        setEditingId(section._id);
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setFormData({
            title: '', title_hi: '', text: '', text_hi: '', imageUrl: '', order: 0, isVisible: true
        });
        setEditingId(null);
        setIsAdding(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await api.put(`/content/crowdfunding/${editingId}`, formData);
                toast.success("Section Updated!");
            } else {
                await api.post('/content/crowdfunding', formData);
                toast.success("Section Created!");
            }
            resetForm();
            fetchSections();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save section');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await showConfirm("Are you sure you want to delete this section?");
        if (!confirmed) return;

        try {
            await api.delete(`/content/crowdfunding/${id}`);
            toast.success("Section deleted!");
            fetchSections();
        } catch (error) {
            toast.error("Failed to delete section");
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>Crowdfunding Sections</h2>
                    <p style={{ color: '#64748b' }}>Manage the alternating text-image rows on the Home page.</p>
                </div>
                <button 
                    className="btn bg-primary text-white" 
                    onClick={() => { isAdding ? resetForm() : setIsAdding(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px', padding: '10px 20px' }}
                >
                    {isAdding ? <X size={20} /> : <Plus size={20} />}
                    {isAdding ? 'Cancel' : 'Add New Section'}
                </button>
            </div>

            {isAdding && (
                <div className="admin-card" style={{ marginBottom: '3rem', borderRadius: '20px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                    <div style={{ background: '#f8fafc', padding: '1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>{editingId ? 'Edit Section' : 'Create New Section'}</h4>
                        
                        {/* Language Toggle */}
                        <div style={{ background: '#e2e8f0', borderRadius: '999px', padding: '4px', display: 'flex' }}>
                            <button
                                type="button"
                                onClick={() => setActiveLang('en')}
                                style={{
                                    padding: '4px 16px', borderRadius: '999px', border: 'none',
                                    background: activeLang === 'en' ? 'white' : 'transparent',
                                    color: activeLang === 'en' ? 'var(--primary)' : '#64748b',
                                    fontWeight: activeLang === 'en' ? '700' : '500',
                                    cursor: 'pointer', fontSize: '0.85rem'
                                }}
                            >
                                English
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveLang('hi')}
                                style={{
                                    padding: '4px 16px', borderRadius: '999px', border: 'none',
                                    background: activeLang === 'hi' ? 'white' : 'transparent',
                                    color: activeLang === 'hi' ? 'var(--primary)' : '#64748b',
                                    fontWeight: activeLang === 'hi' ? '700' : '500',
                                    cursor: 'pointer', fontSize: '0.85rem'
                                }}
                            >
                                Hindi
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} style={{ padding: '2rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            {/* Text Content Column */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {activeLang === 'en' ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Title (English)</label>
                                            <input 
                                                className="form-input" 
                                                value={formData.title} 
                                                onChange={e => setFormData({...formData, title: e.target.value})} 
                                                placeholder="e.g. Help those in need"
                                                required 
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Text (English)</label>
                                            <div className="editor-wrapper">
                                                <CKEditor
                                                    editor={ClassicEditor}
                                                    data={formData.text}
                                                    onChange={(event, editor) => {
                                                        const data = editor.getData();
                                                        setFormData({ ...formData, text: data });
                                                    }}
                                                    config={{
                                                        placeholder: 'Enter detailed description...',
                                                        toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo']
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Title (Hindi)</label>
                                            <input 
                                                className="form-input" 
                                                value={formData.title_hi} 
                                                onChange={e => setFormData({...formData, title_hi: e.target.value})} 
                                                placeholder="शीर्षक हिंदी में"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Text (Hindi)</label>
                                            <div className="editor-wrapper">
                                                <CKEditor
                                                    editor={ClassicEditor}
                                                    data={formData.text_hi}
                                                    onChange={(event, editor) => {
                                                        const data = editor.getData();
                                                        setFormData({ ...formData, text_hi: data });
                                                    }}
                                                    config={{
                                                        placeholder: 'विवरण हिंदी में...',
                                                        toolbar: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'undo', 'redo']
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                                
                                <div className="form-group">
                                    <label className="form-label">Display Order</label>
                                    <input 
                                        type="number" 
                                        className="form-input" 
                                        value={formData.order} 
                                        onChange={e => setFormData({...formData, order: e.target.value})} 
                                    />
                                </div>
                            </div>

                            {/* Image Column */}
                            <div>
                                <label className="form-label">Section Image</label>
                                <div style={{ 
                                    border: '2px dashed #cbd5e1', 
                                    borderRadius: '16px', 
                                    padding: '1rem', 
                                    textAlign: 'center',
                                    height: '250px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: '#f8fafc',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {formData.imageUrl ? (
                                        <>
                                            <img src={formData.imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.2s' }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                                                <label htmlFor="file-upload" style={{ cursor: 'pointer', color: 'white', background: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '30px' }}>Change Image</label>
                                            </div>
                                        </>
                                    ) : (
                                        <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <ImageIcon size={48} color="#94a3b8" />
                                            <span style={{ marginTop: '1rem', color: '#64748b' }}>Click to upload image</span>
                                        </label>
                                    )}
                                    <input id="file-upload" type="file" style={{ display: 'none' }} onChange={handleFileChange} accept="image/*" />
                                    {uploading && <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Uploading...</div>}
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                            <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
                            <button type="submit" className="btn bg-primary text-white" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={18} />
                                {editingId ? 'Update Section' : 'Save Section'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order</th>
                            <th>Image</th>
                            <th>English Content</th>
                            <th>Hindi Content</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sections.length === 0 ? (
                            <tr><td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No sections found. Add one above!</td></tr>
                        ) : sections.map(section => (
                            <tr key={section._id}>
                                <td style={{ width: '80px', fontWeight: 700 }}>#{section.order}</td>
                                <td style={{ width: '120px' }}>
                                    <img src={section.imageUrl} alt="preview" style={{ width: '100px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                </td>
                                <td>
                                    <div style={{ fontWeight: 700 }}>{section.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.text?.substring(0, 100) || '') + '...' }}></div>
                                </td>
                                <td>
                                    <div style={{ fontWeight: 700 }}>{section.title_hi || '---'}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(section.text_hi?.substring(0, 100) || '') + '...' }}></div>
                                </td>
                                <td style={{ width: '150px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-outline" onClick={() => handleEdit(section)} style={{ padding: '6px' }} title="Edit">
                                            <Edit size={16} />
                                        </button>
                                        <button className="btn btn-outline" onClick={() => handleDelete(section._id)} style={{ padding: '6px', borderColor: '#fee2e2', color: '#ef4444' }} title="Delete">
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

export default AdminCrowdfunding;
