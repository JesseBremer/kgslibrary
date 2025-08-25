import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Book {
  isbn: string;
  title: string;
  authors?: string;
  pageCount?: number;
  description?: string;
  maturityRating?: string;
  coverMedium?: string;
  coverLarge?: string;
  dateAdded?: string;
  isRead?: boolean;
  comment?: string;
}

export interface Cover {
  isbn: string;
  medium: string;
  large: string;
}

class DatabaseService {
  private initialized = false;

  async initialize(): Promise<void> {
    // Using AsyncStorage for all platforms for simplicity
    console.log('Using AsyncStorage for data persistence');
    this.initialized = true;
  }

  async addBook(bookData: Book): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const book = {
      ...bookData,
      dateAdded: bookData.dateAdded || new Date().toISOString()
    };
    
    await AsyncStorage.setItem(`book_${bookData.isbn}`, JSON.stringify(book));
    
    // Update books list
    const existingBooks = await this.getAllBooksFromStorage();
    const bookExists = existingBooks.find(b => b.isbn === bookData.isbn);
    
    if (!bookExists) {
      existingBooks.push(book);
      await AsyncStorage.setItem('books_list', JSON.stringify(existingBooks));
    }
  }

  async getAllBooks(): Promise<Book[]> {
    if (!this.initialized) await this.initialize();
    const books = await this.getAllBooksFromStorage();
    return books.sort((a, b) => 
      new Date(b.dateAdded || 0).getTime() - new Date(a.dateAdded || 0).getTime()
    );
  }

  private async getAllBooksFromStorage(): Promise<Book[]> {
    try {
      const booksJson = await AsyncStorage.getItem('books_list');
      return booksJson ? JSON.parse(booksJson) : [];
    } catch (error) {
      console.error('Error reading books from storage:', error);
      return [];
    }
  }

  async getBookByIsbn(isbn: string): Promise<Book | null> {
    if (!this.initialized) await this.initialize();
    try {
      const bookJson = await AsyncStorage.getItem(`book_${isbn}`);
      return bookJson ? JSON.parse(bookJson) : null;
    } catch (error) {
      console.error('Error reading book from storage:', error);
      return null;
    }
  }

  async deleteBook(isbn: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    await AsyncStorage.removeItem(`book_${isbn}`);
    
    // Update books list
    const existingBooks = await this.getAllBooksFromStorage();
    const updatedBooks = existingBooks.filter(book => book.isbn !== isbn);
    await AsyncStorage.setItem('books_list', JSON.stringify(updatedBooks));
  }

  async getRecentBooks(limit: number = 10): Promise<Book[]> {
    const allBooks = await this.getAllBooks();
    return allBooks.slice(0, limit);
  }

  async updateBookStatus(isbn: string, isRead: boolean): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const book = await this.getBookByIsbn(isbn);
    if (book) {
      book.isRead = isRead;
      await AsyncStorage.setItem(`book_${isbn}`, JSON.stringify(book));
      
      // Update books list
      const existingBooks = await this.getAllBooksFromStorage();
      const bookIndex = existingBooks.findIndex(b => b.isbn === isbn);
      if (bookIndex !== -1) {
        existingBooks[bookIndex] = book;
        await AsyncStorage.setItem('books_list', JSON.stringify(existingBooks));
      }
    }
  }

  async updateBookComment(isbn: string, comment: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const book = await this.getBookByIsbn(isbn);
    if (book) {
      book.comment = comment;
      await AsyncStorage.setItem(`book_${isbn}`, JSON.stringify(book));
      
      // Update books list
      const existingBooks = await this.getAllBooksFromStorage();
      const bookIndex = existingBooks.findIndex(b => b.isbn === isbn);
      if (bookIndex !== -1) {
        existingBooks[bookIndex] = book;
        await AsyncStorage.setItem('books_list', JSON.stringify(existingBooks));
      }
    }
  }
}

export const databaseService = new DatabaseService();