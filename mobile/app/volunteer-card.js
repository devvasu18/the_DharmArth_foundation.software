import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  Dimensions, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_HEIGHT = 480;

const DEFAULT_AVATAR_URL = 'https://res.cloudinary.com/dbe1ykvg8/image/upload/v1778152272/dharmarth_foundation/default_guest_avatar.jpg';

export default function VolunteerCardScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const name = user?.name || 'Your Name';
  const mobile = user?.mobile || '0000000000';
  const work = user?.work || 'Volunteer';
  const bio = user?.bio || 'Dedicated to supporting humanity and spreading kindness through The DharmArth Foundation.';
  const location = user?.city ? `${user.city}, ${user.state || ''}` : 'India';
  const referralCode = user?.referralCode || 'DF0000';
  const profileImage = user?.profileImage || DEFAULT_AVATAR_URL;
  const joinedDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '2026';

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: 'Identity Card', headerTitleAlign: 'center' }} />
      
      <View style={styles.header}>
        <View style={styles.verifiedBadge}>
          <Ionicons name="shield-checkmark" size={16} color="#00bfa5" />
          <Text style={styles.verifiedText}>Verified Volunteer Identity</Text>
        </View>
        <Text style={styles.foundationText}>The DharmArth Foundation</Text>
      </View>

      {/* ID Card */}
      <View style={styles.cardContainer}>
        <View style={styles.idCard}>
          {/* Left Section */}
          <View style={styles.leftPane}>
            <View style={styles.photoWrapper}>
              <Image source={{ uri: profileImage }} style={styles.photo} />
            </View>
            
            <View style={styles.officialBadge}>
              <Ionicons name="ribbon" size={14} color="#000" />
              <Text style={styles.officialBadgeText}>Official</Text>
            </View>

            <View style={styles.brandArea}>
              <Text style={styles.brandName}>DharmArth</Text>
              <Text style={styles.brandSub}>Foundation</Text>
            </View>
          </View>

          {/* Right Section */}
          <View style={styles.rightPane}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.hindiName}>धर्मार्थ फाउंडेशन</Text>
                <Text style={styles.tagline}>Spreading Hope</Text>
              </View>
              <View style={styles.cardNoArea}>
                <Text style={styles.cardNoLabel}>CARD NO.</Text>
                <Text style={styles.cardNoValue}>{referralCode}</Text>
              </View>
            </View>

            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={2}>{name}</Text>
              <Text style={styles.userWork}>{work}</Text>
              <Text style={styles.userBio} numberOfLines={3}>"{bio}"</Text>

              <View style={styles.detailsGrid}>
                <DetailItem icon="call" label="Contact" value={`+91 ${mobile}`} />
                <DetailItem icon="location" label="Location" value={location} />
                <DetailItem icon="calendar" label="Joined" value={joinedDate} />
                <DetailItem icon="checkmark-circle" label="Status" value="Active" />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <View style={styles.footerWeb}>
                <Ionicons name="globe-outline" size={14} color="#00bfa5" />
                <Text style={styles.webText}>dharmarth.com</Text>
              </View>
              <View style={styles.qrPlaceholder}>
                <Ionicons name="qr-code-outline" size={24} color="#1e293b" />
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.trustRow}>
        <TrustItem icon="medal" label="Official ID" />
        <TrustItem icon="shield-checkmark" label="Verified" />
        <TrustItem icon="people" label="Trusted" />
      </View>

      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>Back to Dashboard</Text>
      </TouchableOpacity>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <View style={styles.detailItem}>
      <Ionicons name={icon} size={14} color="#475569" style={styles.detailIcon} />
      <View>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function TrustItem({ icon, label }) {
  return (
    <View style={styles.trustItem}>
      <Ionicons name={icon} size={18} color="#00bfa5" />
      <Text style={styles.trustLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    gap: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  foundationText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  cardContainer: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  idCard: {
    width: CARD_WIDTH,
    height: 400,
    backgroundColor: 'white',
    borderRadius: 24,
    flexDirection: 'row',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  leftPane: {
    width: '35%',
    backgroundColor: '#00bfa5',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoWrapper: {
    width: 100,
    height: 120,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    overflow: 'hidden',
    marginBottom: 16,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  officialBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  officialBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000',
    textTransform: 'uppercase',
  },
  brandArea: {
    alignItems: 'center',
  },
  brandName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
  },
  brandSub: {
    color: 'white',
    fontSize: 8,
    fontWeight: '700',
    opacity: 0.8,
    textTransform: 'uppercase',
  },
  rightPane: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  hindiName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#00bfa5',
  },
  tagline: {
    fontSize: 8,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  cardNoArea: {
    alignItems: 'flex-end',
  },
  cardNoLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
  },
  cardNoValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  userInfo: {
    flex: 1,
    marginTop: 12,
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    lineHeight: 26,
  },
  userWork: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00bfa5',
    textTransform: 'uppercase',
    marginVertical: 4,
  },
  userBio: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailItem: {
    width: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1e293b',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  qrPlaceholder: {
    padding: 4,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  backButton: {
    margin: 24,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  backButtonText: {
    color: '#1e293b',
    fontWeight: '700',
    fontSize: 14,
  },
});
