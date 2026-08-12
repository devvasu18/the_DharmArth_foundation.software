import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ArrowLeft, Search, X, Phone, FlaskConical, Activity, User, LayoutGrid, Clock, Utensils, ZoomIn } from 'lucide-react';
import './BodyTests.css';
import SEO from '../components/common/SEO';

const API_URL = `${API_BASE_URL}/api`;

const synonymMap = {
    "blood": ["cbc", "blood count", "hemogram", "sugar", "glucose", "lipid", "cholesterol", "serum", "plasma", "haemoglobin", "hb", "platelet", "wbc", "rbc"],
    "cbc": ["blood count", "hemogram", "complete blood count", "haemoglobin", "hb"],
    "hemogram": ["cbc", "blood count", "complete blood count"],
    "haemoglobin": ["hb", "cbc", "blood count", "iron", "anemia"],
    "hb": ["haemoglobin", "cbc", "blood count", "iron", "anemia"],
    "sugar": ["diabetes", "glucose", "hba1c", "fasting sugar", "random sugar", "blood sugar"],
    "glucose": ["diabetes", "sugar", "hba1c", "blood sugar"],
    "diabetes": ["sugar", "glucose", "hba1c", "blood sugar"],
    "hba1c": ["sugar", "diabetes", "glucose", "blood sugar"],
    "cholesterol": ["lipid", "fat", "triglycerides", "hdl", "ldl", "heart"],
    "lipid": ["cholesterol", "fat", "triglycerides", "hdl", "ldl", "heart"],
    "thyroid": ["t3", "t4", "tsh", "goiter", "hormone"],
    "tsh": ["thyroid", "t3", "t4", "hormone"],
    "heart": ["ecg", "lipid", "cholesterol", "cardiology", "electrocardiogram", "pulse", "bp", "blood pressure"],
    "ecg": ["electrocardiogram", "heart", "cardiology", "pulse"],
    "bp": ["blood pressure", "hypertension", "heart"],
    "xray": ["x-ray", "radiology", "scan", "chest xray", "bone", "fracture"],
    "x-ray": ["xray", "radiology", "scan", "chest xray", "bone", "fracture"],
    "ultrasound": ["usg", "radiology", "scan", "sonography", "abdomen"],
    "urine": ["urinalysis", "kidney", "renal", "rft", "lft", "kft"],
    "kidney": ["renal", "kft", "rft", "urine", "creatinine", "urea"],
    "liver": ["lft", "hepatic", "bilirubin", "sgot", "sgpt", "jaundice"],
    "खून": ["blood", "cbc", "खून जांच", "हीमोग्लोबिन"],
    "शुगर": ["sugar", "diabetes", "glucose", "मधुमेह"],
    "दिल": ["heart", "ecg", "cardiology", "हृदय"],
    "मूत्र": ["urine", "पेशाब"],
    "किडनी": ["kidney", "गुर्दा", "kft"],
    "लिवर": ["liver", "यकृत", "lft"],
    "एक्सरे": ["xray", "x-ray", "एक्स-रे"]
};

const BodyTests = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const openModalParam = searchParams.get('openModal');

    const { user: authUser } = useAuth();

    const [bodyTests, setBodyTests] = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [selectedTestCategory, setSelectedTestCategory] = useState(categoryParam || 'All');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCategoryModal, setShowCategoryModal] = useState(openModalParam === 'true');
    const [selectedImageModal, setSelectedImageModal] = useState(null);

    const [adminMobile, setAdminMobile] = useState('918306305569');
    const [bodyTestMobile, setBodyTestMobile] = useState('918306305569');
    const [contactPhone, setContactPhone] = useState('8306305569');

    useEffect(() => {
        fetchBodyTests();
        fetchSettings();
    }, []);

    useEffect(() => {
        if (categoryParam) {
            setSelectedTestCategory(categoryParam);
        }
    }, [categoryParam]);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/content/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.admin_suspension_mobile) setAdminMobile(data.admin_suspension_mobile);
                if (data.body_test_mobile) setBodyTestMobile(data.body_test_mobile);
                setContactPhone(data.contact_phone || '8306305569');
            }
        } catch (error) {
            console.error("Failed to fetch settings", error);
        }
    };

    const fetchBodyTests = async () => {
        try {
            setLoadingTests(true);
            const response = await fetch(`${API_URL}/body-tests?isActive=true`);
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setBodyTests(data);
        } catch (error) {
            console.error('Failed to fetch body tests:', error);
            toast.error(i18n.language?.startsWith('hi') ? 'मेडिकल टेस्ट लोड करने में विफल' : 'Failed to fetch body tests');
        } finally {
            setLoadingTests(false);
        }
    };

    const isHindi = i18n.language?.startsWith('hi');

    const medicalBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": "The Dharmarth Medical Foundation Sujangarh Healthcare Services",
        "description": "Book diagnostic checkup packages and medical tests at affordable prices in Sujangarh, Rajasthan.",
        "url": "https://thedharmarth.com/body-tests",
        "image": "https://res.cloudinary.com/dbe1ykvg8/image/upload/v1783602963/the_dharmarth_foundation/logo.jpg",
        "telephone": contactPhone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jadaw Marg, Duliya Bass",
            "addressLocality": "Sujangarh",
            "addressRegion": "Rajasthan",
            "postalCode": "331507",
            "addressCountry": "IN"
        }
    };

    const filterTests = () => {
        return bodyTests.filter(test => {
            const isSearching = !!searchTerm.trim();

            if (!isSearching) {
                const matchesCategory = selectedTestCategory === 'All' ||
                    test.category === selectedTestCategory ||
                    (test.category && test.category.toUpperCase() === selectedTestCategory.toUpperCase()) ||
                    (selectedTestCategory === 'BLOOD TESTS' && (test.category === 'BLOOD TESTS' || test.category === 'Pathology' || test.category_hi === 'रक्त जांच')) ||
                    (selectedTestCategory === 'URINE TEST' && (test.category === 'URINE TEST' || test.category_hi === 'मूत्र जांच')) ||
                    (selectedTestCategory === 'RADIOLOGY' && (test.category === 'RADIOLOGY' || test.category === 'Radiology' || test.category_hi === 'रेडियोलॉजी')) ||
                    (selectedTestCategory === 'FULL BODY TESTS' && (test.category === 'FULL BODY TESTS' || test.category_hi === 'संपूर्ण शरीर जांच'));
                if (!matchesCategory) return false;
            }

            if (!isSearching) return true;

            const query = searchTerm.toLowerCase().trim();
            const matchInText = (text) => text && text.toLowerCase().includes(query);
            if (
                matchInText(test.name) ||
                matchInText(test.name_hi) ||
                matchInText(test.category) ||
                matchInText(test.category_hi) ||
                matchInText(test.description) ||
                matchInText(test.description_hi)
            ) {
                return true;
            }

            const queryWords = query.split(/\s+/).filter(Boolean);
            for (const word of queryWords) {
                const synonyms = synonymMap[word] || [];
                const allSearchTerms = [word, ...synonyms];

                for (const term of allSearchTerms) {
                    const matchInField = (fieldVal) => fieldVal && fieldVal.toLowerCase().includes(term.toLowerCase());
                    if (
                        matchInField(test.name) ||
                        matchInField(test.name_hi) ||
                        matchInField(test.category) ||
                        matchInField(test.category_hi) ||
                        matchInField(test.description) ||
                        matchInField(test.description_hi)
                    ) {
                        return true;
                    }
                }
            }

            return false;
        });
    };

    const calculateRelevanceScore = (test, search) => {
        if (!search || !search.trim()) return 0;
        const query = search.toLowerCase().trim();
        const queryWords = query.split(/\s+/).filter(Boolean);

        let score = 0;
        const testName = (test.name || '').toLowerCase();
        const testNameHi = (test.name_hi || '').toLowerCase();
        const category = (test.category || '').toLowerCase();
        const categoryHi = (test.category_hi || '').toLowerCase();
        const description = (test.description || '').toLowerCase();
        const descriptionHi = (test.description_hi || '').toLowerCase();

        if (testName === query || testNameHi === query) return 1000;
        if (testName.startsWith(query) || testNameHi.startsWith(query)) score = Math.max(score, 800);

        const nameWords = testName.split(/[\s,()/\-]+/).concat(testNameHi.split(/[\s,()/\-]+/));
        if (nameWords.some(w => w && w.startsWith(query))) score = Math.max(score, 700);

        if (testName.includes(query) || testNameHi.includes(query)) score = Math.max(score, 600);
        if (category.startsWith(query) || categoryHi.startsWith(query) || category.includes(query) || categoryHi.includes(query)) score = Math.max(score, 500);
        if (description.includes(query) || descriptionHi.includes(query)) score = Math.max(score, 400);

        for (const qWord of queryWords) {
            const synonyms = synonymMap[qWord] || [];
            for (const syn of synonyms) {
                const synLower = syn.toLowerCase();
                if (testName.includes(synLower) || testNameHi.includes(synLower)) score = Math.max(score, 300);
                else if (category.includes(synLower) || categoryHi.includes(synLower)) score = Math.max(score, 200);
                else if (description.includes(synLower) || descriptionHi.includes(synLower)) score = Math.max(score, 100);
            }
        }

        return score;
    };

    const isSearching = !!searchTerm.trim();
    const filteredTests = filterTests().sort((a, b) => {
        if (isSearching) {
            const scoreA = calculateRelevanceScore(a, searchTerm);
            const scoreB = calculateRelevanceScore(b, searchTerm);
            if (scoreB !== scoreA) {
                return scoreB - scoreA;
            }
        }
        const nameA = (isHindi && a.name_hi) ? a.name_hi : a.name;
        const nameB = (isHindi && b.name_hi) ? b.name_hi : b.name;
        return (nameA || '').localeCompare(nameB || '', isHindi ? 'hi' : 'en', { sensitivity: 'base' });
    });

    return (
        <>
            <SEO
                title={isHindi ? "उपलब्ध मेडिकल टेस्ट और हेल्थ चेकअप पैकेज - सुजानगढ़" : "Available Medical Tests & Health Checkups in Sujangarh"}
                description={isHindi ? "धर्मार्थ फाउंडेशन सुजानगढ़ में किफायती दरों पर प्रयोगशाला परीक्षणों और नैदानिक जांच पैकेजों की बुकिंग करें।" : "Book affordable diagnostic checkup packages and laboratory tests at Sujangarh. Professional health checkups from The Dharmarth Medical Foundation."}
                keywords="Medical Tests Sujangarh, Diagnostic checkup, blood test Churu, Pathology Rajasthan, health checkup package"
                jsonLd={medicalBusinessSchema}
            />
            <Navbar />
            <div className="body-tests-page">
                {/* Mobile Screen Top Header Bar */}
                <div className="mobile-tests-header-bar">
                    <button className="header-back-btn" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="header-title-text">{isHindi ? 'मेडिकल टेस्ट' : 'Medical Tests'}</h2>
                    <a href={`tel:${(bodyTestMobile || contactPhone).replace(/\s+/g, '')}`} className="header-call-btn">
                        <Phone size={20} color="#00bf9a" />
                    </a>
                </div>

                <div className="container main-tests-container">
                    {/* Search Input Bar (Matching Image 2) */}
                    <div className="mobile-search-wrapper">
                        <Search className="search-icon-left" size={20} color="#64748b" />
                        <input
                            type="text"
                            placeholder={isHindi ? 'नाम, श्रेणी या लक्षणों द्वारा टेस्ट खोजें...' : 'Search tests by name, category or keyword...'}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="mobile-search-input"
                        />
                        {searchTerm && (
                            <button className="search-clear-btn" onClick={() => setSearchTerm('')} type="button">
                                <X size={18} color="#94a3b8" />
                            </button>
                        )}
                    </div>





                    {/* Medical Test Cards List */}
                    {loadingTests ? (
                        <div className="mobile-tests-grid">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="mobile-test-card skeleton">
                                    <div className="test-card-banner skeleton-pulse"></div>
                                    <div className="test-card-body">
                                        <div className="skeleton-line skeleton-title skeleton-pulse"></div>
                                        <div className="skeleton-line skeleton-text skeleton-pulse"></div>
                                        <div className="skeleton-button skeleton-pulse"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredTests.length === 0 ? (
                        <div className="no-tests-card">
                            <div className="no-tests-flask">
                                <FlaskConical size={56} color="#94a3b8" />
                            </div>
                            <h3>{isHindi ? "कोई मेडिकल टेस्ट नहीं मिला" : "No Medical Tests Found"}</h3>
                            <p>{isHindi ? "कृपया कोई अन्य शब्द खोजें या श्रेणी बदलें।" : "Please try searching for another term or change category."}</p>
                            <button className="btn-reset-search" onClick={() => { setSearchTerm(''); setSelectedTestCategory('All'); }}>
                                {isHindi ? "सभी टेस्ट देखें" : "View All Tests"}
                            </button>
                        </div>
                    ) : (
                        <div className="mobile-tests-grid">
                            {filteredTests.map(test => (
                                <div key={test._id} className="mobile-test-card">
                                    {/* Top Card Banner Area (Image 2 style) */}
                                    <div className="test-card-banner">
                                        <span className="test-category-tag">
                                            {(isHindi && test.category_hi) ? test.category_hi : (test.category || 'BLOOD TESTS')}
                                        </span>
                                        {test.image ? (
                                            <div className="test-banner-img-wrapper" onClick={() => setSelectedImageModal(test.image.startsWith('http') ? test.image : `${API_BASE_URL}${test.image.startsWith('/') ? '' : '/'}${test.image}`)}>
                                                <img
                                                    src={test.image.startsWith('http') ? test.image : `${API_BASE_URL}${test.image.startsWith('/') ? '' : '/'}${test.image}`}
                                                    alt={test.name}
                                                    className="test-banner-img"
                                                />
                                                <div className="zoom-icon-badge">
                                                    <ZoomIn size={16} color="#ffffff" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="test-flask-placeholder">
                                                <FlaskConical size={56} color="#00bf9a" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Card Details Area (Image 2 style) */}
                                    <div className="test-card-body">
                                        <h3 className="test-name-bold">
                                            {(isHindi && test.name_hi) ? test.name_hi : test.name}
                                        </h3>

                                        <div className="test-meta-info-row">
                                            <div className="meta-badges-group">
                                                <span className="meta-badge">
                                                    <Clock size={13} style={{ marginRight: '4px', color: '#64748b' }} />
                                                    {test.time || (isHindi ? '1 घंटे में' : 'ONE HOUR')}
                                                </span>
                                                <span className="meta-badge">
                                                    <Utensils size={13} style={{ marginRight: '4px', color: '#64748b' }} />
                                                    {test.beforeFood
                                                        ? (isHindi ? 'खाली पेट' : 'Before food')
                                                        : (isHindi ? 'भोजन के बाद' : 'After lunch')}
                                                </span>
                                            </div>

                                            <div className="test-price-box">
                                                {test.originalPrice && (
                                                    <span className="price-old">
                                                        {test.originalPrice.startsWith('₹') ? test.originalPrice : `₹${test.originalPrice}`}
                                                    </span>
                                                )}
                                                <span className="price-new">
                                                    {test.price.startsWith('₹') ? test.price : `₹${test.price}`}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            className="btn-call-book"
                                            onClick={() => {
                                                const phoneNum = (bodyTestMobile || '8306305569').replace(/\s+/g, '');
                                                window.location.href = `tel:${phoneNum}`;
                                            }}
                                        >
                                            <span>{isHindi ? 'कॉल और बुक करें' : 'Call & Book'}</span>
                                            <Phone size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Select Test Category Modal (Matching Image 1) */}
            {showCategoryModal && (
                <div className="test-modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="test-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="test-modal-header">
                            <h3>{isHindi ? 'टेस्ट श्रेणी चुनें' : 'Select Test Category'}</h3>
                            <button className="test-modal-close" onClick={() => setShowCategoryModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="test-modal-grid">
                            <div
                                className={`test-modal-item ${selectedTestCategory === 'BLOOD TESTS' ? 'active' : ''}`}
                                onClick={() => { setSelectedTestCategory('BLOOD TESTS'); setShowCategoryModal(false); }}
                            >
                                <div className="test-modal-icon-circle"><FlaskConical size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{isHindi ? 'खून और पेशाब की जांच' : 'Blood & Urine Test'}</span>
                            </div>

                            <div
                                className={`test-modal-item ${selectedTestCategory === 'RADIOLOGY' ? 'active' : ''}`}
                                onClick={() => { setSelectedTestCategory('RADIOLOGY'); setShowCategoryModal(false); }}
                            >
                                <div className="test-modal-icon-circle"><Activity size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{isHindi ? 'एक्स-रे और ईसीजी' : 'X-Ray & ECG'}</span>
                            </div>

                            <div
                                className={`test-modal-item ${selectedTestCategory === 'FULL BODY TESTS' ? 'active' : ''}`}
                                onClick={() => { setSelectedTestCategory('FULL BODY TESTS'); setShowCategoryModal(false); }}
                            >
                                <div className="test-modal-icon-circle"><User size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{isHindi ? 'फुल बॉडी चेकअप' : 'Full Body Checkup'}</span>
                            </div>

                            <div
                                className={`test-modal-item ${selectedTestCategory === 'All' ? 'active' : ''}`}
                                onClick={() => { setSelectedTestCategory('All'); setShowCategoryModal(false); }}
                            >
                                <div className="test-modal-icon-circle"><LayoutGrid size={32} color="#00bf9a" /></div>
                                <span className="test-modal-item-title">{isHindi ? 'सभी जांच' : 'All Tests'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview Zoom Modal */}
            {selectedImageModal && (
                <div className="image-zoom-overlay" onClick={() => setSelectedImageModal(null)}>
                    <div className="image-zoom-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="image-zoom-close" onClick={() => setSelectedImageModal(null)}>
                            <X size={24} color="#ffffff" />
                        </button>
                        <img src={selectedImageModal} alt="Test preview" className="full-zoom-img" />
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default BodyTests;
