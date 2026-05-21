import React from 'react';
import { useTranslation } from 'react-i18next';
import HeroSlider from './HeroSlider';
import FAQAccordion from './FAQAccordion';
import TextBlock from './TextBlock';
import Testimonials from './Testimonials';
import CTASection from './CTASection';
import FeatureList from './FeatureList';
import ImageGallery from './ImageGallery';
import VideoSection from './VideoSection';
import StatsCounter from './StatsCounter';
import ContactForm from './ContactForm';
import ProcessTimeline from './ProcessTimeline';
import InfoAccordion from './InfoAccordion';

const componentsMap = {
    slider: HeroSlider,
    faq: FAQAccordion,
    text_block: TextBlock,
    testimonial: Testimonials,
    cta: CTASection,
    features: FeatureList,
    gallery: ImageGallery,
    video: VideoSection,
    stats: StatsCounter,
    contact_form: ContactForm,
    process: ProcessTimeline,
    info_accordion: InfoAccordion
};

const ComponentRenderer = ({ type, data, config }) => {
    const { i18n } = useTranslation();
    const currentLang = i18n.language ? i18n.language.split('-')[0] : 'en';

    // Helper to clean CMS text fields from wrapping or unwanted HTML tags
    const cleanCmsData = (key, val) => {
        if (typeof val !== 'string') return val;
        
        // List of keys that are rendered as plain text in the components and must not contain any HTML at all
        const plainTextKeys = ['question', 'label', 'name', 'buttonText', 'description', 'value'];
        
        if (plainTextKeys.includes(key)) {
            // Strip all HTML tags
            return val.replace(/<[^>]*>/g, '').trim();
        }
        
        // For other rich keys (including title, subtitle, content, answer, text)
        // we strip the outer <p> and </p> if they wrap the entire text
        if (val.startsWith('<p>') && val.endsWith('</p>')) {
            const inner = val.substring(3, val.length - 4);
            // Only strip if there are no other <p> tags inside (i.e. single paragraph)
            if (!inner.includes('<p>')) {
                return inner;
            }
        }
        
        return val;
    };

    // On-the-fly translation map for missing database fields in Hindi mode
    const getTranslatedText = (text) => {
        if (!text || typeof text !== 'string') return text;
        const cleanText = text.replace(/<[^>]*>/g, '').trim().toLowerCase();

        if (cleanText.includes('become a mission partner')) {
            return 'मिशन भागीदार बनें';
        }
        if (cleanText.includes('join the dharmarth foundation as a motivator')) {
            return 'एक प्रेरक के रूप में द धर्मार्थ फाउंडेशन से जुड़ें। जीवन बदलने वाले कारणों से दाताओं को जोड़ने में हमारी मदद करें और अपने प्रभाव के लिए पारदर्शी प्रोत्साहन अर्जित करें।';
        }
        if (cleanText.includes('how it works')) {
            return 'यह कैसे काम करता है';
        }
        if (cleanText.includes('a simple, transparent process')) {
            return 'एक प्रेरक के रूप में अपनी यात्रा शुरू करने की एक सरल, पारदर्शी प्रक्रिया।';
        }
        if (cleanText.includes('create account')) {
            return 'खाता बनाएं';
        }
        if (cleanText.includes('register as a motivator')) {
            return '2 मिनट से भी कम समय में एक प्रेरक के रूप में पंजीकरण करें।';
        }
        if (cleanText.includes('share the mission')) {
            return 'मिशन साझा करें';
        }
        if (cleanText.includes('connect donors to our verified')) {
            return 'अपने विशिष्ट लिंक का उपयोग करके दाताओं को हमारे सत्यापित सामाजिक कारणों से जोड़ें।';
        }
        if (cleanText.includes('drive impact')) {
            return 'प्रभाव डालें';
        }
        if (cleanText.includes('help us provide food, health')) {
            return 'जरूरतमंदों को भोजन, स्वास्थ्य और शिक्षा प्रदान करने में हमारी मदद करें।';
        }
        if (cleanText.includes('earn incentives')) {
            return 'प्रोत्साहन अर्जित करें';
        }
        if (cleanText.includes('receive recurring referral benefits')) {
            return 'प्रत्येक सफल योगदान के लिए आवर्ती रेफरल लाभ प्राप्त करें।';
        }
        if (cleanText.includes('why join the mission')) {
            return 'मिशन में क्यों शामिल हों?';
        }
        if (cleanText.includes('recurring rewards')) {
            return 'आवर्ती पुरस्कार';
        }
        if (cleanText.includes('earn benefits not just once')) {
            return 'केवल एक बार नहीं, बल्कि दाता सदस्यता के जीवनकाल के लिए लाभ अर्जित करें।';
        }
        if (cleanText.includes('real-time tracking')) {
            return 'वास्तविक समय ट्रैकिंग';
        }
        if (cleanText.includes('monitor your impact and earnings')) {
            return 'एक पेशेवर डैशबोर्ड के माध्यम से अपने प्रभाव और कमाई की निगरानी करें।';
        }
        if (cleanText.includes('direct bank payouts')) {
            return 'सीधे बैंक भुगतान';
        }
        if (cleanText.includes('fast, secure, and transparent')) {
            return 'सीधे आपके खाते में तेज़, सुरक्षित और पारदर्शी भुगतान।';
        }
        if (cleanText.includes('impact certification')) {
            return 'प्रभाव प्रमाणन';
        }
        if (cleanText.includes('get recognized for your contributions')) {
            return 'समाज में आपके योगदान के लिए पहचान प्राप्त करें।';
        }
        if (cleanText.includes('ready to start your mission')) {
            return 'अपना मिशन शुरू करने के लिए तैयार हैं?';
        }
        if (cleanText.includes('join 2,500+ motivators')) {
            return 'दुनिया को एक बेहतर जगह बनाने वाले 2,500+ प्रेरकों में शामिल हों।';
        }
        if (cleanText.includes('register as motivator')) {
            return 'प्रेरक के रूप में पंजीकरण करें';
        }
        if (cleanText.includes('join now')) {
            return 'अभी शामिल हों';
        }
        if (cleanText.includes('empower change. earn rewards')) {
            return 'बदलाव को सशक्त बनाएं। पुरस्कार अर्जित करें।';
        }

        return text;
    };

    // Helper to translate data recursively and clean HTML wrappers from text fields
    const translateData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => translateData(item));
        }
        
        const result = { ...obj };
        Object.keys(obj).forEach(key => {
            // Skip keys that end with _hi to prevent redundant processing
            if (key.endsWith('_hi')) return;

            // Check if there's a Hindi version of this key (e.g., title -> title_hi)
            const hiKey = `${key}_hi`;
            let val = obj[key];
            if (currentLang === 'hi') {
                if (obj[hiKey] && obj[hiKey].trim() !== '') {
                    val = obj[hiKey];
                } else if (typeof val === 'string' && val.trim() !== '') {
                    val = getTranslatedText(val);
                }
            }
            
            // Clean HTML tags if it's a string, or recurse if it's an object/array
            if (typeof val === 'string') {
                val = cleanCmsData(key, val);
            } else if (typeof val === 'object' && val !== null) {
                val = translateData(val);
            }
            
            result[key] = val;
        });
        
        return result;
    };

    const translatedData = translateData(data);
    const Component = componentsMap[type];
    
    if (!Component) {
        return (
            <div className="p-12 border-2 border-dashed border-red-200 rounded-3xl bg-red-50 text-red-600 text-center">
                <p className="font-bold">Missing Component Definition</p>
                <p className="text-sm opacity-70">Type: {type}</p>
            </div>
        );
    }

    return <Component data={translatedData} config={config} />;
};

export default ComponentRenderer;
