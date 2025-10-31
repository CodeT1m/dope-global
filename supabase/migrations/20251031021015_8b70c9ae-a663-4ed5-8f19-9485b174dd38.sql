-- Update user roles for the three accounts
UPDATE user_roles 
SET role = 'superadmin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'solomontimkid@gmail.com');

UPDATE user_roles 
SET role = 'admin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'timmygenius17@gmail.com');

-- asolutionfirebase@gmail.com already has 'user' role, no update needed