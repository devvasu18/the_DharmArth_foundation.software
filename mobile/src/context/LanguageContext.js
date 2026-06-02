import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

const translations = {
  en: {
    navbar: {
      home: "Home",
      donate: "Donate",
      events: "Events",
      profile: "Profile",
      dashboard: "Dashboard",
      myEarnings: "My Earnings",
      myProfile: "My Profile",
      mySubscriptions: "My Subscriptions",
      myNetwork: "My Network",
      myReferrals: "My Referrals",
      shareAndEarn: "Share & Earn",
      logout: "Logout",
      login: "Login",
      signup: "Sign Up",
      notifications: "Notifications",
      markAllRead: "Mark all read",
      noNotifications: "No notifications yet",
      changeLanguage: "Change Language",
      brand: "Dharmarth"
    },
    home: {
      platformFee: "PLATFORM FEE",
      contributors: "CONTRIBUTORS",
      donateNow: "Donate Now",
      whyChooseUs: "Why Choose Us?",
      giftSmiles: "Gift Smiles with Monthly Giving",
      savedText: "Lives Have Been Saved With Monthly Contributions From",
      contributorsLower: "Contributors",
      saveCountless: "Save Countless Lives By Giving Monthly.",
      joinEarnMonthly: "Join & Earn Monthly",
      faqTitle: "Frequently Asked Questions",
      feedChild: "Feed a child, Heal a patient, Save a life."
    },
    auth: {
      enterPhone: "Enter mobile number",
      enterName: "Enter full name",
      getOtp: "Get OTP",
      verify: "Verify OTP",
      login: "Login",
      signup: "Sign Up",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?"
    },
    donate: {
      supportCause: "Support our causes",
      enterAmount: "Enter Custom Amount (₹)",
      proceed: "Proceed to Payment",
      selectMode: "Select Payment Mode",
      success: "Donation Successful!",
      loading: "Processing payment..."
    },
    events: {
      activeEvents: "Active Fundraisers & Events",
      daysLeft: "days left",
      raisedOf: "raised of",
      volunteer: "Volunteer Now",
      viewDetails: "View Details"
    },
    onboarding: {
      s1: {
        title: "Divine Support",
        subtitle: "Cow Seva & Medical Aid",
        description: "Support noble causes like cow shelters, health camps, and child education. Directly touch lives with your kind contributions."
      },
      s2: {
        title: "Inspire & Earn",
        subtitle: "10% Wallet Commission",
        description: "Share your personal referral link with your family and networks. Earn a 10% instant reward for every inspired donation."
      },
      s3: {
        title: "Grow Your Network",
        subtitle: "Multi-Level Tracking",
        description: "Track directly inspired L1 and partner-inspired L2 donors via a visual network tree. Download your 80G tax certificates instantly."
      },
      s4: {
        title: "Secure Payouts",
        subtitle: "Direct Bank Transfer",
        description: "Manage your earnings inside a secure wallet. Withdraw funds directly to your verified bank account at any time with total safety."
      },
      skip: "Skip",
      getStarted: "Get Started",
      next: "Next"
    }
  },
  hi: {
    navbar: {
      home: "मुख्य पृष्ठ",
      donate: "दान करें",
      events: "आयोजन",
      profile: "प्रोफाइल",
      dashboard: "डैशबोर्ड",
      myEarnings: "मेरी कमाई",
      myProfile: "मेरी प्रोफाइल",
      mySubscriptions: "मेरी सदस्यता",
      myNetwork: "मेरा नेटवर्क",
      myReferrals: "मेरे रेफ़रल",
      shareAndEarn: "शेयर करें और कमाएं",
      logout: "लॉगआउट",
      login: "लॉगिन",
      signup: "साइन अप",
      notifications: "सूचनाएं",
      markAllRead: "सभी को पढ़ा हुआ चिह्नित करें",
      noNotifications: "कोई नई सूचना नहीं",
      changeLanguage: "भाषा बदलें",
      brand: "धर्मार्थ"
    },
    home: {
      platformFee: "प्लेटफॉर्म शुल्क",
      contributors: "योगदानकर्ता",
      donateNow: "अभी दान करें",
      whyChooseUs: "हमें क्यों चुनें?",
      giftSmiles: "मासिक दान के साथ मुस्कान उपहार में दें",
      savedText: "जीवन बचाए गए हैं मासिक योगदान के द्वारा",
      contributorsLower: "योगदानकर्ता",
      saveCountless: "मासिक योगदान देकर अनगिनत जिंदगियां बचाएं।",
      joinEarnMonthly: "जुड़ें और मासिक कमाएं",
      faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
      feedChild: "एक बच्चे को खिलाएं, एक मरीज को ठीक करें, एक जीवन बचाएं।"
    },
    auth: {
      enterPhone: "मोबाइल नंबर दर्ज करें",
      enterName: "पूरा नाम दर्ज करें",
      getOtp: "ओटीपी प्राप्त करें",
      verify: "ओटीपी सत्यापित करें",
      login: "लॉगिन करें",
      signup: "साइन अप करें",
      dontHaveAccount: "खाता नहीं है?",
      alreadyHaveAccount: "पहले से ही एक खाता है?"
    },
    donate: {
      supportCause: "हमारे कारणों का समर्थन करें",
      enterAmount: "कस्टम राशि दर्ज करें (₹)",
      proceed: "भुगतान के लिए आगे बढ़ें",
      selectMode: "भुगतान का प्रकार चुनें",
      success: "दान सफल रहा!",
      loading: "भुगतान संसाधित हो रहा है..."
    },
    events: {
      activeEvents: "सक्रिय धन संचय और कार्यक्रम",
      daysLeft: "दिन शेष",
      raisedOf: "एकत्रित किए गए",
      volunteer: "अभी स्वयंसेवक बनें",
      viewDetails: "विवरण देखें"
    },
    onboarding: {
      s1: {
        title: "दैवीय सहायता",
        subtitle: "गौ सेवा और चिकित्सा सहायता",
        description: "गौशालाओं, स्वास्थ्य शिविरों और बाल शिक्षा जैसे नेक कार्यों का समर्थन करें। अपने दयालु योगदान से सीधे जीवन को छुएं।"
      },
      s2: {
        title: "प्रेरित करें और कमाएं",
        subtitle: "10% वॉलेट कमीशन",
        description: "अपने व्यक्तिगत रेफरल लिंक को अपने परिवार और नेटवर्क के साथ साझा करें। प्रत्येक प्रेरित दान के लिए 10% त्वरित इनाम अर्जित करें।"
      },
      s3: {
        title: "अपना नेटवर्क बढ़ाएं",
        subtitle: "बहु-स्तरीय ट्रैकिंग",
        description: "एक विज़ुअल नेटवर्क ट्री के माध्यम से सीधे प्रेरित L1 और भागीदार-प्रेरित L2 दाताओं को ट्रैक करें। अपने 80G टैक्स प्रमाण पत्र तुरंत डाउनलोड करें।"
      },
      s4: {
        title: "सुरक्षित भुगतान",
        subtitle: "सीधा बैंक ट्रांसफर",
        description: "अपने सुरक्षित वॉलेट के भीतर अपनी कमाई का प्रबंधन करें। पूर्ण सुरक्षा के साथ किसी भी समय अपने सत्यापित बैंक खाते में सीधे धन निकालें।"
      },
      skip: "छोड़ें",
      getStarted: "शुरू करें",
      next: "अगला"
    }
  }
};

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('hi'); // Default to Hindi
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLocale = async () => {
      try {
        const storedLocale = await AsyncStorage.getItem('locale');
        if (storedLocale) {
          setLocale(storedLocale);
        }
      } catch (err) {
        console.error("Failed to load locale", err);
      } finally {
        setLoading(false);
      }
    };
    loadLocale();
  }, []);

  const changeLanguage = async (lang) => {
    try {
      setLocale(lang);
      await AsyncStorage.setItem('locale', lang);
    } catch (err) {
      console.error("Failed to save locale", err);
    }
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English if key missing in Hindi
        let fallbackVal = translations['en'];
        for (const fk of keys) {
          if (fallbackVal && fallbackVal[fk] !== undefined) {
            fallbackVal = fallbackVal[fk];
          } else {
            return key; // return raw key if missing completely
          }
        }
        return fallbackVal;
      }
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
};
