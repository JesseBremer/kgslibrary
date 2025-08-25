import React, { useState, useEffect } from 'react';
import { 
  Text, 
  View, 
  FlatList, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { databaseService, Book } from '../../services/database';

export default function Library() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [searchQuery, books]);

  const loadBooks = async () => {
    try {
      const allBooks = await databaseService.getAllBooks();
      setBooks(allBooks);
    } catch (error) {
      console.error('Error loading books:', error);
      Alert.alert('Error', 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadBooks();
    setRefreshing(false);
  };

  const filterBooks = () => {
    if (!searchQuery.trim()) {
      setFilteredBooks(books);
      return;
    }

    const filtered = books.filter(book => 
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.authors?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.isbn.includes(searchQuery)
    );
    setFilteredBooks(filtered);
  };

  const confirmDeleteBook = (book: Book) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to remove "${book.title}" from your library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteBook(book.isbn)
        }
      ]
    );
  };

  const deleteBook = async (isbn: string) => {
    try {
      await databaseService.deleteBook(isbn);
      await loadBooks();
      Alert.alert('Success', 'Book removed from your library');
    } catch (error) {
      console.error('Error deleting book:', error);
      Alert.alert('Error', 'Failed to delete book');
    }
  };


  const handleBookPress = (book: Book) => {
    router.push(`/book/${book.isbn}`);
  };

  const renderBookItem = ({ item }: { item: Book }) => (
    <View style={styles.bookItem}>
      <TouchableOpacity 
        style={styles.bookContent}
        onPress={() => handleBookPress(item)}
      >
        <View style={styles.bookImageContainer}>
          {item.coverMedium ? (
            <Image source={{ uri: item.coverMedium }} style={styles.bookImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="book-outline" size={40} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.bookDetails}>
          <Text style={styles.bookTitle} numberOfLines={2}>{item.title}</Text>
          {item.authors ? (
            <Text style={styles.bookAuthor} numberOfLines={1}>{item.authors}</Text>
          ) : null}
          <Text style={styles.bookIsbn}>ISBN: {item.isbn}</Text>
          {item.pageCount ? (
            <Text style={styles.bookPages}>{`${item.pageCount} pages`}</Text>
          ) : null}
          {item.dateAdded ? (
            <Text style={styles.dateAdded}>
              Added: {new Date(item.dateAdded).toLocaleDateString()}
            </Text>
          ) : null}
          {item.isRead ? (
            <View style={styles.readBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#34C759" />
              <Text style={styles.readBadgeText}>Read</Text>
            </View>
          ) : null}
          {item.comment ? (
            <View style={styles.commentBadge}>
              <Ionicons name="chatbubble-outline" size={12} color="#007AFF" />
              <Text style={styles.commentBadgeText}>Has notes</Text>
            </View>
          ) : null}
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => confirmDeleteBook(item)}
      >
        <Ionicons name="trash-outline" size={20} color="#ff3b30" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="library-outline" size={80} color="#666" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? 'No books found' : 'Your library is empty'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery 
          ? 'Try adjusting your search terms' 
          : 'Start by adding some books with the scanner'
        }
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by title, author, or ISBN..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {`${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''}${searchQuery ? ' found' : ' in library'}`}
        </Text>
      </View>

      <FlatList
        data={filteredBooks}
        renderItem={renderBookItem}
        keyExtractor={(item) => item.isbn}
        contentContainerStyle={styles.booksList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  searchContainer: {
    padding: 15,
    paddingTop: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1c1e',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    height: '100%',
  },
  resultsHeader: {
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 14,
    color: '#999',
  },
  booksList: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  bookItem: {
    backgroundColor: '#1c1c1e',
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bookContent: {
    flexDirection: 'row',
    flex: 1,
    padding: 12,
    alignItems: 'flex-start',
  },
  bookImageContainer: {
    width: 60,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2c2c2e',
    marginRight: 12,
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
  bookDetails: {
    flex: 1,
    paddingRight: 8,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  bookAuthor: {
    fontSize: 14,
    color: '#007AFF',
    marginBottom: 4,
  },
  bookIsbn: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bookPages: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  dateAdded: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 12,
    alignSelf: 'flex-start',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  readBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  readBadgeText: {
    fontSize: 11,
    color: '#34C759',
    marginLeft: 4,
    fontWeight: '500',
  },
  commentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  commentBadgeText: {
    fontSize: 11,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
});