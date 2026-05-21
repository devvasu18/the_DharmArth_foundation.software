import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Animated,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Divine Support',
    subtitle: 'Cow Seva & Medical Aid',
    description: 'Support noble causes like cow shelters, health camps, and child education. Directly touch lives with your kind contributions.',
    icon: 'heart-sharp',
    bgColor: '#00bfa5',
    accentColor: '#e6fffa',
  },
  {
    id: '2',
    title: 'Inspire & Earn',
    subtitle: '10% Wallet Commission',
    description: 'Share your personal referral link with your family and networks. Earn a 10% instant reward for every inspired donation.',
    icon: 'share-social-sharp',
    bgColor: '#00897b',
    accentColor: '#e0f2f1',
  },
  {
    id: '3',
    title: 'Grow Your Network',
    subtitle: 'Multi-Level Tracking',
    description: 'Track directly inspired L1 and partner-inspired L2 donors via a visual network tree. Download your 80G tax certificates instantly.',
    icon: 'git-network-sharp',
    bgColor: '#00695c',
    accentColor: '#e0f2f1',
  },
  {
    id: '4',
    title: 'Secure Payouts',
    subtitle: 'Direct Bank Transfer',
    description: 'Manage your earnings inside a secure wallet. Withdraw funds directly to your verified bank account at any time with total safety.',
    icon: 'wallet-sharp',
    bgColor: '#004d40',
    accentColor: '#e0f2f1',
  }
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentageThreshold: 50 }).current;

  const handleNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      await completeOnboarding();
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      router.replace('/login');
    } catch (err) {
      console.error('Error saving onboarding status:', err);
      router.replace('/login');
    }
  };

  // Dynamically interpolate background color across slide index
  const backgroundColor = scrollX.interpolate({
    inputRange: SLIDES.map((_, i) => i * width),
    outputRange: SLIDES.map((slide) => slide.bgColor),
  });

  const renderItem = ({ item, index }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width
    ];

    // Gorgeous entry scale-up animation for icons
    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1.1, 0.6],
      extrapolate: 'clamp'
    });

    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [40, 0, -40],
      extrapolate: 'clamp'
    });

    return (
      <View style={styles.slideContainer}>
        {/* Animated Feature Icon Box */}
        <Animated.View style={[
          styles.iconContainer,
          { 
            backgroundColor: item.accentColor,
            transform: [{ scale }, { translateY }] 
          }
        ]}>
          <Ionicons name={item.icon} size={110} color={item.bgColor} />
        </Animated.View>

        {/* Slide Copy */}
        <View style={styles.textContainer}>
          <Text style={styles.subtitle}>{item.subtitle.toUpperCase()}</Text>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Skip Button */}
      <View style={styles.header}>
        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main FlatList Slides */}
      <FlatList
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        ref={slidesRef}
      />

      {/* Pagination & CTA Footer */}
      <View style={styles.footer}>
        {/* Animated Progress Indicators */}
        <View style={styles.indicatorContainer}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            
            // Expand width dynamically for the selected slide indicator dot
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 24, 8],
              extrapolate: 'clamp'
            });

            // Fade opacity for unselected indicator dots
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp'
            });

            return (
              <Animated.View
                key={i}
                style={[styles.indicatorDot, { width: dotWidth, opacity }]}
              />
            );
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
          <Ionicons
            name={currentIndex === SLIDES.length - 1 ? "checkmark-circle" : "arrow-forward"}
            size={20}
            color="#00695c"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    height: 100,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  skipText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  slideContainer: {
    width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 48,
  },
  textContainer: {
    alignItems: 'center',
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
    textAlign: 'center',
  },
  title: {
    color: 'white',
    fontSize: 32,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    fontWeight: '500',
    paddingHorizontal: 16,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 60,
    gap: 32,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  indicatorDot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  primaryBtn: {
    backgroundColor: 'white',
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  primaryBtnText: {
    color: '#00695c',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  }
});
