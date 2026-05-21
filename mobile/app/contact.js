import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../src/context/LanguageContext';
import api from '../src/services/api';

export default function ContactScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone || !formData.message) {
      alert(locale === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/leads', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        notes: `Subject: ${formData.subject || 'Mobile Inquiry'}\nMessage: ${formData.message}`
      });
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      alert(locale === 'hi' ? 'संदेश भेजने में विफल। कृपया पुन: प्रयास करें।' : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneCall = () => {
    Linking.openURL('tel:+919413941300');
  };

  const handleEmail = () => {
    Linking.openURL('mailto:support@dharmarth.org');
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: locale === 'hi' ? 'संपर्क करें' : 'Contact Us',
          headerTintColor: '#1e293b',
          headerTitleStyle: { fontWeight: '900', fontSize: 20 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Top Banner Card */}
          <View style={styles.bannerCard}>
            <View style={styles.bannerIconBox}>
              <Ionicons name="heart" size={28} color="#00bfa5" />
            </View>
            <Text style={styles.bannerTitle}>
              {locale === 'hi' ? 'हम यहाँ सहायता के लिए हैं' : 'We are here to help'}
            </Text>
            <Text style={styles.bannerSubtitle}>
              {locale === 'hi'
                ? 'क्या आपके पास कोई प्रश्न है? हमसे सीधे संपर्क करें और हमारी टीम आपकी मदद करेगी।'
                : 'Have any questions? Reach out to us directly and our team will support you.'}
            </Text>
          </View>

          {/* Quick Contact Information */}
          <View style={styles.infoSection}>
            <TouchableOpacity style={styles.infoCard} onPress={handlePhoneCall}>
              <View style={[styles.infoIconBox, { backgroundColor: '#e6fffa' }]}>
                <Ionicons name="call" size={24} color="#00bfa5" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>{locale === 'hi' ? 'हेल्पलाइन नंबर' : 'Helpline Support'}</Text>
                <Text style={styles.infoValue}>+91 94139 41300</Text>
                <Text style={styles.infoSubtext}>{locale === 'hi' ? 'कॉल करने के लिए टैप करें' : 'Tap to call us'}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.infoCard} onPress={handleEmail}>
              <View style={[styles.infoIconBox, { backgroundColor: '#f0fdfa' }]}>
                <Ionicons name="mail" size={24} color="#00bfa5" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>{locale === 'hi' ? 'ईमेल एड्रेस' : 'Email Address'}</Text>
                <Text style={styles.infoValue}>support@dharmarth.org</Text>
                <Text style={styles.infoSubtext}>{locale === 'hi' ? 'ईमेल भेजने के लिए टैप करें' : 'Tap to send mail'}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoCard}>
              <View style={[styles.infoIconBox, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="location" size={24} color="#64748b" />
              </View>
              <View style={styles.infoDetails}>
                <Text style={styles.infoLabel}>{locale === 'hi' ? 'मुख्य कार्यालय' : 'Headquarters'}</Text>
                <Text style={styles.infoValue}>TDMF Online Ventures</Text>
                <Text style={styles.infoSubtext}>Jaipur, Rajasthan, India</Text>
              </View>
            </View>
          </View>

          {/* Input Form Section */}
          <View style={styles.formSection}>
            <Text style={styles.formHeaderTitle}>
              {locale === 'hi' ? 'हमें संदेश भेजें' : 'Send us a Message'}
            </Text>

            {success ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={54} color="#00bfa5" style={{ marginBottom: 12 }} />
                <Text style={styles.successTitle}>
                  {locale === 'hi' ? 'सफलतापूर्वक भेजा गया!' : 'Sent Successfully!'}
                </Text>
                <Text style={styles.successDesc}>
                  {locale === 'hi'
                    ? 'आपका संदेश प्राप्त हो गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।'
                    : 'Your query has been logged. Our executive will call you soon.'}
                </Text>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => setSuccess(false)}
                >
                  <Text style={styles.resetBtnText}>
                    {locale === 'hi' ? 'दूसरा संदेश भेजें' : 'Send Another Message'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formCard}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{locale === 'hi' ? 'पूरा नाम *' : 'Full Name *'}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={locale === 'hi' ? 'अपना नाम दर्ज करें' : 'Enter your name'}
                    placeholderTextColor="#94a3b8"
                    value={formData.name}
                    onChangeText={(val) => setFormData({ ...formData, name: val })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{locale === 'hi' ? 'मोबाइल नंबर *' : 'Mobile Number *'}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={locale === 'hi' ? '10-अंकीय मोबाइल नंबर' : '10-digit number'}
                    placeholderTextColor="#94a3b8"
                    keyboardType="phone-pad"
                    value={formData.phone}
                    onChangeText={(val) => setFormData({ ...formData, phone: val })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{locale === 'hi' ? 'ईमेल आईडी' : 'Email Address'}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="name@domain.com"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    value={formData.email}
                    onChangeText={(val) => setFormData({ ...formData, email: val })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{locale === 'hi' ? 'विषय' : 'Subject'}</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder={locale === 'hi' ? 'पूछताछ का विषय' : 'Subject of inquiry'}
                    placeholderTextColor="#94a3b8"
                    value={formData.subject}
                    onChangeText={(val) => setFormData({ ...formData, subject: val })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>{locale === 'hi' ? 'आपका संदेश *' : 'Your Message *'}</Text>
                  <TextInput
                    style={[styles.textInput, styles.textArea]}
                    placeholder={locale === 'hi' ? 'यहाँ अपना विस्तृत संदेश लिखें...' : 'Type details here...'}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    value={formData.message}
                    onChangeText={(val) => setFormData({ ...formData, message: val })}
                  />
                </View>

                <TouchableOpacity
                  style={styles.submitBtn}
                  onPress={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.submitBtnText}>
                        {locale === 'hi' ? 'संदेश भेजें' : 'Send Message'}
                      </Text>
                      <Ionicons name="send" size={16} color="white" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  bannerCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  bannerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e6fffa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  bannerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  infoSection: {
    gap: 16,
    marginBottom: 28,
  },
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDetails: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  formSection: {
    marginTop: 8,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#00bfa5',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  successContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    boxShadow: '0 4px 20px rgba(15, 23, 42, 0.03)',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontWeight: '500',
  },
  resetBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  resetBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  }
});
