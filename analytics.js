/**
 * ============================================
 * analytics.js - Обработка данных и вычисления
 * ============================================
 * Парсинг Excel, расчет статистики, генерация отчетов
 */

const analyticsModule = {
    /**
     * Парсинг Excel файлов
     */
    async parseExcelFiles(files) {
        const employees = [];
        let questionsReference = null;

        for (const file of files) {
            const data = await this.readFile(file);
            const workbook = XLSX.read(data, { type: 'array' });

            // Check for questions reference sheet
            if (workbook.SheetNames.includes('Справочник вопросов')) {
                questionsReference = this.parseQuestionsReference(workbook.Sheets['Справочник вопросов']);
            }

            // Parse main data sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet);

            const parsedData = this.parseEmployeeData(jsonData);
            employees.push(...parsedData);
        }

        return { employees, questionsReference };
    },

    /**
     * Чтение файла
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Парсинг справочника вопросов
     */
    parseQuestionsReference(sheet) {
        const data = XLSX.utils.sheet_to_json(sheet);
        const reference = {};
        
        data.forEach(row => {
            const questionNum = row['Номер вопроса'];
            const topic = row['Тема обучения'];
            if (questionNum && topic) {
                reference[questionNum] = topic;
            }
        });

        return reference;
    },

    /**
     * Парсинг данных сотрудников
     */
    parseEmployeeData(jsonData) {
        return jsonData.map(row => {
            // Extract basic info
            const employee = {
                city: row['Город'] || '',
                subdivision: row['Подразделение'] || '',
                fullName: row['ФИО'] || '',
                position: row['Должность'] || '',
                testDate: row['Дата тестирования'] || '',
                totalPercent: parseFloat(row['Общий процент']) || 0,
                questions: {}
            };

            // Extract question results
            Object.keys(row).forEach(key => {
                if (key.startsWith('Вопрос') || key.match(/^Вопрос\s*\d+/)) {
                    const questionNum = key.replace('Вопрос', '').trim();
                    employee.questions[questionNum] = parseInt(row[key]) || 0;
                }
            });

            // Determine pass/fail status
            employee.passed = employee.totalPercent >= 80;

            return employee;
        });
    },

    /**
     * Расчет общей статистики
     */
    calculateStatistics(data) {
        if (data.length === 0) {
            return this.getEmptyStats();
        }

        const totalEmployees = data.length;
        const passedEmployees = data.filter(emp => emp.passed).length;
        const failedEmployees = totalEmployees - passedEmployees;
        const results = data.map(emp => emp.totalPercent);

        const avgResult = (results.reduce((a, b) => a + b, 0) / totalEmployees).toFixed(1);
        const maxResult = Math.max(...results).toFixed(1);
        const minResult = Math.min(...results).toFixed(1);
        const passedPercent = ((passedEmployees / totalEmployees) * 100).toFixed(1);
        const failedPercent = ((failedEmployees / totalEmployees) * 100).toFixed(1);

        const cities = [...new Set(data.map(emp => emp.city))];
        const totalCities = cities.length;

        return {
            totalEmployees,
            passedEmployees,
            failedEmployees,
            passedPercent,
            failedPercent,
            avgResult,
            maxResult,
            minResult,
            totalCities
        };
    },

    /**
     * Пустая статистика
     */
    getEmptyStats() {
        return {
            totalEmployees: 0,
            passedEmployees: 0,
            failedEmployees: 0,
            passedPercent: 0,
            failedPercent: 0,
            avgResult: 0,
            maxResult: 0,
            minResult: 0,
            totalCities: 0
        };
    },

    /**
     * Статистика по городам
     */
    calculateCityStats(data) {
        const cityStats = {};

        data.forEach(emp => {
            if (!cityStats[emp.city]) {
                cityStats[emp.city] = {
                    total: 0,
                    passed: 0,
                    failed: 0,
                    totalResult: 0,
                    subdivisions: {}
                };
            }

            cityStats[emp.city].total++;
            cityStats[emp.city].totalResult += emp.totalPercent;

            if (emp.passed) {
                cityStats[emp.city].passed++;
            } else {
                cityStats[emp.city].failed++;
            }

            // Subdivision stats within city
            if (!cityStats[emp.city].subdivisions[emp.subdivision]) {
                cityStats[emp.city].subdivisions[emp.subdivision] = {
                    total: 0,
                    totalResult: 0
                };
            }

            cityStats[emp.city].subdivisions[emp.subdivision].total++;
            cityStats[emp.city].subdivisions[emp.subdivision].totalResult += emp.totalPercent;
        });

        // Calculate averages
        Object.keys(cityStats).forEach(city => {
            cityStats[city].avgResult = (cityStats[city].totalResult / cityStats[city].total).toFixed(1);
            cityStats[city].passedPercent = ((cityStats[city].passed / cityStats[city].total) * 100).toFixed(1);

            Object.keys(cityStats[city].subdivisions).forEach(sub => {
                const subData = cityStats[city].subdivisions[sub];
                subData.avgResult = (subData.totalResult / subData.total).toFixed(1);
            });
        });

        return cityStats;
    },

    /**
     * Статистика по подразделениям
     */
    calculateSubdivisionStats(data) {
        const subdivisionStats = {};

        data.forEach(emp => {
            if (!subdivisionStats[emp.subdivision]) {
                subdivisionStats[emp.subdivision] = {
                    total: 0,
                    passed: 0,
                    totalResult: 0,
                    cities: {}
                };
            }

            subdivisionStats[emp.subdivision].total++;
            subdivisionStats[emp.subdivision].totalResult += emp.totalPercent;

            if (emp.passed) {
                subdivisionStats[emp.subdivision].passed++;
            }

            // City stats within subdivision
            if (!subdivisionStats[emp.subdivision].cities[emp.city]) {
                subdivisionStats[emp.subdivision].cities[emp.city] = {
                    total: 0,
                    totalResult: 0
                };
            }

            subdivisionStats[emp.subdivision].cities[emp.city].total++;
            subdivisionStats[emp.subdivision].cities[emp.city].totalResult += emp.totalPercent;
        });

        // Calculate averages
        Object.keys(subdivisionStats).forEach(sub => {
            subdivisionStats[sub].avgResult = (subdivisionStats[sub].totalResult / subdivisionStats[sub].total).toFixed(1);
            subdivisionStats[sub].passedPercent = ((subdivisionStats[sub].passed / subdivisionStats[sub].total) * 100).toFixed(1);

            Object.keys(subdivisionStats[sub].cities).forEach(city => {
                const cityData = subdivisionStats[sub].cities[city];
                cityData.avgResult = (cityData.totalResult / cityData.total).toFixed(1);
            });
        });

        return subdivisionStats;
    },

    /**
     * Статистика по вопросам
     */
    calculateQuestionStats(data) {
        const questionStats = {};

        data.forEach(emp => {
            Object.keys(emp.questions).forEach(qNum => {
                if (!questionStats[qNum]) {
                    questionStats[qNum] = {
                        correct: 0,
                        incorrect: 0,
                        total: 0
                    };
                }

                questionStats[qNum].total++;
                if (emp.questions[qNum] === 1) {
                    questionStats[qNum].correct++;
                } else {
                    questionStats[qNum].incorrect++;
                }
            });
        });

        // Calculate percentages
        Object.keys(questionStats).forEach(qNum => {
            const stats = questionStats[qNum];
            stats.correctPercent = ((stats.correct / stats.total) * 100).toFixed(1);
            stats.incorrectPercent = ((stats.incorrect / stats.total) * 100).toFixed(1);
            stats.difficultyIndex = (100 - parseFloat(stats.correctPercent)).toFixed(1);
        });

        return questionStats;
    },

    /**
     * Статистика по темам (если есть справочник)
     */
    calculateTopicStats(data, questionsReference) {
        if (!questionsReference) return null;

        const topicStats = {};

        data.forEach(emp => {
            Object.keys(emp.questions).forEach(qNum => {
                const topic = questionsReference[qNum];
                if (!topic) return;

                if (!topicStats[topic]) {
                    topicStats[topic] = {
                        correct: 0,
                        incorrect: 0,
                        total: 0,
                        questions: []
                    };
                }

                topicStats[topic].total++;
                topicStats[topic].questions.push(qNum);

                if (emp.questions[qNum] === 1) {
                    topicStats[topic].correct++;
                } else {
                    topicStats[topic].incorrect++;
                }
            });
        });

        // Calculate percentages
        Object.keys(topicStats).forEach(topic => {
            const stats = topicStats[topic];
            stats.correctPercent = ((stats.correct / stats.total) * 100).toFixed(1);
            stats.incorrectPercent = ((stats.incorrect / stats.total) * 100).toFixed(1);
        });

        return topicStats;
    },

    /**
     * Генерация аналитического отчета
     */
    generateReport(data, stats, questionsReference) {
        const cityStats = this.calculateCityStats(data);
        const questionStats = this.calculateQuestionStats(data);
        const topicStats = questionsReference ? this.calculateTopicStats(data, questionsReference) : null;

        // Find best and worst cities
        const sortedCities = Object.entries(cityStats)
            .sort((a, b) => parseFloat(b[1].avgResult) - parseFloat(a[1].avgResult));
        
        const bestCity = sortedCities[0];
        const worstCity = sortedCities[sortedCities.length - 1];

        // Find most problematic questions
        const sortedQuestions = Object.entries(questionStats)
            .sort((a, b) => parseFloat(b[1].incorrect) - parseFloat(a[1].incorrect))
            .slice(0, 10);

        // Find most problematic topics
        let problematicTopics = [];
        if (topicStats) {
            problematicTopics = Object.entries(topicStats)
                .sort((a, b) => parseFloat(b[1].incorrectPercent) - parseFloat(a[1].incorrectPercent))
                .slice(0, 5);
        }

        // Generate recommendations
        const recommendations = this.generateRecommendations(stats, cityStats, questionStats, topicStats);

        let html = `
            <div class="report-section">
                <h6>📊 Общая статистика</h6>
                <p>Средний результат по компании составил <strong>${stats.avgResult}%</strong>.</p>
                <p>Проходной балл успешно преодолели <strong>${stats.passedEmployees}</strong> сотрудников (${stats.passedPercent}%).</p>
                <p>Не прошли тестирование <strong>${stats.failedEmployees}</strong> сотрудников (${stats.failedPercent}%).</p>
            </div>

            <div class="report-section">
                <h6>🏆 Результаты по городам</h6>
                <p>Лучший результат показал город <strong>${bestCity[0]}</strong> — ${bestCity[1].avgResult}%.</p>
                <p>Наименьший результат показал город <strong>${worstCity[0]}</strong> — ${worstCity[1].avgResult}%.</p>
            </div>
        `;

        // Add subdivision comparison if available
        if (bestCity && bestCity[1].subdivisions) {
            const subs = Object.entries(bestCity[1].subdivisions);
            if (subs.length >= 2) {
                const diff = (parseFloat(subs[0][1].avgResult) - parseFloat(subs[1][1].avgResult)).toFixed(1);
                html += `
                    <div class="report-section">
                        <h6>📈 Сравнение подразделений в ${bestCity[0]}</h6>
                        <p>Подразделение <strong>${subs[0][0]}</strong> показывает ${subs[0][1].avgResult}%, 
                        подразделение <strong>${subs[1][0]}</strong> — ${subs[1][1].avgResult}%.</p>
                        <p>Разница составляет <strong>${diff}%</strong>.</p>
                    </div>
                `;
            }
        }

        // Add problematic questions
        html += `
            <div class="report-section">
                <h6>❓ Проблемные вопросы</h6>
                <p>Наиболее сложными оказались вопросы:</p>
                <ul>
                    ${sortedQuestions.map(([qNum, stats]) => {
                        const topic = questionsReference && questionsReference[qNum] 
                            ? ` (${questionsReference[qNum]})` 
                            : '';
                        return `<li>Вопрос ${qNum}${topic} — ${stats.incorrectPercent}% ошибок (${stats.incorrect} неправильных ответов)</li>`;
                    }).join('')}
                </ul>
            </div>
        `;

        // Add problematic topics if available
        if (topicStats && problematicTopics.length > 0) {
            html += `
                <div class="report-section">
                    <h6>📚 Проблемные темы обучения</h6>
                    <p>Основные затруднения сотрудников связаны с темами:</p>
                    <ul>
                        ${problematicTopics.map(([topic, stats]) => 
                            `<li>${topic} — ${stats.incorrectPercent}% ошибок</li>`
                        ).join('')}
                    </ul>
                </div>
            `;
        }

        // Add recommendations
        html += `
            <div class="report-section">
                <h6>💡 Рекомендации</h6>
                ${recommendations.map(rec => `
                    <div class="recommendation ${rec.type}">
                        ${rec.text}
                    </div>
                `).join('')}
            </div>
        `;

        return html;
    },

    /**
     * Генерация рекомендаций
     */
    generateRecommendations(stats, cityStats, questionStats, topicStats) {
        const recommendations = [];

        // Overall performance
        if (parseFloat(stats.avgResult) < 80) {
            recommendations.push({
                type: 'danger',
                text: 'Средний результат по компании ниже проходного балла. Рекомендуется провести дополнительное обучение для всех сотрудников.'
            });
        } else if (parseFloat(stats.avgResult) < 85) {
            recommendations.push({
                type: 'warning',
                text: 'Средний результат близок к проходному баллу. Рекомендуется усилить подготовку сотрудников.'
            });
        }

        // City performance
        Object.entries(cityStats).forEach(([city, stats]) => {
            if (parseFloat(stats.avgResult) < 80) {
                recommendations.push({
                    type: 'warning',
                    text: `Город ${city} показывает результат ниже проходного балла (${stats.avgResult}%). Рекомендуется провести дополнительный тренинг.`
                });
            }
        });

        // Question performance
        Object.entries(questionStats).forEach(([qNum, stats]) => {
            if (parseFloat(stats.correctPercent) < 60) {
                recommendations.push({
                    type: 'danger',
                    text: `Вопрос ${qNum} имеет низкий процент правильных ответов (${stats.correctPercent}%). Рекомендуется повторное обучение по этой теме.`
                });
            }
        });

        // Topic performance
        if (topicStats) {
            Object.entries(topicStats).forEach(([topic, stats]) => {
                if (parseFloat(stats.correctPercent) < 70) {
                    recommendations.push({
                        type: 'warning',
                        text: `Тема "${topic}" требует дополнительного внимания. Процент правильных ответов: ${stats.correctPercent}%.`
                    });
                }
            });
        }

        if (recommendations.length === 0) {
            recommendations.push({
                type: 'success',
                text: 'Результаты тестирования соответствуют ожиданиям. Продолжайте текущую программу обучения.'
            });
        }

        return recommendations;
    },

    /**
     * Получение данных для тепловой карты
     */
    getHeatmapData(data) {
        const cities = [...new Set(data.map(emp => emp.city))].sort();
        const allQuestions = new Set();
        
        data.forEach(emp => {
            Object.keys(emp.questions).forEach(qNum => allQuestions.add(qNum));
        });

        const questions = Array.from(allQuestions).sort((a, b) => parseInt(a) - parseInt(b));

        const heatmapData = cities.map(city => {
            const cityData = data.filter(emp => emp.city === city);
            const rowData = questions.map(qNum => {
                const questionData = cityData.filter(emp => emp.questions[qNum] !== undefined);
                if (questionData.length === 0) return null;

                const correct = questionData.filter(emp => emp.questions[qNum] === 1).length;
                return ((correct / questionData.length) * 100).toFixed(1);
            });

            return { city, data: rowData };
        });

        return { cities, questions, heatmapData };
    }
};
