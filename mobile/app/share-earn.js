import React from 'react';
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
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTranslation } from '../src/context/LanguageContext';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ShareEarn() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const referralCode = user?.referralCode || user?.mobile || 'DF0000';
  const shareUrl = `https://thedharmarth.com/v/${referralCode}`;

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
    alert(t('shareEarn.copied'));
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
                <Text style={styles.topBrandName}>DharmArth</Text>
                <Text style={styles.topBrandTag}>FOUNDATION</Text>
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
            </View>

          </View>
        </View>

        {/* Sharing Options */ }
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
        <Ionicons name="logo-whatsapp" size={24} color="white" />
        <Text style={styles.shareBtnText}>{t('shareEarn.whatsapp')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.shareBtn, styles.nativeBtn]} onPress={handleShare}>
        <Ionicons name="share-social" size={24} color="white" />
        <Text style={styles.shareBtnText}>{t('shareEarn.shareMore')}</Text>
      </TouchableOpacity>
    </View>
  </View>

  {/* Your Impact Stats */ }
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


  {/* Info Box */ }
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
      </ScrollView >
    </View >
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
    marginBottom: 30,
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
  logoArea: {
    flex: 1,
  },
  foundationNameHi: {
    fontSize: 20,
    fontWeight: '900',
    color: '#00bfa5',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 2,
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
  },
  impactSection: {
    marginBottom: 30,
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
  shareSection: {
    marginBottom: 30,
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
    marginBottom: 20,
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
    padding: 16,
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
  shareBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '800',
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
  }
});
