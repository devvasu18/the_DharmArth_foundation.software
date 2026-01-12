const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role'); // Needed if we populate deeply later

// Protect routes
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];

            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password').populate('roles');

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// Check for dynamic permissions
// Usage: checkPermission('User Management', 'create')
const checkPermission = (moduleName, action) => {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Super Admin bypass
        if (req.user.isSuperAdmin) {
            return next();
        }

        // Check user roles
        const userRoles = req.user.roles;
        if (!userRoles || userRoles.length === 0) {
            return res.status(403).json({ message: 'Access denied: No roles assigned' });
        }

        // We need to fetch the full role objects with permissions if not already populated deep enough
        // Ideally, we populate 'roles' in the protect middleware. 
        // Assuming req.user.roles contains the full Role documents with 'permissions' array.

        // However, Role schema has permissions: [{ module: String, actions: [String] }]
        // We need to iterate and find a match.

        let hasPermission = false;

        for (const role of userRoles) {
            // Need to populate specific role permissions if they are references? 
            // In our schema Role.permissions is an embedded array, so it is available if Role is populated.

            const modulePerm = role.permissions.find(p => p.module === moduleName);
            if (modulePerm && modulePerm.actions.includes(action)) {
                hasPermission = true;
                break;
            }
        }

        if (hasPermission) {
            next();
        } else {
            res.status(403).json({ message: `Access denied: Missing permission ${action} on ${moduleName}` });
        }
    };
};

module.exports = { protect, checkPermission };
