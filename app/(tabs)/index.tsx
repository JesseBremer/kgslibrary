import React, { useState, useEffect } from 'react';
import { Text, View, ScrollView, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { databaseService, Book } from '../../services/database';

export default function Index() {
  const [recentBooks, setRecentBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentBooks();
  }, []);

  const loadRecentBooks = async () => {
    try {
      const books = await databaseService.getRecentBooks(10);
      setRecentBooks(books);
    } catch (error) {
      console.error('Error loading recent books:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.isbn}`);
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <TouchableOpacity 
      style={styles.bookCard}
      onPress={() => handleBookPress(item)}
    >
      <View style={styles.bookImageContainer}>
        {item.coverMedium ? (
          <Image source={{ uri: item.coverMedium }} style={styles.bookImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>No Cover</Text>
          </View>
        )}
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
        {item.authors ? (
          <Text style={styles.bookAuthor} numberOfLines={1}>{item.authors}</Text>
        ) : null}
        <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text>
        {item.isRead ? (
          <View style={styles.readBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#34C759" />
            <Text style={styles.readBadgeText}>Read</Text>
          </View>
        ) : null}
        {item.comment ? (
          <View style={styles.commentBadge}>
            <Ionicons name="chatbubble-outline" size={10} color="#007AFF" />
            <Text style={styles.commentBadgeText}>Notes</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to KGS Library</Text>
        <Text style={styles.subtitle}>Manage your personal book collection</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recently Added</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading books...</Text>
        ) : recentBooks.length > 0 ? (
          <FlatList
            data={recentBooks}
            renderItem={renderBookItem}
            keyExtractor={(item) => item.isbn}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.booksList}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No books added yet</Text>
            <Text style={styles.emptyStateSubtext}>Tap "Add Books" to scan your first book</Text>
          </View>
        )}
      </View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Library Stats</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{`${recentBooks.length}`}</Text>
            <Text style={styles.statLabel}>Total Books</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 20,
    paddingTop: 10,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },
  booksList: {
    paddingHorizontal: 15,
  },
  bookCard: {
    width: 140,
    marginHorizontal: 5,
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookImageContainer: {
    height: 180,
    backgroundColor: '#2c2c2e',
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
    backgroundColor: '#2c2c2e',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
  },
  bookInfo: {
    padding: 12,
  },
  bookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  bookIsbn: {
    fontSize: 10,
    color: '#666',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  readBadgeText: {
    fontSize: 10,
    color: '#34C759',
    marginLeft: 3,
    fontWeight: '500',
  },
  commentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  commentBadgeText: {
    fontSize: 10,
    color: '#007AFF',
    marginLeft: 3,
    fontWeight: '500',
  },
});
