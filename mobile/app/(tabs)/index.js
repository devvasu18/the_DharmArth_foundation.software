import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Dimensions,
  Linking
} from 'react-native';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const LandingScreen = () => {
  const { user } = useAuth();
  const router = useRouter();

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
        {/* Hero Section */}
        <View style={styles.hero}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Welcome to the Dharmarth Medical Foundation</Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>0%</Text>
                <Text style={styles.statLabel}>PLATFORM FEE</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>72 Lakh+</Text>
                <Text style={styles.statLabel}>CONTRIBUTORS</Text>
              </View>
            </View>

            <Text style={styles.heroSubtitle}>
              Empowering change through your generous contributions.
            </Text>

            <View style={styles.heroActions}>
              <TouchableOpacity style={styles.donateBtn} onPress={handleDonate}>
                <Text style={styles.donateBtnText}>Donate Now</Text>
                <Ionicons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>

              {user && (
                <TouchableOpacity style={styles.dashboardBtn} onPress={() => router.push('/dashboard')}>
                  <Text style={styles.dashboardBtnText}>My Dashboard</Text>
                  <Ionicons name="grid" size={20} color="#00bfa5" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Mission Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Mission</Text>
          <View style={styles.underline} />
          <Text style={styles.sectionText}>
            The DharmArth Medical Foundation is dedicated to providing healthcare support to those in need. 
            Through our transparency and 0% platform fee, we ensure that every rupee you donate goes directly 
            to the cause.
          </Text>
          
          <View style={styles.featureGrid}>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#e0f2f1' }]}>
                <Ionicons name="shield-checkmark" size={24} color="#00bfa5" />
              </View>
              <Text style={styles.featureTitle}>Transparent</Text>
              <Text style={styles.featureDesc}>Full visibility of funds</Text>
            </View>
            <View style={styles.featureCard}>
              <View style={[styles.featureIcon, { backgroundColor: '#fff3e0' }]}>
                <Ionicons name="flash" size={24} color="#ff9800" />
              </View>
              <Text style={styles.featureTitle}>Instant</Text>
              <Text style={styles.featureDesc}>Quick aid delivery</Text>
            </View>
          </View>
        </View>

        {/* Impact Section */}
        <View style={[styles.section, { backgroundColor: '#f1f5f9' }]}>
          <Text style={styles.sectionTitle}>Join & Earn</Text>
          <Text style={styles.sectionText}>
            Become a motivator and help us spread the word. Earn rewards while doing good.
          </Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={handleJoin}>
            <Text style={styles.secondaryBtnText}>Become a Motivator</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 The DharmArth Foundation</Text>
          <Text style={styles.footerSubtext}>Dedicated to humanity</Text>
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
  hero: {
    backgroundColor: '#e0f7f6',
    padding: 24,
    paddingVertical: 40,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e293b',
    textAlign: 'center',
    lineHeight: 36,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    backgroundColor: 'rgba(255,255,255,0.5)',
    padding: 16,
    borderRadius: 20,
    width: '100%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00bfa5',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#cbd5e1',
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  donateBtn: {
    backgroundColor: '#00bfa5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  donateBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  heroActions: {
    width: '100%',
    gap: 12,
  },
  dashboardBtn: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    gap: 12,
    borderWidth: 2,
    borderColor: '#00bfa5',
  },
  dashboardBtnText: {
    color: '#00bfa5',
    fontSize: 18,
    fontWeight: '800',
  },
  section: {
    padding: 24,
    paddingVertical: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
  },
  underline: {
    width: 40,
    height: 4,
    backgroundColor: '#00bfa5',
    borderRadius: 2,
    marginBottom: 20,
  },
  sectionText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 26,
    marginBottom: 24,
  },
  featureGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  featureCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    color: '#64748b',
  },
  secondaryBtn: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#00bfa5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#00bfa5',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  footerSubtext: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
});

export default LandingScreen;
