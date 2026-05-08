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
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const LandingScreen = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [sliders, setSliders] = useState([]);
  const [crowdfunding, setCrowdfunding] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSliderIndex, setCurrentSliderIndex] = useState(0);
  const sliderRef = React.useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sliderRes, crowdRes] = await Promise.all([
          api.get('/content/sliders'),
          api.get('/content/crowdfunding')
        ]);
        setSliders(sliderRes.data.filter(s => s.isVisible !== false && (s.type === 'image' || !s.type)));
        setCrowdfunding(crowdRes.data);
      } catch (error) {
        console.error("Failed to fetch home content", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Auto-scroll logic
  useEffect(() => {
    if (sliders.length > 1) {
      const interval = setInterval(() => {
        const nextIndex = (currentSliderIndex + 1) % sliders.length;
        sliderRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        setCurrentSliderIndex(nextIndex);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [sliders, currentSliderIndex]);

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
      <Stack.Screen options={{ 
        title: 'DharmArth', 
        headerTitleAlign: 'center',
        headerLeft: () => (
          <Image 
            source={{ uri: 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/logo.png' }} 
            style={{ width: 30, height: 30, marginLeft: 16 }} 
          />
        )
      }} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Slider Section */}
        <View style={styles.heroSection}>
          <ScrollView 
            ref={sliderRef}
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offset = e.nativeEvent.contentOffset.x;
              setCurrentSliderIndex(Math.round(offset / width));
            }}
            scrollEventThrottle={16}
          >
            {sliders.map((slide, index) => (
              <View key={slide._id || index} style={{ width }}>
                <Image source={{ uri: slide.imageUrl }} style={styles.heroImage} resizeMode="cover" />
                <View style={styles.heroOverlay}>
                  <Text style={styles.heroSlideTitle}>{slide.title}</Text>
                  <Text style={styles.heroSlideSubtitle} numberOfLines={2}>{slide.subtitle}</Text>
                  <TouchableOpacity style={styles.slideCta} onPress={() => Linking.openURL(slide.ctaLink || 'https://the-dharm-arth-foundation-software.vercel.app/donate')}>
                    <Text style={styles.slideCtaText}>{slide.ctaText || 'Donate Now'}</Text>
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          <View style={styles.pagination}>
            {sliders.map((_, i) => (
              <View key={i} style={[styles.dot, currentSliderIndex === i && styles.activeDot]} />
            ))}
          </View>
        </View>

        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to the Dharmarth Medical Foundation</Text>
          <View style={styles.welcomeSeparator} />
          <Text style={styles.welcomeSubtitle}>
            Empowering change through your generous contributions.
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
        </View>

        {/* Crowdfunding Sections */}
        {crowdfunding.map((section, index) => (
          <View key={section._id} style={[styles.crowdSection, index % 2 !== 0 && styles.crowdSectionAlt]}>
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
              <View key={i} style={styles.whyUsItem}>
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
  // Hero Slider
  heroSection: {
    height: 400,
    position: 'relative',
  },
  heroImage: {
    width: width,
    height: 400,
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  heroSlideTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: 'white',
    lineHeight: 40,
  },
  heroSlideSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
    marginBottom: 20,
  },
  slideCta: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'flex-start',
    gap: 8,
  },
  slideCtaText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
  pagination: {
    position: 'absolute',
    bottom: 15,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#00bfa5',
    width: 20,
  },

  // Welcome Section
  welcomeSection: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 36,
  },
  welcomeSeparator: {
    width: 60,
    height: 4,
    backgroundColor: '#00bfa5',
    marginVertical: 20,
    borderRadius: 2,
    opacity: 0.3,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  impactStats: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 24,
    width: '100%',
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
    color: '#94a3b8',
    marginTop: 4,
  },
  impactDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
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
