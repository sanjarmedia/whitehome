import { useEffect } from 'react';

/**
 * Custom hook to lock the background scroll when a modal is open.
 * @param {boolean} lock - Whether to lock the scroll or not.
 */
export const useScrollLock = (lock) => {
    useEffect(() => {
        if (lock) {
            const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = 'hidden';
            document.body.style.paddingRight = `${scrollBarWidth}px`;
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }

        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [lock]);
};

export default useScrollLock;
