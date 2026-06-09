import React, { useEffect } from 'react';

const SEO = ({
    title,
    description,
    keywords,
    canonicalUrl,
    ogTitle,
    ogDescription,
    ogImage = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778822813/the_dharmarth_foundation/logo.jpg',
    ogType = 'website',
    twitterCard = 'summary_large_image',
    jsonLd
}) => {
    useEffect(() => {
        // 1. Update Title
        const formattedTitle = title 
            ? `${title} | The DharmArth Foundation` 
            : 'The DharmArth Foundation | Government Approved 80G Donation & NGO in India';
        document.title = formattedTitle;

        // Helper function to update meta tags
        const updateMeta = (nameAttr, value, isProperty = false) => {
            if (!value) return;
            const selector = isProperty ? `meta[property="${nameAttr}"]` : `meta[name="${nameAttr}"]`;
            let element = document.querySelector(selector);
            if (!element) {
                element = document.createElement('meta');
                if (isProperty) {
                    element.setAttribute('property', nameAttr);
                } else {
                    element.setAttribute('name', nameAttr);
                }
                document.head.appendChild(element);
            }
            element.setAttribute('content', value);
        };

        // 2. Standard Meta Tags
        updateMeta('description', description || 'Donate online to The DharmArth Foundation, a government-approved NGO providing free medicine services, healthcare assistance, and blood donation support. Get 80G tax saving benefits.');
        
        const defaultKeywords = 'dharm, dharmarth, dharmarth charity, Donate, Donation, Online Donation, Charity Donation, NGO Donation, Medical Donation, Medicine Donation, Blood Donation, Donate Now, Support a Cause, Make a Donation, Tax Saving Donation, 80G Donation, Charitable Giving, Fundraising, Nonprofit Donation, Social Welfare Donation, Community Support, Healthcare Donation, Emergency Relief Donation, real life donation, donation in india, donate, dan, दान, दान करें, ऑनलाइन दान, धर्मार्थ दान, भेंट करें, देना या भेंट करना, सहायता करें, सहयोग करें, जरूरतमंदों की मदद करें, रक्तदान, औषधि दान, चिकित्सा सहायता, समाज सेवा, पुण्य कार्य, मानव सेवा, जनकल्याण, स्वास्थ्य सहायता, जरूरतमंदों को दान, सेवा कार्य, चैरिटी, एनजीओ दान, Donate India, NGO Donation India, Online Daan, Daan Karein, Charity India, 80G Donation India, Blood Donation Rajasthan, Medicine Donation Rajasthan, Donate for Healthcare, Donate for Poor Patients, Medical Help India, Healthcare NGO India, Government Approved NGO, Tax Benefit Donation, donate medicine online, donate blood near me, best NGO to donate in India, 80G donation NGO, government approved NGO donation, online charity donation India, donate for medical treatment, donate to help poor patients, healthcare NGO Rajasthan, blood donation Sujangarh, NGO, Free Medicine Service, Medicine Delivery India, Medicine Ordering Rajasthan, Government Hospital Services, Doctor Availability, Health Checkup, Diagnostic Tests, Social Welfare, Community Healthcare, Emergency Medical Support, Sujangarh, Rajasthan, India';
        updateMeta('keywords', typeof keywords === 'string' ? keywords : (Array.isArray(keywords) ? keywords.join(', ') : defaultKeywords));
        updateMeta('author', 'The DharmArth Foundation');
        updateMeta('robots', 'index, follow');

        // 3. Open Graph (OG) Meta Tags
        const currentUrl = canonicalUrl || window.location.href;
        updateMeta('og:title', ogTitle || title || 'The DharmArth Foundation', true);
        updateMeta('og:description', ogDescription || description || 'Donate online to The DharmArth Foundation. Get 80G tax saving benefits.', true);
        updateMeta('og:image', ogImage, true);
        updateMeta('og:url', currentUrl, true);
        updateMeta('og:type', ogType, true);
        updateMeta('og:site_name', 'The DharmArth Foundation', true);

        // 4. Twitter / X Meta Tags
        updateMeta('twitter:card', twitterCard);
        updateMeta('twitter:title', ogTitle || title || 'The DharmArth Foundation');
        updateMeta('twitter:description', ogDescription || description || 'Donate online to The DharmArth Foundation.');
        updateMeta('twitter:image', ogImage);

        // 5. Canonical Link Tag
        let canonicalLink = document.querySelector('link[rel="canonical"]');
        if (!canonicalLink) {
            canonicalLink = document.createElement('link');
            canonicalLink.setAttribute('rel', 'canonical');
            document.head.appendChild(canonicalLink);
        }
        canonicalLink.setAttribute('href', currentUrl);

        // 6. JSON-LD Structured Data Schema Tag
        let jsonLdScript = document.getElementById('jsonld-schema');
        if (jsonLd) {
            if (!jsonLdScript) {
                jsonLdScript = document.createElement('script');
                jsonLdScript.setAttribute('type', 'application/ld+json');
                jsonLdScript.setAttribute('id', 'jsonld-schema');
                document.head.appendChild(jsonLdScript);
            }
            jsonLdScript.textContent = JSON.stringify(jsonLd);
        } else {
            // Remove any existing dynamic schema script to prevent pollution
            if (jsonLdScript) {
                jsonLdScript.remove();
            }
        }

        // Cleanup on unmount
        return () => {
            const scriptToRemove = document.getElementById('jsonld-schema');
            if (scriptToRemove) {
                scriptToRemove.remove();
            }
        };
    }, [title, description, keywords, canonicalUrl, ogTitle, ogDescription, ogImage, ogType, twitterCard, jsonLd]);

    return null;
};

export default SEO;
