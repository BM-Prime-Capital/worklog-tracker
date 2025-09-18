# User Role Migration

This migration adds a default role of "DEVELOPER" to all existing users and ensures new users get this role by default.

## What This Migration Does

1. **Adds `role` field** to the User model with enum values: `'MANAGER' | 'DEVELOPER'`
2. **Sets default role** to `'DEVELOPER'` for all new users
3. **Updates existing users** without a role to have `'DEVELOPER'` role
4. **Updates API responses** to include the role field in all user-related endpoints

## Files Modified

- `src/models/User.ts` - Added role field to schema and interface
- `src/app/api/auth/signup/route.ts` - Assigns default role on signup
- `src/app/api/auth/login/route.ts` - Includes role in login response
- `src/app/api/auth/me/route.ts` - Includes role in user profile response

## Running the Migration

### Option 1: Using npm script (Recommended)
```bash
npm run migrate:users-role
```

### Option 2: Manual execution
```bash
node src/scripts/migrate-users-role.js
```

## Migration Output

The script will show:
- Number of users found without role field
- Number of users successfully updated
- Total users with DEVELOPER role after migration

## Example Output
```
Starting user role migration...
Found 5 users without role field.
Successfully updated 5 users with default role.
Total users with DEVELOPER role: 5
Migration completed. Database connection closed.
```

## After Migration

1. **New users** will automatically get the "DEVELOPER" role
2. **Existing users** will have the "DEVELOPER" role
3. **Role-based access control** will work properly
4. **Protected routes** will function as expected

## Manual Role Updates

To change a user's role from DEVELOPER to MANAGER, you can:

1. **Via MongoDB directly:**
```javascript
db.users.updateOne(
  { email: "user@example.com" },
  { $set: { role: "MANAGER" } }
)
```

2. **Via API endpoint** (if implemented):
```typescript
// PATCH /api/users/[id]
{
  "role": "MANAGER"
}
```

## Rollback (If Needed)

To remove the role field from all users:
```javascript
db.users.updateMany(
  {},
  { $unset: { role: "" } }
)
```

## Notes

- This migration is **safe** and **reversible**
- No data loss occurs
- The role field is required after migration
- Default role ensures backward compatibility
- All authentication flows continue to work












