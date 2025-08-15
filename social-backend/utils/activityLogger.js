import Activity from '../models/Activity.js';

export const createActivity = async ({ user, type, refId }) => {
    try {
        const newActivity = new Activity({
            user,
            type,
            refId
        });
        await newActivity.save();
        return newActivity;
    } catch (err) {
        console.error('Error creating activity:', err.message);
        // In a real application, you might want to log this error more robustly
    }
};