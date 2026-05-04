import React from 'react';
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
    const Component = componentsMap[type];
    
    if (!Component) {
        return (
            <div className="p-12 border-2 border-dashed border-red-200 rounded-3xl bg-red-50 text-red-600 text-center">
                <p className="font-bold">Missing Component Definition</p>
                <p className="text-sm opacity-70">Type: {type}</p>
            </div>
        );
    }

    return <Component data={data} config={config} />;
};

export default ComponentRenderer;
