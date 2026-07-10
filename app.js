/**
 * ============================================
 * app.js - Главный контроллер приложения
 * ============================================
 * Управление состоянием, событиями и координация модулей
 */

class App {
    constructor() {
        this.state = {
            rawData: [],
            filteredData: [],
            questionsReference: null,
            filters: {
                city: '',
                subdivision: '',
                position: '',
                date: ''
            },
            charts: {},
            currentTab: 'overview'
        };

        this.init();
    }

    /**
     * Инициализация приложения
     */
    init() {
        this.bindEvents();
        this.initDragAndDrop();
        console.log('Application initialized');
    }

    /**
     * Привязка событий
     */
    bindEvents() {
        // File upload
        document.getElementById('fileInput').addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Demo button
        document.getElementById('demoBtn').addEventListener('click', () => this.loadDemoData());
        
        // New upload button
        document.getElementById('newUploadBtn').addEventListener('click', () => this.resetApp());
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            const modal = new bootstrap.Modal(document.getElementById('exportModal'));
            modal.show();
        });
        
        // Filter changes
        document.getElementById('cityFilter').addEventListener('change', (e) => this.handleFilterChange('city', e.target.value));
        document.getElementById('subdivisionFilter').addEventListener('change', (e) => this.handleFilterChange('subdivision', e.target.value));
        document.getElementById('positionFilter').addEventListener('change', (e) => this.handleFilterChange('position', e.target.value));
        document.getElementById('dateFilter').addEventListener('change', (e) => this.handleFilterChange('date', e.target.value));
        
        // Reset filters
        document.getElementById('resetFiltersBtn').addEventListener('click', () => this.resetFilters());
        
        // Download report
        document.getElementById('downloadReportBtn').addEventListener('click', () => exportModule.downloadReport());
        
        // Export buttons
        document.getElementById('exportPdfBtn').addEventListener('click', () => exportModule.exportPDF());
        document.getElementById('exportExcelBtn').addEventListener('click', () => exportModule.exportExcel());
        document.getElementById('exportManagerReportBtn').addEventListener('click', () => exportModule.exportManagerReport());
        
        // Employee search
        document.getElementById('employeeSearch').addEventListener('input', (e) => {
            tableModule.filterEmployees(e.target.value);
        });
    }

    /**
     * Инициализация Drag & Drop
     */
    initDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('dragover');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('dragover');
            });
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            this.processFiles(files);
        });
    }

    /**
     * Обработка загрузки файлов
     */
    handleFileUpload(event) {
        const files = event.target.files;
        this.processFiles(files);
    }

    /**
     * Обработка файлов
     */
    async processFiles(files) {
        if (files.length === 0) return;

        try {
            const data = await analyticsModule.parseExcelFiles(files);
            
            if (data.employees.length === 0) {
                alert('Файлы не содержат данных или имеют неверный формат');
                return;
            }

            this.state.rawData = data.employees;
            this.state.questionsReference = data.questionsReference;
            this.state.filteredData = [...this.state.rawData];

            this.showDashboard();
            this.populateFilters();
            this.updateAllAnalytics();
            
        } catch (error) {
            console.error('Error processing files:', error);
            alert('Ошибка при обработке файлов: ' + error.message);
        }
    }

    /**
     * Загрузка демо-данных
     */
    loadDemoData() {
        const demoData = demoModule.generateDemoData();
        this.state.rawData = demoData.employees;
        this.state.questionsReference = demoData.questionsReference;
        this.state.filteredData = [...this.state.rawData];

        this.showDashboard();
        this.populateFilters();
        this.updateAllAnalytics();
    }

    /**
     * Показать дашборд
     */
    showDashboard() {
        document.getElementById('uploadSection').classList.add('d-none');
        document.getElementById('dashboardSection').classList.remove('d-none');
    }

    /**
     * Сброс приложения
     */
    resetApp() {
        this.state = {
            rawData: [],
            filteredData: [],
            questionsReference: null,
            filters: {
                city: '',
                subdivision: '',
                position: '',
                date: ''
            },
            charts: {},
            currentTab: 'overview'
        };

        document.getElementById('uploadSection').classList.remove('d-none');
        document.getElementById('dashboardSection').classList.add('d-none');
        document.getElementById('fileInput').value = '';
        
        // Clear all filters
        document.getElementById('cityFilter').value = '';
        document.getElementById('subdivisionFilter').value = '';
        document.getElementById('positionFilter').value = '';
        document.getElementById('dateFilter').value = '';
        
        // Destroy all charts
        Object.values(this.state.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.state.charts = {};
    }

    /**
     * Заполнение фильтров
     */
    populateFilters() {
        const cities = [...new Set(this.state.rawData.map(emp => emp.city))].sort();
        const subdivisions = [...new Set(this.state.rawData.map(emp => emp.subdivision))].sort();
        const positions = [...new Set(this.state.rawData.map(emp => emp.position))].sort();

        this.populateSelect('cityFilter', cities);
        this.populateSelect('subdivisionFilter', subdivisions);
        this.populateSelect('positionFilter', positions);
    }

    /**
     * Заполнение select
     */
    populateSelect(selectId, options) {
        const select = document.getElementById(selectId);
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Все</option>';
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option;
            select.appendChild(opt);
        });

        select.value = currentValue;
    }

    /**
     * Обработка изменения фильтра
     */
    handleFilterChange(filterName, value) {
        this.state.filters[filterName] = value;
        this.applyFilters();
    }

    /**
     * Применение фильтров
     */
    applyFilters() {
        this.state.filteredData = filtersModule.applyFilters(
            this.state.rawData,
            this.state.filters
        );
        this.updateAllAnalytics();
    }

    /**
     * Сброс фильтров
     */
    resetFilters() {
        this.state.filters = {
            city: '',
            subdivision: '',
            position: '',
            date: ''
        };

        document.getElementById('cityFilter').value = '';
        document.getElementById('subdivisionFilter').value = '';
        document.getElementById('positionFilter').value = '';
        document.getElementById('dateFilter').value = '';

        this.state.filteredData = [...this.state.rawData];
        this.updateAllAnalytics();
    }

    /**
     * Обновление всей аналитики
     */
    updateAllAnalytics() {
        const stats = analyticsModule.calculateStatistics(this.state.filteredData);
        this.updateKPI(stats);
        chartsModule.updateAllCharts(this.state.filteredData, stats, this.state.questionsReference);
        tableModule.renderTable(this.state.filteredData);
        this.generateReport(stats);
    }

    /**
     * Обновление KPI карточек
     */
    updateKPI(stats) {
        document.getElementById('totalEmployees').textContent = stats.totalEmployees;
        document.getElementById('passedEmployees').textContent = stats.passedEmployees;
        document.getElementById('failedEmployees').textContent = stats.failedEmployees;
        document.getElementById('passedPercent').textContent = stats.passedPercent + '%';
        document.getElementById('failedPercent').textContent = stats.failedPercent + '%';
        document.getElementById('avgResult').textContent = stats.avgResult + '%';
        document.getElementById('maxResult').textContent = stats.maxResult + '%';
        document.getElementById('minResult').textContent = stats.minResult + '%';
        document.getElementById('totalCities').textContent = stats.totalCities;
    }

    /**
     * Генерация отчета
     */
    generateReport(stats) {
        const report = analyticsModule.generateReport(
            this.state.filteredData,
            stats,
            this.state.questionsReference
        );
        document.getElementById('reportContent').innerHTML = report;
    }

    /**
     * Получение состояния
     */
    getState() {
        return this.state;
    }

    /**
     * Получение отфильтрованных данных
     */
    getFilteredData() {
        return this.state.filteredData;
    }

    /**
     * Получение справочника вопросов
     */
    getQuestionsReference() {
        return this.state.questionsReference;
    }
}

// Создание экземпляра приложения
const app = new App();
