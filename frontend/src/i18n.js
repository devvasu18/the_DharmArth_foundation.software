import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
    // detect user language
    .use(LanguageDetector)
    // pass the i18n instance to react-i18next.
    .use(initReactI18next)
    // init i18next
    .init({
        debug: true,
        fallbackLng: 'hi', // Default to Hindi
        interpolation: {
            escapeValue: false, // not needed for react as it escapes by default
        },
        resources: {
            en: {
                translation: {
                    "navbar": {
                        "home": "Home",
                        "login": "Login",
                        "signup": "Signup",
                        "dashboard": "Dashboard",
                        "admin": "Admin Panel",
                        "logout": "Logout",
                        "brand": "Dharmarth",
                        "browseDonations": "Browse Donations",
                        "fundraiseFor": "Events",
                        "doctorAvailability": "Doctor Availability",
                        "search": "Search",
                        "signIn": "Sign In",
                        "donate": "Donate",
                        "wallet": "Wallet",
                        "userDashboard": "User Dashboard"
                    },
                    "home": {
                        "welcomeTitle": "Welcome to The Dharmarth Foundation",
                        "welcomeSubtitle": "Empowering change through your generous contributions."
                    },
                    "hero": {
                        "feePercent": "0%",
                        "feeLabel": "PLATFORM FEE",
                        "contributorsLabel": "CONTRIBUTORS",
                        "defaultSubtitle": "Every contribution brings us closer to a better world. Join our mission today."
                    },
                    "whyUs": {
                        "title": "Why The Dharmarth Foundation?",
                        "items": [
                            { "text": "100% Transparent Donation Process" },
                            { "text": "Supported By a Growing Community of Donors" },
                            { "text": "Easy-To-Manage Tools To Boost Results" },
                            { "text": "Receive contributions via all popular payment modes" },
                            { "text": "Get Expert Support 24/7" },
                            { "text": "A Dedicated Smart-Dashboard" },
                            { "text": "Withdraw Funds Without Hassle" },
                            { "text": "International Payment Support" }
                        ]
                    },
                    "crowd": {
                        "s1": {
                            "title": "Medical Bills are a Burden for Many Individuals and Families",
                            "text": "Expenses related to hospital stays, cancer treatments with high-cost chemotherapy routines, and other medicinal costs can be even higher. Treatment costs and necessary living expenses can bring the best of families to the brink of experiencing hard times. Insurance plans are not enough, as policies do not cover everything you need."
                        },
                        "s2": {
                            "title": "Support Medical Crowdfunding",
                            "text": "Stop worrying about the helpless, and start supporting them with The Dharmarth Foundation. We are a Donation Platform dedicated to helping those in need. Crowdfunding is the easiest way to pool support from friends, family and compassionate individuals who are waiting to contribute funds."
                        },
                        "s3": {
                            "title": "Contribute to Medical Aid for those in Need",
                            "text": "With The Dharmarth Foundation, you can make a quick, secure donation in minutes to support medical bills and healthcare costs for the underprivileged. You can also take on the role of spreading the word and bringing in support. Your contributions give hope to patients and families during their most difficult times."
                        }
                    },
                    "app": {
                        "title": "Manage your donation on our APP",
                        "f1": { "title": "Access a personalized dashboard", "desc": "Manage earnings, referrals, and payouts." },
                        "f2": { "title": "Withdraw your referrals faster", "desc": "Easy withdrawal requests directly to your bank." },
                        "f3": { "title": "Keep track of contributions", "desc": "View real-time donation history and stats." },
                        "f4": { "title": "Start Donations instantly", "desc": "start supporting poors in seconds." }
                    },
                    "faq": {
                        "title": "Frequently Asked Questions",
                        "list": [
                            { "q": "How do I make a donation on The Dharmarth Foundation?", "a": "Making a contribution is simple and secure. Click on the 'Donate' button, select the cause you wish to support, enter the amount, and complete the payment using your preferred method. Your support reaches those in need instantly." },
                            { "q": "Is there a fee for donating?", "a": "We strive to ensure maximum impact. We do not charge any platform fee from donors. A small standard transaction processing fee may apply from the payment gateway provider, which is standard across all online payments." },
                            { "q": "Do I get tax benefits for my donation?", "a": "Yes, all donations made to The Dharmarth Foundation are eligible for tax exemption under Section 80G of the Income Tax Act. You will receive a tax receipt instantly via email after your donation." },
                            { "q": "Is my donation safe?", "a": "Absolutely. We use industry-standard encryption and secure payment gateways to ensure your transaction is safe. We also verify the authenticity of every cause to ensure your money reaches the right beneficiaries." },
                            { "q": " Can I donate to a specific person or cause?", "a": "Yes, you can browse through our verified list of active cases and choose to support a specific individual, medical case, or social cause that resonates with you. Every contribution makes a difference." },
                            { "q": "Does The Dharmarth Foundation support international currencies?", "a": "Yes, our platform supports contributions from around the world. We accept major international currencies and credit cards to help you get the maximum support for your cause." }
                        ]
                    },
                    "footer": {
                        "causes": "Causes",
                        "howItWorks": "How It Works",
                        "aboutUs": "About Us",
                        "support": "Support",
                        "queries": "For any queries",
                        "copyright": "Copyright © 2026 Dharmarth Online Ventures Pvt Ltd. All Rights Reserved.",
                        "monthly": {
                            "title": "Gift Smiles with Monthly Giving",
                            "p1": "6,619 Lives",
                            "p2": " Have Been Saved With Monthly Contributions From ",
                            "p3": "4,21,908 Contributors",
                            "p4": ". Save Countless Lives By Giving Monthly.",
                            "cta": "START MONTHLY GIVING"
                        }
                    },
                    "donatePage": {
                        "title": "Select Donation Amount",
                        "popular": "Popular",
                        "customPlaceholder": "Enter custom amount (Min ₹500)",
                        "citizenConfirm": "I confirm that I am an Indian citizen",
                        "personalDetails": "Personal Details",
                        "fullName": "Full Name*",
                        "mobile": "Mobile Number*",
                        "whatsappNote": "We'll send payment updates via WhatsApp",
                        "email": "Email Address (Optional)",
                        "motivatorTitle": "Motivational Source",
                        "motivatedBy": "Motivated By",
                        "referralPlaceholder": "Select Referral Source",
                        "need80G": "Need 80G Certificate for Tax Exemption?",
                        "saveTax": "Save Tax",
                        "pan": "PAN Number*",
                        "aadhaar": "Aadhaar Number*",
                        "donateBtn": "Donate",
                        "processing": "Processing Secure Payment...",
                        "processingShort": "Processing...",
                        "securePayment": "100% Secure Payment",
                        "thankYou": "Thank You",
                        "successMessage": "Your donation of",
                        "wasSuccessful": "was successful.",
                        "transactionId": "Transaction ID",
                        "claimAccount": "Claim Your Account",
                        "claimDesc": "Create a password to track this donation and access your <br />80G certificates anytime.",
                        "createPassword": "Create Password",
                        "confirmPassword": "Confirm Password",
                        "createAccountBtn": "Create Account & Track Donation",
                        "creatingAccount": "Creating Account...",
                        "goToDashboard": "Go to Dashboard",
                        "skipHome": "Skip & Go Home",
                        "secureConfirm": "Secure Confirmation",
                        "verifyDetails": "Verify details for 80G Tax Exemption",
                        "donorName": "Donor Name:",
                        "confirmPan": "Confirm PAN Number*",
                        "cancel": "Cancel",
                        "confirmDonate": "Confirm & Donate"
                    },
                    "authFooter": {
                        "privacy": "Privacy Policy",
                        "terms": "Terms & Conditions",
                        "support": "Support",
                        "rights": "All rights reserved."
                    }
                }

            },
            hi: {
                translation: {
                    "navbar": {
                        "home": "होम",
                        "login": "लॉगिन",
                        "signup": "साइन अप",
                        "dashboard": "डैशबोर्ड",
                        "admin": "एडमिन पैनल",
                        "logout": "लॉग आउट",
                        "brand": "धर्मार्थ",
                        "browseDonations": "दान के अवसर",
                        "fundraiseFor": "कार्यक्रम",
                        "doctorAvailability": "डॉक्टर उपलब्धता",
                        "search": "खोजें",
                        "signIn": "साइन इन",
                        "donate": "दान करें",
                        "wallet": "वॉलेट",
                        "userDashboard": "यूज़र डैशबोर्ड"
                    },
                    "home": {
                        "welcomeTitle": "धर्मार्थ फाउंडेशन में आपका स्वागत है",
                        "welcomeSubtitle": "अपने  योगदान के माध्यम से बदलाव को सक्षम करें।"
                    },
                    "hero": {
                        "feePercent": "0%",
                        "feeLabel": "मंच शुल्क",
                        "contributorsLabel": "योगदानकर्ता",
                        "defaultSubtitle": "हर योगदान हमें एक बेहतर दुनिया के करीब लाता है। आज ही हमारे मिशन में शामिल हों।"
                    },
                    "whyUs": {
                        "title": "धर्मार्थ फाउंडेशन क्यों?",
                        "items": [
                            { "text": "100% पारदर्शी दान प्रक्रिया" },
                            { "text": "दाताओं के बढ़ते समुदाय द्वारा समर्थित" },
                            { "text": "परिणाम बढ़ाने के लिए आसान उपकरण" },
                            { "text": "सभी लोकप्रिय भुगतान तरीकों से योगदान प्राप्त करें" },
                            { "text": "24/7 विशेषज्ञ सहायता प्राप्त करें" },
                            { "text": "एक समर्पित स्मार्ट डैशबोर्ड" },
                            { "text": "बिना किसी परेशानी के फंड निकालें" },
                            { "text": "अंतर्राष्ट्रीय भुगतान सहायता" }
                        ]
                    },
                    "crowd": {
                        "s1": {
                            "title": "कई व्यक्तियों और परिवारों के लिए चिकित्सा बिल एक बोझ हैं",
                            "text": "अस्पताल में रहने, उच्च लागत वाली कीमोथेरेपी और अन्य दवाओं का खर्च बहुत अधिक हो सकता है। यह परिवारों को कठिन समय में डाल सकता है। बीमा योजनाएं अक्सर पर्याप्त नहीं होती हैं।"
                        },
                        "s2": {
                            "title": "मेडिकल क्राउडफंडिंग का समर्थन करें",
                            "text": "असहायों के बारे में चिंता करना छोड़ें और धर्मार्थ फाउंडेशन के साथ उनका समर्थन करना शुरू करें। हम जरूरतमंदों की मदद करने के लिए समर्पित एक दान मंच हैं।"
                        },
                        "s3": {
                            "title": "जरूरतमंदों के लिए चिकित्सा सहायता में योगदान करें",
                            "text": "धर्मार्थ फाउंडेशन के साथ, आप वंचितों के चिकित्सा बिलों के लिए मिनटों में सुरक्षित दान कर सकते हैं। आप जागरूकता फैलाने की भूमिका भी निभा सकते हैं।"
                        }
                    },
                    "app": {
                        "title": "हमारे ऐप पर अपने दान का प्रबंधन करें",
                        "f1": { "title": "व्यक्तिगत डैशबोर्ड तक पहुंचें", "desc": "कमाई, रेफरल और भुगतान का प्रबंधन करें।" },
                        "f2": { "title": "अपने रेफरल तेजी से निकालें", "desc": "सीधे अपने बैंक में आसान निकासी अनुरोध।" },
                        "f3": { "title": "योगदान का ट्रैक रखें", "desc": "रीयल-टाइम दान इतिहास और आंकड़े देखें।" },
                        "f4": { "title": "तुरंत दान शुरू करें", "desc": "कुछ ही सेकंड में गरीबों की मदद करना शुरू करें।" }
                    },
                    "faq": {
                        "title": "अक्सर पूछे जाने वाले प्रश्न",
                        "list": [
                            { "q": "मैं धर्मार्थ फाउंडेशन पर दान कैसे कर सकता हूं?", "a": "योगदान करना सरल और सुरक्षित है। 'दान करें' बटन पर क्लिक करें, वह कारण चुनें जिसे आप समर्थन देना चाहते हैं, राशि दर्ज करें और अपने पसंदीदा तरीके का उपयोग करके भुगतान पूरा करें।" },
                            { "q": "क्या दान करने के लिए कोई शुल्क है?", "a": "हम अधिकतम प्रभाव सुनिश्चित करने का प्रयास करते हैं। हम दाताओं से कोई मंच शुल्क नहीं लेते हैं। भुगतान गेटवे प्रदाता से एक छोटा मानक लेनदेन शुल्क लागू हो सकता है।" },
                            { "q": "क्या मुझे अपने दान के लिए कर लाभ मिलता है?", "a": "हां, धर्मार्थ फाउंडेशन को दिए गए सभी दान आयकर अधिनियम की धारा 80G के तहत कर छूट के लिए पात्र हैं।" },
                            { "q": "क्या मेरा दान सुरक्षित है?", "a": "बिल्कुल। हम यह सुनिश्चित करने के लिए उद्योग-मानक एन्क्रिप्शन और सुरक्षित भुगतान गेटवे का उपयोग करते हैं कि आपका लेनदेन सुरक्षित है।" },
                            { "q": "क्या मैं किसी विशिष्ट व्यक्ति या कारण के लिए दान कर सकता हूं?", "a": "हां, आप सक्रिय मामलों की हमारी सत्यापित सूची ब्राउज़ कर सकते हैं और किसी विशिष्ट व्यक्ति, चिकित्सा मामले या सामाजिक कारण का समर्थन करना चुन सकते हैं।" },
                            { "q": "क्या धर्मार्थ फाउंडेशन अंतर्राष्ट्रीय मुद्राओं का समर्थन करता है?", "a": "हां, हमारा मंच दुनिया भर से योगदान का समर्थन करता है। हम प्रमुख अंतरराष्ट्रीय मुद्राओं को स्वीकार करते हैं।" }
                        ]
                    },
                    "footer": {
                        "causes": "कारण",
                        "howItWorks": "यह कैसे काम करता है?",
                        "aboutUs": "हमारे बारे में",
                        "support": "सहायता",
                        "queries": "किसी भी प्रश्न के लिए",
                        "copyright": "कॉपीराइट © 2026 धर्मार्थ ऑनलाइन वेंचर्स प्राइवेट लिमिटेड। सर्वाधिकार सुरक्षित।",
                        "monthly": {
                            "title": "मासिक दान के साथ मुस्कान उपहार में दें",
                            "p1": "4,21,908 योगदानकर्ताओं",
                            "p2": " के मासिक योगदान से ",
                            "p3": "6,619 जीवन",
                            "p4": " बचाए गए हैं। मासिक दान देकर अनगिनत जीवन बचाएं।",
                            "cta": "मासिक दान शुरू करें"
                        }
                    },
                    "donatePage": {
                        "title": "दान राशि चुनें",
                        "popular": "लोकप्रिय",
                        "customPlaceholder": "कस्टम राशि दर्ज करें (न्यूनतम ₹500)",
                        "citizenConfirm": "मैं पुष्टि करता हूँ कि मैं एक भारतीय नागरिक हूँ",
                        "personalDetails": "व्यक्तिगत विवरण",
                        "fullName": "पूरा नाम*",
                        "mobile": "मोबाइल नंबर*",
                        "whatsappNote": "हम व्हाट्सएप के माध्यम से भुगतान अपडेट भेजेंगे",
                        "email": "ईमेल पता (वैकल्पिक)",
                        "motivatorTitle": "प्रेरक स्रोत",
                        "motivatedBy": "द्वारा प्रेरित",
                        "referralPlaceholder": "रेफरल स्रोत चुनें",
                        "need80G": "क्या आपको छूट के लिए 80G प्रमाण पत्र चाहिए?",
                        "saveTax": "टैक्स बचाएं",
                        "pan": "पैन नंबर*",
                        "aadhaar": "आधार नंबर*",
                        "donateBtn": "दान करें",
                        "processing": "सुरक्षित भुगतान संसाधित हो रहा है...",
                        "securePayment": "100% सुरक्षित भुगतान",
                        "thankYou": "धन्यवाद",
                        "successMessage": "आपका दान",
                        "wasSuccessful": "सफल रहा।",
                        "transactionId": "लेनदेन आईडी",
                        "claimAccount": "अपना खाता क्लेम करें",
                        "claimDesc": "इस दान को ट्रैक करने और अपने 80G प्रमाण पत्र तक कभी भी पहुंचने के लिए एक पासवर्ड बनाएं।",
                        "createPassword": "पासवर्ड बनाएं",
                        "confirmPassword": "पासवर्ड की पुष्टि करें",
                        "createAccountBtn": "खाता बनाएं और दान ट्रैक करें",
                        "creatingAccount": "खाता बनाया जा रहा है...",
                        "goToDashboard": "डैशबोर्ड पर जाएं",
                        "skipHome": "स्किप करें और होम पर जाएं",
                        "secureConfirm": "सुरक्षित पुष्टि",
                        "verifyDetails": "80G कर छूट के लिए विवरण सत्यापित करें",
                        "donorName": "दाता का नाम:",
                        "confirmPan": "पैन नंबर की पुष्टि करें*",
                        "cancel": "रद्द करें",
                        "confirmDonate": "पुष्टि करें और दान करें"
                    },
                    "authFooter": {
                        "privacy": "गोपनीयता नीति",
                        "terms": "नियम और शर्तें",
                        "support": "सहायता",
                        "rights": "सर्वाधिकार सुरक्षित।"
                    }

                }
            }
        }
    });

export default i18n;
