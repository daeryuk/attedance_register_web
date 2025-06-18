class AttendanceManager {
    constructor() {
        this.attendanceSection = document.getElementById('attendance-section');
        this.attendanceList = document.getElementById('attendance-list');
        this.currentClassId = null;
        this.isLoading = false;
        this.isRendering = false;
        this.lastCallTime = 0;
    }

    showAttendanceSection(classId) {
        const now = Date.now();
        
        // 500ms 내에 같은 classId로 호출되면 무시
        if (now - this.lastCallTime < 500 && this.currentClassId === classId) {
            console.log('중복 호출 방지:', classId);
            return;
        }
        
        console.log('showAttendanceSection 호출됨, classId:', classId, '현재 classId:', this.currentClassId);
        this.lastCallTime = now;
        
        // 이미 같은 반의 출석 섹션이 열려있다면 아무것도 하지 않음
        if (this.currentClassId === classId && !this.attendanceSection.classList.contains('hidden')) {
            console.log('이미 같은 반의 출석 섹션이 열려있음');
            return;
        }
        
        // 다른 반을 클릭했을 때 기존 출석 영역 초기화
        if (this.currentClassId !== classId) {
            this.clearAttendanceSection();
        }
        
        this.currentClassId = classId;
        this.attendanceSection.classList.remove('hidden');
        this.loadStudents();
    }

    clearAttendanceSection() {
        console.log('clearAttendanceSection 호출됨');
        this.attendanceList.innerHTML = '';
        this.currentClassId = null;
        this.isLoading = false;
        this.isRendering = false;
        this.lastCallTime = 0;
        
        // 모든 학생 카드 제거
        const existingCards = document.querySelectorAll('.student-card');
        existingCards.forEach(card => card.remove());
    }

    getStatusText(status) {
        switch (status) {
            case 'present':
                return '출석';
            case 'absent':
                return '결석';
            case 'late':
                return '지각';
            default:
                return '출석체크';
        }
    }

    async loadStudents() {
        // 이미 로딩 중이면 중복 호출 방지
        if (this.isLoading) {
            console.log('이미 학생 목록을 로딩 중입니다.');
            return;
        }
        
        this.isLoading = true;
        console.log('loadStudents 시작, classId:', this.currentClassId);
        
        try {
            const response = await fetch(`/api/classes/${this.currentClassId}/students`, {
                credentials: 'include'
            });

            if (response.ok) {
                const students = await response.json();
                console.log('서버에서 받은 학생 데이터:', students);
                
                // 렌더링 중이면 대기
                if (this.isRendering) {
                    console.log('렌더링 중이므로 대기...');
                    setTimeout(() => this.renderStudents(students), 100);
                } else {
                    this.renderStudents(students);
                }
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            }
        } catch (error) {
            console.error('학생 목록 로드 에러:', error);
        } finally {
            this.isLoading = false;
        }
    }

    async renderStudents(students) {
        // 이미 렌더링 중이면 중복 방지
        if (this.isRendering) {
            console.log('이미 렌더링 중입니다.');
            return;
        }
        
        this.isRendering = true;
        console.log('renderStudents 호출됨, 학생 수:', students.length);
        
        // 기존 목록 완전히 초기화
        this.attendanceList.innerHTML = '';
        
        // 중복 제거 (같은 ID를 가진 학생이 여러 번 있는 경우)
        const uniqueStudents = students.filter((student, index, self) => 
            index === self.findIndex(s => s.id === student.id)
        );
        
        console.log('중복 제거 후 학생 수:', uniqueStudents.length);
        
        // 추가 중복 검사 (이름 기준)
        const finalStudents = uniqueStudents.filter((student, index, self) => 
            index === self.findIndex(s => s.name === student.name)
        );
        
        console.log('최종 학생 수:', finalStudents.length);
        
        // 이미 렌더링된 학생 ID 추적
        const renderedStudentIds = new Set();
        
        // 오늘 날짜
        const today = new Date().toISOString().split('T')[0];
        
        // 오늘 출석 데이터 로드
        let todayAttendance = {};
        try {
            const attendanceResponse = await fetch(`/api/attendance/${this.currentClassId}/${today}`, {
                credentials: 'include'
            });
            if (attendanceResponse.ok) {
                const attendanceData = await attendanceResponse.json();
                attendanceData.forEach(record => {
                    todayAttendance[record.student_id] = record.status;
                });
            }
        } catch (error) {
            console.error('출석 데이터 로드 에러:', error);
        }
        
        finalStudents.forEach(student => {
            // 이미 렌더링된 학생인지 확인
            if (renderedStudentIds.has(student.id)) {
                console.log('이미 렌더링된 학생 건너뛰기:', student.name);
                return;
            }
            
            renderedStudentIds.add(student.id);
            
            const studentCard = document.createElement('div');
            studentCard.className = 'student-card';
            studentCard.dataset.studentId = student.id;
            
            // 기존 출석 상태 확인
            const existingStatus = todayAttendance[student.id];
            let cardClass = 'student-card';
            let buttonText = '출석체크';
            
            if (existingStatus === 'present') {
                cardClass += ' present';
                buttonText = '출석완료';
            }
            
            studentCard.className = cardClass;
            
            studentCard.innerHTML = `
                <div class="student-info">
                    <h4>${student.name}</h4>
                </div>
                <div class="attendance-button">
                    <button class="attendance-btn ${existingStatus === 'present' ? 'present' : ''}" 
                            onclick="window.attendanceManager.markAttendance(${student.id}, 'present')" 
                            data-student-id="${student.id}">
                        ${buttonText}
                    </button>
                </div>
            `;
            
            this.attendanceList.appendChild(studentCard);
        });
        
        console.log('실제 렌더링된 학생 수:', renderedStudentIds.size);
        this.isRendering = false;
    }

    async markAttendance(studentId, status) {
        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    classId: this.currentClassId,
                    studentId: studentId,
                    status: status,
                    date: new Date().toISOString().split('T')[0]
                })
            });

            if (response.ok) {
                // 출석 처리 후 해당 학생의 카드와 버튼 상태 업데이트
                const studentCard = document.querySelector(`[data-student-id="${studentId}"]`);
                const button = studentCard.querySelector('.attendance-btn');
                
                if (studentCard && button) {
                    // 카드에 출석 완료 클래스 추가
                    studentCard.classList.add('present');
                    // 버튼 상태 업데이트
                    button.classList.add('present');
                    button.textContent = '출석완료';
                }
                
                if (typeof window.showNotification === 'function') {
                    window.showNotification('출석이 기록되었습니다.', 'success');
                }
            } else if (response.status === 401) {
                // 로그인되지 않은 상태 - 로그인 페이지로 이동
                document.getElementById('main-section').classList.add('hidden');
                document.getElementById('login-section').classList.remove('hidden');
            } else {
                const error = await response.json();
                alert(error.message || '출석 기록에 실패했습니다.');
            }
        } catch (error) {
            console.error('출석 기록 에러:', error);
            alert('출석 기록 중 오류가 발생했습니다.');
        }
    }

    hideAttendanceSection() {
        this.attendanceSection.classList.add('hidden');
        this.currentClassId = null;
    }
}

// 전역 객체로 선언
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceManager = new AttendanceManager();
}); 