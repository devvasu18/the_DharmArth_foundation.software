import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { useTranslation } from '../../src/context/LanguageContext';
import api from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.faqQuestion}>{question}</Text>
        <Ionicons
          name={isOpen ? "chevron-up" : "chevron-down"}
          size={20}
          color="#1e293b"
        />
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.faqAnswerContainer}>
          <Text style={styles.faqAnswer}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

const LandingScreen = () => {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const [visuals, setVisuals] = useState([]);
  const [textSlides, setTextSlides] = useState([]);
  const [crowdfunding, setCrowdfunding] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const fetchData = async () => {
    try {
      const [sliderRes, crowdRes, faqRes] = await Promise.all([
        api.get('/content/sliders'),
        api.get('/content/crowdfunding'),
        api.get('/content/faqs')
      ]);
      const allSliders = sliderRes.data.filter(s => s.isVisible !== false);
      const images = allSliders.filter(s => s.type === 'image' || !s.type).sort((a, b) => a.order - b.order);
      const texts = allSliders.filter(s => s.type === 'text').sort((a, b) => a.order - b.order);

      setVisuals(images);
      setTextSlides(texts.length > 0 ? texts : images);
      setCrowdfunding(crowdRes.data);
      setFaqs(faqRes.data.filter(f => f.isVisible !== false));
    } catch (error) {
      console.error("Failed to fetch home content", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [])
  );

  // Auto-rotation logic
  useEffect(() => {
    if (visuals.length > 1) {
      const interval = setInterval(() => {
        setCurrentVisualIndex((prev) => (prev + 1) % visuals.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [visuals.length]);

  useEffect(() => {
    if (textSlides.length > 1) {
      const interval = setInterval(() => {
        setCurrentTextIndex((prev) => (prev + 1) % textSlides.length);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [textSlides.length]);

  const handleDonate = () => {
    router.push('/donate');
  };

  const handleJoin = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      router.push('/signup');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Premium Hero Slider Section */}
        <View style={styles.heroSection}>
          {/* App-like Hero Slider */}
          <View style={styles.heroSliderWrapper}>
            <View style={styles.heroDialContainer}>
              {visuals.map((slide, index) => {
                const len = visuals.length;
                const isCenter = index === currentVisualIndex;
                const isLeft = index === (currentVisualIndex - 1 + len) % len;
                const isRight = index === (currentVisualIndex + 1) % len;

                let position = 'hidden';
                if (isCenter) position = 'center';
                else if (isLeft) position = 'left';
                else if (isRight) position = 'right';

                if (position === 'hidden') return null;

                return (
                  <View
                    key={`hero-img-${slide._id || ''}-${index}`}
                    style={[
                      styles.heroCard,
                      position === 'center' && styles.heroCardCenter,
                      position === 'left' && styles.heroCardLeft,
                      position === 'right' && styles.heroCardRight,
                    ]}
                  >
                    <Image source={{ uri: slide.imageUrl }} style={styles.heroCardImage} resizeMode="cover" />
                  </View>
                );
              })}
            </View>

            {/* Pagination Indicators */}
            <View style={styles.paginationContainer}>
              {visuals.map((_, index) => (
                <View
                  key={`dot-${index}`}
                  style={[
                    styles.paginationDot,
                    index === currentVisualIndex && styles.paginationDotActive
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            {textSlides[currentTextIndex] && (
              <View key={`hero-txt-${textSlides[currentTextIndex]._id || ''}-${currentTextIndex}`}>
                <Text style={styles.heroTitle}>
                  {locale === 'hi' && textSlides[currentTextIndex].title_hi ? textSlides[currentTextIndex].title_hi : textSlides[currentTextIndex].title}
                </Text>

                <View style={styles.impactStats}>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>
                      {locale === 'hi' 
                        ? (textSlides[currentTextIndex].stat1Number_hi || textSlides[currentTextIndex].stat1Number || "0%") 
                        : (textSlides[currentTextIndex].stat1Number || "0%")}
                    </Text>
                    <Text style={styles.impactLabel}>
                      {locale === 'hi' 
                        ? (textSlides[currentTextIndex].stat1Label_hi || textSlides[currentTextIndex].stat1Label || t('home.platformFee')) 
                        : (textSlides[currentTextIndex].stat1Label || t('home.platformFee'))}
                    </Text>
                  </View>
                  <View style={styles.impactDivider} />
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>
                      {locale === 'hi' 
                        ? (textSlides[currentTextIndex].stat2Number_hi || textSlides[currentTextIndex].stat2Number || "72 लाख+") 
                        : (textSlides[currentTextIndex].stat2Number || "72 Lakh+")}
                    </Text>
                    <Text style={styles.impactLabel}>
                      {locale === 'hi' 
                        ? (textSlides[currentTextIndex].stat2Label_hi || textSlides[currentTextIndex].stat2Label || t('home.contributors')) 
                        : (textSlides[currentTextIndex].stat2Label || t('home.contributors'))}
                    </Text>
                  </View>
                </View>

                <Text style={styles.heroDescription}>
                  {locale === 'hi' && textSlides[currentTextIndex].subtitle_hi ? textSlides[currentTextIndex].subtitle_hi : (textSlides[currentTextIndex].subtitle || 'Empowering change through your generous contributions.')}
                </Text>

                <TouchableOpacity
                  style={styles.heroCta}
                  onPress={() => {
                    const link = textSlides[currentTextIndex].ctaLink || '';
                    if (!link || link === '/donate' || link.endsWith('/donate')) {
                      router.push('/donate');
                    } else if (link === '/events' || link.endsWith('/events')) {
                      router.push('/events');
                    } else {
                      let webLink = link;
                      if (link.startsWith('/')) {
                        webLink = `https://thedharmarth.com${link}`;
                      } else if (!link.startsWith('http')) {
                        webLink = `https://thedharmarth.com/${link}`;
                      }
                      Linking.openURL(webLink).catch(err => console.log('Failed to open link:', err));
                    }
                  }}
                >
                  <Text style={styles.heroCtaText}>
                    {locale === 'hi' && textSlides[currentTextIndex].ctaText_hi ? textSlides[currentTextIndex].ctaText_hi : (textSlides[currentTextIndex].ctaText || 'Donate Now')}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            {t('home.feedChild')}
          </Text>
          <View style={styles.welcomeUnderline} />
        </View>

        {/* Crowdfunding Sections */}
        {crowdfunding.map((section, index) => (
          <View key={`crowd-${section._id || ''}-${index}`} style={[styles.crowdSection, index % 2 !== 0 && styles.crowdSectionAlt]}>
            <Image source={{ uri: section.imageUrl }} style={styles.crowdImage} />
            <View style={styles.crowdContent}>
              <Text style={styles.crowdTitle}>
                {locale === 'hi' && section.title_hi ? section.title_hi : section.title}
              </Text>
              <Text style={styles.crowdText}>
                {locale === 'hi' && section.text_hi ? section.text_hi.replace(/<[^>]*>?/gm, '') : section.text.replace(/<[^>]*>?/gm, '')}
              </Text>
            </View>
          </View>
        ))}

        {/* Why Us Section */}
        <View style={styles.whyUsSection}>
          <Text style={styles.sectionHeading}>{t('home.whyChooseUs')}</Text>
          <View style={styles.whyUsGrid}>
            {[
              { icon: 'trophy-outline', text: locale === 'hi' ? 'पारदर्शी और जवाबदेह' : 'Transparent & Accountable' },
              { icon: 'people-outline', text: locale === 'hi' ? 'समुदाय संचालित' : 'Community Driven' },
              { icon: 'medical-outline', text: locale === 'hi' ? 'जीवन रक्षक सहायता' : 'Life Saving Aid' },
              { icon: 'card-outline', text: locale === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Payments' }
            ].map((item, i) => (
              <View key={`why-${i}`} style={styles.whyUsItem}>
                <View style={styles.whyUsIcon}>
                  <Ionicons name={item.icon} size={32} color="#00bfa5" />
                </View>
                <Text style={styles.whyUsText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Monthly Giving Section */}
        <View style={styles.monthlyGivingSection}>
          <Image
            source={{ uri: 'https://thedharmarth.com/assets/happy_kids_illustration-sgLu09hg.png' }}
            style={styles.monthlyGivingImg}
            resizeMode="cover"
          />
          <View style={styles.monthlyGivingContent}>
            <Text style={styles.monthlyGivingTitle}>{t('home.giftSmiles')}</Text>
            <Text style={styles.monthlyGivingText}>
              <Text style={styles.monthlyHighlight}>{locale === 'hi' ? '6,619 जीवन' : '6,619 Lives'}</Text> {t('home.savedText')} <Text style={styles.monthlyHighlight}>{locale === 'hi' ? '4,21,908 योगदानकर्ताओं' : '4,21,908 Contributors'}</Text>. {t('home.saveCountless')}
            </Text>
            <TouchableOpacity
              style={styles.monthlyGivingBtn}
              onPress={() => router.push('/dashboard')}
            >
              <Text style={styles.monthlyGivingBtnText}>{t('home.joinEarnMonthly')}</Text>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <View style={styles.faqSection}>
            <Text style={styles.sectionHeading}>{t('home.faqTitle')}</Text>
            {faqs.map((faq, index) => (
              <FAQItem 
                key={faq._id || index} 
                question={locale === 'hi' && faq.question_hi ? faq.question_hi : faq.question} 
                answer={locale === 'hi' && faq.answer_hi ? faq.answer_hi : faq.answer} 
              />
            ))}
          </View>
        )}

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Hero Section
  heroSection: {
    paddingTop: 40,
    backgroundColor: '#E0F7FA', // Light teal background
    paddingBottom: 60,
  },
  heroSliderWrapper: {
    marginBottom: 32,
    marginTop: 10,
  },
  heroDialContainer: {
    height: 220,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 20,
  },
  heroCard: {
    position: 'absolute',
    width: width * 0.88,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
  },
  heroCardCenter: {
    zIndex: 10,
    transform: [{ scale: 1 }],
    opacity: 1,
  },
  heroCardLeft: {
    zIndex: 5,
    transform: [
      { translateX: -width * 0.78 },
      { scale: 0.9 }
    ],
    opacity: 0.6,
  },
  heroCardRight: {
    zIndex: 5,
    transform: [
      { translateX: width * 0.78 },
      { scale: 0.9 }
    ],
    opacity: 0.6,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 191, 165, 0.3)',
  },
  paginationDotActive: {
    width: 24,
    backgroundColor: '#00bfa5',
  },
  heroContent: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 24,
  },
  heroDescription: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  heroCta: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 35,
    gap: 12,
    elevation: 8,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  heroCtaText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 18,
  },
  impactStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(0,191,165,0.2)',
  },
  impactItem: {
    flex: 1,
    alignItems: 'center',
  },
  impactNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00bfa5',
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00bfa5',
    marginTop: 4,
  },
  impactDivider: {
    width: 1,
    backgroundColor: 'rgba(0,191,165,0.1)',
  },

  // Welcome Section
  welcomeSection: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 16,
  },
  welcomeUnderline: {
    width: 60,
    height: 5,
    backgroundColor: '#00bfa5',
    borderRadius: 5,
  },

  // Crowdfunding Sections
  crowdSection: {
    padding: 24,
    backgroundColor: 'white',
  },
  crowdSectionAlt: {
    backgroundColor: '#f1f5f9',
  },
  crowdImage: {
    width: '100%',
    height: 250,
    borderRadius: 20,
    marginBottom: 24,
  },
  crowdContent: {
    flex: 1,
  },
  crowdTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  crowdText: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 26,
  },

  // Why Us
  whyUsSection: {
    padding: 32,
    backgroundColor: 'white',
  },
  sectionHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  // FAQ Section
  faqSection: {
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  faqItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    marginRight: 10,
  },
  faqAnswerContainer: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 0,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 22,
  },
  whyUsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  whyUsItem: {
    width: (width - 64 - 16) / 2,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  whyUsIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  whyUsText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },

  // Monthly Giving Section
  monthlyGivingSection: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  monthlyGivingImg: {
    width: '100%',
    height: 180,
  },
  monthlyGivingContent: {
    padding: 24,
    alignItems: 'center',
  },
  monthlyGivingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  monthlyGivingText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  monthlyHighlight: {
    color: '#00bfa5',
    fontWeight: '800',
  },
  monthlyGivingBtn: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
    gap: 10,
  },
  monthlyGivingBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  // Detailed Footer
  footerDetailed: {
    padding: 32,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerBrand: {
    marginBottom: 32,
  },
  footerBrandName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 16,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  contactInfo: {
    gap: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  footerLinksGrid: {
    flexDirection: 'row',
    gap: 40,
    marginBottom: 40,
  },
  footerCol: {
    flex: 1,
  },
  footerColTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  footerLink: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    fontWeight: '500',
  },
  footerBottom: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 32,
    alignItems: 'center',
  },
  paymentIcons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  paymentTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  copyrightText: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LandingScreen;
