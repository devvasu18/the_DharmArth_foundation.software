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
import api from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const LandingScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [visuals, setVisuals] = useState([]);
  const [textSlides, setTextSlides] = useState([]);
  const [crowdfunding, setCrowdfunding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentVisualIndex, setCurrentVisualIndex] = useState(0);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);

  const fetchData = async () => {
    try {
      const [sliderRes, crowdRes] = await Promise.all([
        api.get('/content/sliders'),
        api.get('/content/crowdfunding')
      ]);
      const allSliders = sliderRes.data.filter(s => s.isVisible !== false);
      const images = allSliders.filter(s => s.type === 'image' || !s.type).sort((a, b) => a.order - b.order);
      const texts = allSliders.filter(s => s.type === 'text').sort((a, b) => a.order - b.order);

      setVisuals(images);
      setTextSlides(texts.length > 0 ? texts : images);
      setCrowdfunding(crowdRes.data);
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
    Linking.openURL('https://the-dharm-arth-foundation-software.vercel.app/donate');
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

          {/* Hero Content */}
          <View style={styles.heroContent}>
            {textSlides[currentTextIndex] && (
              <View key={`hero-txt-${textSlides[currentTextIndex]._id || ''}-${currentTextIndex}`}>
                <Text style={styles.heroTitle}>
                  {textSlides[currentTextIndex].title}
                </Text>

                <View style={styles.impactStats}>
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>0%</Text>
                    <Text style={styles.impactLabel}>PLATFORM FEE</Text>
                  </View>
                  <View style={styles.impactDivider} />
                  <View style={styles.impactItem}>
                    <Text style={styles.impactNumber}>72 Lakh+</Text>
                    <Text style={styles.impactLabel}>CONTRIBUTORS</Text>
                  </View>
                </View>

                <Text style={styles.heroDescription}>
                  {textSlides[currentTextIndex].subtitle || 'Empowering change through your generous contributions.'}
                </Text>

                <TouchableOpacity 
                  style={styles.heroCta} 
                  onPress={() => Linking.openURL(textSlides[currentTextIndex].ctaLink || 'https://the-dharm-arth-foundation-software.vercel.app/donate')}
                >
                  <Text style={styles.heroCtaText}>{textSlides[currentTextIndex].ctaText || 'Donate Now'}</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>
            Welcome to The DharmArth Foundation
          </Text>
          <View style={styles.welcomeUnderline} />
        </View>

        {/* Crowdfunding Sections */}
        {crowdfunding.map((section, index) => (
          <View key={`crowd-${section._id || ''}-${index}`} style={[styles.crowdSection, index % 2 !== 0 && styles.crowdSectionAlt]}>
            <Image source={{ uri: section.imageUrl }} style={styles.crowdImage} />
            <View style={styles.crowdContent}>
              <Text style={styles.crowdTitle}>{section.title}</Text>
              <Text style={styles.crowdText}>{section.text.replace(/<[^>]*>?/gm, '')}</Text>
            </View>
          </View>
        ))}

        {/* Why Us Section */}
        <View style={styles.whyUsSection}>
          <Text style={styles.sectionHeading}>Why Choose Us?</Text>
          <View style={styles.whyUsGrid}>
            {[
              { icon: 'trophy-outline', text: 'Transparent & Accountable' },
              { icon: 'people-outline', text: 'Community Driven' },
              { icon: 'medical-outline', text: 'Life Saving Aid' },
              { icon: 'card-outline', text: 'Secure Payments' }
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

        {/* Monthly Giving CTA */}
        <View style={styles.monthlySection}>
          <Text style={styles.monthlyTitle}>Support Monthly</Text>
          <Text style={styles.monthlyDesc}>Join our circle of constant support and help us plan for long-term medical aid.</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={handleDonate}>
            <Text style={styles.primaryBtnText}>Start Monthly Donation</Text>
          </TouchableOpacity>
        </View>

        {/* Detailed Footer */}
        <View style={styles.footerDetailed}>
          <View style={styles.footerBrand}>
            <Text style={styles.footerBrandName}>Dharmarth</Text>
            <View style={styles.socialRow}>
              <Ionicons name="logo-facebook" size={20} color="#475569" />
              <Ionicons name="logo-twitter" size={20} color="#475569" />
              <Ionicons name="logo-linkedin" size={20} color="#475569" />
              <Ionicons name="logo-youtube" size={20} color="#475569" />
              <Ionicons name="logo-instagram" size={20} color="#475569" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactText}>Email: info@Dharmarth.org</Text>
              <Text style={styles.contactText}>Contact: +91 9900000000</Text>
            </View>
          </View>

          <View style={styles.footerLinksGrid}>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Causes</Text>
              <Text style={styles.footerLink}>Medical Crowdfunding</Text>
              <Text style={styles.footerLink}>Cancer Crowdfunding</Text>
              <Text style={styles.footerLink}>Education Crowdfunding</Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>About Us</Text>
              <Text style={styles.footerLink}>Team Dharmarth</Text>
              <Text style={styles.footerLink}>Success Stories</Text>
              <Text style={styles.footerLink}>Our Blog</Text>
            </View>
          </View>

          <View style={styles.footerBottom}>
            <View style={styles.paymentIcons}>
              <Text style={styles.paymentTag}>VISA</Text>
              <Text style={styles.paymentTag}>UPI</Text>
              <Text style={styles.paymentTag}>SECURE</Text>
            </View>
            <Text style={styles.copyrightText}>© 2026 The DharmArth Foundation. All Rights Reserved.</Text>
          </View>
        </View>
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
  heroDialContainer: {
    height: 280,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  heroCard: {
    position: 'absolute',
    width: width * 0.55,
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: 'white',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
  },
  heroCardCenter: {
    zIndex: 10,
    transform: [{ scale: 1.1 }],
  },
  heroCardLeft: {
    zIndex: 5,
    transform: [
      { translateX: -width * 0.35 },
      { scale: 0.85 },
      { rotate: '-8deg' }
    ],
    opacity: 0.8,
  },
  heroCardRight: {
    zIndex: 5,
    transform: [
      { translateX: width * 0.35 },
      { scale: 0.85 },
      { rotate: '8deg' }
    ],
    opacity: 0.8,
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
    textAlign: 'center',
    marginBottom: 32,
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

  // Monthly
  monthlySection: {
    padding: 32,
    backgroundColor: '#00bfa5',
    margin: 24,
    borderRadius: 30,
    alignItems: 'center',
  },
  monthlyTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
    marginBottom: 12,
  },
  monthlyDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryBtn: {
    backgroundColor: 'white',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  primaryBtnText: {
    color: '#00bfa5',
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
