/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Create admin user collection if it doesn't exist (it should be auto-created)
  // PocketBase automatically creates 'users' as an auth collection

  const collection = app.findCollectionByNameOrId('users');

  if (!collection) {
    // If users collection doesn't exist, create it as auth collection
    const usersCollection = new Collection({
      name: 'users',
      type: 'auth',
      schema: [
        {
          name: 'name',
          type: 'text',
          required: false,
          options: {
            min: 0,
            max: 255
          }
        }
      ],
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null
    });
    app.save(usersCollection);
  }

  // Create admin user with credentials from .env
  // Email: tester@test.com
  // Password: PocketbaseTanstackDBPass123
  const usersCollection = app.findCollectionByNameOrId('users');

  const adminUser = new Record(usersCollection, {
    email: 'tester@test.com',
    emailVisibility: true,
    verified: true,
    name: 'Test Admin User'
  });

  // Set password using setPassword method
  adminUser.setPassword('PocketbaseTanstackDBPass123');

  app.save(adminUser);

}, (app) => {
  // Rollback: delete the admin user
  try {
    const usersCollection = app.findCollectionByNameOrId('users');
    if (usersCollection) {
      // Find and delete the test user
      const users = app.findRecordsByFilter(
        usersCollection.id,
        'email = "tester@test.com"',
        '-created',
        1
      );

      if (users.length > 0) {
        app.delete(users[0]);
      }
    }
  } catch (e) {}
});
