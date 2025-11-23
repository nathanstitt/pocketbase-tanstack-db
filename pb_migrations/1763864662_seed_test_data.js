/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const authorsCollection = app.findCollectionByNameOrId('authors');
  const booksCollection = app.findCollectionByNameOrId('books');
  const bookMetadataCollection = app.findCollectionByNameOrId('book_metadata');
  const tagsCollection = app.findCollectionByNameOrId('tags');
  const bookTagsCollection = app.findCollectionByNameOrId('book_tags');

  // Create authors
  const author1 = new Record(authorsCollection, {
    name: 'J.K. Rowling',
    bio: 'British author best known for the Harry Potter fantasy series.',
    email: 'jk.rowling@example.com'
  });
  app.save(author1);

  const author2 = new Record(authorsCollection, {
    name: 'George Orwell',
    bio: 'English novelist and essayist, journalist and critic.',
    email: 'george.orwell@example.com'
  });
  app.save(author2);

  const author3 = new Record(authorsCollection, {
    name: 'Jane Austen',
    bio: 'English novelist known primarily for her six major novels.',
    email: 'jane.austen@example.com'
  });
  app.save(author3);

  const author4 = new Record(authorsCollection, {
    name: 'Isaac Asimov',
    bio: 'American writer and professor of biochemistry, prolific author of science fiction.',
    email: 'isaac.asimov@example.com'
  });
  app.save(author4);

  // Create books
  const book1 = new Record(booksCollection, {
    title: 'Harry Potter and the Philosopher\'s Stone',
    isbn: '978-0-7475-3269-9',
    published_date: '1997-06-26',
    page_count: 223,
    genre: 'Fantasy',
    author: author1.id
  });
  app.save(book1);

  const book2 = new Record(booksCollection, {
    title: 'Harry Potter and the Chamber of Secrets',
    isbn: '978-0-7475-3849-3',
    published_date: '1998-07-02',
    page_count: 251,
    genre: 'Fantasy',
    author: author1.id
  });
  app.save(book2);

  const book3 = new Record(booksCollection, {
    title: '1984',
    isbn: '978-0-452-28423-4',
    published_date: '1949-06-08',
    page_count: 328,
    genre: 'Science Fiction',
    author: author2.id
  });
  app.save(book3);

  const book4 = new Record(booksCollection, {
    title: 'Animal Farm',
    isbn: '978-0-452-28424-1',
    published_date: '1945-08-17',
    page_count: 112,
    genre: 'Fiction',
    author: author2.id
  });
  app.save(book4);

  const book5 = new Record(booksCollection, {
    title: 'Pride and Prejudice',
    isbn: '978-0-14-143951-8',
    published_date: '1813-01-28',
    page_count: 432,
    genre: 'Romance',
    author: author3.id
  });
  app.save(book5);

  const book6 = new Record(booksCollection, {
    title: 'Foundation',
    isbn: '978-0-553-29335-0',
    published_date: '1951-06-01',
    page_count: 255,
    genre: 'Science Fiction',
    author: author4.id
  });
  app.save(book6);

  // Create book metadata (one-to-one with books)
  const metadata1 = new Record(bookMetadataCollection, {
    book: book1.id,
    summary: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.',
    genre: 'Fantasy',
    language: 'English',
    rating: 4.8
  });
  app.save(metadata1);

  const metadata2 = new Record(bookMetadataCollection, {
    book: book2.id,
    summary: 'Harry Potter\'s summer has included the worst birthday ever, doomy warnings from a house-elf called Dobby, and rescue from the Dursleys by his friend Ron Weasley.',
    genre: 'Fantasy',
    language: 'English',
    rating: 4.7
  });
  app.save(metadata2);

  const metadata3 = new Record(bookMetadataCollection, {
    book: book3.id,
    summary: 'A dystopian social science fiction novel and cautionary tale about the dangers of totalitarianism.',
    genre: 'Science Fiction',
    language: 'English',
    rating: 4.9
  });
  app.save(metadata3);

  const metadata4 = new Record(bookMetadataCollection, {
    book: book4.id,
    summary: 'A satirical allegorical novella reflecting events leading up to the Russian Revolution and the Stalinist era.',
    genre: 'Fiction',
    language: 'English',
    rating: 4.6
  });
  app.save(metadata4);

  const metadata5 = new Record(bookMetadataCollection, {
    book: book5.id,
    summary: 'A romantic novel of manners that follows the character development of Elizabeth Bennet.',
    genre: 'Romance',
    language: 'English',
    rating: 4.7
  });
  app.save(metadata5);

  const metadata6 = new Record(bookMetadataCollection, {
    book: book6.id,
    summary: 'A science fiction novel about mathematician Hari Seldon who develops psychohistory.',
    genre: 'Science Fiction',
    language: 'English',
    rating: 4.5
  });
  app.save(metadata6);

  // Create tags
  const tag1 = new Record(tagsCollection, {
    name: 'Magic',
    color: '#9B59B6'
  });
  app.save(tag1);

  const tag2 = new Record(tagsCollection, {
    name: 'Adventure',
    color: '#E74C3C'
  });
  app.save(tag2);

  const tag3 = new Record(tagsCollection, {
    name: 'Dystopian',
    color: '#34495E'
  });
  app.save(tag3);

  const tag4 = new Record(tagsCollection, {
    name: 'Classic',
    color: '#F39C12'
  });
  app.save(tag4);

  const tag5 = new Record(tagsCollection, {
    name: 'Young Adult',
    color: '#3498DB'
  });
  app.save(tag5);

  const tag6 = new Record(tagsCollection, {
    name: 'Space Opera',
    color: '#1ABC9C'
  });
  app.save(tag6);

  const tag7 = new Record(tagsCollection, {
    name: 'Political',
    color: '#E67E22'
  });
  app.save(tag7);

  // Create book_tags (many-to-many relationships)
  // Book 1: Harry Potter 1 -> Magic, Adventure, Young Adult
  app.save(new Record(bookTagsCollection, { book: book1.id, tag: tag1.id }));
  app.save(new Record(bookTagsCollection, { book: book1.id, tag: tag2.id }));
  app.save(new Record(bookTagsCollection, { book: book1.id, tag: tag5.id }));

  // Book 2: Harry Potter 2 -> Magic, Adventure, Young Adult
  app.save(new Record(bookTagsCollection, { book: book2.id, tag: tag1.id }));
  app.save(new Record(bookTagsCollection, { book: book2.id, tag: tag2.id }));
  app.save(new Record(bookTagsCollection, { book: book2.id, tag: tag5.id }));

  // Book 3: 1984 -> Dystopian, Classic, Political
  app.save(new Record(bookTagsCollection, { book: book3.id, tag: tag3.id }));
  app.save(new Record(bookTagsCollection, { book: book3.id, tag: tag4.id }));
  app.save(new Record(bookTagsCollection, { book: book3.id, tag: tag7.id }));

  // Book 4: Animal Farm -> Classic, Political
  app.save(new Record(bookTagsCollection, { book: book4.id, tag: tag4.id }));
  app.save(new Record(bookTagsCollection, { book: book4.id, tag: tag7.id }));

  // Book 5: Pride and Prejudice -> Classic
  app.save(new Record(bookTagsCollection, { book: book5.id, tag: tag4.id }));

  // Book 6: Foundation -> Space Opera, Classic
  app.save(new Record(bookTagsCollection, { book: book6.id, tag: tag6.id }));
  app.save(new Record(bookTagsCollection, { book: book6.id, tag: tag4.id }));

}, (app) => {
  // Rollback: delete all records
  // Note: Due to cascade deletes, we only need to delete top-level records
  const authorsCollection = app.findCollectionByNameOrId('authors');
  const tagsCollection = app.findCollectionByNameOrId('tags');

  if (authorsCollection) {
    const authors = app.findRecordsByFilter(authorsCollection.id, '', '-created', 500);
    authors.forEach((record) => app.delete(record));
  }

  if (tagsCollection) {
    const tags = app.findRecordsByFilter(tagsCollection.id, '', '-created', 500);
    tags.forEach((record) => app.delete(record));
  }
});
