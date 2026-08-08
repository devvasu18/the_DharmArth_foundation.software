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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../src/context/LanguageContext';
import { useAuth } from '../src/context/AuthContext';
import api, { API_BASE_URL } from '../src/services/api';

const { width } = Dimensions.get('window');

const synonymMap = {
  // Blood tests
  "blood": ["cbc", "blood count", "hemogram", "sugar", "glucose", "lipid", "cholesterol", "serum", "plasma", "haemoglobin", "hb", "platelet", "wbc", "rbc"],
  "cbc": ["blood count", "hemogram", "complete blood count", "haemoglobin", "hb"],
  "hemogram": ["cbc", "blood count", "complete blood count"],
  "haemoglobin": ["hb", "cbc", "blood count", "iron", "anemia"],
  "hb": ["haemoglobin", "cbc", "blood count", "iron", "anemia"],
  "sugar": ["diabetes", "glucose", "hba1c", "fasting sugar", "random sugar", "blood sugar"],
  "glucose": ["diabetes", "sugar", "hba1c", "blood sugar"],
  "diabetes": ["sugar", "glucose", "hba1c", "blood sugar"],
  "hba1c": ["sugar", "diabetes", "glucose", "blood sugar"],
  "cholesterol": ["lipid", "fat", "triglycerides", "hdl", "ldl", "heart"],
  "lipid": ["cholesterol", "fat", "triglycerides", "hdl", "ldl", "heart", "लिपिड", "कोलेस्ट्रॉल"],
  "thyroid": ["t3", "t4", "tsh", "goiter", "hormone", "थायरॉइड", "थायराइड"],
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
  "urine": ["urinalysis", "kidney", "renal", "rft", "kft"],
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
  "एक्सरे": ["xray", "x-ray", "एक्स-रे"],
  "थायरॉइड": ["thyroid", "t3", "t4", "tsh", "goiter", "hormone"],
  "थायराइड": ["thyroid", "t3", "t4", "tsh", "goiter", "hormone"],
  "लिपिड": ["lipid", "cholesterol", "fat", "triglycerides", "heart"]
};

const calculateRelevanceScore = (test, search) => {
  if (!search || !search.trim()) return 0;
  const query = search.toLowerCase().trim();
  const queryWords = query.split(/\s+/).filter(Boolean);

  let score = 0;

  const testName = (test.name || '').toLowerCase();
  const testNameHi = (test.name_hi || '').toLowerCase();
  const category = (test.category || '').toLowerCase();
  const categoryHi = (test.category_hi || '').toLowerCase();
  const description = (test.description || '').toLowerCase();
  const descriptionHi = (test.description_hi || '').toLowerCase();

  // 1. Direct Name Exact Match
  if (testName === query || testNameHi === query) {
    return 1000;
  }

  // 2. Direct Name Starts With Query
  if (testName.startsWith(query) || testNameHi.startsWith(query)) {
    score = Math.max(score, 800);
  }

  // 3. Any Word in Name Starts With Query
  const nameWords = testName.split(/[\s,()/\-]+/).concat(testNameHi.split(/[\s,()/\-]+/));
  if (nameWords.some(w => w && w.startsWith(query))) {
    score = Math.max(score, 700);
  }

  // 4. Direct Name Substring Match
  if (testName.includes(query) || testNameHi.includes(query)) {
    score = Math.max(score, 600);
  }

  // 5. Category Match
  if (category.startsWith(query) || categoryHi.startsWith(query) || category.includes(query) || categoryHi.includes(query)) {
    score = Math.max(score, 500);
  }

  // 6. Description Substring Match
  if (description.includes(query) || descriptionHi.includes(query)) {
    score = Math.max(score, 400);
  }

  // 7. Synonym Matches
  for (const qWord of queryWords) {
    const synonyms = synonymMap[qWord] || [];
    for (const syn of synonyms) {
      const synLower = syn.toLowerCase();
      if (testName.includes(synLower) || testNameHi.includes(synLower)) {
        score = Math.max(score, 300);
      } else if (category.includes(synLower) || categoryHi.includes(synLower)) {
        score = Math.max(score, 200);
      } else if (description.includes(synLower) || descriptionHi.includes(synLower)) {
        score = Math.max(score, 100);
      }
    }
  }

  return score;
};

export default function BodyTestsScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();

  const [bodyTests, setBodyTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(params.initialCategory || 'All');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedCategory]);
  // Admin Settings State (for mobile dialer fallback)
  const [adminMobile, setAdminMobile] = useState('918306305569');
  const [bodyTestMobile, setBodyTestMobile] = useState('918306305569');
  const [contactPhone, setContactPhone] = useState('8306305569');

  useEffect(() => {
    fetchBodyTests();
    fetchSettings();
  }, []);

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

  // Selected category value mapping
  const CATEGORIES = [
    { id: 'BLOOD TESTS', label: 'Blood Test', labelHi: 'खून की जांच' },
    { id: 'URINE TEST', label: 'Urine Test', labelHi: 'पेशाब की जांच' },
    { id: 'RADIOLOGY', label: 'X-Ray & ECG', labelHi: 'एक्स-रे और ईसीजी' },
    { id: 'FULL BODY TESTS', label: 'Full Body Checkup', labelHi: 'फुल बॉडी चेकअप' },
    { id: 'All', label: 'All Tests', labelHi: 'सभी जांच' },
  ];

  const filteredTests = bodyTests.filter(test => {
    const isSearching = !!searchTerm.trim();

    // 1. Category check - ignore if searching
    if (!isSearching) {
      const matchesCategory = selectedCategory === 'All' || 
                              test.category === selectedCategory ||
                              (test.category && test.category.toUpperCase() === selectedCategory.toUpperCase()) ||
                              (selectedCategory === 'BLOOD TESTS' && (test.category === 'BLOOD TESTS' || test.category === 'Pathology' || test.category_hi === 'रक्त जांच')) ||
                              (selectedCategory === 'URINE TEST' && (test.category === 'URINE TEST' || test.category_hi === 'मूत्र जांच')) ||
                              (selectedCategory === 'RADIOLOGY' && (test.category === 'RADIOLOGY' || test.category === 'Radiology' || test.category_hi === 'रेडियोलॉजी')) ||
                              (selectedCategory === 'FULL BODY TESTS' && (test.category === 'FULL BODY TESTS' || test.category_hi === 'संपूर्ण शरीर जांच'));
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

  // Sort by relevance score when searching, otherwise sort alphabetically
  const isSearching = !!searchTerm.trim();
  const sortedFilteredTests = [...filteredTests].sort((a, b) => {
    if (isSearching) {
      const scoreA = calculateRelevanceScore(a, searchTerm);
      const scoreB = calculateRelevanceScore(b, searchTerm);
      if (scoreB !== scoreA) {
        return scoreB - scoreA;
      }
    }
    const nameA = (locale === 'hi' && a.name_hi) ? a.name_hi : a.name;
    const nameB = (locale === 'hi' && b.name_hi) ? b.name_hi : b.name;
    return (nameA || '').localeCompare(nameB || '', locale === 'hi' ? 'hi' : 'en');
  });

  const displayedTests = sortedFilteredTests.slice(0, page * itemsPerPage);

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 300;
    
    if (isCloseToBottom && displayedTests.length < filteredTests.length) {
      setPage(prev => prev + 1);
    }
  };

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
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={{ paddingHorizontal: 12, paddingVertical: 8, marginLeft: -4 }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="arrow-back" size={24} color="#1e293b" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${adminMobile}`)}
              style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: -4 }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
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
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >


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
            displayedTests.map((test) => {
              const hasDiscount = !!test.originalPrice;
              const name = (locale === 'hi' && test.name_hi) ? test.name_hi : test.name;
              const cat = (locale === 'hi' && test.category_hi) ? test.category_hi : test.category;

              return (
                <View key={test._id} style={styles.testCard}>
                  <View style={styles.testImageContainer}>
                    {test.image ? (
                      <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedImage(getImageUrl(test.image))} style={{ width: '100%', height: '100%' }}>
                        <Image
                          source={{ uri: getImageUrl(test.image) }}
                          style={styles.testImage}
                          resizeMode="cover"
                        />
                        <View style={styles.zoomIconContainer}>
                          <Ionicons name="scan-outline" size={20} color="white" />
                        </View>
                      </TouchableOpacity>
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
                    <Text style={styles.testName} numberOfLines={2}>{name}</Text>
                    
                    <View style={styles.metaRow}>
                      <View style={styles.timeBadge}>
                        <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.timeText}>{test.time}</Text>
                      </View>
                      <View style={[styles.timeBadge, { marginLeft: 8 }]}>
                        <Ionicons name="restaurant-outline" size={14} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={styles.timeText}>
                          {test.beforeFood 
                            ? (locale === 'hi' ? 'खाली पेट' : 'Before food')
                            : (locale === 'hi' ? 'भोजन के बाद' : 'After lunch')}
                        </Text>
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
          {displayedTests.length < filteredTests.length && (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#00bfa5" />
              <Text style={{ marginTop: 8, color: '#64748b', fontSize: 12 }}>
                {locale === 'hi' ? 'और टेस्ट लोड हो रहे हैं...' : 'Loading more tests...'}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity style={styles.imageModalClose} onPress={() => setSelectedImage(null)}>
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

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
    marginBottom: 20,
  },
  categoryGrid: {
    gap: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryColumnBtn: {
    flex: 1,
    backgroundColor: 'white',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryColumnBtnActive: {
    borderColor: '#00bfa5',
    backgroundColor: '#e6fffa',
  },
  categoryColumnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textAlign: 'center',
  },
  categoryColumnTextActive: {
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
    height: 220,
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
  zoomIconContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 6,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
});
