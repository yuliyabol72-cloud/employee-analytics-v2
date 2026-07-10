/**
 * ============================================
 * charts.js - Визуализация данных
 * ============================================
 * Создание и обновление графиков Chart.js
 */

const chartsModule = {
    charts: {},

    /**
     * Обновление всех графиков
     */
    updateAllCharts(data, stats, questionsReference) {
        this.destroyAllCharts();
        
        const cityStats = analyticsModule.calculateCityStats(data);
        const subdivisionStats = analyticsModule.calculateSubdivisionStats(data);
        const questionStats = analyticsModule.calculateQuestionStats(data);
        const topicStats = questionsReference ? analyticsModule.calculateTopicStats(data, questionsReference) : null;

        // Overview charts
        this.createResultsDistributionChart(data);
        this.createPassFailChart(stats);
        this.createCitiesOverviewChart(cityStats);

        // Cities charts
        this.createTopCitiesChart(cityStats);
        this.createBottomCitiesChart(cityStats);
        this.createCitySubdivisionsChart(cityStats);

        // Subdivisions charts
        this.createTsapRatingChart(subdivisionStats);
        this.createTsrkRatingChart(subdivisionStats);

        // Questions charts
        this.createTopErrorsChart(questionStats, questionsReference);
        if (topicStats) {
            this.createTopicsChart(topicStats);
        }

        // Heatmap
        this.createHeatmapChart(data);
    },

    /**
     * Уничтожение всех графиков
     */
    destroyAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};
    },

    /**
     * График распределения результатов
     */
    createResultsDistributionChart(data) {
        const ctx = document.getElementById('resultsDistributionChart').getContext('2d');
        
        // Create ranges
        const ranges = ['0-59%', '60-69%', '70-79%', '80-89%', '90-100%'];
        const counts = [0, 0, 0, 0, 0];

        data.forEach(emp => {
            const percent = emp.totalPercent;
            if (percent < 60) counts[0]++;
            else if (percent < 70) counts[1]++;
            else if (percent < 80) counts[2]++;
            else if (percent < 90) counts[3]++;
            else counts[4]++;
        });

        this.charts.resultsDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ranges,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#dc3545', '#ffc107', '#fd7e14', '#198754', '#0d6efd'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    /**
     * График сдали/не сдали
     */
    createPassFailChart(stats) {
        const ctx = document.getElementById('passFailChart').getContext('2d');

        this.charts.passFail = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Сдали', 'Не сдали'],
                datasets: [{
                    data: [stats.passedEmployees, stats.failedEmployees],
                    backgroundColor: ['#198754', '#dc3545'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    },

    /**
     * График среднего результата по городам
     */
    createCitiesOverviewChart(cityStats) {
        const ctx = document.getElementById('citiesOverviewChart').getContext('2d');
        
        const sortedCities = Object.entries(cityStats)
            .sort((a, b) => parseFloat(b[1].avgResult) - parseFloat(a[1].avgResult));

        this.charts.citiesOverview = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: sortedCities.map(([city]) => city),
                datasets: [{
                    label: 'Средний результат',
                    data: sortedCities.map(([, stats]) => parseFloat(stats.avgResult)),
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * ТОП городов
     */
    createTopCitiesChart(cityStats) {
        const ctx = document.getElementById('topCitiesChart').getContext('2d');
        
        const topCities = Object.entries(cityStats)
            .sort((a, b) => parseFloat(b[1].avgResult) - parseFloat(a[1].avgResult))
            .slice(0, 5);

        this.charts.topCities = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: topCities.map(([city]) => city),
                datasets: [{
                    label: 'Средний результат',
                    data: topCities.map(([, stats]) => parseFloat(stats.avgResult)),
                    backgroundColor: 'rgba(25, 135, 84, 0.8)',
                    borderColor: 'rgba(25, 135, 84, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Антирейтинг городов
     */
    createBottomCitiesChart(cityStats) {
        const ctx = document.getElementById('bottomCitiesChart').getContext('2d');
        
        const bottomCities = Object.entries(cityStats)
            .sort((a, b) => parseFloat(a[1].avgResult) - parseFloat(b[1].avgResult))
            .slice(0, 5);

        this.charts.bottomCities = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: bottomCities.map(([city]) => city),
                datasets: [{
                    label: 'Средний результат',
                    data: bottomCities.map(([, stats]) => parseFloat(stats.avgResult)),
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Подразделения внутри городов
     */
    createCitySubdivisionsChart(cityStats) {
        const ctx = document.getElementById('citySubdivisionsChart').getContext('2d');
        
        const datasets = [];
        const colors = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1'];
        let colorIndex = 0;

        Object.entries(cityStats).forEach(([city, stats]) => {
            Object.entries(stats.subdivisions).forEach(([sub, subStats]) => {
                const existingDataset = datasets.find(d => d.label === sub);
                if (existingDataset) {
                    existingDataset.data.push(parseFloat(subStats.avgResult));
                } else {
                    datasets.push({
                        label: sub,
                        data: [parseFloat(subStats.avgResult)],
                        backgroundColor: colors[colorIndex % colors.length],
                        borderColor: colors[colorIndex % colors.length],
                        borderWidth: 2
                    });
                    colorIndex++;
                }
            });
        });

        const cities = Object.keys(cityStats);

        this.charts.citySubdivisions = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: cities,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                }
            }
        });
    },

    /**
     * Рейтинг ЦАП
     */
    createTsapRatingChart(subdivisionStats) {
        const ctx = document.getElementById('tsapRatingChart').getContext('2d');
        
        const tsapData = Object.entries(subdivisionStats)
            .filter(([sub]) => sub.includes('ЦАП'))
            .sort((a, b) => parseFloat(b[1].avgResult) - parseFloat(a[1].avgResult));

        if (tsapData.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Нет данных ЦАП', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.charts.tsapRating = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tsapData.map(([sub, stats]) => {
                    const city = Object.keys(stats.cities)[0] || sub;
                    return city;
                }),
                datasets: [{
                    label: 'Средний результат',
                    data: tsapData.map(([, stats]) => parseFloat(stats.avgResult)),
                    backgroundColor: 'rgba(13, 110, 253, 0.8)',
                    borderColor: 'rgba(13, 110, 253, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Рейтинг ЦРК
     */
    createTsrkRatingChart(subdivisionStats) {
        const ctx = document.getElementById('tsrkRatingChart').getContext('2d');
        
        const tsrkData = Object.entries(subdivisionStats)
            .filter(([sub]) => sub.includes('ЦРК'))
            .sort((a, b) => parseFloat(b[1].avgResult) - parseFloat(a[1].avgResult));

        if (tsrkData.length === 0) {
            ctx.font = '16px Arial';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Нет данных ЦРК', ctx.canvas.width / 2, ctx.canvas.height / 2);
            return;
        }

        this.charts.tsrkRating = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: tsrkData.map(([sub, stats]) => {
                    const city = Object.keys(stats.cities)[0] || sub;
                    return city;
                }),
                datasets: [{
                    label: 'Средний результат',
                    data: tsrkData.map(([, stats]) => parseFloat(stats.avgResult)),
                    backgroundColor: 'rgba(111, 66, 193, 0.8)',
                    borderColor: 'rgba(111, 66, 193, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * ТОП-10 вопросов с ошибками
     */
    createTopErrorsChart(questionStats, questionsReference) {
        const ctx = document.getElementById('topErrorsChart').getContext('2d');
        
        const topErrors = Object.entries(questionStats)
            .sort((a, b) => parseFloat(b[1].incorrect) - parseFloat(a[1].incorrect))
            .slice(0, 10);

        const labels = topErrors.map(([qNum, stats]) => {
            const topic = questionsReference && questionsReference[qNum] 
                ? ` (${questionsReference[qNum]})` 
                : '';
            return `Вопрос ${qNum}${topic}`;
        });

        this.charts.topErrors = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Количество ошибок',
                    data: topErrors.map(([, stats]) => stats.incorrect),
                    backgroundColor: 'rgba(220, 53, 69, 0.8)',
                    borderColor: 'rgba(220, 53, 69, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * График проблемных тем
     */
    createTopicsChart(topicStats) {
        const ctx = document.getElementById('topicsChart').getContext('2d');
        
        const problematicTopics = Object.entries(topicStats)
            .sort((a, b) => parseFloat(b[1].incorrectPercent) - parseFloat(a[1].incorrectPercent))
            .slice(0, 10);

        this.charts.topics = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: problematicTopics.map(([topic]) => topic),
                datasets: [{
                    label: '% ошибок',
                    data: problematicTopics.map(([, stats]) => parseFloat(stats.incorrectPercent)),
                    backgroundColor: 'rgba(255, 193, 7, 0.8)',
                    borderColor: 'rgba(255, 193, 7, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: value => value + '%'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    /**
     * Тепловая карта
     */
    createHeatmapChart(data) {
        const ctx = document.getElementById('heatmapChart').getContext('2d');
        const { cities, questions, heatmapData } = analyticsModule.getHeatmapData(data);

        // Create data for heatmap
        const heatmapColors = heatmapData.map(row => {
            return row.data.map(value => {
                if (value === null) return 'rgba(200, 200, 200, 0.3)';
                if (value >= 90) return 'rgba(40, 167, 69, 0.8)';
                if (value >= 70) return 'rgba(255, 193, 7, 0.8)';
                return 'rgba(220, 53, 69, 0.8)';
            });
        });

        this.charts.heatmap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: cities,
                datasets: questions.map((q, i) => ({
                    label: q,
                    data: heatmapData.map(row => row.data[i] || 0),
                    backgroundColor: heatmapColors.map(row => row[i]),
                    borderColor: heatmapColors.map(row => row[i]),
                    borderWidth: 1
                }))
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        stacked: true,
                        display: false
                    },
                    y: {
                        stacked: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: (context) => {
                                const cityIndex = context[0].dataIndex;
                                return cities[cityIndex];
                            },
                            label: (context) => {
                                const questionIndex = context.datasetIndex;
                                const value = heatmapData[context.dataIndex].data[questionIndex];
                                return `Вопрос ${questions[questionIndex]}: ${value}%`;
                            }
                        }
                    }
                }
            }
        });
    }
};
