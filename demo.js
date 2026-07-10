/**
 * ============================================
 * demo.js - Генерация демо-данных
 * ============================================
 * Создание тестовых данных для демонстрации
 */

const demoModule = {
    /**
     * Генерация демо-данных
     */
    generateDemoData() {
        const cities = ['Алматы', 'Астана', 'Шымкент', 'Караганда', 'Актобе', 
                       'Уральск', 'Павлодар', 'Семей', 'Костанай', 'Петропавловск'];
        const subdivisions = ['ЦАП', 'ЦРК'];
        const positions = ['Консультант', 'Старший консультант', 'Менеджер', 'Специалист', 'Эксперт'];
        
        const firstNames = ['Александр', 'Елена', 'Дмитрий', 'Ольга', 'Сергей', 
                           'Анна', 'Андрей', 'Мария', 'Максим', 'Наталья',
                           'Артем', 'Юлия', 'Иван', 'Екатерина', 'Павел',
                           'Виктория', 'Николай', 'Татьяна', 'Алексей', 'Светлана'];
        const lastNames = ['Иванов', 'Петров', 'Сидоров', 'Козлов', 'Новиков',
                          'Морозов', 'Волков', 'Соколов', 'Лебедев', 'Кузнецов',
                          'Попов', 'Смирнов', 'Васильев', 'Павлов', 'Семенов',
                          'Голубев', 'Виноградов', 'Богданов', 'Воробьев', 'Федоров'];

        const employees = [];
        const numEmployees = 200;
        const numQuestions = 40;

        // Generate questions reference
        const questionsReference = {};
        const topics = [
            'Приветствие', 'Выявление потребностей', 'Работа с возражениями', 
            'Тарифные планы', 'Дополнительные услуги', 'Презентация продукта',
            'Завершение продажи', 'Работа с клиентом', 'Коммуникация',
            'Продажи услуг', 'Кросс-продажи', 'Апсейл', 'Технологии продаж',
            'CRM система', 'Документооборот', 'Стандарты обслуживания',
            'Обработка звонков', 'Личная эффективность', 'Работа в команде',
            'Тайм-менеджмент'
        ];

        for (let i = 1; i <= numQuestions; i++) {
            questionsReference[i.toString()] = topics[i % topics.length];
        }

        // Generate employees
        for (let i = 0; i < numEmployees; i++) {
            const city = cities[Math.floor(Math.random() * cities.length)];
            const subdivision = subdivisions[Math.floor(Math.random() * subdivisions.length)];
            const position = positions[Math.floor(Math.random() * positions.length)];
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            
            // Generate test date within last 30 days
            const testDate = new Date();
            testDate.setDate(testDate.getDate() - Math.floor(Math.random() * 30));
            
            // Generate questions with varying difficulty
            const questions = {};
            let correctCount = 0;
            
            for (let q = 1; q <= numQuestions; q++) {
                // Some questions are harder (lower success rate)
                const difficulty = q % 5 === 0 ? 0.6 : 0.8; // Every 5th question is harder
                const isCorrect = Math.random() < difficulty;
                questions[q.toString()] = isCorrect ? 1 : 0;
                if (isCorrect) correctCount++;
            }

            const totalPercent = ((correctCount / numQuestions) * 100).toFixed(1);

            employees.push({
                city,
                subdivision,
                fullName: `${lastName} ${firstName}`,
                position,
                testDate: testDate.toISOString().split('T')[0],
                totalPercent: parseFloat(totalPercent),
                passed: parseFloat(totalPercent) >= 80,
                questions
            });
        }

        return { employees, questionsReference };
    },

    /**
     * Создание демо Excel файла
     */
    generateDemoExcel() {
        const { employees, questionsReference } = this.generateDemoData();
        
        const wb = XLSX.utils.book_new();

        // Create main data sheet
        const mainData = employees.map(emp => {
            const row = {
                'Город': emp.city,
                'Подразделение': emp.subdivision,
                'ФИО': emp.fullName,
                'Должность': emp.position,
                'Дата тестирования': emp.testDate,
                'Общий процент': emp.totalPercent
            };

            // Add question columns
            Object.keys(emp.questions).forEach(qNum => {
                row[`Вопрос ${qNum}`] = emp.questions[qNum];
            });

            return row;
        });

        const mainWs = XLSX.utils.json_to_sheet(mainData);
        XLSX.utils.book_append_sheet(wb, mainWs, 'Результаты');

        // Create questions reference sheet
        const refData = Object.entries(questionsReference).map(([qNum, topic]) => ({
            'Номер вопроса': qNum,
            'Тема обучения': topic
        }));

        const refWs = XLSX.utils.json_to_sheet(refData);
        XLSX.utils.book_append_sheet(wb, refWs, 'Справочник вопросов');

        XLSX.writeFile(wb, 'demo_data.xlsx');
    }
};
