import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator,
  RefreshControl,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import api from '../src/services/api';
import { Stack } from 'expo-router';

const { width } = Dimensions.get('window');

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const NetworkNode = ({ user, level, title, subtitle }) => {
  const isYou = level === 'you';
  const isMotivator = level === 'root';
  const isL1 = level === 'L1';
  const isL2 = level === 'L2';

  return (
    <View style={[styles.nodeContainer, isYou && styles.youNodeContainer]}>
      {/* Badges for L1/L2 */}
      {(isL1 || isL2) && (
        <View style={[styles.levelBadgeMini, isL1 ? styles.badgeL1 : styles.badgeL2]}>
          <Text style={styles.badgeText}>{level}</Text>
        </View>
      )}

      <View style={styles.nodeContent}>
        {isMotivator && (
          <View style={[styles.nodeIconBox, { backgroundColor: '#f0fdf9' }]}>
            <Ionicons name="shield-checkmark" size={20} color="#00bfa5" />
          </View>
        )}
        
        <View style={styles.nodeInfo}>
          <Text style={[styles.nodeTitle, isL2 && styles.nodeTitleSmall]} numberOfLines={1}>
            {title || user?.name}
          </Text>
          <Text style={styles.nodeSubtitle}>
            {subtitle || user?.mobile}
          </Text>
          {!isMotivator && user?.createdAt && (
            <Text style={styles.nodeDate}>
              Member since {formatDate(user.createdAt)}
            </Text>
          )}
        </View>
      </View>
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

  const directCount = referralTree?.level1Users?.length || 0;
  const indirectCount = referralTree?.level2Data?.reduce((sum, g) => sum + (g?.level2Users?.length || 0), 0) || 0;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'My Referral Network' }} />
      
      <ScrollView 
        contentContainerStyle={styles.mainScroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00bfa5']} tintColor="#00bfa5" />
        }
      >
        {/* Header Stats Row */}
        <View style={styles.headerStatsRow}>
          <View style={styles.miniStat}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(0, 191, 165, 0.1)' }]}>
              <Ionicons name="people" size={20} color="#00bfa5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statVal}>{directCount}</Text>
              <Text style={styles.statLbl}>Direct (L1)</Text>
            </View>
          </View>
          
          <View style={styles.miniStat}>
            <View style={[styles.statIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
              <Ionicons name="git-network" size={20} color="#6366f1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.statVal}>{indirectCount}</Text>
              <Text style={styles.statLbl}>Indirect (L2)</Text>
            </View>
          </View>
        </View>

        {/* Tree Viewport */}
        <View style={styles.treeViewport}>
          {/* Sticky Root Wrapper */}
          <View style={styles.stickyRootWrapper}>
            {referralTree?.user?.referredBy && (
              <View style={styles.motivatorWrapper}>
                <View style={styles.motivatorLabelBox}>
                  <Text style={styles.motivatorLabelText}>MY MOTIVATOR</Text>
                </View>
                <NetworkNode 
                  user={referralTree.user.referredBy} 
                  level="root" 
                />
                <View style={styles.connectorVertical} />
              </View>
            )}

            {/* YOU Node */}
            <NetworkNode 
              user={referralTree?.user} 
              level="you" 
              title={`You (${referralTree?.user?.name})`}
            />
            {directCount > 0 && <View style={styles.connectorVertical} />}
          </View>

          {/* Scrollable Tree Tracks */}
          <ScrollView 
            horizontal={true} 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableTreeContent}
          >
            <View style={styles.familyTrack}>
              {directCount === 0 ? (
                <View style={styles.emptyNetwork}>
                  <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.emptyNetworkText}>
                    No direct referrals yet. Start sharing your link to build your network!
                  </Text>
                </View>
              ) : (
                referralTree?.level1Users?.map(l1User => {
                  const l2Group = referralTree?.level2Data?.find(g => g?.level1User?._id === l1User._id);
                  const l2Users = l2Group ? l2Group.level2Users : [];
                  
                  return (
                    <View key={l1User._id} style={styles.familyColumn}>
                      {/* L1 Node */}
                      <NetworkNode user={l1User} level="L1" />
                      
                      {/* L2 Nodes under L1 */}
                      {l2Users.length > 0 && (
                        <View style={styles.level2Group}>
                          {l2Users.map(l2User => (
                            <View key={l2User._id} style={styles.level2NodeWrapper}>
                              <View style={styles.connectorVerticalShort} />
                              <NetworkNode user={l2User} level="L2" />
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
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
  mainScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  headerStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  miniStat: {
    flex: 1,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 24,
  },
  statLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  treeViewport: {
    backgroundColor: 'white',
    borderRadius: 24,
    minHeight: 500,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
  },
  stickyRootWrapper: {
    paddingVertical: 24,
    alignItems: 'center',
    backgroundColor: 'white',
    zIndex: 10,
  },
  motivatorWrapper: {
    alignItems: 'center',
    marginBottom: 0,
  },
  motivatorLabelBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  motivatorLabelText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#6366f1',
    letterSpacing: 1,
  },
  connectorVertical: {
    width: 2,
    height: 30,
    backgroundColor: '#cbd5e1',
  },
  connectorVerticalShort: {
    width: 2,
    height: 20,
    backgroundColor: '#cbd5e1',
  },
  scrollableTreeContent: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    minWidth: '100%',
  },
  familyTrack: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 30,
  },
  familyColumn: {
    alignItems: 'center',
    width: 130, // fixed width for nice columns
  },
  level2Group: {
    alignItems: 'center',
  },
  level2NodeWrapper: {
    alignItems: 'center',
  },
  emptyNetwork: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
    width: width - 80,
  },
  emptyNetworkText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  
  /* Node Styles */
  nodeContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    minWidth: 120,
    maxWidth: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  youNodeContainer: {
    backgroundColor: '#e6fffa',
    borderColor: '#00bfa5',
    borderWidth: 2,
    shadowColor: '#00bfa5',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    paddingHorizontal: 20,
    minWidth: 160,
    maxWidth: 200,
  },
  nodeContent: {
    alignItems: 'center',
    gap: 4,
  },
  nodeIconBox: {
    padding: 6,
    borderRadius: 10,
    marginBottom: 4,
  },
  nodeInfo: {
    alignItems: 'center',
  },
  nodeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },
  nodeTitleSmall: {
    fontSize: 13,
  },
  nodeSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  nodeDate: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center'
  },
  levelBadgeMini: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
    zIndex: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeL1: {
    backgroundColor: '#00bfa5',
  },
  badgeL2: {
    backgroundColor: '#6366f1',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: '900',
  }
});
