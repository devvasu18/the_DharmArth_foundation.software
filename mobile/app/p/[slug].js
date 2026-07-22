import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  Linking,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import YoutubeIframe from 'react-native-youtube-iframe';
import api from '../../src/services/api';
import { useTranslation } from '../../src/context/LanguageContext';
import { useAuth } from '../../src/context/AuthContext';

const { width } = Dimensions.get('window');

export default function DynamicCmsScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { locale, t } = useTranslation();
  const { user } = useAuth();
  
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedFaqs, setExpandedFaqs] = useState({});
  const [expandedAccordions, setExpandedAccordions] = useState({});

  useEffect(() => {
    if (!slug) return;
    const fetchPage = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/cms/pages/public/${slug}`);
        setPageData(data);
        setError(null);
      } catch (err) {
        console.error("CMS Page fetch error:", err);
        setError("Page not found");
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug]);

  // Clean HTML from text
  const cleanText = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/<[^>]*>/g, '').trim();
  };

  // Hindi Translations helper
  const getTranslatedText = (text) => {
    if (!text || typeof text !== 'string') return text;
    const cleaned = text.replace(/<[^>]*>/g, '').trim().toLowerCase();

    if (cleaned.includes('become a mission partner')) return 'मिशन भागीदार बनें';
    if (cleaned.includes('join the dharmarth foundation as a motivator')) return 'एक प्रेरक के रूप में द धर्मार्थ फाउंडेशन से जुड़ें। जीवन बदलने वाले कारणों से दाताओं को जोड़ने में हमारी मदद करें और अपने प्रभाव के लिए पारदर्शी प्रोत्साहन अर्जित करें।';
    if (cleaned.includes('how it works')) return 'यह कैसे काम करता है';
    if (cleaned.includes('a simple, transparent process')) return 'एक प्रेरक के रूप में अपनी यात्रा शुरू करने की एक सरल, पारदर्शी प्रक्रिया।';
    if (cleaned.includes('create account')) return 'खाता बनाएं';
    if (cleaned.includes('register as a motivator')) return '2 मिनट से भी कम समय में एक प्रेरक के रूप में पंजीकरण करें।';
    if (cleaned.includes('share the mission')) return 'मिशन साझा करें';
    if (cleaned.includes('connect donors to our verified')) return 'अपने विशिष्ट लिंक का उपयोग करके दाताओं को हमारे सत्यापित सामाजिक कारणों से जोड़ें।';
    if (cleaned.includes('drive impact')) return 'प्रभाव डालें';
    if (cleaned.includes('help us provide food, health')) return 'जरूरतमंदों को भोजन, स्वास्थ्य और शिक्षा प्रदान करने में हमारी मदद करें।';
    if (cleaned.includes('earn incentives')) return 'प्रोत्साहन अर्जित करें';
    if (cleaned.includes('receive recurring referral benefits')) return 'प्रत्येक सफल योगदान के लिए आवर्ती रेफरल लाभ प्राप्त करें।';
    if (cleaned.includes('why join the mission')) return 'मिशन में क्यों शामिल हों?';
    if (cleaned.includes('recurring rewards')) return 'आवर्ती पुरस्कार';
    if (cleaned.includes('earn benefits not just once')) return 'केवल एक बार नहीं, बल्कि दाता सदस्यता के जीवनकाल के लिए लाभ अर्जित करें।';
    if (cleaned.includes('real-time tracking')) return 'वास्तविक समय ट्रैकिंग';
    if (cleaned.includes('monitor your impact and earnings')) return 'एक पेशेवर डैशबोर्ड के माध्यम से अपने प्रभाव और कमाई की निगरानी करें।';
    if (cleaned.includes('direct bank payouts')) return 'सीधे बैंक भुगतान';
    if (cleaned.includes('fast, secure, and transparent')) return 'सीधे आपके खाते में तेज़, सुरक्षित और पारदर्शी भुगतान।';
    if (cleaned.includes('impact certification')) return 'प्रभाव प्रमाणन';
    if (cleaned.includes('get recognized for your contributions')) return 'समाज में आपके योगदान के लिए पहचान प्राप्त करें।';
    if (cleaned.includes('ready to start your mission')) return 'अपना मिशन शुरू करने के लिए तैयार हैं?';
    if (cleaned.includes('join 2,500+ motivators')) return 'दुनिया को एक बेहतर जगह बनाने वाले 2,500+ प्रेरकों में शामिल हों।';
    if (cleaned.includes('register as motivator')) return 'प्रेरक के रूप में पंजीकरण करें';
    if (cleaned.includes('join now')) return 'अभी शामिल हों';
    if (cleaned.includes('empower change. earn rewards')) return 'बदलाव को सशक्त बनाएं। पुरस्कार अर्जित करें।';

    return text;
  };

  const getLocalizedValue = (item, key) => {
    if (!item) return '';
    const hiKey = `${key}_hi`;
    if (locale === 'hi') {
      if (item[hiKey] && item[hiKey].trim() !== '') {
        return cleanText(item[hiKey]);
      }
      return cleanText(getTranslatedText(item[key]));
    }
    return cleanText(item[key]);
  };

  const mapIconToIonicons = (iconName) => {
    const map = {
      Users: 'people-outline',
      Heart: 'heart-outline',
      Zap: 'flash-outline',
      ShieldCheck: 'shield-checkmark-outline',
      RotateCw: 'sync-outline',
      BarChart3: 'analytics-outline',
      Wallet: 'wallet-outline',
      Award: 'award-outline',
    };
    return map[iconName] || 'cube-outline';
  };

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
    return null;
  };

  const handleCtaPress = (link) => {
    if (!link) return;
    if (link === '/donate' || link.endsWith('/donate')) {
      router.push('/donate');
    } else if (link === '/events' || link.endsWith('/events')) {
      router.push('/events');
    } else if (link.startsWith('/')) {
      router.push(link);
    } else {
      Linking.openURL(link).catch(err => console.log('Failed to open link:', err));
    }
  };

  const toggleFaq = (index) => {
    setExpandedFaqs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleAccordion = (index) => {
    setExpandedAccordions(prev => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: '' }} />
        <ActivityIndicator size="large" color="#00bfa5" />
        <Text style={styles.loadingText}>Loading page...</Text>
      </View>
    );
  }

  if (error || !pageData) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text style={styles.errorText}>{error || "Page not found"}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backButtonText}>Go to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const title = getLocalizedValue(pageData, 'title');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      <Stack.Screen 
        options={{ 
          title: title || 'Page',
          headerTitleStyle: { fontWeight: '800', color: '#1e293b' },
          headerTintColor: '#00bfa5',
          headerStyle: { backgroundColor: 'white' }
        }} 
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {pageData.components.map((component, idx) => {
          const { type, data } = component;
          if (!data) return null;

          switch (type) {
            case 'video': {
              const compTitle = getLocalizedValue(data, 'title');
              const videoUrl = data.videoUrl || '';
              const thumbUrl = getYoutubeThumbnail(videoUrl);
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  {compTitle !== '' && <Text style={styles.sectionTitle}>{compTitle}</Text>}
                  {(() => {
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                    const match = videoUrl.match(regExp);
                    const videoId = (match && match[2].length === 11) ? match[2] : null;

                    if (videoId) {
                      return (
                        <View style={{ borderRadius: 16, overflow: 'hidden', marginTop: 10 }}>
                          <YoutubeIframe height={220} videoId={videoId} />
                        </View>
                      );
                    }

                    return (
                      <TouchableOpacity 
                        style={styles.videoCard}
                        activeOpacity={0.9}
                        onPress={() => Linking.openURL(videoUrl).catch(err => console.log(err))}
                      >
                        {thumbUrl ? (
                          <ImageBackground source={{ uri: thumbUrl }} style={styles.videoThumb} imageStyle={{ borderRadius: 16 }}>
                            <View style={styles.videoOverlay}>
                              <Ionicons name="play-circle" size={72} color="#00bfa5" />
                            </View>
                          </ImageBackground>
                        ) : (
                          <View style={[styles.videoThumb, styles.videoPlaceholder]}>
                            <Ionicons name="play-circle" size={72} color="#00bfa5" />
                            <Text style={styles.videoPlaceholderText}>Watch Guide Video</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })()}
                </View>
              );
            }

            case 'slider': {
              const slides = data.slides || [];
              if (slides.length === 0) return null;
              const slide = slides[0]; // Render the main slider banner
              const slideTitle = getLocalizedValue(slide, 'title');
              const slideSubtitle = getLocalizedValue(slide, 'subtitle');
              const buttonText = getLocalizedValue(slide, 'buttonText');
              
              return (
                <View key={`comp-${idx}`} style={styles.heroSection}>
                  {slide.image ? (
                    <ImageBackground source={{ uri: slide.image }} style={styles.heroBg} imageStyle={{ borderRadius: 24 }}>
                      <View style={styles.heroBgOverlay}>
                        <Text style={styles.heroTitle}>{slideTitle}</Text>
                        <Text style={styles.heroSubtitle}>{slideSubtitle}</Text>
                        {buttonText !== '' && (
                          <TouchableOpacity 
                            style={styles.heroBtn}
                            onPress={() => handleCtaPress(slide.buttonLink)}
                          >
                            <Text style={styles.heroBtnText}>{buttonText}</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </ImageBackground>
                  ) : (
                    <View style={[styles.heroBg, { backgroundColor: '#f0fdfa' }]}>
                      <View style={[styles.heroBgOverlay, { backgroundColor: 'transparent' }]}>
                        <Text style={[styles.heroTitle, { color: '#0f172a' }]}>{slideTitle}</Text>
                        <Text style={[styles.heroSubtitle, { color: '#475569' }]}>{slideSubtitle}</Text>
                        {buttonText !== '' && (
                          <TouchableOpacity 
                            style={styles.heroBtn}
                            onPress={() => handleCtaPress(slide.buttonLink)}
                          >
                            <Text style={styles.heroBtnText}>{buttonText}</Text>
                            <Ionicons name="arrow-forward" size={18} color="white" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              );
            }

            case 'process': {
              const compTitle = getLocalizedValue(data, 'title');
              const compSubtitle = getLocalizedValue(data, 'subtitle');
              const steps = data.steps || [];
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{compTitle}</Text>
                  {compSubtitle !== '' && <Text style={styles.sectionSubtitle}>{compSubtitle}</Text>}
                  
                  <View style={styles.processList}>
                    {steps.map((step, sIdx) => {
                      const stepTitle = getLocalizedValue(step, 'title');
                      const stepDesc = getLocalizedValue(step, 'description');
                      return (
                        <View key={`step-${sIdx}`} style={styles.processItem}>
                          <View style={styles.processLeft}>
                            <View style={styles.processDot}>
                              <Text style={styles.processDotText}>{`0${sIdx + 1}`}</Text>
                            </View>
                            {sIdx < steps.length - 1 && <View style={styles.processLine} />}
                          </View>
                          <View style={styles.processRight}>
                            <Text style={styles.processItemTitle}>{stepTitle}</Text>
                            <Text style={styles.processItemDesc}>{stepDesc}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }

            case 'stats': {
              const items = data.items || [];
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <View style={styles.statsGrid}>
                    {items.map((stat, sIdx) => {
                      const label = getLocalizedValue(stat, 'label');
                      const value = getLocalizedValue(stat, 'value');
                      const icon = stat.icon || 'Users';
                      return (
                        <View key={`stat-${sIdx}`} style={styles.statCard}>
                          <View style={styles.statIconWrapper}>
                            <Ionicons name={mapIconToIonicons(icon)} size={24} color="#00bfa5" />
                          </View>
                          <Text style={styles.statValue}>{value}</Text>
                          <Text style={styles.statLabel}>{label}</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }

            case 'features': {
              const compTitle = getLocalizedValue(data, 'title');
              const compSubtitle = getLocalizedValue(data, 'subtitle');
              const items = data.items || [];
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{compTitle}</Text>
                  {compSubtitle !== '' && <Text style={styles.sectionSubtitle}>{compSubtitle}</Text>}
                  
                  <View style={styles.featuresList}>
                    {items.map((feat, fIdx) => {
                      const fTitle = getLocalizedValue(feat, 'title');
                      const fDesc = getLocalizedValue(feat, 'description');
                      const icon = feat.icon || 'RotateCw';
                      return (
                        <View key={`feat-${fIdx}`} style={styles.featureItem}>
                          <View style={styles.featureIconBg}>
                            <Ionicons name={mapIconToIonicons(icon)} size={24} color="#00bfa5" />
                          </View>
                          <View style={styles.featureContent}>
                            <Text style={styles.featureItemTitle}>{fTitle}</Text>
                            <Text style={styles.featureItemDesc}>{fDesc}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }

            case 'testimonial': {
              const compTitle = getLocalizedValue(data, 'title');
              const items = data.items || [];
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{compTitle}</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.testimonialsScroll}
                  >
                    {items.map((testi, tIdx) => {
                      const name = getLocalizedValue(testi, 'name');
                      const text = getLocalizedValue(testi, 'text');
                      const rating = testi.rating || 5;
                      const photo = testi.photo || '';
                      return (
                        <View key={`testi-${tIdx}`} style={styles.testiCard}>
                          <Ionicons name="quote" size={32} color="#00bfa5" style={{ opacity: 0.15, marginBottom: -10 }} />
                          <View style={styles.starsRow}>
                            {Array.from({ length: rating }).map((_, r) => (
                              <Ionicons key={`star-${r}`} name="star" size={16} color="#fbbf24" style={{ marginRight: 2 }} />
                            ))}
                          </View>
                          <Text style={styles.testiText}>{`"${text}"`}</Text>
                          <View style={styles.testiUser}>
                            {photo ? (
                              <Image source={{ uri: photo }} style={styles.testiAvatar} />
                            ) : (
                              <View style={[styles.testiAvatar, { backgroundColor: '#e2e8f0', justifyContent: 'center', alignItems: 'center' }]}>
                                <Ionicons name="person" size={20} color="#94a3b8" />
                              </View>
                            )}
                            <Text style={styles.testiName}>{name}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
              );
            }

            case 'faq': {
              const compTitle = getLocalizedValue(data, 'title');
              const items = data.items || [];
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{compTitle}</Text>
                  <View style={styles.faqWrapper}>
                    {items.map((faq, fIdx) => {
                      const question = getLocalizedValue(faq, 'question');
                      const answer = getLocalizedValue(faq, 'answer');
                      const isExpanded = !!expandedFaqs[fIdx];
                      return (
                        <View key={`faq-${fIdx}`} style={styles.faqCard}>
                          <TouchableOpacity 
                            style={styles.faqHeader}
                            activeOpacity={0.7}
                            onPress={() => toggleFaq(fIdx)}
                          >
                            <Text style={styles.faqQuestion}>{question}</Text>
                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#1e293b" />
                          </TouchableOpacity>
                          {isExpanded && (
                            <View style={styles.faqAnswerContainer}>
                              <Text style={styles.faqAnswer}>{answer}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }

            case 'info_accordion': {
              const compTitle = getLocalizedValue(data, 'title');
              const compSubtitle = getLocalizedValue(data, 'subtitle');
              const items = data.items || [];
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <Text style={styles.sectionTitle}>{compTitle}</Text>
                  {compSubtitle !== '' && <Text style={styles.sectionSubtitle}>{compSubtitle}</Text>}
                  
                  <View style={styles.faqWrapper}>
                    {items.map((item, aIdx) => {
                      const rowTitle = getLocalizedValue(item, 'title');
                      const rowContent = getLocalizedValue(item, 'content');
                      const isExpanded = !!expandedAccordions[aIdx];
                      return (
                        <View key={`accordion-${aIdx}`} style={styles.faqCard}>
                          <TouchableOpacity 
                            style={styles.faqHeader}
                            activeOpacity={0.7}
                            onPress={() => toggleAccordion(aIdx)}
                          >
                            <Text style={styles.faqQuestion}>{rowTitle}</Text>
                            <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#1e293b" />
                          </TouchableOpacity>
                          {isExpanded && (
                            <View style={styles.faqAnswerContainer}>
                              <Text style={styles.faqAnswer}>{rowContent}</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            }

            case 'cta': {
              const compTitle = getLocalizedValue(data, 'title');
              const compSubtitle = getLocalizedValue(data, 'subtitle');
              const btnText = getLocalizedValue(data, 'buttonText');
              const btnLink = data.buttonLink || '';
              
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <View style={styles.ctaCard}>
                    <Text style={styles.ctaTitle}>{compTitle}</Text>
                    {compSubtitle !== '' && <Text style={styles.ctaSubtitle}>{compSubtitle}</Text>}
                    {btnText !== '' && (
                      <TouchableOpacity 
                        style={styles.ctaBtn}
                        onPress={() => handleCtaPress(btnLink)}
                      >
                        <Text style={styles.ctaBtnText}>{btnText}</Text>
                        <Ionicons name="arrow-forward" size={18} color="#00bfa5" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            }

            case 'contact_form': {
              const compTitle = getLocalizedValue(data, 'title');
              const compSubtitle = getLocalizedValue(data, 'subtitle');
              return (
                <View key={`comp-${idx}`} style={styles.section}>
                  <View style={styles.contactCard}>
                    <Ionicons name="chatbubbles-outline" size={48} color="#00bfa5" style={{ marginBottom: 12 }} />
                    <Text style={styles.contactTitle}>{compTitle}</Text>
                    {compSubtitle !== '' && <Text style={styles.contactSubtitle}>{compSubtitle}</Text>}
                    
                    <View style={styles.contactActions}>
                      <TouchableOpacity 
                        style={styles.contactBtn}
                        onPress={() => Linking.openURL('tel:+918306305569')}
                      >
                        <Ionicons name="call" size={18} color="white" />
                        <Text style={styles.contactBtnText}>Call Helpline</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.contactBtn, { backgroundColor: '#475569' }]}
                        onPress={() => Linking.openURL('mailto:support@dharmarth.org')}
                      >
                        <Ionicons name="mail" size={18} color="white" />
                        <Text style={styles.contactBtnText}>Email Us</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            }

            default:
              return null;
          }
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  backButton: {
    marginTop: 24,
    backgroundColor: '#00bfa5',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 32,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 32,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  
  // Video styling
  videoCard: {
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  videoThumb: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlaceholder: {
    backgroundColor: '#0f172a',
    gap: 8,
  },
  videoPlaceholderText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 16,
  },

  // Hero section styling
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  heroBg: {
    width: '100%',
    minHeight: 280,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroBgOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 24,
    justifyContent: 'center',
    borderRadius: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    lineHeight: 36,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 24,
  },
  heroBtn: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  heroBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },

  // Process timeline styling
  processList: {
    marginTop: 16,
  },
  processItem: {
    flexDirection: 'row',
    minHeight: 80,
  },
  processLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  processDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e6fbf7',
    borderWidth: 2,
    borderColor: '#00bfa5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processDotText: {
    color: '#00bfa5',
    fontWeight: '900',
    fontSize: 14,
  },
  processLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#00bfa5',
    opacity: 0.3,
    marginVertical: 4,
  },
  processRight: {
    flex: 1,
    paddingBottom: 24,
  },
  processItemTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  processItemDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },

  // Stats styling
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e6fbf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Features styling
  featuresList: {
    marginTop: 8,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e6fbf7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureItemTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  featureItemDesc: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },

  // Testimonials styling
  testimonialsScroll: {
    gap: 16,
    paddingVertical: 8,
  },
  testiCard: {
    width: width * 0.75,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  starsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  testiText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  testiUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  testiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  testiName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
  },

  // FAQ styling
  faqWrapper: {
    gap: 12,
  },
  faqCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  faqAnswerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },

  // CTA styling
  ctaCard: {
    backgroundColor: '#00bfa5',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: 'white',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaBtn: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    gap: 8,
  },
  ctaBtnText: {
    color: '#00bfa5',
    fontSize: 15,
    fontWeight: '800',
  },

  // Contact form styling
  contactCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  contactTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  contactBtn: {
    flex: 1,
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '800',
  },
});
