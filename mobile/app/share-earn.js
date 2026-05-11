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
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

export default function ShareEarn() {
  const { user } = useAuth();
  const router = useRouter();

  const referralCode = user?.referralCode || user?.mobile;
  const shareUrl = `https://dharmarthfoundation.org/v/${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        title: 'Join The DharmArth Foundation',
        message: `Namaste! I am an official volunteer at The DharmArth Foundation. Join me in our noble cause. Support through my verified profile here: ${shareUrl}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error(error.message);
    }
  };

  const copyToClipboard = () => {
    Clipboard.setString(shareUrl);
    alert('Link copied to clipboard!');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Share & Earn' }} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Digital Identity</Text>
          <Text style={styles.headerSubtitle}>Share your verified volunteer profile to grow your network and earn commissions.</Text>
        </View>

        {/* Digital ID Card */}
        <View style={styles.cardContainer}>
          <View style={styles.idCard}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.brandName}>DharmArth</Text>
                <Text style={styles.brandTag}>FOUNDATION</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={16} color="white" />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.profileRow}>
                <Image 
                  source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=00bfa5&color=fff&size=128` }} 
                  style={styles.avatar} 
                />
                <View style={styles.mainInfo}>
                  <Text style={styles.name}>{user?.name}</Text>
                  <Text style={styles.role}>{user?.roles?.[0]?.name || 'Volunteer'}</Text>
                  <View style={styles.idRow}>
                    <Text style={styles.idLabel}>VOLUNTEER ID</Text>
                    <Text style={styles.idValue}>{referralCode}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{user?.totalReferrals || 0}</Text>
                  <Text style={styles.statLabel}>Referrals</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>₹{user?.totalEarnings || 0}</Text>
                  <Text style={styles.statLabel}>Earned</Text>
                </View>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Ionicons name="qr-code" size={24} color="rgba(255,255,255,0.6)" />
              <Text style={styles.footerText}>Official Digital Identity Card</Text>
            </View>
          </View>
        </View>

        {/* Sharing Options */}
        <View style={styles.shareSection}>
          <Text style={styles.sectionLabel}>Your Unique Sharing Link</Text>
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={1}>{shareUrl}</Text>
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={20} color="#00bfa5" />
            </TouchableOpacity>
          </View>

          <View style={styles.btnGrid}>
            <TouchableOpacity style={[styles.shareBtn, styles.waBtn]} onPress={handleShare}>
              <Ionicons name="logo-whatsapp" size={24} color="white" />
              <Text style={styles.shareBtnText}>WhatsApp</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.shareBtn, styles.nativeBtn]} onPress={handleShare}>
              <Ionicons name="share-social" size={24} color="white" />
              <Text style={styles.shareBtnText}>Share More</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="information-circle" size={24} color="#00bfa5" />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works?</Text>
            <Text style={styles.infoText}>
              When someone clicks your link and makes a donation, they are automatically added to your network. You earn commissions on every successful donation made through your link!
            </Text>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 30,
    alignItems: 'center',
  },
  idCard: {
    width: width - 40,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },
  brandTag: {
    fontSize: 8,
    fontWeight: '700',
    color: '#00bfa5',
    letterSpacing: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00bfa5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  verifiedText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '800',
  },
  cardBody: {
    padding: 24,
  },
  profileRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#334155',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  mainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    marginBottom: 2,
  },
  role: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00bfa5',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  idRow: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  idLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
  },
  idValue: {
    fontSize: 14,
    fontWeight: '800',
    color: 'white',
    letterSpacing: 1,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    height: '100%',
  },
  cardFooter: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  footerText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.5,
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
