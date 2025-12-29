import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  useColorScheme,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/Colors';
import { useGetUploadUrl, useUploadMedia } from '@/lib/api/hooks/use-media';
import { useConcerts } from '@/lib/api/hooks/use-concerts';

export default function MediaUploadScreen() {
  const router = useRouter();
  const { concertId } = useLocalSearchParams<{ concertId?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];

  const [selectedConcertId, setSelectedConcertId] = useState(concertId || '');
  const [caption, setCaption] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [analyzeWithAI, setAnalyzeWithAI] = useState(false);

  const { data: concertsData } = useConcerts();
  const getUploadUrl = useGetUploadUrl();
  const uploadMedia = useUploadMedia();

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera roll permissions to upload media.'
        );
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImagePickerAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setMediaType(result.assets[0].type === 'video' ? 'video' : 'image');
    }
  };

  const takePhoto = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please grant camera permissions to take photos.'
        );
        return;
      }
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setMediaType('image');
    }
  };

  const handleUpload = async () => {
    if (!selectedConcertId) {
      Alert.alert('Error', 'Please select a concert');
      return;
    }

    if (!imageUri) {
      Alert.alert('Error', 'Please select an image or video');
      return;
    }

    try {
      // Get presigned upload URL
      const { uploadUrl, fileUrl } = await getUploadUrl.mutateAsync({
        concertId: selectedConcertId,
        type: mediaType,
        caption,
        analyzeWithAI,
      });

      // Fetch the file as a blob
      const response = await fetch(imageUri);
      const blob = await response.blob();

      // Upload to S3
      await uploadMedia.mutateAsync({ uploadUrl, file: blob });

      Alert.alert('Success', 'Media uploaded successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'An error occurred'
      );
    }
  };

  const isUploading = getUploadUrl.isPending || uploadMedia.isPending;

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Upload Media',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          {imageUri ? (
            <Card style={styles.imagePreview}>
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                contentFit="cover"
              />
              <Button
                title="Change Media"
                onPress={pickImage}
                variant="outline"
                size="small"
                style={styles.changeButton}
              />
            </Card>
          ) : (
            <Card style={styles.uploadCard}>
              <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                No media selected
              </Text>
              <View style={styles.uploadButtons}>
                <Button
                  title="Choose from Library"
                  onPress={pickImage}
                  style={styles.uploadButton}
                />
                <Button
                  title="Take Photo"
                  onPress={takePhoto}
                  variant="outline"
                  style={styles.uploadButton}
                />
              </View>
            </Card>
          )}

          <Input
            label="Caption (Optional)"
            placeholder="Add a caption..."
            value={caption}
            onChangeText={setCaption}
            multiline
            numberOfLines={3}
          />

          {!concertId && concertsData?.concerts && (
            <View style={styles.concertSelect}>
              <Text style={[styles.label, { color: colors.text }]}>
                Select Concert *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.concertList}
              >
                {concertsData.concerts.map((concert) => (
                  <Card
                    key={concert.id}
                    style={[
                      styles.concertCard,
                      selectedConcertId === concert.id && {
                        borderColor: colors.primary,
                        borderWidth: 2,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => setSelectedConcertId(concert.id)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.concertName,
                          { color: colors.text },
                          selectedConcertId === concert.id && {
                            color: colors.primary,
                          },
                        ]}
                      >
                        {concert.artist?.name}
                      </Text>
                      <Text style={[styles.concertDate, { color: colors.textSecondary }]}>
                        {new Date(concert.date).toLocaleDateString()}
                      </Text>
                    </TouchableOpacity>
                  </Card>
                ))}
              </ScrollView>
            </View>
          )}

          <Card style={styles.aiOption}>
            <TouchableOpacity
              onPress={() => setAnalyzeWithAI(!analyzeWithAI)}
              style={styles.aiToggle}
              activeOpacity={0.7}
            >
              <View style={styles.aiToggleContent}>
                <Text style={[styles.aiToggleText, { color: colors.text }]}>
                  Analyze with AI
                </Text>
                <Text style={[styles.aiToggleSubtext, { color: colors.textSecondary }]}>
                  Get automatic tags and descriptions
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: analyzeWithAI ? colors.primary : colors.border,
                    backgroundColor: analyzeWithAI ? colors.primary : 'transparent',
                  },
                ]}
              >
                {analyzeWithAI && (
                  <Ionicons name="checkmark" size={16} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          </Card>

          <Button
            title="Upload Media"
            onPress={handleUpload}
            loading={isUploading}
            disabled={!imageUri || !selectedConcertId}
            style={styles.submitButton}
          />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  imagePreview: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 300,
    marginBottom: 12,
  },
  changeButton: {
    marginTop: 8,
  },
  uploadCard: {
    marginBottom: 16,
    alignItems: 'center',
    paddingVertical: 40,
  },
  uploadText: {
    fontSize: 16,
    marginBottom: 20,
  },
  uploadButtons: {
    width: '100%',
    gap: 12,
  },
  uploadButton: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  concertSelect: {
    marginBottom: 16,
  },
  concertList: {
    flexDirection: 'row',
  },
  concertCard: {
    marginRight: 12,
    minWidth: 150,
  },
  concertName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  concertDate: {
    fontSize: 12,
  },
  aiOption: {
    marginBottom: 24,
  },
  aiToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiToggleContent: {
    flex: 1,
  },
  aiToggleText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  aiToggleSubtext: {
    fontSize: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    marginBottom: 32,
  },
});
