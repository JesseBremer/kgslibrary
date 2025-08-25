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
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { databaseService, Book } from '../../services/database';

export default function BookDisplay() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isRead, setIsRead] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadBook();
  }, [isbn]);

  const loadBook = async () => {
    if (!isbn) return;
    
    setLoading(true);
    try {
      const bookData = await databaseService.getBookByIsbn(isbn);
      if (bookData) {
        setBook(bookData);
        setComment(bookData.comment || '');
        setIsRead(bookData.isRead || false);
      } else {
        Alert.alert('Error', 'Book not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading book:', error);
      Alert.alert('Error', 'Failed to load book details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReadStatus = async () => {
    if (!book) return;
    
    const newReadStatus = !isRead;
    setIsRead(newReadStatus);
    
    try {
      await databaseService.updateBookStatus(book.isbn, newReadStatus);
    } catch (error) {
      console.error('Error updating book status:', error);
      Alert.alert('Error', 'Failed to update read status');
      setIsRead(!newReadStatus); // Revert on error
    }
  };

  const handleSaveComment = async () => {
    if (!book) return;
    
    setSaving(true);
    try {
      await databaseService.updateBookComment(book.isbn, comment);
      Alert.alert('Success', 'Notes saved successfully');
    } catch (error) {
      console.error('Error saving comment:', error);
      Alert.alert('Error', 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading book details...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="book-outline" size={80} color="#666" />
        <Text style={styles.errorText}>Book not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.bookPreview}>
        <View style={styles.bookImageContainer}>
          {book.coverMedium || book.coverLarge ? (
            <Image
              source={{ uri: book.coverLarge || book.coverMedium }}
              style={styles.bookImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={60} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.bookInfo}>
          <Text style={styles.bookTitle}>{book.title}</Text>
          {book.authors ? (
            <Text style={styles.bookAuthor}>by {book.authors}</Text>
          ) : null}
          <Text style={styles.bookIsbn}>ISBN: {book.isbn}</Text>
          {book.pageCount ? (
            <Text style={styles.bookPages}>{`${book.pageCount} pages`}</Text>
          ) : null}
          {book.dateAdded ? (
            <Text style={styles.dateAdded}>
              Added: {new Date(book.dateAdded).toLocaleDateString()}
            </Text>
          ) : null}
        </View>
      </View>

      {book.description ? (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>Description</Text>
          <Text style={styles.description}>
            {book.description}
          </Text>
        </View>
      ) : null}

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.readButton,
            isRead ? styles.readButtonActive : styles.readButtonInactive,
          ]}
          onPress={handleToggleReadStatus}
        >
          <Ionicons
            name={isRead ? 'checkmark-circle' : 'ellipse-outline'}
            size={20}
            color={isRead ? '#fff' : '#007AFF'}
          />
          <Text
            style={[
              styles.readButtonText,
              isRead ? styles.readButtonTextActive : styles.readButtonTextInactive,
            ]}
          >
            {isRead ? 'Mark as Unread' : 'Mark as Read'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.notesContainer}>
        <Text style={styles.notesTitle}>Personal Notes & Review</Text>
        <TextInput
          style={styles.notesInput}
          value={comment}
          onChangeText={setComment}
          placeholder="Add your thoughts, review, or notes about this book..."
          placeholderTextColor="#666"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
        />
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveComment}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#fff" />
              <Text style={styles.saveButtonText}>Save Notes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    color: '#999',
    fontSize: 18,
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 50,
  },
  headerBackButton: {
    padding: 8,
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
    marginBottom: 4,
  },
  dateAdded: {
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
  actionsContainer: {
    padding: 15,
    paddingTop: 0,
  },
  readButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  readButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  readButtonInactive: {
    backgroundColor: 'transparent',
    borderColor: '#007AFF',
  },
  readButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  readButtonTextActive: {
    color: '#fff',
  },
  readButtonTextInactive: {
    color: '#007AFF',
  },
  notesContainer: {
    padding: 15,
    paddingTop: 0,
  },
  notesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  notesInput: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    minHeight: 120,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#666',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
});