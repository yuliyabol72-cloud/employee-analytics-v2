/**
 * ============================================
 * table.js - Таблица сотрудников
 * ============================================
 * Рендеринг таблицы, поиск, детальная карточка
 */

const tableModule = {
    currentData: [],

    /**
     * Рендеринг таблицы
     */
    renderTable(data) {
        this.currentData = data;
        const tbody = document.querySelector('#employeesTable tbody');
        
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Нет данных</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((emp, index) => {
            const statusClass = emp.passed ? 'passed' : 'failed';
            const statusText = emp.passed ? 'Сдал' : 'Не сдал';
            
            const resultClass = emp.totalPercent >= 90 ? 'high' : 
                              emp.totalPercent >= 70 ? 'medium' : 'low';

            return `
                <tr>
                    <td>${emp.fullName}</td>
                    <td>${emp.city}</td>
                    <td>${emp.subdivision}</td>
                    <td>${emp.position}</td>
                    <td><span class="result-badge ${resultClass}">${emp.totalPercent}%</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="tableModule.showEmployeeDetails(${index})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Фильтрация сотрудников по поиску
     */
    filterEmployees(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = this.currentData.filter(emp => 
            emp.fullName.toLowerCase().includes(term) ||
            emp.city.toLowerCase().includes(term) ||
            emp.subdivision.toLowerCase().includes(term) ||
            emp.position.toLowerCase().includes(term)
        );
        
        const tbody = document.querySelector('#employeesTable tbody');
        
        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">Ничего не найдено</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((emp, index) => {
            const statusClass = emp.passed ? 'passed' : 'failed';
            const statusText = emp.passed ? 'Сдал' : 'Не сдал';
            
            const resultClass = emp.totalPercent >= 90 ? 'high' : 
                              emp.totalPercent >= 70 ? 'medium' : 'low';

            const originalIndex = this.currentData.indexOf(emp);

            return `
                <tr>
                    <td>${emp.fullName}</td>
                    <td>${emp.city}</td>
                    <td>${emp.subdivision}</td>
                    <td>${emp.position}</td>
                    <td><span class="result-badge ${resultClass}">${emp.totalPercent}%</span></td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary" onclick="tableModule.showEmployeeDetails(${originalIndex})">
                            <i class="bi bi-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    },

    /**
     * Показ детальной карточки сотрудника
     */
    showEmployeeDetails(index) {
        const emp = this.currentData[index];
        const questionsReference = app.getQuestionsReference();
        
        const correctCount = Object.values(emp.questions).filter(v => v === 1).length;
        const incorrectCount = Object.values(emp.questions).filter(v => v === 0).length;
        
        const incorrectQuestions = Object.entries(emp.questions)
            .filter(([qNum, result]) => result === 0)
            .map(([qNum]) => qNum);

        // Get topics if reference available
        const topicsToReview = questionsReference 
            ? incorrectQuestions
                .map(qNum => questionsReference[qNum])
                .filter(topic => topic)
                .filter((topic, index, self) => self.indexOf(topic) === index)
            : [];

        let html = `
            <div class="employee-detail">
                <div class="employee-detail-label">ФИО</div>
                <div class="employee-detail-value">${emp.fullName}</div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Город</div>
                <div class="employee-detail-value">${emp.city}</div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Подразделение</div>
                <div class="employee-detail-value">${emp.subdivision}</div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Должность</div>
                <div class="employee-detail-value">${emp.position}</div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Дата тестирования</div>
                <div class="employee-detail-value">${emp.testDate}</div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Результат тестирования</div>
                <div class="employee-detail-value">
                    <span class="result-badge ${emp.totalPercent >= 90 ? 'high' : emp.totalPercent >= 70 ? 'medium' : 'low'}">
                        ${emp.totalPercent}%
                    </span>
                </div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Статус</div>
                <div class="employee-detail-value">
                    <span class="status-badge ${emp.passed ? 'passed' : 'failed'}">
                        ${emp.passed ? 'Сдал' : 'Не сдал'}
                    </span>
                </div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Правильных ответов</div>
                <div class="employee-detail-value text-success">${correctCount}</div>
            </div>
            <div class="employee-detail">
                <div class="employee-detail-label">Неправильных ответов</div>
                <div class="employee-detail-value text-danger">${incorrectCount}</div>
            </div>
        `;

        if (incorrectQuestions.length > 0) {
            html += `
                <div class="employee-questions">
                    <h6>❌ Вопросы с ошибками (${incorrectQuestions.length})</h6>
                    <div class="questions-list">
                        ${incorrectQuestions.map(qNum => {
                            const topic = questionsReference && questionsReference[qNum] 
                                ? `<small class="text-muted">(${questionsReference[qNum]})</small>` 
                                : '';
                            return `
                                <div class="question-item incorrect">
                                    Вопрос ${qNum} ${topic}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        if (topicsToReview.length > 0) {
            html += `
                <div class="employee-questions">
                    <h6>📚 Темы для повторения</h6>
                    <div class="topics-list">
                        ${topicsToReview.map(topic => `
                            <div class="question-item">
                                ${topic}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        // Strengths and development areas
        const strongQuestions = Object.entries(emp.questions)
            .filter(([qNum, result]) => result === 1)
            .map(([qNum]) => qNum);

        if (strongQuestions.length > 0 && strongQuestions.length > incorrectQuestions.length) {
            html += `
                <div class="employee-questions">
                    <h6>💪 Сильные стороны</h6>
                    <div class="text-success">
                        Сотрудник хорошо ответил на ${strongQuestions.length} вопросов
                    </div>
                </div>
            `;
        }

        if (incorrectQuestions.length > 0) {
            html += `
                <div class="employee-questions">
                    <h6>🎯 Зоны развития</h6>
                    <div class="text-danger">
                        Требуется работа над ${incorrectQuestions.length} вопросами
                    </div>
                </div>
            `;
        }

        document.getElementById('employeeModalBody').innerHTML = html;
        
        const modal = new bootstrap.Modal(document.getElementById('employeeModal'));
        modal.show();
    }
};
