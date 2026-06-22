import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { API_BASE_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, X } from 'lucide-react';
import './BodyTests.css';
import SEO from '../components/common/SEO';

const API_URL = `${API_BASE_URL}/api`;

const synonymMap = {
    // Blood tests
    "blood": ["cbc", "blood count", "hemogram", "sugar", "glucose", "lipid", "cholesterol", "serum", "plasma", "haemoglobin", "hb", "platelet", "wbc", "rbc"],
    "cbc": ["blood count", "hemogram", "blood test", "complete blood count", "haemoglobin", "hb"],
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

    // Heart / Cardiorespiratory
    "heart": ["ecg", "lipid", "cholesterol", "cardiology", "electrocardiogram", "pulse", "bp", "blood pressure"],
    "ecg": ["electrocardiogram", "heart", "cardiology", "pulse"],
    "bp": ["blood pressure", "hypertension", "heart"],
    "blood pressure": ["bp", "hypertension", "heart"],

    // Radiology / Imaging
    "xray": ["x-ray", "radiology", "scan", "chest xray", "bone", "fracture"],
    "x-ray": ["xray", "radiology", "scan", "chest xray", "bone", "fracture"],
    "ultrasound": ["usg", "radiology", "scan", "sonography", "abdomen"],
    "usg": ["ultrasound", "radiology", "scan", "sonography", "abdomen"],
    "sonography": ["ultrasound", "usg", "radiology", "scan", "abdomen"],
    "scan": ["ultrasound", "usg", "xray", "x-ray", "mri", "ct scan", "radiology"],
    "mri": ["scan", "radiology", "imaging"],
    "ct": ["ct scan", "scan", "radiology", "imaging"],

    // Urine / Kidney
    "urine": ["urinalysis", "kidney", "renal", "rft", "lft", "kft"],
    "kidney": ["renal", "kft", "rft", "urine", "creatinine", "urea"],
    "kft": ["kidney", "renal", "rft", "creatinine", "urea", "urine"],
    "rft": ["kidney", "renal", "kft", "creatinine", "urea", "urine"],

    // Liver
    "liver": ["lft", "hepatic", "bilirubin", "sgot", "sgpt", "jaundice"],
    "lft": ["liver", "hepatic", "bilirubin", "sgot", "sgpt", "jaundice"],

    // General / Hindi synonyms
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
    const { user: authUser } = useAuth();

    const [bodyTests, setBodyTests] = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);
    const [selectedTestCategory, setSelectedTestCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Admin Settings State (for mobile dialer fallback)
    const [adminMobile, setAdminMobile] = useState('918306305569');
    const [bodyTestMobile, setBodyTestMobile] = useState('918306305569');
    const [contactPhone, setContactPhone] = useState('8306305569');

    useEffect(() => {
        fetchBodyTests();
        fetchSettings();
    }, []);

    // Reset category filter when language is changed
    useEffect(() => {
        setSelectedTestCategory('All');
    }, [i18n.language]);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/content/settings`);
            if (response.ok) {
                const data = await response.json();
                if (data.admin_suspension_mobile) {
                    setAdminMobile(data.admin_suspension_mobile);
                }
                if (data.body_test_mobile) {
                    setBodyTestMobile(data.body_test_mobile);
                }
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

    // Get unique categories (translated if Hindi selected)
    const testCategories = ['All', ...new Set(bodyTests.map(t => (isHindi && t.category_hi) ? t.category_hi : t.category))];

    const medicalBusinessSchema = {
        "@context": "https://schema.org",
        "@type": "MedicalBusiness",
        "name": "The DharmArth Foundation Sujangarh Healthcare Services",
        "description": "Book diagnostic checkup packages and medical tests at affordable prices in Sujangarh, Rajasthan.",
        "url": "https://thedharmarth.com/body-tests",
        "image": "https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778822813/the_dharmarth_foundation/logo.jpg",
        "telephone": contactPhone,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Jadaw Marg, Duliya Bypass",
            "addressLocality": "Sujangarh",
            "addressRegion": "Rajasthan",
            "postalCode": "331507",
            "addressCountry": "IN"
        }
    };

    return (
        <>
            <SEO
                title={isHindi ? "उपलब्ध मेडिकल टेस्ट और हेल्थ चेकअप पैकेज - सुजानगढ़" : "Available Medical Tests & Health Checkups in Sujangarh"}
                description={isHindi ? "धर्मार्थ फाउंडेशन सुजानगढ़ में किफायती दरों पर प्रयोगशाला परीक्षणों और नैदानिक जांच पैकेजों की बुकिंग करें।" : "Book affordable diagnostic checkup packages and laboratory tests at Sujangarh. Professional health checkups from The DharmArth Foundation."}
                keywords="Medical Tests Sujangarh, Diagnostic checkup, blood test Churu, Pathology Rajasthan, health checkup package"
                jsonLd={medicalBusinessSchema}
            />
            <Navbar />
            <div className="body-tests-page">
                {/* Hero Section */}
                <div className="tests-hero">
                    <div className="container">
                        <h1>{isHindi ? "चिकित्सीय परीक्षण एवं निदान सेवाएं" : "Medical Tests & Diagnostic Services"}</h1>
                        <p>{isHindi ? "धर्मार्थ फाउंडेशन के माध्यम से किफायती और उच्च गुणवत्ता वाले टेस्ट बुक करें" : "Book affordable and high-quality tests through The DharmArth Foundation"}</p>
                    </div>
                </div>

                <div className="container">
                    {/* Available Tests Section */}
                    <div className="tests-section">
                        <div className="section-header center-text">
                            <h2>{isHindi ? "उपलब्ध मेडिकल टेस्ट" : "Available Medical Tests"}</h2>

                        </div>

                        {/* Localized Search Bar */}
                        {!loadingTests && bodyTests.length > 0 && (
                            <div className="test-search-container">
                                <div className="test-search-bar">
                                    <Search className="search-icon" size={20} />
                                    <input
                                        type="text"
                                        placeholder={isHindi ? "नाम, श्रेणी या लक्षणों द्वारा टेस्ट खोजें..." : "Search tests by name, category or keywords..."}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="search-input"
                                    />
                                    {searchTerm && (
                                        <button className="search-clear-btn" onClick={() => setSearchTerm('')} type="button">
                                            <X size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Category filter tabs */}
                        {!loadingTests && bodyTests.length > 0 && (
                            <div className="test-categories-container">
                                <div className="test-categories-filter">
                                    {testCategories.map(cat => (
                                        <button
                                            key={cat}
                                            className={`test-category-chip ${selectedTestCategory === cat ? 'active' : ''}`}
                                            onClick={() => setSelectedTestCategory(cat)}
                                        >
                                            {cat === 'All' ? (isHindi ? 'सभी' : 'All') : cat}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {loadingTests ? (
                            <div className="tests-grid">
                                {[1, 2, 3, 4].map(n => (
                                    <div key={n} className="test-card skeleton">
                                        <div className="test-image skeleton-pulse"></div>
                                        <div className="test-content">
                                            <div className="skeleton-line skeleton-title skeleton-pulse"></div>
                                            <div className="skeleton-line skeleton-text skeleton-pulse"></div>
                                            <div className="skeleton-line skeleton-meta skeleton-pulse"></div>
                                            <div className="skeleton-button skeleton-pulse"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : bodyTests.length === 0 ? (
                            <div className="no-tests-premium">
                                <div className="no-tests-emoji">🔬</div>
                                <h3>{isHindi ? "कोई मेडिकल टेस्ट सूचीबद्ध नहीं है" : "No Medical Tests Listed"}</h3>
                                <p>{isHindi ? "हम वर्तमान में अपने चेकअप पैकेजों को अपडेट कर रहे हैं। कृपया जल्द ही दोबारा जांचें या हमारे हेल्पलाइन पर कॉल करें।" : "We are currently updating our checkup packages. Please check back soon or call our helpline."}</p>
                            </div>
                        ) : (
                            <div className="tests-grid">
                                {bodyTests
                                    .filter(test => {
                                        const isSearching = !!searchTerm.trim();

                                        // 1. Category check - ignore if searching
                                        if (!isSearching) {
                                            const localizedCat = (isHindi && test.category_hi) ? test.category_hi : test.category;
                                            const matchesCategory = selectedTestCategory === 'All' || localizedCat === selectedTestCategory;
                                            if (!matchesCategory) return false;
                                        }

                                        // 2. Search query check
                                        if (!isSearching) return true;

                                        const query = searchTerm.toLowerCase().trim();

                                        // Check exact / partial matches
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

                                        // Check synonym/keyword matches
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
                                    })
                                    .map(test => (
                                        <div key={test._id} className="test-card">
                                            <div className="test-image">
                                                {test.image ? (
                                                    <img
                                                        src={test.image.startsWith('http') ? test.image : `${API_BASE_URL}${test.image.startsWith('/') ? '' : '/'}${test.image}`}
                                                        alt={`${(isHindi && test.name_hi) ? test.name_hi : test.name} Diagnostic Test Package - The DharmArth Foundation Sujangarh`}
                                                    />
                                                ) : (
                                                    <div className="test-placeholder-image">🔬</div>
                                                )}
                                                <div className="test-category">{(isHindi && test.category_hi) ? test.category_hi : test.category}</div>
                                            </div>
                                            <div className="test-content">
                                                <h3>{(isHindi && test.name_hi) ? test.name_hi : test.name}</h3>
                                                <p className="test-description">{(isHindi && test.description_hi) ? test.description_hi : (test.description || 'Professional diagnostic checkup package.')}</p>
                                                <div className="test-meta">
                                                    <span>⏱️ {test.time}</span>
                                                    <div className="test-prices">
                                                        {test.originalPrice && (
                                                            <span className="test-price-original">
                                                                {test.originalPrice.startsWith('₹') ? test.originalPrice : `₹${test.originalPrice}`}
                                                            </span>
                                                        )}
                                                        <span className="test-price-discounted">
                                                            {test.price.startsWith('₹') ? test.price : `₹${test.price}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="btn-book-test"
                                                    onClick={() => {
                                                        if (window.innerWidth >= 1024) {
                                                            const testName = (isHindi && test.name_hi) ? test.name_hi : test.name;
                                                            const message = isHindi 
                                                                ? `नमस्ते, मैं "${testName}" टेस्ट बुक करना चाहता/चाहती हूँ।`
                                                                : `Hello, I would like to book the "${testName}" test.`;
                                                            window.open(`https://wa.me/${bodyTestMobile}?text=${encodeURIComponent(message)}`, '_blank');
                                                        } else {
                                                            window.location.href = `tel:${bodyTestMobile}`;
                                                        }
                                                    }}
                                                >
                                                    {isHindi ? "कॉल और बुक करें" : "Call & Book"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>


            <Footer />
        </>
    );
};

export default BodyTests;
