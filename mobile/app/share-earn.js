import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Share,
  Clipboard,
  Dimensions,
  Platform,
  Linking,
  Alert,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const { width } = Dimensions.get('window');

export default function ShareEarn() {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const router = useRouter();

  const [downloadPermissionModalVisible, setDownloadPermissionModalVisible] = useState(false);

  const referralCode = user?.referralCode || user?.mobile || 'DF0000';
  const shareUrl = `https://thedharmarth.com/v/${referralCode}`;
  const donationUrl = `https://thedharmarth.com/donate?ref=${referralCode}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(donationUrl)}`;

  const name = user?.name || 'Your Name';
  const mobilePhone = user?.mobile || '0000000000';
  const work = user?.work || user?.roles?.[0]?.name || t('shareEarn.defaultWork');
  const bio = user?.bio || t('shareEarn.defaultBio');
  const location = user?.city ? `${user.city}, ${user?.state || ''}` : t('shareEarn.defaultLocation');
  const profileImage = user?.profileImage || `https://ui-avatars.com/api/?name=${name}&background=00bfa5&color=fff&size=128`;
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026';

  const handleShare = async () => {
    try {
      await Share.share({
        title: t('shareEarn.shareTitle'),
        message: t('shareEarn.shareMessage').replace('{shareUrl}', shareUrl),
        url: shareUrl,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleWhatsAppShare = async () => {
    const message = t('shareEarn.shareMessage').replace('{shareUrl}', shareUrl);
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
    const webWhatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      console.error("WhatsApp deep link failed, using native share fallback", error);
      try {
        await Share.share({
          title: t('shareEarn.shareTitle'),
          message: message,
          url: shareUrl,
        });
      } catch (shareError) {
        console.error(shareError.message);
      }
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(shareUrl);
    Alert.alert(t('common.success') || 'Copied', t('shareEarn.copied'));
  };

  const handleDownloadQr = () => {
    if (!user) {
      Alert.alert('Error', locale === 'hi' ? 'कृपया अपना क्यूआर कोड डाउनलोड करने के लिए लॉगिन करें' : 'Please login to download your QR code');
      return;
    }
    setDownloadPermissionModalVisible(true);
  };

  const executeDownloadQr = async () => {
    setDownloadPermissionModalVisible(false);
    try {
      Alert.alert(locale === 'hi' ? 'डाउनलोड हो रहा है' : 'Downloading', locale === 'hi' ? 'कृपया प्रतीक्षा करें, क्यूआर कोड डाउनलोड हो रहा है...' : 'Please wait while the QR Code is downloading...');
      const localUri = FileSystem.cacheDirectory + `referral_qr_${referralCode}.png`;
      const downloadRes = await FileSystem.downloadAsync(qrCodeUrl, localUri);

      if (downloadRes.status === 200) {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadRes.uri, {
            mimeType: 'image/png',
            dialogTitle: locale === 'hi' ? 'क्यूआर कोड सहेजें या साझा करें' : 'Save or Share QR Code',
            UTI: 'public.png'
          });
        } else {
          Alert.alert(locale === 'hi' ? 'सफलता' : 'Success', locale === 'hi' ? 'क्यूआर कोड सफलतापूर्वक डाउनलोड हो गया!' : 'QR Code downloaded successfully!');
        }
      } else {
        Alert.alert(locale === 'hi' ? 'त्रुटि' : 'Error', `Failed to download QR Code. Status: ${downloadRes.status}`);
      }
    } catch (error) {
      console.error("Download Error:", error);
      Alert.alert(locale === 'hi' ? 'त्रुटि' : 'Error', `Failed to download: ${error.message || 'Unknown error'}`);
    }
  };

  const handleShareQr = async () => {
    try {
      const filename = FileSystem.cacheDirectory + `referral_qr_${referralCode}.png`;
      const { uri } = await FileSystem.downloadAsync(qrCodeUrl, filename);

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(locale === 'hi' ? 'त्रुटि' : 'Error', locale === 'hi' ? 'इस डिवाइस पर साझाकरण उपलब्ध नहीं है' : 'Sharing is not available on this device');
        return;
      }

      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: t('shareEarn.qrCode') || 'Share QR Code',
        UTI: 'public.png'
      });
    } catch (error) {
      console.error("Error sharing QR image:", error);
      handleShare();
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: t('shareEarn.title') }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('shareEarn.digitalIdentity')}</Text>
          <Text style={styles.headerSubtitle}>{t('shareEarn.digitalIdentityDesc')}</Text>
        </View>

        {/* Digital ID Card */}
        <View style={styles.cardContainer}>
          <View style={styles.idCard}>
            {/* Top Pane */}
            <View style={styles.cardTopPane}>
              <View style={styles.photoWrapper}>
                <Image source={{ uri: profileImage }} style={styles.photo} />
              </View>
              <View style={styles.topBrandArea}>
                <Text style={styles.topBrandName}>{locale === 'hi' ? 'द धर्मार्थ' : 'The Dharmarth'}</Text>
                <Text style={styles.topBrandTag}>{locale === 'hi' ? 'मेडिकल फाउंडेशन' : 'Medical FOUNDATION'}</Text>
              </View>
            </View>

            {/* Bottom Pane */}
            <View style={styles.cardBottomPane}>
              {/* Header inside Bottom */}
              <View style={styles.bottomHeader}>
                <View style={[styles.userInfoArea, { flex: 1, marginBottom: 0, marginRight: 16 }]}>
                  <Text style={styles.userName}>{name}</Text>
                  <Text style={styles.userWork}>{work}</Text>
                  <Text style={styles.userBio} numberOfLines={3}>"{bio}"</Text>
                </View>
                <View style={styles.idArea}>
                  <Text style={styles.idLabelText}>{t('shareEarn.volunteerId')}</Text>
                  <Text style={styles.idValueText}>{referralCode}</Text>
                </View>
              </View>

              {/* Grid */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Ionicons name="call" size={24} color="#1e293b" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('shareEarn.contact')}</Text>
                    <Text style={styles.detailValue}>{mobilePhone}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="location" size={24} color="#1e293b" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('shareEarn.location')}</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>{location}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={24} color="#1e293b" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('shareEarn.verified')}</Text>
                    <Text style={styles.detailValue}>{joinedDate}</Text>
                  </View>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="shield-checkmark" size={24} color="#1e293b" />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('shareEarn.status')}</Text>
                    <Text style={styles.detailValue}>{t('shareEarn.active')}</Text>
                  </View>
                </View>
              </View>

              {/* Card Footer with Website and QR Code */}
              <View style={styles.cardFooterArea}>
                <View style={styles.footerWeb}>
                  <Ionicons name="globe-outline" size={16} color="#00bfa5" />
                  <Text style={styles.footerWebText}>thedharmarth.com</Text>
                </View>
                <TouchableOpacity style={styles.qrCodeBox} onPress={handleDownloadQr} activeOpacity={0.8}>
                  <Image
                    source={{ uri: qrCodeUrl }}
                    style={{ width: 56, height: 56 }}
                  />
                </TouchableOpacity>
              </View>
            </View>

          </View>
        </View>

        {/* Sharing Options */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionLabel}>{t('shareEarn.uniqueLink')}</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{shareUrl}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={20} color="#00bfa5" />
            </TouchableOpacity>
          </View>

          <View style={styles.btnGrid}>
            <TouchableOpacity style={[styles.shareBtn, styles.waBtn]} onPress={handleWhatsAppShare}>
              <Ionicons name="logo-whatsapp" size={22} color="white" />
              <Text style={styles.shareBtnText}>{t('shareEarn.whatsapp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.shareBtn, styles.nativeBtn]} onPress={handleShare}>
              <Ionicons name="share-social" size={22} color="white" />
              <Text style={styles.shareBtnText}>{t('shareEarn.shareMore')}</Text>
            </TouchableOpacity>
          </View>

          {/* Download QR button moved from Dashboard */}
          <TouchableOpacity style={[styles.shareBtn, styles.qrDownloadBtn]} onPress={handleDownloadQr}>
            <Ionicons name="download-outline" size={22} color="white" />
            <Text style={styles.shareBtnText}>{t('shareEarn.downloadQr') || 'Download QR'}</Text>
          </TouchableOpacity>
        </View>

        {/* Dedicated Referral QR Code Card */}
        <View style={styles.qrCard}>
          <View style={styles.qrCardHeader}>
            <Ionicons name="qr-code" size={22} color="#6366f1" />
            <Text style={styles.qrCardTitle}>{t('shareEarn.qrCode') || 'Referral QR Code'}</Text>
          </View>
          <Text style={styles.qrCardDesc}>
            {t('shareEarn.qrDesc') || 'Scan this QR code to visit your personalized donation link.'}
          </Text>

          <View style={styles.qrDisplayBox}>
            <Text style={styles.qrBannerText}>
              {t('shareEarn.donateQrBanner') || (locale === 'hi' ? 'द धर्मार्थ मेडिकल फाउंडेशन को दान करें' : 'The Dharmarth Medical Foundation')}
            </Text>
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrImageLarge}
            />
            <View style={styles.qrRefPill}>
              <Text style={styles.qrRefText}>{t('shareEarn.volunteerId')}: {referralCode}</Text>
            </View>
          </View>

          <View style={styles.qrActionRow}>
            <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: '#6366f1' }]} onPress={handleDownloadQr}>
              <Ionicons name="download-outline" size={18} color="white" />
              <Text style={styles.qrActionBtnText}>{t('shareEarn.downloadQr') || 'Download QR'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: '#00bfa5' }]} onPress={handleShareQr}>
              <Ionicons name="share-social-outline" size={18} color="white" />
              <Text style={styles.qrActionBtnText}>{t('shareEarn.shareQr') || 'Share QR'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Your Impact Stats - Temporarily commented out
        <View style={styles.impactSection}>
          <Text style={styles.sectionLabel}>{t('shareEarn.yourImpact')}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{user?.totalReferrals || 0}</Text>
              <Text style={styles.statLabel}>{t('shareEarn.referrals')}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>₹{user?.totalEarnings || 0}</Text>
              <Text style={styles.statLabel}>{t('shareEarn.earned')}</Text>
            </View>
          </View>
        </View>
        */}

        {/* Info Box */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={24} color="#00bfa5" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>{t('shareEarn.howItWorks')}</Text>
            <Text style={styles.infoText}>
              {t('shareEarn.howItWorksDesc')}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Storage Permission Modal */}
      <Modal
        visible={downloadPermissionModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDownloadPermissionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderTitleRow}>
                <Ionicons name="images-outline" size={24} color="white" />
                <Text style={styles.modalTitle}>{t('shareEarn.storagePermission') || 'Storage Permission'}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDownloadPermissionModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.modalBodyText}>
                {t('shareEarn.storagePermissionDesc') || "We need access to your device's photo gallery to save the QR code so you can share it easily."}
              </Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setDownloadPermissionModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>{locale === 'hi' ? 'रद्द करें' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.allowBtn}
                  onPress={executeDownloadQr}
                >
                  <Text style={styles.allowBtnText}>{locale === 'hi' ? 'अनुमति दें' : 'Allow'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 8,
    lineHeight: 20,
  },
  cardContainer: {
    marginBottom: 26,
    alignItems: 'center',
  },
  idCard: {
    width: width - 40,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTopPane: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  photoWrapper: {
    width: 80,
    height: 100,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  topBrandArea: {
    alignItems: 'flex-end',
  },
  topBrandName: {
    fontSize: 28,
    fontWeight: '900',
    color: 'white',
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  topBrandTag: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
    opacity: 0.9,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 2,
  },
  cardBottomPane: {
    backgroundColor: 'white',
    padding: 24,
  },
  bottomHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  idArea: {
    alignItems: 'flex-end',
  },
  idLabelText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  idValueText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1e293b',
  },
  userInfoArea: {
    marginBottom: 20,
  },
  userName: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    marginBottom: 4,
    lineHeight: 32,
  },
  userWork: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00bfa5',
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  userBio: {
    fontSize: 14,
    color: '#000',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 24,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '46%',
    gap: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e293b',
  },
  cardFooterArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerWebText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  qrCodeBox: {
    backgroundColor: 'white',
    padding: 4,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  shareSection: {
    marginBottom: 26,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  linkBox: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 14,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  copyBtn: {
    padding: 8,
    backgroundColor: '#00bfa510',
    borderRadius: 10,
    marginLeft: 12,
  },
  btnGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  waBtn: {
    backgroundColor: '#25D366',
  },
  nativeBtn: {
    backgroundColor: '#00bfa5',
  },
  qrDownloadBtn: {
    backgroundColor: '#6366f1',
    marginTop: 12,
    flex: 0,
    width: '100%',
  },
  shareBtnText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '800',
  },
  qrCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 26,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    alignItems: 'center',
  },
  qrCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  qrCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  qrCardDesc: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  qrDisplayBox: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  qrBannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00bfa5',
    marginBottom: 12,
    textAlign: 'center',
  },
  qrImageLarge: {
    width: 200,
    height: 200,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  qrRefPill: {
    marginTop: 12,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  qrRefText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6366f1',
  },
  qrActionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  qrActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrActionBtnText: {
    color: 'white',
    fontWeight: '800',
    fontSize: 14,
  },
  impactSection: {
    marginBottom: 26,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#00bfa5',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '700',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    height: '100%',
  },
  infoCard: {
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
  },
  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00bfa510',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
  },
  modalHeader: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
    alignItems: 'center',
  },
  modalBodyText: {
    fontSize: 14,
    color: '#334155',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
    lineHeight: 22,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#64748b',
    fontWeight: '700',
    fontSize: 14,
  },
  allowBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  allowBtnText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 14,
  },
});
