class ClassManager {
    constructor() {
        this.addClassBtn = document.getElementById('add-class-btn');
        this.classList = document.getElementById('class-list');
        this.classDetail = document.getElementById('class-detail');
        this.classNameInput = document.getElementById('class-name');
        this.saveClassBtn = document.getElementById('save-class-btn');
        this.addTeacherBtn = document.getElementById('add-teacher-btn');
        this.addStudentBtn = document.getElementById('add-student-btn');
        this.teachersList = document.getElementById('teachers-list');
        this.studentsList = document.getElementById('students-list');
        
        this.currentClassId = null;
        this.init();
    }

    init() {
        this.addClassBtn.addEventListener('click', () => this.showAddClassForm());
        this.saveClassBtn.addEventListener('click', () => this.saveClass());
        this.addTeacherBtn.addEventListener('click', () => this.showAddTeacherForm());
        this.addStudentBtn.addEventListener('click', () => this.showAddStudentForm());
        this.loadClasses();
    }

    async loadClasses() {
        try {
            const response = await fetch('/api/classes', {
                credentials: 'include'
            });

            if (response.ok) {
                const classes = await response.json();
                this.renderClasses(classes);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '학급 목록을 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('학급 목록 로드 에러:', error);
            alert('학급 목록을 불러오는 중 오류가 발생했습니다.');
        }
    }

    renderClasses(classes) {
        this.classList.innerHTML = '';
        classes.forEach(classItem => {
            const classCard = document.createElement('div');
            classCard.className = 'class-card';
            classCard.dataset.classId = classItem.id;
            classCard.innerHTML = `
                <h4>${classItem.name}</h4>
                <p>담임: ${classItem.teachers || '없음'}</p>
                <p>학생 수: ${classItem.student_count || 0}명</p>
                <div class="class-actions">
                    <button onclick="window.classManager.showClassDetailPage(${classItem.id})">상세보기</button>
                    <button onclick="window.classManager.deleteClass(${classItem.id})">삭제</button>
                    <button class="attendance-btn" data-class-id="${classItem.id}">출석체크</button>
                    <button class="statistics-btn" onclick="window.statisticsManager.showStatisticsSection(${classItem.id})">통계</button>
                </div>
            `;
            
            // 출석체크 버튼에 이벤트 리스너 추가
            const attendanceBtn = classCard.querySelector('.attendance-btn');
            attendanceBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                window.attendanceManager.showAttendanceSection(classItem.id);
            });
            
            this.classList.appendChild(classCard);
        });
    }

    showAddClassForm() {
        this.currentClassId = null;
        this.classNameInput.value = '';
        this.classDetail.classList.remove('hidden');
        this.teachersList.innerHTML = '';
        this.studentsList.innerHTML = '';
        
        // 학급 생성 후 바로 선생님과 학생 추가 안내
        if (typeof window.showNotification === 'function') {
            window.showNotification('학급 이름을 입력하고 저장한 후, 선생님과 학생을 추가해주세요.', 'info');
        }
    }

    async saveClass() {
        const name = this.classNameInput.value;
        if (!name) {
            alert('학급 이름을 입력해주세요.');
            return;
        }

        try {
            const url = this.currentClassId ? 
                `/api/classes/${this.currentClassId}` : 
                '/api/classes';
            
            const response = await fetch(url, {
                method: this.currentClassId ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                this.loadClasses();
                this.classDetail.classList.add('hidden');
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '학급 저장에 실패했습니다.');
            }
        } catch (error) {
            console.error('학급 저장 에러:', error);
            alert('학급 저장 중 오류가 발생했습니다.');
        }
    }

    showClassDetailPage(classId) {
        // 모든 섹션 숨기기
        this.hideAllSections();
        
        // 상세보기 섹션 표시
        this.showDetailPage(classId);
    }

    async showDetailPage(classId) {
        try {
            const response = await fetch(`/api/classes/${classId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const classData = await response.json();
                this.currentClassId = classId;
                
                // 상세보기 페이지 HTML 생성
                const detailPageHTML = `
                    <div class="detail-page">
                        <div class="detail-header">
                            <h2>📚 ${classData.name} 상세 정보</h2>
                            <button onclick="window.classManager.hideDetailPage()" class="close-btn">✕ 닫기</button>
                        </div>
                        <div class="detail-content">
                            <div class="detail-section">
                                <h3>선생님 목록</h3>
                                <div class="teachers-list">
                                    ${classData.teachers.length > 0 ? 
                                        classData.teachers.map(teacher => `
                                            <div class="teacher-item">
                                                <span>${teacher.name}</span>
                                                <button onclick="window.classManager.deleteTeacher(${teacher.id})" class="delete-btn">삭제</button>
                                            </div>
                                        `).join('') : 
                                        '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">등록된 선생님이 없습니다.</p>'
                                    }
                                </div>
                                <button onclick="window.classManager.showAddTeacherForm()" class="add-btn">선생님 추가</button>
                            </div>
                            <div class="detail-section">
                                <h3>학생 목록</h3>
                                <div class="students-list">
                                    ${classData.students.length > 0 ? 
                                        classData.students.map(student => `
                                            <div class="student-item">
                                                <span>${student.name}</span>
                                                <button onclick="window.classManager.deleteStudent(${student.id})" class="delete-btn">삭제</button>
                                            </div>
                                        `).join('') : 
                                        '<p style="text-align: center; color: #6c757d; font-style: italic; padding: 20px;">등록된 학생이 없습니다.</p>'
                                    }
                                </div>
                                <button onclick="window.classManager.showAddStudentForm()" class="add-btn">학생 추가</button>
                            </div>
                        </div>
                    </div>
                `;
                
                // 기존 상세보기 페이지 제거
                const existingDetailPage = document.querySelector('.detail-page');
                if (existingDetailPage) {
                    existingDetailPage.remove();
                }
                
                // 새로운 상세보기 페이지 추가
                document.getElementById('main-section').insertAdjacentHTML('beforeend', detailPageHTML);
                
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '학급 정보를 불러오는데 실패했습니다.');
            }
        } catch (error) {
            console.error('학급 상세 정보 로드 에러:', error);
            alert('학급 정보를 불러오는 중 오류가 발생했습니다.');
        }
    }

    hideDetailPage() {
        const detailPage = document.querySelector('.detail-page');
        if (detailPage) {
            detailPage.remove();
        }
    }

    async deleteClass(classId) {
        if (!confirm('정말로 이 학급을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/classes/${classId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.loadClasses();
                this.classDetail.classList.add('hidden');
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '학급 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('학급 삭제 에러:', error);
            alert('학급 삭제 중 오류가 발생했습니다.');
        }
    }

    showAddTeacherForm() {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>선생님 추가</h3>
                <div class="form-group">
                    <label for="modal-teacher-name">선생님 이름</label>
                    <input type="text" id="modal-teacher-name" placeholder="이름을 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-add-teacher-btn" style="background:#6a82fb;">추가</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-add-teacher-btn').onclick = () => {
                    const name = document.getElementById('modal-teacher-name').value.trim();
                    if (name) {
                        this.addTeacher(name);
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('이름을 입력하세요.', 'error');
                        } else {
                            alert('이름을 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-teacher-name').focus();
            }, 0);
        } else {
            const name = prompt('선생님 이름을 입력해주세요:');
            if (name) {
                this.addTeacher(name);
            }
        }
    }

    async addTeacher(name) {
        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/teachers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                this.showDetailPage(this.currentClassId);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '선생님 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('선생님 추가 에러:', error);
            alert('선생님 추가 중 오류가 발생했습니다.');
        }
    }

    showAddStudentForm() {
        if (typeof window.showModal === 'function') {
            window.showModal(`
                <h3>학생 추가</h3>
                <div class="form-group">
                    <label for="modal-student-name">학생 이름</label>
                    <input type="text" id="modal-student-name" placeholder="이름을 입력하세요" style="width:100%;padding:12px;margin:10px 0;border:1.5px solid #e0e0e0;border-radius:8px;">
                </div>
                <div style="display:flex;gap:10px;justify-content:flex-end;">
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background:#6c757d;">취소</button>
                    <button id="modal-add-student-btn" style="background:#6a82fb;">추가</button>
                </div>
            `);
            setTimeout(() => {
                document.getElementById('modal-add-student-btn').onclick = () => {
                    const name = document.getElementById('modal-student-name').value.trim();
                    if (name) {
                        this.addStudent(name);
                        document.querySelector('.modal').remove();
                    } else {
                        if (typeof window.showNotification === 'function') {
                            window.showNotification('이름을 입력하세요.', 'error');
                        } else {
                            alert('이름을 입력하세요.');
                        }
                    }
                };
                document.getElementById('modal-student-name').focus();
            }, 0);
        } else {
            const name = prompt('학생 이름을 입력해주세요:');
            if (name) {
                this.addStudent(name);
            }
        }
    }

    async addStudent(name) {
        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                this.showDetailPage(this.currentClassId);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '학생 추가에 실패했습니다.');
            }
        } catch (error) {
            console.error('학생 추가 에러:', error);
            alert('학생 추가 중 오류가 발생했습니다.');
        }
    }

    renderTeachers(teachers) {
        this.teachersList.innerHTML = '';
        teachers.forEach(teacher => {
            const teacherElement = document.createElement('div');
            teacherElement.className = 'teacher-item';
            teacherElement.innerHTML = `
                <p>${teacher.name}</p>
                <button onclick="window.classManager.deleteTeacher(${teacher.id})">삭제</button>
            `;
            this.teachersList.appendChild(teacherElement);
        });
    }

    renderStudents(students) {
        this.studentsList.innerHTML = '';
        students.forEach(student => {
            const studentElement = document.createElement('div');
            studentElement.className = 'student-item';
            studentElement.innerHTML = `
                <p>${student.name}</p>
                <button onclick="window.classManager.deleteStudent(${student.id})">삭제</button>
            `;
            this.studentsList.appendChild(studentElement);
        });
    }

    async deleteTeacher(teacherId) {
        if (!confirm('정말로 이 선생님을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/teachers/${teacherId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showDetailPage(this.currentClassId);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '선생님 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('선생님 삭제 에러:', error);
            alert('선생님 삭제 중 오류가 발생했습니다.');
        }
    }

    async deleteStudent(studentId) {
        if (!confirm('정말로 이 학생을 삭제하시겠습니까?')) {
            return;
        }

        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/students/${studentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                this.showDetailPage(this.currentClassId);
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '학생 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('학생 삭제 에러:', error);
            alert('학생 삭제 중 오류가 발생했습니다.');
        }
    }

    showClassDetails(classId) {
        // 모든 섹션 숨기기
        this.hideAllSections();
        
        // 선택된 반 버튼 활성화
        document.querySelectorAll('.class-button').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
        
        // 반 상세 정보 표시
        this.classDetailsSection.classList.remove('hidden');
        this.loadClassDetails(classId);
    }

    hideAllSections() {
        // 모든 섹션 숨기기
        this.classDetail.classList.add('hidden');
        
        // 출석, 통계, 전체 통계 섹션도 숨기기
        if (window.attendanceManager) {
            window.attendanceManager.attendanceSection.classList.add('hidden');
        }
        if (window.statisticsManager) {
            window.statisticsManager.statisticsSection.classList.add('hidden');
        }
        if (window.overallStatisticsManager) {
            window.overallStatisticsManager.overallStatisticsSection.classList.add('hidden');
        }
        
        // 상세보기 페이지 숨기기
        this.hideDetailPage();
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.classManager = new ClassManager();
}); 