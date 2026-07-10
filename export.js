/**
 * ============================================
 * export.js - Экспорт данных
 * ============================================
 * Генерация PDF, Excel и отчетов
 */

const exportModule = {
    /**
     * Экспорт в PDF
     */
    exportPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const data = app.getFilteredData();
        const stats = analyticsModule.calculateStatistics(data);
        const cityStats = analyticsModule.calculateCityStats(data);
        const questionStats = analyticsModule.calculateQuestionStats(data);
        const questionsReference = app.getQuestionsReference();

        // Title
        doc.setFontSize(20);
        doc.text('Аналитика результатов тестирования', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 105, 30, { align: 'center' });

        // KPI
        doc.setFontSize(14);
        doc.text('Общая статистика', 20, 45);
        
        doc.setFontSize(11);
        doc.text(`Всего сотрудников: ${stats.totalEmployees}`, 20, 55);
        doc.text(`Успешно прошли: ${stats.passedEmployees} (${stats.passedPercent}%)`, 20, 62);
        doc.text(`Не прошли: ${stats.failedEmployees} (${stats.failedPercent}%)`, 20, 69);
        doc.text(`Средний результат: ${stats.avgResult}%`, 20, 76);
        doc.text(`Максимальный результат: ${stats.maxResult}%`, 20, 83);
        doc.text(`Минимальный результат: ${stats.minResult}%`, 20, 90);

        // City stats
        doc.setFontSize(14);
        doc.text('Результаты по городам', 20, 105);

        const cityTableData = Object.entries(cityStats).map(([city, stats]) => [
            city,
            stats.total.toString(),
            stats.avgResult + '%',
            stats.passedPercent + '%'
        ]);

        doc.autoTable({
            startY: 110,
            head: [['Город', 'Сотрудников', 'Средний результат', 'Успешность']],
            body: cityTableData,
            theme: 'grid',
            headStyles: { fillColor: [13, 110, 253] }
        });

        // Question stats
        const topErrors = Object.entries(questionStats)
            .sort((a, b) => parseFloat(b[1].incorrect) - parseFloat(a[1].incorrect))
            .slice(0, 10);

        doc.addPage();
        doc.setFontSize(14);
        doc.text('ТОП-10 вопросов с наибольшим количеством ошибок', 20, 20);

        const questionTableData = topErrors.map(([qNum, stats]) => {
            const topic = questionsReference && questionsReference[qNum] 
                ? questionsReference[qNum] 
                : '-';
            return [
                qNum,
                topic,
                stats.incorrect.toString(),
                stats.correct.toString(),
                stats.incorrectPercent + '%'
            ];
        });

        doc.autoTable({
            startY: 25,
            head: [['Вопрос', 'Тема', 'Ошибок', 'Правильно', '% ошибок']],
            body: questionTableData,
            theme: 'grid',
            headStyles: { fillColor: [220, 53, 69] }
        });

        doc.save('analytics_report.pdf');
    },

    /**
     * Экспорт в Excel
     */
    exportExcel() {
        const data = app.getFilteredData();
        const stats = analyticsModule.calculateStatistics(data);
        const cityStats = analyticsModule.calculateCityStats(data);
        const questionStats = analyticsModule.calculateQuestionStats(data);
        const questionsReference = app.getQuestionsReference();

        const wb = XLSX.utils.book_new();

        // Summary sheet
        const summaryData = [
            ['Показатель', 'Значение'],
            ['Всего сотрудников', stats.totalEmployees],
            ['Успешно прошли', stats.passedEmployees],
            ['Не прошли', stats.failedEmployees],
            ['Процент успешности', stats.passedPercent + '%'],
            ['Средний результат', stats.avgResult + '%'],
            ['Максимальный результат', stats.maxResult + '%'],
            ['Минимальный результат', stats.minResult + '%'],
            ['Количество городов', stats.totalCities]
        ];

        const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, summaryWs, 'Общая статистика');

        // City stats sheet
        const cityData = [['Город', 'Сотрудников', 'Средний результат', 'Успешность']];
        Object.entries(cityStats).forEach(([city, stats]) => {
            cityData.push([city, stats.total, stats.avgResult + '%', stats.passedPercent + '%']);
        });

        const cityWs = XLSX.utils.aoa_to_sheet(cityData);
        XLSX.utils.book_append_sheet(wb, cityWs, 'По городам');

        // Question stats sheet
        const questionData = [['Вопрос', 'Тема', 'Правильно', 'Ошибок', '% ошибок', 'Индекс сложности']];
        Object.entries(questionStats).forEach(([qNum, stats]) => {
            const topic = questionsReference && questionsReference[qNum] 
                ? questionsReference[qNum] 
                : '-';
            questionData.push([
                qNum,
                topic,
                stats.correct,
                stats.incorrect,
                stats.incorrectPercent + '%',
                stats.difficultyIndex
            ]);
        });

        const questionWs = XLSX.utils.aoa_to_sheet(questionData);
        XLSX.utils.book_append_sheet(wb, questionWs, 'По вопросам');

        // Employees sheet
        const employeeData = [['ФИО', 'Город', 'Подразделение', 'Должность', 'Дата', 'Результат', 'Статус']];
        data.forEach(emp => {
            employeeData.push([
                emp.fullName,
                emp.city,
                emp.subdivision,
                emp.position,
                emp.testDate,
                emp.totalPercent + '%',
                emp.passed ? 'Сдал' : 'Не сдал'
            ]);
        });

        const employeeWs = XLSX.utils.aoa_to_sheet(employeeData);
        XLSX.utils.book_append_sheet(wb, employeeWs, 'Сотрудники');

        XLSX.writeFile(wb, 'analytics_report.xlsx');
    },

    /**
     * Экспорт отчета для руководителя
     */
    exportManagerReport() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const data = app.getFilteredData();
        const stats = analyticsModule.calculateStatistics(data);
        const cityStats = analyticsModule.calculateCityStats(data);
        const questionStats = analyticsModule.calculateQuestionStats(data);
        const questionsReference = app.getQuestionsReference();
        const topicStats = questionsReference ? analyticsModule.calculateTopicStats(data, questionsReference) : null;

        // Title
        doc.setFontSize(22);
        doc.text('ОТЧЕТ ДЛЯ РУКОВОДИТЕЛЯ', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text('Аналитика результатов тестирования сотрудников', 105, 30, { align: 'center' });
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 105, 38, { align: 'center' });

        // Executive Summary
        doc.setFontSize(16);
        doc.text('РЕЗЮМЕ', 20, 55);
        
        doc.setFontSize(12);
        const summary = [
            `Средний результат по компании: ${stats.avgResult}%`,
            `Успешно прошли тестирование: ${stats.passedEmployees} чел. (${stats.passedPercent}%)`,
            `Не прошли тестирование: ${stats.failedEmployees} чел. (${stats.failedPercent}%)`,
            `Протестировано городов: ${stats.totalCities}`
        ];

        summary.forEach((line, index) => {
            doc.text(line, 20, 65 + (index * 8));
        });

        // Key Findings
        doc.addPage();
        doc.setFontSize(16);
        doc.text('КЛЮЧЕВЫЕ НАХОДКИ', 20, 20);

        const sortedCities = Object.entries(cityStats)
            .sort((a, b) => parseFloat(b[1].avgResult) - parseFloat(a[1].avgResult));
        
        const bestCity = sortedCities[0];
        const worstCity = sortedCities[sortedCities.length - 1];

        doc.setFontSize(12);
        doc.text(`Лучший результат: ${bestCity[0]} - ${bestCity[1].avgResult}%`, 20, 35);
        doc.text(`Худший результат: ${worstCity[0]} - ${worstCity[1].avgResult}%`, 20, 45);

        // Problematic Questions
        const topErrors = Object.entries(questionStats)
            .sort((a, b) => parseFloat(b[1].incorrect) - parseFloat(a[1].incorrect))
            .slice(0, 5);

        doc.setFontSize(14);
        doc.text('Проблемные вопросы', 20, 65);

        doc.setFontSize(11);
        topErrors.forEach(([qNum, stats], index) => {
            const topic = questionsReference && questionsReference[qNum] 
                ? ` (${questionsReference[qNum]})` 
                : '';
            doc.text(`${index + 1}. Вопрос ${qNum}${topic} - ${stats.incorrectPercent}% ошибок`, 20, 75 + (index * 8));
        });

        // Problematic Topics
        if (topicStats) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text('ПРОБЛЕМНЫЕ ТЕМЫ ОБУЧЕНИЯ', 20, 20);

            const problematicTopics = Object.entries(topicStats)
                .sort((a, b) => parseFloat(b[1].incorrectPercent) - parseFloat(a[1].incorrectPercent))
                .slice(0, 5);

            doc.setFontSize(12);
            problematicTopics.forEach(([topic, stats], index) => {
                doc.text(`${index + 1}. ${topic} - ${stats.incorrectPercent}% ошибок`, 20, 35 + (index * 10));
            });
        }

        // Recommendations
        doc.addPage();
        doc.setFontSize(16);
        doc.text('РЕКОМЕНДАЦИИ', 20, 20);

        const recommendations = analyticsModule.generateRecommendations(stats, cityStats, questionStats, topicStats);

        doc.setFontSize(11);
        recommendations.forEach((rec, index) => {
            const lines = doc.splitTextToSize(rec.text, 170);
            doc.setFontSize(10);
            doc.text(`${index + 1}.`, 20, 35 + (index * 25));
            doc.setFontSize(11);
            lines.forEach((line, lineIndex) => {
                doc.text(line, 30, 35 + (index * 25) + (lineIndex * 6));
            });
        });

        doc.save('manager_report.pdf');
    },

    /**
     * Скачивание отчета
     */
    downloadReport() {
        const reportContent = document.getElementById('reportContent').innerHTML;
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Аналитический отчет', 105, 20, { align: 'center' });
        
        doc.setFontSize(12);
        doc.text(`Дата: ${new Date().toLocaleDateString('ru-RU')}`, 105, 30, { align: 'center' });

        // Convert HTML to text (simplified)
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reportContent;
        const text = tempDiv.innerText || tempDiv.textContent;

        const lines = doc.splitTextToSize(text, 170);
        doc.setFontSize(11);
        lines.forEach((line, index) => {
            if (index < 50) { // Limit to prevent too long PDF
                doc.text(line, 20, 45 + (index * 7));
            }
        });

        doc.save('analytical_report.pdf');
    }
};
