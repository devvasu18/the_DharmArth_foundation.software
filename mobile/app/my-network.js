import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');

const NetworkNode = ({ user, level, isLast, hasChildren }) => {
  const getBadgeColor = () => {
    switch (level) {
      case 'root': return '#00bfa5';
      case 'L1': return '#10b981';
      case 'L2': return '#3b82f6';
      default: return '#64748b';
    }
  };

  return (
    <View style={styles.nodeContainer}>
      <View style={styles.nodeContent}>
        <View style={[styles.nodeIcon, { backgroundColor: getBadgeColor() + '10' }]}>
          <Ionicons 
            name={level === 'root' ? "person" : "people"} 
            size={20} 
            color={getBadgeColor()} 
          />
        </View>
        <View style={styles.nodeText}>
          <View style={styles.nameRow}>
            <Text style={styles.nodeName}>{user.name}</Text>
            {level !== 'root' && (
              <View style={[styles.levelBadge, { backgroundColor: getBadgeColor() }]}>
                <Text style={styles.levelBadgeText}>{level}</Text>
              </View>
            )}
          </View>
          <Text style={styles.nodeMobile}>{user.mobile}</Text>
          {user.createdAt && (
            <Text style={styles.nodeDate}>
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      {hasChildren && <View style={styles.connectorLine} />}
    </View>
  );
};

export default function MyNetwork() {
  const { user: authUser } = useAuth();
  const [referralTree, setReferralTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchNetwork = async () => {
    try {
      const { data } = await api.get('/transactions/my-referral-tree');
      setReferralTree(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching network:', err);
      setError('Failed to load your network structure.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNetwork();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#00bfa5" />
        <Text style={styles.loadingText}>Building your network map...</Text>
      </View>
    );
  }

  const renderL1Branch = (l1User) => {
    const l2Group = referralTree.level2Data.find(g => g.level1User._id === l1User._id);
    const l2Users = l2Group ? l2Group.level2Users : [];

    return (
      <View key={l1User._id} style={styles.branchWrapper}>
        <View style={styles.l1NodeWrapper}>
          <View style={styles.horizontalConnector} />
          <NetworkNode user={l1User} level="L1" hasChildren={l2Users.length > 0} />
        </View>
        
        {l2Users.length > 0 && (
          <View style={styles.l2Group}>
            {l2Users.map((l2User, idx) => (
              <View key={l2User._id} style={styles.l2NodeWrapper}>
                <View style={styles.verticalConnector} />
                <View style={styles.horizontalConnectorShort} />
                <NetworkNode user={l2User} level="L2" isLast={idx === l2Users.length - 1} />
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Network Tree' }} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00bfa5']} />
        }
      >
        {/* Stats Section */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{referralTree?.level1Users.length || 0}</Text>
            <Text style={styles.statLbl}>Direct (L1)</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>
              {referralTree?.level2Data.reduce((sum, g) => sum + g.level2Users.length, 0) || 0}
            </Text>
            <Text style={styles.statLbl}>Indirect (L2)</Text>
          </View>
        </View>

        {/* Tree Section */}
        <View style={styles.treeSection}>
          {/* Motivator */}
          {referralTree?.user?.referredBy && (
            <View style={styles.motivatorContainer}>
              <View style={styles.motivatorLabelWrapper}>
                <Text style={styles.motivatorLabel}>MY MOTIVATOR</Text>
              </View>
              <NetworkNode user={referralTree.user.referredBy} level="root" hasChildren={true} />
              <View style={styles.mainVerticalConnector} />
            </View>
          )}

          {/* YOU */}
          <View style={styles.youContainer}>
            <View style={[styles.nodeIcon, styles.youIcon]}>
              <Ionicons name="star" size={24} color="#00bfa5" />
            </View>
            <View style={styles.youContent}>
              <Text style={styles.youTitle}>You ({referralTree?.user?.name})</Text>
              <Text style={styles.youSubtitle}>{referralTree?.user?.mobile}</Text>
            </View>
          </View>

          <View style={styles.mainVerticalConnector} />

          {/* Referrals */}
          <View style={styles.referralsContainer}>
            {referralTree?.level1Users.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyText}>No referrals yet. Share your link to build your network!</Text>
              </View>
            ) : (
              referralTree.level1Users.map(renderL1Branch)
            )}
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
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#00bfa5',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
    elevation: 4,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    height: '100%',
  },
  statVal: {
    fontSize: 24,
    fontWeight: '900',
    color: 'white',
  },
  statLbl: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  treeSection: {
    alignItems: 'center',
  },
  motivatorContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 0,
  },
  motivatorLabelWrapper: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  motivatorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 1,
  },
  nodeContainer: {
    width: width * 0.7,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  nodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nodeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nodeText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nodeName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
  },
  levelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  levelBadgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  },
  nodeMobile: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  nodeDate: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
  },
  mainVerticalConnector: {
    width: 2,
    height: 30,
    backgroundColor: '#cbd5e1',
  },
  youContainer: {
    backgroundColor: 'white',
    width: width * 0.8,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: '#00bfa5',
    elevation: 4,
    shadowColor: '#00bfa5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  youIcon: {
    backgroundColor: '#00bfa510',
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  youContent: {
    flex: 1,
  },
  youTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  youSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  referralsContainer: {
    width: '100%',
    paddingLeft: 20,
  },
  branchWrapper: {
    marginBottom: 20,
  },
  l1NodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalConnector: {
    width: 20,
    height: 2,
    backgroundColor: '#cbd5e1',
  },
  l2Group: {
    marginLeft: 50,
    marginTop: 0,
  },
  l2NodeWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  verticalConnector: {
    width: 2,
    height: '100%',
    backgroundColor: '#cbd5e1',
    position: 'absolute',
    left: -30,
    top: -12,
  },
  horizontalConnectorShort: {
    width: 30,
    height: 2,
    backgroundColor: '#cbd5e1',
    marginLeft: -30,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f1f5f9',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#cbd5e1',
  },
  emptyText: {
    textAlign: 'center',
    color: '#94a3b8',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
  }
});
