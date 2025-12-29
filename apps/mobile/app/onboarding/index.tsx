import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import OnboardingSlide from './components/OnboardingSlide';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  icon: string;
  title: string;
  description: string;
  backgroundColor: string;
}

const slides: Slide[] = [
  {
    id: '1',
    icon: '🎸',
    title: 'Welcome to Encore',
    description: 'Your AI-powered concert memory app',
    backgroundColor: '#9333ea', // purple-600
  },
  {
    id: '2',
    icon: '📸',
    title: 'Upload Your Concert Photos',
    description: 'Take photos at shows. We\'ll remember the details.',
    backgroundColor: '#7c3aed', // purple-700
  },
  {
    id: '3',
    icon: '🤖',
    title: 'AI Does the Work',
    description: 'We identify the artist, venue, and date automatically.',
    backgroundColor: '#6d28d9', // purple-800
  },
  {
    id: '4',
    icon: '🎵',
    title: 'Relive Your Concerts',
    description: 'Stats, setlists, and memories. All in one place.',
    backgroundColor: '#5b21b6', // purple-900
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handleGetStarted = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await SecureStore.setItemAsync('hasCompletedOnboarding', 'true');
      router.replace('/(auth)/signin');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      router.replace('/(auth)/signin');
    }
  };

  const renderItem = ({ item }: { item: Slide }) => (
    <OnboardingSlide
      icon={item.icon}
      title={item.title}
      description={item.description}
      backgroundColor={item.backgroundColor}
    />
  );

  const Pagination = () => {
    return (
      <View style={styles.paginationContainer}>
        {slides.map((_, index) => {
          const inputRange = [
            (index - 1) * width,
            index * width,
            (index + 1) * width,
          ];

          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity,
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        scrollEventThrottle={16}
      />

      {/* Pagination Dots */}
      <View style={styles.footer}>
        <Pagination />

        {/* Action Button */}
        <View style={styles.buttonContainer}>
          {currentIndex === slides.length - 1 ? (
            <TouchableOpacity
              style={styles.getStartedButton}
              onPress={handleGetStarted}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedText}>Get Started</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>Next</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#9333ea',
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    height: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  buttonContainer: {
    paddingHorizontal: 20,
  },
  getStartedButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  getStartedText: {
    color: '#9333ea',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  nextButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
