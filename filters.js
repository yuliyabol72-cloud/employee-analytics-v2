/**
 * ============================================
 * filters.js - Логика фильтрации
 * ============================================
 * Применение фильтров к данным
 */

const filtersModule = {
    /**
     * Применение фильтров к данным
     */
    applyFilters(data, filters) {
        let filtered = [...data];

        // Filter by city
        if (filters.city) {
            filtered = filtered.filter(emp => emp.city === filters.city);
        }

        // Filter by subdivision
        if (filters.subdivision) {
            filtered = filtered.filter(emp => emp.subdivision === filters.subdivision);
        }

        // Filter by position
        if (filters.position) {
            filtered = filtered.filter(emp => emp.position === filters.position);
        }

        // Filter by date
        if (filters.date) {
            filtered = filtered.filter(emp => {
                if (!emp.testDate) return false;
                const empDate = new Date(emp.testDate);
                const filterDate = new Date(filters.date);
                return empDate.toDateString() === filterDate.toDateString();
            });
        }

        return filtered;
    },

    /**
     * Получение уникальных значений для фильтров
     */
    getFilterValues(data, field) {
        return [...new Set(data.map(emp => emp[field]))].filter(Boolean).sort();
    },

    /**
     * Сброс фильтров
     */
    resetFilters() {
        return {
            city: '',
            subdivision: '',
            position: '',
            date: ''
        };
    }
};
