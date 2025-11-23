/// <reference path="../pb_data/types.d.ts" />
migrate(
    app => {
        // Create 'authors' collection
        const authorsCollection = new Collection({
            name: 'authors',
            type: 'base',
            system: false,
            fields: [
                {
                    id: 'text3208210256',
                    name: 'id',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: true,
                    primaryKey: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    pattern: '^[a-z0-9]+$',
                    min: 15,
                    max: 15
                },
                {
                    id: 'text1579384326',
                    name: 'name',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 1,
                    max: 255
                },
                {
                    id: 'text1234567890',
                    name: 'bio',
                    type: 'text',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 0,
                    max: 2000
                },
                {
                    id: 'email9876543210',
                    name: 'email',
                    type: 'email',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    exceptDomains: [],
                    onlyDomains: []
                },
                {
                    id: 'autodate2990389176',
                    name: 'created',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: false
                },
                {
                    id: 'autodate3332085495',
                    name: 'updated',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: true
                }
            ],
            indexes: [],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.id != ''"
        });

        app.save(authorsCollection);

        // Create 'books' collection
        const booksCollection = new Collection({
            name: 'books',
            type: 'base',
            system: false,
            fields: [
                {
                    id: 'text3208210257',
                    name: 'id',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: true,
                    primaryKey: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    pattern: '^[a-z0-9]+$',
                    min: 15,
                    max: 15
                },
                {
                    id: 'text2222222222',
                    name: 'title',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 1,
                    max: 500
                },
                {
                    id: 'text3333333333',
                    name: 'isbn',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 10,
                    max: 17
                },
                {
                    id: 'date4444444444',
                    name: 'published_date',
                    type: 'date',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    min: '',
                    max: ''
                },
                {
                    id: 'number5555555555',
                    name: 'page_count',
                    type: 'number',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    min: 1,
                    max: null,
                    noDecimal: true
                },
                {
                    id: 'select6666666666',
                    name: 'genre',
                    type: 'select',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    maxSelect: 1,
                    values: [
                        'Fiction',
                        'Non-Fiction',
                        'Science Fiction',
                        'Fantasy',
                        'Mystery',
                        'Romance',
                        'Thriller',
                        'Biography',
                        'History',
                        'Science',
                        'Self-Help',
                        'Other'
                    ]
                },
                {
                    id: 'relation7777777777',
                    name: 'author',
                    type: 'relation',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    collectionId: authorsCollection.id,
                    cascadeDelete: false,
                    minSelect: null,
                    maxSelect: 1,
                    displayFields: ['name']
                },
                {
                    id: 'autodate2990389177',
                    name: 'created',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: false
                },
                {
                    id: 'autodate3332085496',
                    name: 'updated',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: true
                }
            ],
            indexes: [],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.id != ''"
        });

        app.save(booksCollection);

        // Create 'book_metadata' collection
        const bookMetadataCollection = new Collection({
            name: 'book_metadata',
            type: 'base',
            system: false,
            fields: [
                {
                    id: 'text3208210258',
                    name: 'id',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: true,
                    primaryKey: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    pattern: '^[a-z0-9]+$',
                    min: 15,
                    max: 15
                },
                {
                    id: 'text8888888888',
                    name: 'summary',
                    type: 'text',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 0,
                    max: 5000
                },
                {
                    id: 'select9999999999',
                    name: 'genre',
                    type: 'select',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    maxSelect: 1,
                    values: [
                        'Fiction',
                        'Non-Fiction',
                        'Science Fiction',
                        'Fantasy',
                        'Mystery',
                        'Romance',
                        'Thriller',
                        'Biography',
                        'History',
                        'Science',
                        'Self-Help',
                        'Other'
                    ]
                },
                {
                    id: 'text0000000001',
                    name: 'language',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 2,
                    max: 50
                },
                {
                    id: 'number0000000002',
                    name: 'rating',
                    type: 'number',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    min: 0,
                    max: 5,
                    noDecimal: false
                },
                {
                    id: 'relation0000000003',
                    name: 'book',
                    type: 'relation',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    collectionId: booksCollection.id,
                    cascadeDelete: true,
                    minSelect: null,
                    maxSelect: 1,
                    displayFields: ['title']
                },
                {
                    id: 'autodate2990389178',
                    name: 'created',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: false
                },
                {
                    id: 'autodate3332085497',
                    name: 'updated',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: true
                }
            ],
            indexes: [],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.id != ''"
        });

        app.save(bookMetadataCollection);

        // Create 'tags' collection
        const tagsCollection = new Collection({
            name: 'tags',
            type: 'base',
            system: false,
            fields: [
                {
                    id: 'text3208210259',
                    name: 'id',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: true,
                    primaryKey: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    pattern: '^[a-z0-9]+$',
                    min: 15,
                    max: 15
                },
                {
                    id: 'text0000000004',
                    name: 'name',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '',
                    min: 1,
                    max: 100
                },
                {
                    id: 'text0000000005',
                    name: 'color',
                    type: 'text',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    autogeneratePattern: '',
                    pattern: '^#([A-Fa-f0-9]{6})$',
                    min: 0,
                    max: 7
                },
                {
                    id: 'autodate2990389179',
                    name: 'created',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: false
                },
                {
                    id: 'autodate3332085498',
                    name: 'updated',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: true
                }
            ],
            indexes: [],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.id != ''"
        });

        app.save(tagsCollection);

        // Create 'book_tags' junction collection (many-to-many)
        const bookTagsCollection = new Collection({
            name: 'book_tags',
            type: 'base',
            system: false,
            fields: [
                {
                    id: 'text3208210260',
                    name: 'id',
                    type: 'text',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: true,
                    primaryKey: true,
                    autogeneratePattern: '[a-z0-9]{15}',
                    hidden: false,
                    pattern: '^[a-z0-9]+$',
                    min: 15,
                    max: 15
                },
                {
                    id: 'relation0000000006',
                    name: 'book',
                    type: 'relation',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    collectionId: booksCollection.id,
                    cascadeDelete: true,
                    minSelect: null,
                    maxSelect: 1,
                    displayFields: ['title']
                },
                {
                    id: 'relation0000000007',
                    name: 'tag',
                    type: 'relation',
                    required: true,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    collectionId: tagsCollection.id,
                    cascadeDelete: true,
                    minSelect: null,
                    maxSelect: 1,
                    displayFields: ['name']
                },
                {
                    id: 'autodate2990389180',
                    name: 'created',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: false
                },
                {
                    id: 'autodate3332085499',
                    name: 'updated',
                    type: 'autodate',
                    required: false,
                    presentable: false,
                    unique: false,
                    system: false,
                    hidden: false,
                    onCreate: true,
                    onUpdate: true
                }
            ],
            indexes: [],
            listRule: "@request.auth.id != ''",
            viewRule: "@request.auth.id != ''",
            createRule: "@request.auth.id != ''",
            updateRule: "@request.auth.id != ''",
            deleteRule: "@request.auth.id != ''"
        });

        return app.save(bookTagsCollection);
    },
    app => {
        const bookTags = app.findCollectionByNameOrId('book_tags');
        if (bookTags) {
            app.delete(bookTags);
        }

        const tags = app.findCollectionByNameOrId('tags');
        if (tags) {
            app.delete(tags);
        }

        const bookMetadata = app.findCollectionByNameOrId('book_metadata');
        if (bookMetadata) {
            app.delete(bookMetadata);
        }

        const books = app.findCollectionByNameOrId('books');
        if (books) {
            app.delete(books);
        }

        const authors = app.findCollectionByNameOrId('authors');
        if (authors) {
            return app.delete(authors);
        }
    }
);
