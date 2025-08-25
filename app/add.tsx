import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CameraView, Camera, useCameraPermissions } from 'expo-camera';
import { BarCodeScanningResult } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Book } from '../services/database';
import { googleBooksApi, GoogleBookData } from '../services/googleBooksApi';

export default function AddBooks() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(false);
  const [bookData, setBookData] = useState<GoogleBookData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleBarCodeScanned = async ({ data }: BarCodeScanningResult) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      // Clean ISBN (remove any non-numeric characters except X)
      const cleanIsbn = data.replace(/[^\dX]/g, '');
      
      if (cleanIsbn.length < 10) {
        Alert.alert('Invalid ISBN', 'The scanned code doesn\'t appear to be a valid ISBN');
        resetScanner();
        return;
      }

      // Check if book already exists
      const existingBook = await databaseService.getBookByIsbn(cleanIsbn);
      if (existingBook) {
        Alert.alert(
          'Book Already Added',
          `"${existingBook.title}" is already in your library.`,
          [{ text: 'OK', onPress: resetScanner }]
        );
        return;
      }

      // Fetch book data from Google Books API
      const fetchedBookData = await googleBooksApi.getBookData(cleanIsbn);
      
      if (!fetchedBookData) {
        Alert.alert(
          'Book Not Found',
          'Could not find information for this ISBN. Would you like to try again?',
          [
            { text: 'Try Again', onPress: resetScanner },
            { text: 'Cancel', onPress: () => setScanning(false) }
          ]
        );
        return;
      }

      setBookData(fetchedBookData);
    } catch (error) {
      console.error('Error processing scanned ISBN:', error);
      Alert.alert('Error', 'Failed to process the scanned ISBN');
      resetScanner();
    } finally {
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setBookData(null);
  };

  const addBookToLibrary = async () => {
    if (!bookData) return;

    setLoading(true);
    try {
      // Get cover URLs
      const coverSources = googleBooksApi.getCoverSources(bookData.imageLinks);

      const book: Book = {
        isbn: bookData.isbn,
        title: bookData.title,
        authors: bookData.authors?.join(', '),
        pageCount: bookData.pageCount,
        description: bookData.description,
        maturityRating: bookData.maturityRating,
        coverMedium: coverSources?.medium,
        coverLarge: coverSources?.large,
      };

      await databaseService.addBook(book);
      
      Alert.alert(
        'Book Added!',
        `"${bookData.title}" has been added to your library.`,
        [
          { text: 'Add Another', onPress: continueScanning },
          { text: 'Done', onPress: () => setScanning(false) }
        ]
      );
    } catch (error) {
      console.error('Error adding book:', error);
      Alert.alert('Error', 'Failed to add book to library');
    } finally {
      setLoading(false);
    }
  };

  const continueScanning = () => {
    setBookData(null);
    setScanned(false);
  };

  const startScanning = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Required', 'Camera permission is needed to scan books');
        return;
      }
    }
    setScanning(true);
    setScanned(false);
    setBookData(null);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={80} color="#666" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to scan book barcodes and add them to your library.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (scanning && !bookData) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
          }}
        />
        
        <View style={styles.overlay}>
          <View style={styles.scannerFrame} />
          <Text style={styles.scannerText}>
            {loading ? 'Processing...' : 'Point camera at book barcode'}
          </Text>
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setScanning(false)}
          >
            <Ionicons name="close" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Looking up book...</Text>
          </View>
        )}
      </View>
    );
  }

  if (bookData) {
    return (
      <ScrollView style={styles.bookConfirmationContainer}>
        <View style={styles.bookPreview}>
          <View style={styles.bookImageContainer}>
            {bookData.imageLinks?.thumbnail ? (
              <Image
                source={{ uri: bookData.imageLinks.thumbnail }}
                style={styles.bookImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="book-outline" size={60} color="#666" />
              </View>
            )}
          </View>
          
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle}>{bookData.title}</Text>
            {bookData.authors && bookData.authors.length > 0 ? (
              <Text style={styles.bookAuthor}>by {bookData.authors.join(', ')}</Text>
            ) : null}
            <Text style={styles.bookIsbn}>ISBN: {bookData.isbn}</Text>
            {bookData.pageCount ? (
              <Text style={styles.bookPages}>{`${bookData.pageCount} pages`}</Text>
            ) : null}
          </View>
        </View>

        {bookData.description ? (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Description</Text>
            <Text style={styles.description} numberOfLines={6}>
              {bookData.description}
            </Text>
          </View>
        ) : null}

        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={[styles.button, styles.addButton]}
            onPress={addBookToLibrary}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add to Library</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={continueScanning}
            disabled={loading}
          >
            <Ionicons name="scan" size={20} color="#007AFF" />
            <Text style={styles.cancelButtonText}>Scan Another</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeContent}>
        <Ionicons name="scan-outline" size={100} color="#007AFF" />
        <Text style={styles.welcomeTitle}>Add Books to Your Library</Text>
        <Text style={styles.welcomeText}>
          Scan book barcodes to automatically add them to your personal library.
          We'll fetch book details and cover images for you.
        </Text>
      </View>

      <TouchableOpacity style={styles.startScanButton} onPress={startScanning}>
        <Ionicons name="camera" size={24} color="#fff" />
        <Text style={styles.startScanButtonText}>Start Scanning</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    marginBottom: 16,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 150,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  bookConfirmationContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  bookPreview: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#1c1c1e',
    margin: 15,
    borderRadius: 12,
  },
  bookImageContainer: {
    width: 100,
    height: 140,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2c2c2e',
    marginRight: 16,
  },
  bookImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookInfo: {
    flex: 1,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bookAuthor: {
    fontSize: 16,
    color: '#007AFF',
    marginBottom: 8,
  },
  bookIsbn: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bookPages: {
    fontSize: 14,
    color: '#666',
  },
  descriptionContainer: {
    margin: 15,
    marginTop: 0,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  confirmationButtons: {
    padding: 15,
    paddingTop: 0,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#000',
    paddingHorizontal: 20,
  },
  welcomeContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginTop: 30,
    marginBottom: 16,
  },
  welcomeText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
  },
  startScanButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  startScanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
  },
});