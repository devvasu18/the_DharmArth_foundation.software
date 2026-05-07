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

    // Helper to translate data recursively
    const translateData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        if (Array.isArray(obj)) {
            return obj.map(item => translateData(item));
        }
        
        const result = { ...obj };
        Object.keys(obj).forEach(key => {
            // Check if there's a Hindi version of this key (e.g., title -> title_hi)
            const hiKey = `${key}_hi`;
            if (currentLang === 'hi' && obj[hiKey]) {
                result[key] = obj[hiKey];
            }
            
            // Recursively translate nested objects
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                result[key] = translateData(obj[key]);
            }
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
