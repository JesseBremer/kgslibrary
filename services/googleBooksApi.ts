export interface GoogleBookData {
  isbn: string;
  title: string;
  authors?: string[];
  pageCount?: number;
  description?: string;
  maturityRating?: string;
  imageLinks?: {
    thumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
  };
}

export interface BookCoverSources {
  medium: string;
  large: string;
}

class GoogleBooksApiService {
  private apiKey: string | null = null;

  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  async getBookData(isbn: string): Promise<GoogleBookData | null> {
    try {
      const apiKeyParam = this.apiKey ? `&key=${this.apiKey}` : '';
      const query = `?q=isbn:${isbn}`;
      const fields = '&fields=items(volumeInfo(title,authors,pageCount,maturityRating,description,imageLinks))';
      const maxResults = '&maxResults=1';

      const url = `https://www.googleapis.com/books/v1/volumes${query}${fields}${maxResults}${apiKeyParam}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }

      const bookInfo = data.items[0].volumeInfo;
      
      return {
        isbn,
        title: bookInfo.title || 'Unknown Title',
        authors: bookInfo.authors || [],
        pageCount: bookInfo.pageCount,
        description: bookInfo.description,
        maturityRating: bookInfo.maturityRating,
        imageLinks: bookInfo.imageLinks
      };
    } catch (error) {
      console.error('Error fetching book data:', error);
      return null;
    }
  }

  async getBookCover(isbn: string, size: 'small' | 'medium' | 'large' = 'medium'): Promise<string | null> {
    try {
      const apiKeyParam = this.apiKey ? `&key=${this.apiKey}` : '';
      const query = `?q=isbn:${isbn}`;
      const fields = '&fields=items(volumeInfo(imageLinks))';
      const maxResults = '&maxResults=1';

      const url = `https://www.googleapis.com/books/v1/volumes${query}${fields}${maxResults}${apiKeyParam}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return null;
      }

      const imageLinks = data.items[0].volumeInfo.imageLinks;
      
      if (!imageLinks) {
        return null;
      }

      // Map size to zoom parameter for higher resolution
      const zoomValues = {
        'small': 1,
        'medium': 2,
        'large': 0
      };

      let imageUrl = imageLinks.thumbnail;
      
      if (imageUrl) {
        // Replace zoom parameter to get different sizes
        const zoomValue = zoomValues[size];
        imageUrl = imageUrl.replace(/zoom=\d{1}/, `zoom=${zoomValue}`);
        // Ensure HTTPS
        imageUrl = imageUrl.replace(/^http:/, 'https:');
      }

      return imageUrl || null;
    } catch (error) {
      console.error('Error fetching book cover:', error);
      return null;
    }
  }

  getCoverSources(imageLinks?: { thumbnail?: string }): BookCoverSources | null {
    if (!imageLinks?.thumbnail) {
      return null;
    }

    const baseUrl = imageLinks.thumbnail.replace(/zoom=\d{1}/, '');
    
    return {
      medium: `${baseUrl}zoom=2`.replace(/^http:/, 'https:'),
      large: `${baseUrl}zoom=0`.replace(/^http:/, 'https:')
    };
  }

  async searchBooks(query: string, maxResults: number = 10): Promise<GoogleBookData[]> {
    try {
      const apiKeyParam = this.apiKey ? `&key=${this.apiKey}` : '';
      const searchQuery = `?q=${encodeURIComponent(query)}`;
      const fields = '&fields=items(volumeInfo(title,authors,pageCount,maturityRating,description,imageLinks,industryIdentifiers))';
      const maxRes = `&maxResults=${maxResults}`;

      const url = `https://www.googleapis.com/books/v1/volumes${searchQuery}${fields}${maxRes}${apiKeyParam}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.items) {
        return [];
      }

      return data.items.map((item: any) => {
        const bookInfo = item.volumeInfo;
        
        // Try to extract ISBN from industry identifiers
        let isbn = '';
        if (bookInfo.industryIdentifiers) {
          const isbnIdentifier = bookInfo.industryIdentifiers.find(
            (id: any) => id.type === 'ISBN_13' || id.type === 'ISBN_10'
          );
          isbn = isbnIdentifier?.identifier || '';
        }

        return {
          isbn,
          title: bookInfo.title || 'Unknown Title',
          authors: bookInfo.authors || [],
          pageCount: bookInfo.pageCount,
          description: bookInfo.description,
          maturityRating: bookInfo.maturityRating,
          imageLinks: bookInfo.imageLinks
        };
      });
    } catch (error) {
      console.error('Error searching books:', error);
      return [];
    }
  }
}

export const googleBooksApi = new GoogleBooksApiService();