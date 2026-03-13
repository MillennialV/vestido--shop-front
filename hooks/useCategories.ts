"use client";

import { useCategoryContext } from '@/context/CategoryContext';

export const useCategories = () => {
    return useCategoryContext();
};
