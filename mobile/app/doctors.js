import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  Platform,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../src/context/LanguageContext';
import api, { API_BASE_URL } from '../src/services/api';

const { width } = Dimensions.get('window');

const categoryTranslations = {
  'Cardiologist': 'हृदय रोग विशेषज्ञ (Cardiologist)',
  'Dentist': 'दंत चिकित्सक (Dentist)',
  'Dermatologist': 'त्वचा रोग विशेषज्ञ (Dermatologist)',
  'ENT Specialist': 'नाक-कान-गला विशेषज्ञ (ENT Specialist)',
  'General Physician': 'सामान्य चिकित्सक (General Physician)',
  'Gynecologist': 'स्त्री रोग विशेषज्ञ (Gynecologist)',
  'Orthopedic': 'हड्डी रोग विशेषज्ञ (Orthopedic)',
  'Pediatrician': 'बाल रोग विशेषज्ञ (Pediatrician)',
  'Ophthalmologist': 'नेत्र रोग विशेषज्ञ (Ophthalmologist)',
  'Neurologist': 'नसों के रोग विशेषज्ञ (Neurologist)',
  'Urologist': 'मूत्र रोग विशेषज्ञ (Urologist)',
  'Oncologist': 'कैंसर रोग विशेषज्ञ (Oncologist)',
  'Psychiatrist': 'मनोचिकित्सक (Psychiatrist)',
  'Surgeon': 'सर्जन (Surgeon)'
};

const getLocalDateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

const getCurrentTimeInMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export default function DoctorsScreen() {
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [selectedType, setSelectedType] = useState(null); // 'government' or 'clinic'
  
  const [searchCategories, setSearchCategories] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchCategoryId, setSearchCategoryId] = useState('all');
  const [searchDate, setSearchDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [contactPhone, setContactPhone] = useState('8306305569');

  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [doctorFaqs, setDoctorFaqs] = useState([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  // Generate an array of the next 7 dates for the date selector
  const upcomingDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  useEffect(() => {
    fetchSettings();
    fetchSearchCategories();
    fetchDoctorFaqs();
  }, []);

  const fetchDoctorFaqs = async () => {
    try {
      setLoadingFaqs(true);
      const response = await api.get('/doctor-faqs?isVisible=true');
      setDoctorFaqs(response.data || []);
    } catch (error) {
      console.error('Failed to fetch doctor FAQs:', error);
    } finally {
      setLoadingFaqs(false);
    }
  };

  const fetchSearchCategories = async () => {
    try {
      const response = await api.get('/doctor-categories?isActive=true');
      setSearchCategories(response.data || []);
    } catch (error) {
      console.error('Failed to fetch doctor categories', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await api.get('/content/settings');
      if (response.data) {
        setContactPhone(response.data.contact_phone || '8306305569');
      }
    } catch (error) {
      console.error("Failed to fetch settings", error);
    }
  };

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setSearchCategoryId('all');
    setShowSearchModal(true);
  };

  const handleCloseSearchModal = () => {
    setShowSearchModal(false);
    if (!searchPerformed) {
      setSelectedType(null);
    }
  };

  const handleSearchSubmit = async () => {
    if (!selectedType || !searchCategoryId) {
      Alert.alert(locale === 'hi' ? 'त्रुटि' : 'Error', locale === 'hi' ? 'कृपया एक विशेषज्ञ श्रेणी चुनें' : 'Please select a specialist category');
      return;
    }

    try {
      setSearching(true);
      setSearchPerformed(true);
      setShowSearchModal(false);

      let url = `/availability/search?hospitalType=${selectedType}&categoryId=${searchCategoryId}`;
      if (selectedType !== 'clinic') {
        const dateStr = getLocalDateString(searchDate);
        url += `&date=${dateStr}`;
      }

      const response = await api.get(url);
      setSearchResult(response.data);
    } catch (error) {
      console.error('Error during search:', error);
      Alert.alert(locale === 'hi' ? 'त्रुटि' : 'Error', locale === 'hi' ? 'खोज विफल रही। कृपया पुनः प्रयास करें।' : 'Search failed. Please try again.');
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  const handleBackToTypeSelection = () => {
    setSelectedType(null);
    setSearchPerformed(false);
    setSearchResult(null);
  };

  const checkDoctorAvailability = (timeSlots, targetDate) => {
    if (!timeSlots) timeSlots = [];
    const now = new Date();
    const isToday = targetDate && targetDate.toDateString() === now.toDateString();
    const isFuture = targetDate && targetDate > now && !isToday;

    const currentMinutes = getCurrentTimeInMinutes();
    const hasAvailableSlots = timeSlots.some(slot => slot.status === 'Available');

    if (!hasAvailableSlots) {
      return { isAvailableNow: false, status: 'Not Available Today', nextSlot: null, sortOrder: 999999 };
    }

    if (isFuture) {
      return { isAvailableNow: false, status: 'Scheduled', nextSlot: null, sortOrder: 50 };
    }

    if (isToday) {
      for (const slot of timeSlots) {
        if (slot.status !== 'Available') continue;
        const startMinutes = timeToMinutes(slot.startTime);
        const endMinutes = timeToMinutes(slot.endTime);
        const adjustedEnd = (endMinutes <= startMinutes) ? endMinutes + 1440 : endMinutes;

        if (currentMinutes >= startMinutes && currentMinutes <= adjustedEnd) {
          return { isAvailableNow: true, status: 'Available Now', nextSlot: null, sortOrder: 0 };
        }
      }

      let nextSlot = null;
      let minDiff = Infinity;

      for (const slot of timeSlots) {
        if (slot.status !== 'Available') continue;
        const startMinutes = timeToMinutes(slot.startTime);
        if (startMinutes > currentMinutes) {
          const diff = startMinutes - currentMinutes;
          if (diff < minDiff) {
            minDiff = diff;
            nextSlot = slot;
          }
        }
      }

      if (nextSlot) {
        const hoursUntil = Math.floor(minDiff / 60);
        const minutesUntil = minDiff % 60;

        let statusMessage;
        if (hoursUntil === 0) statusMessage = `Available in ${minutesUntil} minutes`;
        else if (hoursUntil === 1 && minutesUntil === 0) statusMessage = `Available in 1 hour`;
        else if (minutesUntil === 0) statusMessage = `Available in ${hoursUntil} hours`;
        else statusMessage = `Available at ${formatTime(nextSlot.startTime)}`;

        return { isAvailableNow: false, status: statusMessage, nextSlot, sortOrder: 1 + minDiff };
      }

      return { isAvailableNow: false, status: 'Shift Ended', nextSlot: null, sortOrder: 900000 };
    }

    return { isAvailableNow: false, status: 'Not Available', nextSlot: null, sortOrder: 999999 };
  };

  const getActiveSearchDate = () => {
    if (!searchResult) return searchDate;
    return searchResult.available ? searchDate : new Date(searchResult.nextAvailableDate || searchDate);
  };

  const sortDoctorsByAvailability = (doctors, targetDate) => {
    return [...doctors].sort((a, b) => {
      const availA = checkDoctorAvailability(a.timeSlots, targetDate);
      const availB = checkDoctorAvailability(b.timeSlots, targetDate);
      return availA.sortOrder - availB.sortOrder;
    });
  };

  const getTranslatedCategoryName = (cat) => {
    if (cat._id === 'all') return t('doctors.allSpecialists');
    if (locale === 'hi') {
      return categoryTranslations[cat.name] || cat.name;
    }
    return cat.name;
  };

  const getTranslatedStatus = (status) => {
    if (locale !== 'hi') return status;
    if (status === 'Available Now') return 'अभी उपलब्ध';
    if (status === 'Not Available Today') return 'आज उपलब्ध नहीं';
    if (status === 'Shift Ended') return 'शिफ्ट समाप्त';
    if (status === 'Not Available') return 'उपलब्ध नहीं';
    if (status === 'Scheduled') return 'निर्धारित';
    if (status.startsWith('Available in')) {
        return status.replace('Available in', '').replace('minutes', 'मिनट में उपलब्ध').replace('hours', 'घंटे में उपलब्ध').replace('hour', 'घंटे में उपलब्ध').trim();
    }
    if (status.startsWith('Available at')) {
        return status.replace('Available at', '').trim() + ' पर उपलब्ध';
    }
    return status;
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${API_BASE_URL}${cleanPath}`;
  };

  const renderCategorySelection = () => (
    <View style={styles.categoryView}>
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryHeaderTitle}>{t('doctors.selectSetting')}</Text>
        <Text style={styles.categoryHeaderSubtitle}>{t('doctors.selectSettingDesc')}</Text>
      </View>

      <TouchableOpacity style={[styles.typeCard, styles.govCard]} onPress={() => handleTypeSelect('government')}>
        <View style={styles.typeIconBox}>
          <Text style={{ fontSize: 32 }}>🏥</Text>
        </View>
        <Text style={styles.typeCardTitle}>{t('doctors.govHospital')}</Text>
        <Text style={styles.typeCardDesc}>{t('doctors.govHospitalDesc')}</Text>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{t('doctors.scheduled')}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.typeCard, styles.clinicCard]} onPress={() => handleTypeSelect('clinic')}>
        <View style={styles.typeIconBox}>
          <Text style={{ fontSize: 32 }}>🏨</Text>
        </View>
        <Text style={styles.typeCardTitle}>{t('doctors.privateClinic')}</Text>
        <Text style={styles.typeCardDesc}>{t('doctors.privateClinicDesc')}</Text>
        <View style={[styles.typeBadge, styles.clinicBadge]}>
          <Text style={[styles.typeBadgeText, styles.clinicBadgeText]}>{t('doctors.highAvailability')}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderDoctorList = () => {
    if (searching) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00bfa5" />
          <Text style={styles.loadingText}>{t('doctors.searching')}</Text>
        </View>
      );
    }

    if (!searchResult) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>{t('doctors.noResults')}</Text>
          <Text style={styles.emptyDesc}>{t('doctors.noResultsDesc')}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setShowSearchModal(true)}>
            <Text style={styles.primaryButtonText}>{t('doctors.searchDoctors')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!searchResult.doctors || searchResult.doctors.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={64} color="#cbd5e1" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>{t('doctors.noDoctors')}</Text>
          <Text style={styles.emptyDesc}>{searchResult.message || t('doctors.noDoctorsDesc')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowSearchModal(true)}>
              <Text style={styles.primaryButtonText}>{t('doctors.modifySearch')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleBackToTypeSelection}>
              <Text style={styles.secondaryButtonText}>{t('doctors.changeHospital')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    const doctorsToRender = selectedType === 'clinic' ? searchResult.doctors : sortDoctorsByAvailability(searchResult.doctors, getActiveSearchDate());

    return (
      <View style={styles.doctorsList}>
        {doctorsToRender.map(avail => {
          const activeDate = selectedType === 'clinic' ? null : getActiveSearchDate();
          const availabilityInfo = selectedType === 'clinic' ? null : checkDoctorAvailability(avail.timeSlots, activeDate);
          const isUpcoming = selectedType === 'clinic' ? false : (!availabilityInfo.isAvailableNow &&
            availabilityInfo.status !== 'Not Available Today' &&
            availabilityInfo.status !== 'Shift Ended' &&
            availabilityInfo.status !== 'Not Available');
          
          const doctorName = locale === 'hi' ? (avail.doctorId.name_hi || avail.doctorId.name) : avail.doctorId.name;
          const doctorTitle = locale === 'hi' ? (avail.doctorId.title_hi || avail.doctorId.title) : avail.doctorId.title;
          const doctorExp = locale === 'hi' ? (avail.doctorId.experience_hi || avail.doctorId.experience) : avail.doctorId.experience;
          const doctorDesc = locale === 'hi' ? (avail.doctorId.description_hi || avail.doctorId.description) : avail.doctorId.description;

          return (
            <View key={avail._id} style={[styles.doctorCard, (selectedType !== 'clinic' && availabilityInfo?.isAvailableNow) ? styles.doctorCardAvailableNow : null]}>
              <View style={styles.doctorHeader}>
                <View style={styles.doctorPhotoContainer}>
                  {avail.doctorId.photo ? (
                    <Image source={{ uri: getImageUrl(avail.doctorId.photo) }} style={styles.doctorPhoto} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={60} color="#94a3b8" />
                  )}
                </View>
                <View style={styles.doctorInfo}>
                  <Text style={styles.doctorName}>Dr. {doctorName}</Text>
                  <Text style={styles.doctorMeta}>{doctorTitle} • {doctorExp}</Text>
                  {selectedType === 'clinic' && avail.doctorId.privateFee > 0 && (
                    <View style={styles.feeRow}>
                      <Ionicons name="cash-outline" size={14} color="#16a34a" />
                      <Text style={styles.feeText}>{t('doctors.fee')}: ₹{avail.doctorId.privateFee}</Text>
                    </View>
                  )}
                </View>
              </View>

              {doctorDesc && <Text style={styles.doctorDesc}>{doctorDesc}</Text>}

              {selectedType !== 'clinic' && !isUpcoming && availabilityInfo && (
                <View style={[
                  styles.statusBadge, 
                  availabilityInfo.isAvailableNow ? styles.statusAvailable : 
                  (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? styles.statusClosed : styles.statusUpcoming
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    availabilityInfo.isAvailableNow ? styles.statusAvailableText : 
                    (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? styles.statusClosedText : styles.statusUpcomingText
                  ]}>
                    {availabilityInfo.isAvailableNow ? '●' : (availabilityInfo.status === 'Not Available Today' || availabilityInfo.status === 'Shift Ended' || availabilityInfo.status === 'Not Available') ? '✕' : '🕒'} {getTranslatedStatus(availabilityInfo.status)}
                  </Text>
                </View>
              )}

              {selectedType === 'clinic' ? (
                <View style={styles.clinicInfoBox}>
                  {avail.timing && (
                    <View style={styles.timingRow}>
                      <Ionicons name="time" size={16} color="#0f766e" />
                      <Text style={styles.timingText}>{t('doctors.timing')}{formatTime(avail.timing.startTime)} - {formatTime(avail.timing.endTime)}</Text>
                    </View>
                  )}
                  <View style={styles.daysContainer}>
                    <Text style={styles.daysHeader}><Ionicons name="calendar" size={14} /> {t('doctors.availableDates')}</Text>
                    <View style={styles.daysList}>
                      {avail.availableDates && avail.availableDates.length > 0 ? (
                        avail.availableDates.map(dayNum => (
                          <View key={dayNum} style={styles.dayChip}>
                            <Text style={styles.dayChipText}>{dayNum}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noDaysText}>{t('doctors.noAvailableDates')}</Text>
                      )}
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.timeSlotsContainer}>
                  {avail.timeSlots.map((slot, idx) => (
                    <View key={idx} style={[styles.timeSlot, slot.status === 'Available' ? styles.timeSlotAvailable : styles.timeSlotNotAvailable]}>
                      <View style={styles.slotRow}>
                        <Text style={styles.slotPeriod}>{slot.period}:</Text>
                        <Text style={styles.slotTime}>{formatTime(slot.startTime)} - {formatTime(slot.endTime)}</Text>
                      </View>
                      <Text style={[styles.slotStatus, slot.status === 'Available' ? styles.slotStatusAvailable : styles.slotStatusNotAvailable]}>
                        {slot.status === 'Available' ? t('doctors.available') : t('doctors.notAvailable')}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00bfa5" />
        </View>
      </SafeAreaView>
    );
  }

  const selectedCategoryName = searchCategoryId === 'all' 
    ? t('doctors.allSpecialists') 
    : searchCategoryId 
      ? getTranslatedCategoryName(searchCategories.find(c => c._id === searchCategoryId) || { name: '...' })
      : t('doctors.specialistSearch');

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: t('doctors.title'),
          headerTintColor: '#1e293b',
          headerTitleStyle: { fontWeight: '900', fontSize: 16 },
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
              onPress={() => Linking.openURL(`tel:${contactPhone}`)} 
              style={{ paddingHorizontal: 12, paddingVertical: 8, marginRight: -4 }}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Ionicons name="call" size={22} color="#00bfa5" />
            </TouchableOpacity>
          )
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.bannerCard}>
          <Text style={styles.bannerSubtitle}>{t('doctors.subtitle')}</Text>
        </View>

        {!selectedType ? (
          renderCategorySelection()
        ) : (
          <View style={styles.mainView}>
            <View style={styles.headerCard}>
              <View style={styles.headerLeft}>
                <TouchableOpacity style={styles.backBtnSquare} onPress={handleBackToTypeSelection}>
                  <Ionicons name="arrow-back" size={20} color="#1e293b" />
                </TouchableOpacity>
                <View style={styles.headerDivider} />
                <View style={styles.headerInfo}>
                  <Text style={styles.headerTypeLabel}>
                    {selectedType === 'government' ? t('doctors.govHospital') : t('doctors.privateClinic')}
                  </Text>
                  <Text style={styles.headerCatName} numberOfLines={1}>{selectedCategoryName}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity style={styles.actionBtnFilter} onPress={() => setShowSearchModal(true)}>
                  <Ionicons name="filter" size={16} color="#00bfa5" />
                  <Text style={styles.actionBtnFilterText}>{t('doctors.filter')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {renderDoctorList()}
          </View>
        )}

        {/* FAQ Section */}
        <View style={styles.faqSection}>
          <View style={styles.faqHeader}>
            <Text style={styles.faqHeaderTitle}>{t('doctors.faqTitle')}</Text>
            <Text style={styles.faqHeaderSubtitle}>{t('doctors.faqSubtitle')}</Text>
          </View>

          <View style={styles.faqGrid}>
            {loadingFaqs ? (
              <Text style={styles.faqEmptyText}>{t('doctors.loadingFaqs')}</Text>
            ) : doctorFaqs.length === 0 ? (
              <Text style={styles.faqEmptyText}>{t('doctors.noFaqs')}</Text>
            ) : (
              doctorFaqs.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                const question = (locale === 'hi' && faq.question_hi) ? faq.question_hi : faq.question;
                const answer = (locale === 'hi' && faq.answer_hi) ? faq.answer_hi : faq.answer;
                
                return (
                  <TouchableOpacity
                    key={faq._id}
                    style={[styles.faqItem, isOpen && styles.faqItemOpen]}
                    onPress={() => setOpenFaqIndex(isOpen ? null : index)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.faqQuestionRow}>
                      <Text style={[styles.faqQuestion, isOpen && styles.faqQuestionOpen]}>{question}</Text>
                      <Ionicons name={isOpen ? "remove" : "add"} size={20} color={isOpen ? "#00bfa5" : "#64748b"} />
                    </View>
                    {isOpen && (
                      <View style={styles.faqAnswerContainer}>
                        <Text style={styles.faqAnswer}>{answer}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>

      {/* Search/Filter Modal */}
      <Modal visible={showSearchModal} transparent animationType="slide" onRequestClose={handleCloseSearchModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('doctors.findDoctor')}</Text>
              <TouchableOpacity onPress={handleCloseSearchModal} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              <Text style={styles.inputLabel}>{t('doctors.selectCategory')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsContainer}>
                <TouchableOpacity
                  style={[styles.catChip, searchCategoryId === 'all' && styles.catChipActive]}
                  onPress={() => setSearchCategoryId('all')}
                >
                  <Text style={[styles.catChipText, searchCategoryId === 'all' && styles.catChipTextActive]}>
                    {t('doctors.allSpecialists')}
                  </Text>
                </TouchableOpacity>
                {searchCategories.map(cat => (
                  <TouchableOpacity
                    key={cat._id}
                    style={[styles.catChip, searchCategoryId === cat._id && styles.catChipActive]}
                    onPress={() => setSearchCategoryId(cat._id)}
                  >
                    <Text style={[styles.catChipText, searchCategoryId === cat._id && styles.catChipTextActive]}>
                      {getTranslatedCategoryName(cat)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>


            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleSearchSubmit}>
                <Text style={styles.submitBtnText}>{t('doctors.searchDoctors')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f8fafc' },
  container: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },
  loadingText: { marginTop: 12, fontSize: 14, color: '#64748b', fontWeight: '600' },
  
  bannerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  bannerSubtitle: { fontSize: 14, color: '#e2e8f0', textAlign: 'center', lineHeight: 22, fontWeight: '500' },
  
  categoryView: { alignItems: 'center' },
  categoryHeader: { marginBottom: 24, alignItems: 'center' },
  categoryHeaderTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  categoryHeaderSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  
  typeCard: {
    width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 24, marginBottom: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#f1f5f9',
    ...Platform.select({ ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 }, android: { elevation: 2 } }),
  },
  typeIconBox: { width: 70, height: 70, borderRadius: 35, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  typeCardTitle: { fontSize: 20, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  typeCardDesc: { fontSize: 14, color: '#64748b', marginBottom: 16 },
  typeBadge: { backgroundColor: '#e2e8f0', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  typeBadgeText: { color: '#475569', fontSize: 12, fontWeight: '700' },
  clinicCard: { borderColor: '#e6fffa' },
  clinicBadge: { backgroundColor: '#e6fffa' },
  clinicBadgeText: { color: '#00bfa5' },
  
  headerCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white',
    padding: 12, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  backBtnSquare: { padding: 8, backgroundColor: '#f8fafc', borderRadius: 10 },
  headerDivider: { width: 1, height: 30, backgroundColor: '#e2e8f0', marginHorizontal: 12 },
  headerInfo: { flex: 1 },
  headerTypeLabel: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  headerCatName: { fontSize: 16, fontWeight: '800', color: '#1e293b' },
  headerRight: { paddingLeft: 10 },
  actionBtnFilter: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdfa', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionBtnFilterText: { color: '#00bfa5', fontWeight: '700', fontSize: 13, marginLeft: 4 },
  
  doctorsList: { gap: 16 },
  doctorCard: {
    backgroundColor: 'white', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 }, android: { elevation: 2 } }),
  },
  doctorCardAvailableNow: { borderColor: '#00bfa5', borderWidth: 2 },
  doctorHeader: { flexDirection: 'row', marginBottom: 16 },
  doctorPhotoContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f1f5f9', overflow: 'hidden', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  doctorPhoto: { width: '100%', height: '100%' },
  doctorInfo: { flex: 1, justifyContent: 'center' },
  doctorName: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 4 },
  doctorMeta: { fontSize: 13, color: '#64748b', fontWeight: '600', marginBottom: 6 },
  feeRow: { flexDirection: 'row', alignItems: 'center' },
  feeText: { fontSize: 13, color: '#16a34a', fontWeight: '700', marginLeft: 4 },
  doctorDesc: { fontSize: 14, color: '#475569', lineHeight: 20, marginBottom: 16, backgroundColor: '#f8fafc', padding: 12, borderRadius: 12 },
  
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginBottom: 16 },
  statusBadgeText: { fontSize: 13, fontWeight: '800' },
  statusAvailable: { backgroundColor: '#dcfce7' },
  statusAvailableText: { color: '#16a34a' },
  statusClosed: { backgroundColor: '#fee2e2' },
  statusClosedText: { color: '#dc2626' },
  statusUpcoming: { backgroundColor: '#fef3c7' },
  statusUpcomingText: { color: '#d97706' },
  
  clinicInfoBox: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 16 },
  timingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  timingText: { fontSize: 14, color: '#0f766e', fontWeight: '700', marginLeft: 6 },
  daysContainer: { backgroundColor: '#f0fdfa', padding: 12, borderRadius: 12 },
  daysHeader: { fontSize: 13, color: '#0f766e', fontWeight: '700', marginBottom: 8 },
  daysList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: { backgroundColor: 'white', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#ccfbf1' },
  dayChipText: { fontSize: 12, color: '#0f766e', fontWeight: '700' },
  noDaysText: { fontSize: 12, color: '#64748b', fontStyle: 'italic' },
  
  timeSlotsContainer: { gap: 10 },
  timeSlot: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  timeSlotAvailable: { backgroundColor: 'white', borderColor: '#e2e8f0' },
  timeSlotNotAvailable: { backgroundColor: '#f8fafc', borderColor: '#f1f5f9' },
  slotRow: { flexDirection: 'row', alignItems: 'center' },
  slotPeriod: { fontSize: 14, fontWeight: '700', color: '#475569', marginRight: 8, width: 80 },
  slotTime: { fontSize: 14, color: '#1e293b', fontWeight: '600' },
  slotStatus: { fontSize: 12, fontWeight: '800' },
  slotStatusAvailable: { color: '#16a34a' },
  slotStatusNotAvailable: { color: '#94a3b8' },
  
  emptyContainer: { alignItems: 'center', padding: 32, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 20 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b', marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  primaryButton: { backgroundColor: '#00bfa5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  primaryButtonText: { color: 'white', fontWeight: '800', fontSize: 14 },
  secondaryButton: { backgroundColor: '#f1f5f9', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  secondaryButtonText: { color: '#475569', fontWeight: '800', fontSize: 14 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  closeBtn: { padding: 4 },
  inputLabel: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginBottom: 12 },
  catChipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 24 },
  catChip: { backgroundColor: '#f1f5f9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: 'transparent', marginBottom: 8, marginRight: 8 },
  catChipActive: { backgroundColor: '#f0fdfa', borderColor: '#00bfa5' },
  catChipText: { fontSize: 14, color: '#475569', fontWeight: '600' },
  catChipTextActive: { color: '#00bfa5', fontWeight: '800' },
  
  dateSection: { marginBottom: 24 },
  dateChipsContainer: { flexDirection: 'row', gap: 12 },
  dateChip: { width: 70, height: 80, backgroundColor: '#f8fafc', borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 12 },
  dateChipActive: { backgroundColor: '#0f172a', borderColor: '#0f172a' },
  dateDayText: { fontSize: 12, color: '#64748b', fontWeight: '600', marginBottom: 4 },
  dateNumText: { fontSize: 20, color: '#1e293b', fontWeight: '800', marginBottom: 2 },
  dateMonthText: { fontSize: 11, color: '#64748b', fontWeight: '600', textTransform: 'uppercase' },
  dateTextActive: { color: 'white' },
  
  modalFooter: { paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  submitBtn: { backgroundColor: '#0f172a', borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: 'white', fontSize: 16, fontWeight: '800' },
  
  faqSection: { marginTop: 32, paddingBottom: 24 },
  faqHeader: { alignItems: 'center', marginBottom: 24 },
  faqHeaderTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  faqHeaderSubtitle: { fontSize: 14, color: '#64748b', textAlign: 'center' },
  faqGrid: { gap: 12 },
  faqEmptyText: { textAlign: 'center', color: '#94a3b8', padding: 20 },
  faqItem: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5 }, android: { elevation: 1 } }) },
  faqItemOpen: { borderColor: '#00bfa5' },
  faqQuestionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 15, fontWeight: '700', color: '#1e293b', flex: 1, paddingRight: 16 },
  faqQuestionOpen: { color: '#00bfa5' },
  faqAnswerContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  faqAnswer: { fontSize: 14, color: '#475569', lineHeight: 22 }
});
