import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Globe, Layout, X, Save, ArrowRight, ArrowUp, ArrowDown, Layers, Settings, Shield, Image, Type, HelpCircle, UserCheck, Megaphone, Grid, Play, BarChart3, ChevronRight, Check, Mail, ListChecks, FileText } from 'lucide-react';
import api from '../../../services/api';
import ConfirmationModal from '../../../components/admin/ConfirmationModal';
import toast from 'react-hot-toast';
import './CMS.css';

const AVAILABLE_COMPONENTS = [
    {
        type: 'slider',
        name: 'Slider / Banner',
        icon: Image,
        defaultData: {
            title: 'Welcome to Our Foundation',
            sliderType: 'hero',
            slides: [{
                title: 'Making a Difference',
                subtitle: 'Join our mission to provide direct support to those in need.',
                image: '',
                buttonText: 'Get Involved',
                buttonLink: '/join',
                contentPosition: 'left-center',
                titleColor: '#ffffff',
                subtitleColor: '#f1f5f9',
                btnBgColor: '#00bfa5',
                btnTextColor: '#ffffff'
            }]
        }
    },
    {
        type: 'faq',
        name: 'FAQ / Questions',
        icon: HelpCircle,
        defaultData: {
            title: 'Frequently Asked Questions',
            items: [{ question: 'How to help?', answer: 'You can help by donating or volunteering.' }]
        }
    },
    {
        type: 'text_block',
        name: 'Simple Text Content',
        icon: Type,
        defaultData: {
            title: 'About Us',
            content: 'We are a foundation dedicated to...',
            alignment: 'left'
        }
    },
    {
        type: 'testimonial',
        name: 'User Testimonials',
        icon: UserCheck,
        defaultData: {
            title: 'What People Say',
            items: [{ name: 'John Doe', text: 'Amazing experience!', rating: 5, photo: '' }]
        }
    },
    {
        type: 'cta',
        name: 'Call to Action (CTA)',
        icon: Megaphone,
        defaultData: {
            title: 'Join Us Today',
            subtitle: 'Make an impact now',
            buttonText: 'Donate',
            buttonLink: '/donate',
            buttonPosition: 'left',
            image: ''
        }
    },
    {
        type: 'features',
        name: 'Feature Grid',
        icon: Grid,
        defaultData: {
            title: 'Our Impact',
            items: [{ title: 'Transparency', description: 'We show everything', icon: 'Shield' }]
        }
    },
    {
        type: 'gallery',
        name: 'Image Gallery',
        icon: Image,
        defaultData: {
            title: 'Our Work',
            images: ['https://images.unsplash.com/photo-1488521787991-ed7bbaae773c']
        }
    },
    {
        type: 'video',
        name: 'Video Embed',
        icon: Play,
        defaultData: {
            title: 'Watch our Story',
            videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
        }
    },
    {
        type: 'stats',
        name: 'Stats & Counters',
        icon: BarChart3,
        defaultData: {
            items: [{ label: 'Lives Impacted', value: '1M+', icon: 'Heart' }]
        }
    },
    {
        type: 'contact_form',
        name: 'Interactive Contact Form',
        icon: Mail,
        defaultData: {
            title: 'Get in Touch',
            subtitle: 'Have questions? We are here to help you.'
        }
    },
    {
        type: 'process',
        name: 'Process Timeline',
        icon: ListChecks,
        defaultData: {
            title: 'How It Works',
            subtitle: 'Get started in just a few simple steps.',
            steps: [
                { title: 'Register', description: 'Create your account in seconds.' },
                { title: 'Verify', description: 'Complete your profile verification.' },
                { title: 'Earn', description: 'Start your mission and earn rewards.' }
            ]
        }
    },
    {
        type: 'info_accordion',
        name: 'Documentation Accordion',
        icon: FileText,
        defaultData: {
            title: 'Guides & Documentation',
            subtitle: 'Detailed information about our programs.',
            items: [
                { title: 'Program Overview', content: 'Details about the program go here...' }
            ]
        }
    }
];

const PageManager = () => {
    const [pages, setPages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBuilderOpen, setIsBuilderOpen] = useState(false);
    const [isCompPickerOpen, setIsCompPickerOpen] = useState(false);
    const [isDataEditorOpen, setIsDataEditorOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [editingPage, setEditingPage] = useState(null);
    const [formData, setFormData] = useState({
        title: '',
        slug: '',
        status: 'draft',
        seo: { metaTitle: '', metaDescription: '' },
        components: []
    });
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

    useEffect(() => {
        fetchPages();
    }, []);

    const fetchPages = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/cms/pages');
            setPages(data);
        } catch (error) {
            toast.error("Failed to fetch pages");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingPage) {
                await api.put(`/cms/pages/${editingPage._id}`, formData);
                toast.success("Page updated");
            } else {
                await api.post('/cms/pages', formData);
                toast.success("Page created");
            }
            setIsModalOpen(false);
            setIsBuilderOpen(false);
            fetchPages();
        } catch (error) {
            toast.error(error.response?.data?.message || "Operation failed");
        }
    };

    const handleDelete = async (id) => {
        setConfirmDelete({ isOpen: true, id });
    };

    const executeDelete = async () => {
        try {
            await api.delete(`/cms/pages/${confirmDelete.id}`);
            toast.success("Page deleted");
            fetchPages();
        } catch (error) {
            toast.error("Delete failed");
        } finally {
            setConfirmDelete({ isOpen: false, id: null });
        }
    };

    const openEdit = (page) => {
        setEditingPage(page);
        setFormData(page);
        setIsModalOpen(true);
    };

    const openBuilder = (page) => {
        setEditingPage(page);
        setFormData(page);
        setIsBuilderOpen(true);
    };

    const addComponentToPage = (compType) => {
        const compDef = AVAILABLE_COMPONENTS.find(c => c.type === compType);
        const newComp = {
            type: compType,
            data: { ...compDef.defaultData },
            order: formData.components.length,
            config: {}
        };
        setFormData({ ...formData, components: [...formData.components, newComp] });
        setIsCompPickerOpen(false);
        toast.success(`Added ${compDef.name}`);
    };

    const moveComponent = (index, direction) => {
        const newComps = [...formData.components];
        if (direction === 'up' && index > 0) {
            [newComps[index], newComps[index - 1]] = [newComps[index - 1], newComps[index]];
        } else if (direction === 'down' && index < newComps.length - 1) {
            [newComps[index], newComps[index + 1]] = [newComps[index + 1], newComps[index]];
        }
        setFormData({ ...formData, components: newComps.map((c, i) => ({ ...c, order: i })) });
    };

    const removeComponent = (index) => {
        const newComps = formData.components.filter((_, i) => i !== index);
        setFormData({ ...formData, components: newComps.map((c, i) => ({ ...c, order: i })) });
    };

    const openDataEditor = (index) => {
        const comp = formData.components[index];
        const def = AVAILABLE_COMPONENTS.find(c => c.type === comp.type);

        if (def) {
            // Merge top-level keys
            const mergedData = { ...def.defaultData, ...comp.data };

            // Merge array item keys (e.g., slides, items)
            Object.keys(mergedData).forEach(key => {
                if (Array.isArray(mergedData[key]) && def.defaultData[key] && def.defaultData[key].length > 0) {
                    const defaultItem = def.defaultData[key][0];
                    mergedData[key] = mergedData[key].map(item => ({ ...defaultItem, ...item }));
                }
            });

            const newComps = [...formData.components];
            newComps[index].data = mergedData;
            setFormData({ ...formData, components: newComps });
        }

        setEditingIndex(index);
        setIsDataEditorOpen(true);
    };

    const updateCompData = (newData) => {
        const newComps = [...formData.components];
        newComps[editingIndex].data = newData;
        setFormData({ ...formData, components: newComps });
    };

    return (
        <div className="page-manager">
            {/* Header removed as it is handled by CMSDashboard */}

            {!loading && pages.length > 0 && (
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => { setEditingPage(null); setFormData({ title: '', slug: '', status: 'draft', seo: { metaTitle: '', metaDescription: '' }, components: [] }); setIsModalOpen(true); }}
                        className="cms-btn cms-btn-primary shadow-lg shadow-teal-500/10"
                        style={{ borderRadius: '12px' }}
                    >
                        <Plus size={18} /> New Page
                    </button>
                </div>
            )}

            {loading ? (
                <div className="p-20 text-center">
                    <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading your content...</p>
                </div>
            ) : (
                <>
                    {pages.length === 0 ? (
                        <div className="bg-white rounded-[2rem] border border-dashed border-gray-200 p-20 text-center shadow-sm">
                            <div className="w-24 h-24 bg-teal-50 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-8">

                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">No pages yet</h3>

                            <button
                                onClick={() => { setEditingPage(null); setFormData({ title: '', slug: '', status: 'draft', seo: { metaTitle: '', metaDescription: '' }, components: [] }); setIsModalOpen(true); }}
                                className="cms-btn cms-btn-primary mx-auto shadow-xl shadow-teal-500/20"
                                style={{ padding: '14px 40px', borderRadius: '50px' }}
                            >
                                <Plus size={20} /> Create Your First Page
                            </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                            <table className="data-table w-full">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Title & URL Path</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Structure</th>
                                        <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Manage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pages.map(page => (
                                        <tr key={page._id} className="hover:bg-teal-50/30 transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="font-bold text-gray-900 text-lg">{page.title}</div>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <Globe size={12} className="text-teal-500" />
                                                    <span className="text-xs text-teal-600 font-mono font-medium">/p/{page.slug}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${page.status === 'published' ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${page.status === 'published' ? 'bg-teal-500' : 'bg-gray-400'}`} />
                                                    {page.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold bg-gray-50 w-fit px-3 py-1 rounded-lg">
                                                    <Layers size={14} className="text-teal-500" />
                                                    {page.components?.length || 0} Block{page.components?.length !== 1 ? 's' : ''}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => openBuilder(page)} className="cms-action-btn w-10 h-10 rounded-xl bg-white text-gray-400 hover:text-teal-600 hover:bg-teal-50 shadow-sm transition-all" title="Open Page Builder">
                                                        <Layout size={18} />
                                                    </button>
                                                    <button onClick={() => openEdit(page)} className="cms-action-btn w-10 h-10 rounded-xl bg-white text-gray-400 hover:text-teal-600 hover:bg-teal-50 shadow-sm transition-all" title="Page Settings">
                                                        <Settings size={18} />
                                                    </button>
                                                    <button onClick={() => handleDelete(page._id)} className="cms-action-btn w-10 h-10 rounded-xl bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 shadow-sm transition-all" title="Delete Page">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}

            {/* Modal for Page Metadata */}
            {isModalOpen && (
                <div className="cms-modal-overlay">
                    <div className="cms-modal-content">
                        <div className="cms-modal-header">
                            <h3>{editingPage ? 'Page Settings' : 'Create New Page'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="icon-btn"><X size={20} /></button>
                        </div>
                        <div className="cms-modal-body">
                            <div className="cms-form-grid">
                                <div className="cms-form-group full-width">
                                    <label className="cms-label">Internal Page Title</label>
                                    <input type="text" className="cms-input" placeholder="e.g. Join and Earn" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
                                </div>
                                <div className="cms-form-group">
                                    <label className="cms-label">URL Slug</label>
                                    <input type="text" className="cms-input font-mono" placeholder="join-and-earn" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/ /g, '-') })} />
                                </div>
                                <div className="cms-form-group">
                                    <label className="cms-label">Status</label>
                                    <select className="cms-select" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                    </select>
                                </div>
                            </div>
                            <div className="cms-section-title"><Shield size={18} /> SEO & Metadata</div>
                            <div className="cms-form-group">
                                <label className="cms-label">Meta Title</label>
                                <input type="text" className="cms-input" value={formData.seo.metaTitle} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaTitle: e.target.value } })} />
                            </div>
                            <div className="cms-form-group">
                                <label className="cms-label">Meta Description</label>
                                <textarea className="cms-textarea" value={formData.seo.metaDescription} onChange={(e) => setFormData({ ...formData, seo: { ...formData.seo, metaDescription: e.target.value } })} />
                            </div>
                        </div>
                        <div className="cms-modal-footer">
                            <button onClick={() => setIsModalOpen(false)} className="cms-btn ">Cancel</button>
                            <button onClick={handleSave} className="cms-btn cms-btn-primary"><Save size={18} /> Save</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Page Builder */}
            {isBuilderOpen && (
                <div className="cms-modal-overlay">
                    <div className="cms-modal-content large">
                        <div className="cms-builder-header">
                            <div className="flex items-center gap-6">
                                <button onClick={() => setIsBuilderOpen(false)} className="close-btn" title="Close Builder">
                                    <X size={22} />
                                </button>
                                <div>
                                    <h3>{formData.title}</h3>
                                    <span className="slug-badge">/p/{formData.slug}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSave} className="save-btn">
                                    <Save size={20} /> Save Page Structure
                                </button>
                            </div>
                        </div>

                        <div className="cms-builder-container">
                            <div className="cms-builder-canvas">
                                <div className="max-w-2xl mx-auto py-10">
                                    <div className="space-y-4">
                                        {formData.components.map((pageComp, idx) => {
                                            const def = AVAILABLE_COMPONENTS.find(c => c.type === pageComp.type);
                                            return (
                                                <div key={idx} className="cms-layout-item group">
                                                    <div className="cms-item-controls">
                                                        <button onClick={() => moveComponent(idx, 'up')} className="cms-control-btn" disabled={idx === 0}><ArrowUp size={16} /></button>
                                                        <button onClick={() => moveComponent(idx, 'down')} className="cms-control-btn" disabled={idx === formData.components.length - 1}><ArrowDown size={16} /></button>
                                                    </div>
                                                    <div className="cms-item-info cursor-pointer" onClick={() => openDataEditor(idx)}>
                                                        <span className="type-label">{pageComp.type}</span>
                                                        <h4 className="flex items-center gap-3">
                                                            {def?.icon && <div className="p-2 bg-teal-50 text-teal-600 rounded-lg"><def.icon size={18} /></div>}
                                                            {def?.name}
                                                        </h4>
                                                    </div>
                                                    <div className="cms-item-actions">
                                                        <button onClick={() => openDataEditor(idx)} className="cms-action-btn edit" title="Edit Content"><Edit2 size={18} /></button>
                                                        <button onClick={() => removeComponent(idx)} className="cms-action-btn delete" title="Remove Block"><Trash2 size={18} /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <button onClick={() => setIsCompPickerOpen(true)} className="w-full py-12 border-2 border-dashed border-gray-200 rounded-[2rem] text-gray-400 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/30 transition-all flex flex-col items-center justify-center gap-4 group">
                                            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-teal-500 group-hover:text-white transition-all duration-300">
                                                <Plus size={32} />
                                            </div>
                                            <span className="font-bold text-lg">Add Content Block</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Component Picker */}
            {isCompPickerOpen && (
                <div className="cms-modal-overlay" style={{ zIndex: 2100 }}>
                    <div className="cms-modal-content" style={{ maxWidth: '800px' }}>
                        <div className="cms-modal-header">
                            <h3>Select Component Type</h3>
                            <button onClick={() => setIsCompPickerOpen(false)} className="icon-btn"><X size={20} /></button>
                        </div>
                        <div className="cms-modal-body">
                            <div className="grid grid-cols-2 gap-6">
                                {AVAILABLE_COMPONENTS.map(comp => (
                                    <div key={comp.type} className="cms-component-card group" onClick={() => addComponentToPage(comp.type)}>
                                        <div className="icon-box">
                                            <comp.icon size={24} />
                                        </div>
                                        <div>
                                            <span className="type-badge">{comp.type}</span>
                                            <h5 className="text-lg">{comp.name}</h5>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Data Editor Modal */}
            {isDataEditorOpen && editingIndex !== null && (
                <DataEditor
                    component={formData.components[editingIndex]}
                    onClose={() => setIsDataEditorOpen(false)}
                    onSave={updateCompData}
                />
            )}

            <ConfirmationModal
                isOpen={confirmDelete.isOpen}
                onClose={() => setConfirmDelete({ isOpen: false, id: null })}
                onConfirm={executeDelete}
                title="Delete Page"
                message="Are you sure you want to permanently delete this page?"
                confirmText="Delete"
                confirmColor="red"
            />
        </div>
    );
};

// Sub-component for editing component data
const DataEditor = ({ component, onClose, onSave }) => {
    const [data, setData] = useState({ ...component.data });

    const handleChange = (key, value) => {
        setData({ ...data, [key]: value });
    };

    const handleArrayChange = (arrayKey, index, key, value) => {
        const newArray = [...data[arrayKey]];
        newArray[index] = { ...newArray[index], [key]: value };
        setData({ ...data, [arrayKey]: newArray });
    };

    const addItem = (arrayKey, defaultItem) => {
        setData({ ...data, [arrayKey]: [...(data[arrayKey] || []), defaultItem] });
    };

    const removeItem = (arrayKey, index) => {
        setData({ ...data, [arrayKey]: data[arrayKey].filter((_, i) => i !== index) });
    };

    const [uploading, setUploading] = useState(false);

    const handleImageUpload = async (e, key, idx = null, subKey = null) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploading(true);
            const { data: uploadRes } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (idx !== null && subKey !== null) {
                handleArrayChange(key, idx, subKey, uploadRes.imageUrl);
            } else {
                handleChange(key, uploadRes.imageUrl);
            }
            toast.success('Image uploaded successfully');
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="cms-modal-overlay" style={{ zIndex: 2200 }}>
            <div className="cms-modal-content" style={{ maxWidth: '750px', height: '90vh' }}>
                <div className="cms-modal-header">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
                            <Settings size={22} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">Configure {component.type.toUpperCase()}</h3>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mt-1">Component Content Editor</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="icon-btn"><X size={20} /></button>
                </div>
                <div className="cms-modal-body">
                    {/* Basic Fields */}
                    <div className="space-y-6 mb-12">
                        {Object.keys(data).map(key => {
                            if (typeof data[key] === 'string' || typeof data[key] === 'number') {
                                if (key === 'buttonPosition') {
                                    return (
                                        <div key={key} className="cms-form-group mb-0">
                                            <label className="cms-label">Button Position</label>
                                            <select
                                                className="cms-select"
                                                value={data[key]}
                                                onChange={(e) => handleChange(key, e.target.value)}
                                            >
                                                <option value="left">Left Aligned</option>
                                                <option value="center">Centered</option>
                                                <option value="right">Right Aligned</option>
                                            </select>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={key} className="cms-form-group mb-0">
                                        <label className="cms-label">{key.replace(/([A-Z])/g, ' $1')}</label>
                                        <div className="flex flex-col gap-2 w-full">
                                            {data[key] && (data[key].startsWith('http') || data[key].startsWith('/')) && (
                                                <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-2">
                                                    <img src={data[key]} alt="" className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    className="cms-input"
                                                    value={data[key]}
                                                    placeholder="Enter image URL or upload..."
                                                    onChange={(e) => handleChange(key, e.target.value)}
                                                />
                                                {(key.toLowerCase().includes('image') || key.toLowerCase().includes('photo')) && (
                                                    <label className="cms-action-btn edit flex-shrink-0 cursor-pointer relative overflow-hidden">
                                                        {uploading ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent" />
                                                        ) : (
                                                            <>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleImageUpload(e, key)}
                                                                />
                                                                <Image size={18} />
                                                            </>
                                                        )}
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>

                    {/* Array Fields (Slides, FAQ items, etc.) */}
                    {Object.keys(data).map(key => {
                        if (Array.isArray(data[key])) {
                            return (
                                <div key={key} className="mt-12">
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                                        <h4 className="font-extrabold text-gray-900 uppercase tracking-widest text-[11px] flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                            {key} Items
                                        </h4>
                                        <button onClick={() => addItem(key, { ...data[key][0] })} className="px-6 py-3 bg-teal-50 text-teal-600 rounded-xl text-xs font-bold hover:bg-teal-500 hover:text-white transition-all flex items-center gap-1">
                                            <Plus size={14} /> Add New Item
                                        </button>
                                    </div>
                                    <div className="space-y-8">
                                        {data[key].map((item, idx) => (
                                            <div key={idx} className="p-8 bg-white rounded-3xl relative border border-gray-100 shadow-sm hover:shadow-md transition-all">

                                                <div className="grid grid-cols-1 gap-6">
                                                    {Object.keys(item).map(subKey => (
                                                        <div key={subKey}>
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 block">{subKey.replace(/([A-Z])/g, ' $1')}</label>
                                                            {subKey.toLowerCase().includes('color') ? (
                                                                <div className="cms-color-group">
                                                                    <input
                                                                        type="color"
                                                                        className="cms-color-input"
                                                                        value={item[subKey] || '#000000'}
                                                                        onChange={(e) => handleArrayChange(key, idx, subKey, e.target.value)}
                                                                    />
                                                                    <span className="cms-color-value uppercase">{item[subKey] || '#000000'}</span>
                                                                </div>
                                                            ) : subKey === 'contentPosition' ? (
                                                                <select
                                                                    className="cms-select"
                                                                    value={item[subKey] || 'left-center'}
                                                                    onChange={(e) => handleArrayChange(key, idx, subKey, e.target.value)}
                                                                >
                                                                    <option value="left-center">Left Center (Default)</option>
                                                                    <option value="center">Center</option>
                                                                    <option value="right-center">Right Center</option>
                                                                    <option value="bottom-left">Bottom Left</option>
                                                                    <option value="bottom-center">Bottom Center</option>
                                                                    <option value="bottom-right">Bottom Right</option>
                                                                </select>
                                                            ) : (
                                                                <div className="flex flex-col gap-2 w-full">
                                                                    {item[subKey] && (item[subKey].startsWith('http') || item[subKey].startsWith('/')) && (
                                                                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm mb-2">
                                                                            <img src={item[subKey]} alt="" className="w-full h-full object-cover" />
                                                                        </div>
                                                                    )}
                                                                    <div className="flex gap-2">
                                                                        <input
                                                                            type="text"
                                                                            className="cms-input"
                                                                            value={item[subKey]}
                                                                            placeholder="Enter image URL or upload..."
                                                                            onChange={(e) => handleArrayChange(key, idx, subKey, e.target.value)}
                                                                        />
                                                                        {(subKey.toLowerCase().includes('image') || subKey.toLowerCase().includes('photo')) && (
                                                                            <label className="cms-action-btn edit flex-shrink-0 cursor-pointer relative overflow-hidden">
                                                                                {uploading ? (
                                                                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-500 border-t-transparent" />
                                                                                ) : (
                                                                                    <>
                                                                                        <input
                                                                                            type="file"
                                                                                            className="hidden"
                                                                                            accept="image/*"
                                                                                            onChange={(e) => handleImageUpload(e, key, idx, subKey)}
                                                                                        />
                                                                                        <Image size={18} />
                                                                                    </>
                                                                                )}
                                                                            </label>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
                <div className="cms-modal-footer bg-gray-50/50">
                    <button onClick={onClose} className="cms-btn">Cancel</button>
                    <button onClick={() => { onSave(data); onClose(); }} className="cms-btn cms-btn-primary shadow-xl shadow-teal-500/20">
                        <Check size={18} /> Apply Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PageManager;
