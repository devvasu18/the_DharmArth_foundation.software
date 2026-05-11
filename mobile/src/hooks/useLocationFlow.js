import { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';

export const useLocationFlow = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Check App Permission
      let { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      if (status !== 'granted' && canAskAgain) {
        const response = await Location.requestForegroundPermissionsAsync();
        status = response.status;
        canAskAgain = response.canAskAgain;
      }

      // Handle "Never ask again" or blocked status
      if (status === 'denied' && !canAskAgain) {
        Alert.alert(
          'Location Permission Required',
          'We need location access to automatically fill your address. Please enable it in App Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return null;
      }

      if (status !== 'granted') {
        return null;
      }

      // 2. Check Device GPS/Location Service
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        if (Platform.OS === 'android') {
          // Trigger the system prompt to enable GPS on Android
          try {
            await Location.enableNetworkProviderAsync();
            // Wait a bit for the provider to actually warm up
            await new Promise(resolve => setTimeout(resolve, 1000));
          } catch (e) {
            // User likely cancelled the prompt
            return null;
          }
        } else {
          // iOS doesn't have a direct "Enable GPS" prompt, must go to settings
          Alert.alert(
            'GPS Disabled',
            'Please turn on Location Services in your device settings to use this feature.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Settings', onPress: () => Linking.openURL('App-Prefs:root=Privacy&path=LOCATION') }
            ]
          );
          return null;
        }
      }

      // 3. Fetch Current Position
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeout: 15000,
      });

      // 4. Reverse Geocode (Address Detection)
      const addressResult = await Location.reverseGeocodeAsync({
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude
      });

      let formattedAddress = '';
      if (addressResult.length > 0) {
        const item = addressResult[0];
        const parts = [
          item.name,
          item.street,
          item.district,
          item.city || item.subregion,
          item.region,
          item.postalCode
        ].filter(Boolean);
        formattedAddress = parts.join(', ');
      }

      return {
        coords: currentPosition.coords,
        address: formattedAddress
      };

    } catch (err) {
      console.error("Location Flow Error:", err);
      setError('Failed to get location. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { requestLocation, loading, error };
};
