import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Platform,
  SafeAreaView,
  Pressable,
  KeyboardAvoidingView,
  Linking
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import api, { API_BASE_URL } from '../src/services/api';

const { width } = Dimensions.get('window');

const synonymMap = {
  // Blood tests
  "blood": ["cbc", "blood count", "hemogram", "sugar", "glucose", "lipid", "cholesterol", "serum", "plasma", "haemoglobin", "hb", "platelet", "wbc", "rbc"],
  "cbc": ["blood count", "hemogram", "blood test", "complete blood count", "haemoglobin", "hb"],
  "hemogram": ["cbc", "blood count", "complete blood count"],
  "haemoglobin": ["hb", "cbc", "blood count", "iron", "anemia"],
  "hb": ["haemoglobin", "cbc", "blood count", "iron", "anemia"],
  "sugar": ["diabetes", "glucose", "hba1c", "fasting sugar", "random sugar", "blood sugar"],
  "glucose": ["diabetes", "sugar", "hba1c", "blood sugar"],
  "diabetes": ["sugar", "glucose", "hba1c", "blood sugar"],
  "hba1c": ["sugar", "diabetes", "glucose", "blood sugar"],
  "cholesterol": ["lipid", "fat", "triglycerides", "hdl", "ldl", "heart"],
  "lipid": ["cholesterol", "fat", "triglycerides", "hdl", "ldl", "heart"],
  "thyroid": ["t3", "t4", "tsh", "goiter", "hormone"],
  "tsh": ["thyroid", "t3", "t4", "hormone"],

  // Heart / Cardiorespiratory
  "heart": ["ecg", "lipid", "cholesterol", "cardiology", "electrocardiogram", "pulse", "bp", "blood pressure"],
  "ecg": ["electrocardiogram", "heart", "cardiology", "pulse"],
  "bp": ["blood pressure", "hypertension", "heart"],
  "blood pressure": ["bp", "hypertension", "heart"],

  // Radiology / Imaging
  "xray": ["x-ray", "radiology", "scan", "chest xray", "bone", "fracture"],
  "x-ray": ["xray", "radiology", "scan", "chest xray", "bone", "fracture"],
  "ultrasound": ["usg", "radiology", "scan", "sonography", "abdomen"],
  "usg": ["ultrasound", "radiology", "scan", "sonography", "abdomen"],
  "sonography": ["ultrasound", "usg", "radiology", "scan", "abdomen"],
  "scan": ["ultrasound", "usg", "xray", "x-ray", "mri", "ct scan", "radiology"],
  "mri": ["scan", "radiology", "imaging"],
  "ct": ["ct scan", "scan", "radiology", "imaging"],

  // Urine / Kidney
  "urine": ["urinalysis", "kidney", "renal", "rft", "lft", "kft"],
  "kidney": ["renal", "kft", "rft", "urine", "creatinine", "urea"],
  "kft": ["kidney", "renal", "rft", "creatinine", "urea", "urine"],
  "rft": ["kidney", "renal", "kft", "creatinine", "urea", "urine"],

  // Liver
  "liver": ["lft", "hepatic", "bilirubin", "sgot", "sgpt", "jaundice"],
  "lft": ["liver", "hepatic", "bilirubin", "sgot", "sgpt", "jaundice"],

  // General / Hindi synonyms
  "खून": ["blood", "cbc", "खून जांच", "हीमोग्लोबिन"],
  "शुगर": ["sugar", "diabetes", "glucose", "मधुमेह"],
  "दिल": ["heart", "ecg", "cardiology", "हृदय"],
  "मूत्र": ["urine", "पेशाब"],
  "किडनी": ["kidney", "गुर्दा", "kft"],
  "लिवर": ["liver", "यकृत", "lft"],
  "एक्सरे": ["xray", "x-ray", "एक्स-रे"]
};

export default function BodyTestsScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();

  const [bodyTests, setBodyTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Admin Settings State (for mobile dialer fallback)
  const [adminMobile, setAdminMobile] = useState('918306305569');
  const [bodyTestMobile, setBodyTestMobile] = useState('918306305569');
  const [contactPhone, setContactPhone] = useState('8306305569');

  useEffect(() => {
    fetchBodyTests();
    fetchSettings();
  }, []);

  // Reset category filter when language is changed
  useEffect(() => {
    setSelectedCategory('All');
  }, [locale]);

  const fetchBodyTests = async () => {
    try {
      setLoading(true);
      const response = await api.get('/body-tests?isActive=true');
      setBodyTests(response.data);
    } catch (error) {
      console.error('Failed to fetch body tests:', error);
      Alert.alert(
        locale === 'hi' ? 'त्रुटि' : 'Error',
        locale === 'hi' ? 'मेडिकल टेस्ट लोड करने में विफल' : 'Failed to fetch body tests'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/content/settings');
      if (response.data) {
        if (response.data.admin_suspension_mobile) {
          setAdminMobile(response.data.admin_suspension_mobile);
        }
        if (response.data.body_test_mobile) {
          setBodyTestMobile(response.data.body_test_mobile);
        }
        setContactPhone(response.data.contact_phone || '8306305569');
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };



  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  // Get unique categories
  const testCategories = ['All', ...new Set(bodyTests.map(t => (locale === 'hi' && t.category_hi) ? t.category_hi : t.category))];

  const filteredTests = bodyTests.filter(test => {
    const isSearching = !!searchTerm.trim();

    // 1. Category check - ignore if searching
    if (!isSearching) {
      const localizedCat = (locale === 'hi' && test.category_hi) ? test.category_hi : test.category;
      const matchesCategory = selectedCategory === 'All' || localizedCat === selectedCategory;
      if (!matchesCategory) return false;
    }

    // 2. Search query check
    if (!isSearching) return true;

    const query = searchTerm.toLowerCase().trim();

    const matchInText = (text) => text && text.toLowerCase().includes(query);
    if (
      matchInText(test.name) ||
      matchInText(test.name_hi) ||
      matchInText(test.category) ||
      matchInText(test.category_hi) ||
      matchInText(test.description) ||
      matchInText(test.description_hi)
    ) {
      return true;
    }

    const queryWords = query.split(/\s+/).filter(Boolean);
    for (const word of queryWords) {
      const synonyms = synonymMap[word] || [];
      const allSearchTerms = [word, ...synonyms];

      for (const term of allSearchTerms) {
        const matchInField = (fieldVal) => fieldVal && fieldVal.toLowerCase().includes(term.toLowerCase());
        if (
          matchInField(test.name) ||
          matchInField(test.name_hi) ||
          matchInField(test.category) ||
          matchInField(test.category_hi) ||
          matchInField(test.description) ||
          matchInField(test.description_hi)
        ) {
          return true;
        }
      }
    }

    return false;
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <Stack.Screen
          options={{
            headerShown: true,
            title: locale === 'hi' ? 'मेडिकल टेस्ट' : 'Medical Tests',
            headerTintColor: '#1e293b',
            headerTitleStyle: { fontWeight: '900', fontSize: 18 },
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
                <Ionicons name="arrow-back" size={24} color="#1e293b" />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00bfa5" />
          <Text style={styles.loadingText}>
            {locale === 'hi' ? 'टेस्ट लोड हो रहे हैं...' : 'Loading tests...'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: locale === 'hi' ? 'मेडिकल टेस्ट' : 'Medical Tests',
          headerTintColor: '#1e293b',
          headerTitleStyle: { fontWeight: '900', fontSize: 18 },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 8 }}>
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => Linking.openURL(`tel:${adminMobile}`)} 
              style={{ marginRight: 8, padding: 4 }}
            >
              <Ionicons name="call" size={22} color="#00bfa5" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView 
        style={styles.container} 
        contentContainerStyle={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Section */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="flask" size={28} color="#00bfa5" />
          </View>
          <Text style={styles.bannerTitle}>{t('bodyTests.title')}</Text>
          <Text style={styles.bannerSubtitle}>{t('bodyTests.subtitle')}</Text>
        </View>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('bodyTests.searchPlaceholder')}
            placeholderTextColor="#94a3b8"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm ? (
            <TouchableOpacity onPress={() => setSearchTerm('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Categories Scroller */}
        <View style={styles.categoriesWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {testCategories.map(cat => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                    {cat === 'All' ? t('bodyTests.all') : cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Header Label */}
        <Text style={styles.sectionTitle}>{t('bodyTests.availableTests')}</Text>

        {/* Grid/List of test cards */}
        <View style={styles.testList}>
          {filteredTests.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="flask-outline" size={64} color="#94a3b8" style={{ marginBottom: 16 }} />
              <Text style={styles.emptyTitle}>{t('bodyTests.noTests')}</Text>
              <Text style={styles.emptyDesc}>{t('bodyTests.noTestsDesc')}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchBodyTests}>
                <Text style={styles.retryText}>{locale === 'hi' ? 'पुनः प्रयास करें' : 'Retry'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredTests.map((test) => {
              const hasDiscount = !!test.originalPrice;
              const name = (locale === 'hi' && test.name_hi) ? test.name_hi : test.name;
              const desc = (locale === 'hi' && test.description_hi) ? test.description_hi : (test.description || 'Professional diagnostic checkup package.');
              const cat = (locale === 'hi' && test.category_hi) ? test.category_hi : test.category;

              return (
                <View key={test._id} style={styles.testCard}>
                  <View style={styles.testImageContainer}>
                    {test.image ? (
                      <Image
                        source={{ uri: getImageUrl(test.image) }}
                        style={styles.testImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.testPlaceholder}>
                        <Ionicons name="flask-outline" size={48} color="#00bfa5" />
                      </View>
                    )}
                    <View style={styles.testCategoryTag}>
                      <Text style={styles.testCategoryText}>{cat}</Text>
                    </View>
                  </View>

                  <View style={styles.testInfo}>
                    <Text style={styles.testName}>{name}</Text>
                    <Text style={styles.testDesc} numberOfLines={3}>{desc}</Text>
                    
                    <View style={styles.metaRow}>
                      <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.timeText}>{test.time}</Text>
                      </View>
                      <View style={styles.priceContainer}>
                        {hasDiscount && (
                          <Text style={styles.originalPrice}>
                            {test.originalPrice.startsWith('₹') ? test.originalPrice : `₹${test.originalPrice}`}
                          </Text>
                        )}
                        <Text style={styles.discountPrice}>
                          {test.price.startsWith('₹') ? test.price : `₹${test.price}`}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.bookButton}
                      onPress={() => {
                        let dialNumber = bodyTestMobile;
                        if (dialNumber.startsWith('91') && dialNumber.length === 12) {
                          dialNumber = dialNumber.substring(2);
                        }
                        Linking.openURL(`tel:${dialNumber}`);
                      }}
                    >
                      <Text style={styles.bookButtonText}>{t('bodyTests.bookTest')}</Text>
                      <Ionicons name="call" size={16} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  bannerCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
      },
      android: {
        elevation: 2,
      },
    }),
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
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
    fontWeight: '950',
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
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 52,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '600',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  categoriesWrapper: {
    marginBottom: 24,
  },
  categoryContainer: {
    gap: 8,
    paddingRight: 16,
  },
  categoryChip: {
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  categoryChipActive: {
    borderColor: '#00bfa5',
    backgroundColor: '#e6fffa',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  categoryTextActive: {
    color: '#004d40',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 16,
  },
  testList: {
    gap: 16,
  },
  testCard: {
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 20,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  testImageContainer: {
    height: 180,
    position: 'relative',
    backgroundColor: '#f8fafc',
  },
  testImage: {
    width: '100%',
    height: '100%',
  },
  testPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0fdfa',
  },
  testCategoryTag: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 191, 165, 0.9)',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  testCategoryText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  testInfo: {
    padding: 20,
  },
  testName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 6,
  },
  testDesc: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '700',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  originalPrice: {
    fontSize: 13,
    color: '#ef4444',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  discountPrice: {
    fontSize: 18,
    color: '#0f172a',
    fontWeight: '900',
  },
  bookButton: {
    backgroundColor: '#00bfa5',
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#00bfa5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  bookButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  emptyContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '805',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    fontWeight: '500',
  },
  retryButton: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  retryText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
});
