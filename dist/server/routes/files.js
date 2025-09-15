var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Router } from 'express';
import { db } from '../db/index.js';
import { Op } from 'sequelize';
const router = Router();
const { File } = db;
// Middleware to ensure user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
};
// Get all files for the authenticated user
router.get('/', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const tags = req.query.tags;
        let where = { userId };
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0);
            where.tags = { [Op.or]: tagArray.map(tag => ({ [Op.like]: `%${tag}%` })) };
        }
        const files = await File.findAll({ where, order: [['uploadedAt', 'DESC']] });
        //  Add proper null/undefined checks before calling split
        const filesWithTags = files.map(f => {
            const fileData = f.toJSON();
            let tags = [];
            if (fileData.tags) {
                if (typeof fileData.tags === 'string') {
                    tags = fileData.tags.split(',').map((tag) => tag.trim());
                }
                else if (Array.isArray(fileData.tags)) {
                    tags = fileData.tags.map((tag) => tag.toString().trim());
                }
            }
            return Object.assign(Object.assign({}, fileData), { tags });
        });
        res.json({ files: filesWithTags });
    }
    catch (error) {
        console.error('Error fetching user files:', error);
        res.status(500).json({ error: 'Failed to fetch files' });
    }
});
// Create a new file record
router.post('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, originalName, type, size, s3Key, url, tags } = req.body;
        if (!name || !type || !size || !url) {
            return res.status(400).json({ error: 'Missing required file information' });
        }
        // Process tags - ensure they're lowercase and unique
        let processedTags = [];
        if (tags && Array.isArray(tags)) {
            processedTags = tags
                .map(tag => tag.toString().toLowerCase().trim())
                .filter(tag => tag.length > 0)
                .filter((tag, index, array) => array.indexOf(tag) === index);
        }
        const file = await File.create({
            userId,
            name,
            originalName: originalName || name,
            type,
            size,
            s3Key,
            url,
            tags: processedTags.length > 0 ? processedTags.join(',') : undefined,
            uploadedAt: new Date(),
            updatedAt: new Date()
        });
        // Convert tags back to array for response
        const response = Object.assign(Object.assign({}, file.toJSON()), { tags: (file.tags && typeof file.tags === 'string')
                ? file.tags.split(',').map(tag => tag.trim())
                : [] });
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating file record:', error);
        res.status(500).json({ error: 'Failed to create file record' });
    }
});
// Create a new file record via upload endpoint (alias for POST /)
router.post('/upload', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, originalName, type, size, s3Key, url, tags } = req.body;
        if (!name || !type || !size || !url) {
            return res.status(400).json({ error: 'Missing required file information' });
        }
        // Process tags - ensure they're lowercase and unique
        let processedTags = [];
        if (tags && Array.isArray(tags)) {
            processedTags = tags
                .map(tag => tag.toString().toLowerCase().trim())
                .filter(tag => tag.length > 0)
                .filter((tag, index, array) => array.indexOf(tag) === index);
        }
        const file = await File.create({
            userId,
            name,
            originalName: originalName || name,
            type,
            size,
            s3Key,
            url,
            tags: processedTags.length > 0 ? processedTags.join(',') : undefined,
            uploadedAt: new Date(),
            updatedAt: new Date()
        });
        // Convert tags back to array for response
        const response = Object.assign(Object.assign({}, file.toJSON()), { tags: (file.tags && typeof file.tags === 'string')
                ? file.tags.split(',').map(tag => tag.trim())
                : [] });
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating file record via upload:', error);
        res.status(500).json({ error: 'Failed to create file record' });
    }
});
// Get all unique tags for the authenticated user
router.get('/tags/list', requireAuth, async (req, res) => {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const files = await File.findAll({ where: { userId } });
        //  Add proper null/undefined checks before calling split
        const allTags = files
            .flatMap(file => {
            const fileData = file.toJSON();
            return (fileData.tags && typeof fileData.tags === 'string')
                ? fileData.tags.split(',').map(tag => tag.trim().toLowerCase())
                : [];
        })
            .filter((tag, index, array) => array.indexOf(tag) === index)
            .sort();
        res.json({ tags: allTags });
    }
    catch (error) {
        console.error('Error fetching user tags:', error);
        res.status(500).json({ error: 'Failed to fetch tags' });
    }
});
// Get a specific file by ID (only if it belongs to the user)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const fileId = parseInt(req.params.id);
        if (isNaN(fileId)) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }
        const file = await File.findOne({ where: { id: fileId, userId } });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Convert tags back to array for response
        let responseTags = [];
        if (file.tags) {
            if (typeof file.tags === 'string') {
                responseTags = file.tags.split(',').map((tag) => tag.trim());
            }
            else if (Array.isArray(file.tags)) {
                responseTags = file.tags.map((tag) => tag.toString().trim());
            }
        }
        const response = Object.assign(Object.assign({}, file.toJSON()), { tags: responseTags });
        res.json({ file: response });
    }
    catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).json({ error: 'Failed to fetch file' });
    }
});
// Delete a file
router.delete('/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.id;
        const fileId = parseInt(req.params.id);
        if (isNaN(fileId)) {
            return res.status(400).json({ error: 'Invalid file ID' });
        }
        const file = await File.findOne({ where: { id: fileId, userId } });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        await file.destroy();
        res.json({ message: 'File deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});
// Update a specific file
router.put('/:id', requireAuth, async (req, res) => {
    var _a;
    try {
        const fileId = parseInt(req.params.id);
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const _b = req.body, { tags } = _b, updateData = __rest(_b, ["tags"]);
        // Convert tags array to comma-separated string for database storage
        if (tags !== undefined) {
            if (Array.isArray(tags)) {
                const processedTags = tags.filter(tag => tag && tag.trim()).map(tag => tag.trim().toLowerCase());
                updateData.tags = processedTags.join(',');
            }
            else {
                updateData.tags = '';
            }
        }
        const [updatedRows] = await File.update(updateData, {
            where: { id: fileId, userId }
        });
        if (updatedRows === 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        const updatedFile = await File.findOne({ where: { id: fileId, userId } });
        if (!updatedFile) {
            return res.status(404).json({ error: 'File not found after update' });
        }
        // Handle both string and array cases
        let responseTags = [];
        if (updatedFile.tags) {
            if (typeof updatedFile.tags === 'string') {
                // If it's a string, split it
                responseTags = updatedFile.tags.split(',').map((tag) => tag.trim());
            }
            else if (Array.isArray(updatedFile.tags)) {
                // If it's already an array, use it directly
                responseTags = updatedFile.tags.map((tag) => tag.toString().trim());
            }
        }
        const response = Object.assign(Object.assign({}, updatedFile.toJSON()), { tags: responseTags });
        res.json(response);
    }
    catch (error) {
        console.error('Error updating file:', error);
        res.status(500).json({ error: 'Failed to update file' });
    }
});
// Handle tag key press for adding tags to files
router.post('/tags', requireAuth, async (req, res) => {
    try {
        const { fileId, tag } = req.body;
        const userId = req.user.id;
        if (!fileId || !tag) {
            return res.status(400).json({ error: 'File ID and tag are required' });
        }
        // Find the file to update
        const file = await File.findOne({ where: { id: fileId, userId } });
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }
        // Add tag to current tags
        const currentTags = file.tags ? file.tags.split(',').map(t => t.trim()) : [];
        const newTags = Array.from(new Set([...currentTags, tag.toLowerCase()]));
        // Update the file with new tags
        file.tags = newTags.join(',');
        await file.save();
        res.json({ file: Object.assign(Object.assign({}, file.toJSON()), { tags: newTags }) });
    }
    catch (error) {
        console.error('Error adding tag to file:', error);
        res.status(500).json({ error: 'Failed to add tag to file' });
    }
});
export default router;
