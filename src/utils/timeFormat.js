import { formatDistanceToNow } from 'date-fns';

export const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
        return '';
    }
};
