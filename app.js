// ==========================================
// 1. 초기 설정 및 가상 로그인 정보 (테스트 유저)
// ==========================================
// 현재 로그인된 사용자를 가상으로 정의합니다.
// 추후 실제 인증(인프라 확인 시스템)과 연동할 때 이 객체 정보만 수정하면 됩니다.
const CURRENT_USER = {
    id: "user_01",            // 사용자 고유 아이디 (ID)
    name: "테스트 유저"        // 사용자 이름
};

// 기본 키워드 (중학교 과목 분류 태그)
const DEFAULT_KEYWORDS = ["전체질문", "국어", "수학", "사회", "역사", "도덕", "과학", "기술·가정", "체육", "음악", "미술", "영어", "정보"];


// 기본 질문 데이터 (초기 상태가 비어 보이지 않도록 샘플 데이터 설정)
const DEFAULT_QUESTIONS = [
    {
        id: "q_1",
        userId: "user_02",
        userName: "김수학",
        title: "고등 수학 1 등차수열 합 공식 질문",
        content: "등차수열의 합 공식 S_n = n{2a + (n-1)d}/2 에서 왜 분모가 2가 되는지 원리가 이해되지 않아요. 쉽게 설명해 줄 수 있는 친구 있나요?",
        keyword: "수학",
        createdAt: "2026-06-28T10:00:00+09:00",
        answers: [
            {
                id: "a_1",
                userId: "user_03",
                userName: "이해결",
                content: "수열을 거꾸로 뒤집어서 원래 수열과 한 번 더 더해주는 방식을 상상해 보세요.\n모든 항의 합이 (첫째항 + 끝항)으로 일정해지는데, 두 번 더했기 때문에 마지막에 2로 나누어 주는 것이랍니다! 교과서의 유도 과정을 차근차근 다시 보시면 그림으로 잘 나와 있어요.",
                createdAt: "2026-06-28T10:15:00+09:00"
            }
        ]
    },
    {
        id: "q_2",
        userId: "user_04",
        userName: "최과학",
        title: "물리 작용 반작용 법칙 질문",
        content: "작용 반작용 법칙에서 내가 벽을 미는 힘과 벽이 나를 미는 힘은 크기가 같고 방향이 반대라고 배웠는데, 왜 힘이 평형을 이루어 상쇄되지 않는지 궁금합니다.",
        keyword: "과학",
        createdAt: "2026-06-28T12:00:00+09:00",
        answers: []
    }
];

// ==========================================
// 2. 로컬 스토리지 (브라우저 내장 저장소) 초기화
// ==========================================
// 로컬 스토리지에 데이터가 비어 있거나, 예전 6개짜리 기본 키워드라면 중학교 과목명으로 새로 세팅합니다.
const oldKeywords = ["전체질문", "국어", "수학", "과학", "영어", "사회"];
const storedKeywords = localStorage.getItem("qa_keywords");
if (!storedKeywords) {
    localStorage.setItem("qa_keywords", JSON.stringify(DEFAULT_KEYWORDS));
} else {
    try {
        const parsed = JSON.parse(storedKeywords);
        // 저장된 키워드가 예전 6개 키워드 세트와 정확히 일치하는지 비교 검증합니다.
        const isOldList = parsed.length === oldKeywords.length && parsed.every((val, index) => val === oldKeywords[index]);
        if (isOldList) {
            localStorage.setItem("qa_keywords", JSON.stringify(DEFAULT_KEYWORDS));
        }
    } catch (e) {
        localStorage.setItem("qa_keywords", JSON.stringify(DEFAULT_KEYWORDS));
    }
}
if (!localStorage.getItem("qa_questions")) {
    localStorage.setItem("qa_questions", JSON.stringify(DEFAULT_QUESTIONS));
}

// 메모리 상에서 다룰 데이터 변수들
let keywords = JSON.parse(localStorage.getItem("qa_keywords"));
let questions = JSON.parse(localStorage.getItem("qa_questions"));

// 현재 선택된 키워드 (기본값: '전체질문')
let selectedKeyword = "전체질문";

// 현재 상세 보기 중인 질문 객체
let activeQuestion = null;

// ==========================================
// 3. DOM (HTML 문서 객체 모델) 요소 가져오기
// ==========================================
const keywordListEl = document.getElementById("keyword-list");
const btnAddKeyword = document.getElementById("btn-add-keyword");
const currentKeywordTitleEl = document.getElementById("current-keyword-title");
const currentKeywordDescEl = document.getElementById("current-keyword-desc");
const btnOpenAskModal = document.getElementById("btn-open-ask-modal");
const questionListArea = document.getElementById("question-list-area");

// 모달 관련 요소들
const askModal = document.getElementById("ask-modal");
const btnCloseAskModal = document.getElementById("btn-close-ask-modal");
const btnCancelAsk = document.getElementById("btn-cancel-ask");
const askForm = document.getElementById("ask-form");
const askTitleInput = document.getElementById("ask-title");
const askKeywordSelect = document.getElementById("ask-keyword");
const askContentInput = document.getElementById("ask-content");

const detailModal = document.getElementById("detail-modal");
const btnCloseDetailModal = document.getElementById("btn-close-detail-modal");
const detailKeywordBadge = document.getElementById("detail-keyword");
const detailTitleEl = document.getElementById("detail-title");
const detailAuthorEl = document.getElementById("detail-author");
const detailDateEl = document.getElementById("detail-date");
const detailContentEl = document.getElementById("detail-content");
const detailAnswersCountEl = document.getElementById("detail-answers-count");
const detailAnswersList = document.getElementById("detail-answers-list");
const answerForm = document.getElementById("answer-form");
const answerInput = document.getElementById("answer-input");



// ==========================================
// 4. 공통 기능 및 시간 포맷팅 함수
// ==========================================
// 시간 데이터를 예쁘게 출력하기 위한 헬퍼 함수(도우미 함수)입니다.
function formatTime(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// ==========================================
// 5. 렌더링 (화면 그리기) 함수들
// ==========================================

// 5-1. 좌측 키워드 목록 렌더링
function renderKeywords() {
    keywordListEl.innerHTML = "";
    // 질문 작성 폼 내의 과목 선택 셀렉트 박스도 초기화합니다.
    askKeywordSelect.innerHTML = "";

    keywords.forEach(keyword => {
        // 좌측 키워드 목록 리스트 아이템 생성
        const li = document.createElement("li");
        li.className = `keyword-item ${keyword === selectedKeyword ? 'active' : ''}`;
        li.textContent = keyword;
        
        // 클릭 이벤트 등록
        li.addEventListener("click", () => {
            selectedKeyword = keyword;
            renderKeywords(); // 활성화 클래스 적용을 위해 재렌더링
            renderQuestions(); // 질문 목록 필터링 적용
        });
        
        keywordListEl.appendChild(li);

        // '전체질문'이 아닐 경우에만 질문 등록 폼의 과목 선택지(Option)에 추가
        if (keyword !== "전체질문") {
            const option = document.createElement("option");
            option.value = keyword;
            option.textContent = keyword;
            askKeywordSelect.appendChild(option);
        }
    });
}

// 5-2. 중앙 질문 게시글 목록 렌더링
function renderQuestions() {
    questionListArea.innerHTML = "";
    
    // 중앙 상단 헤더 텍스트 설정
    currentKeywordTitleEl.textContent = selectedKeyword;
    if (selectedKeyword === "전체질문") {
        currentKeywordDescEl.textContent = "학교 수업 중 모르는 질문을 자유롭게 나누는 공간입니다.";
    } else {
        currentKeywordDescEl.textContent = `${selectedKeyword} 과목의 궁금증을 해결하는 게시판입니다.`;
    }

    // 선택된 키워드에 따라 필터링 (전체질문일 경우 필터 통과)
    const filteredQuestions = selectedKeyword === "전체질문" 
        ? questions 
        : questions.filter(q => q.keyword === selectedKeyword);

    // 최신 글이 위에 오도록 정렬 (역순 정렬)
    const sortedQuestions = [...filteredQuestions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (sortedQuestions.length === 0) {
        // 질문이 없는 경우 빈 상태 안내 렌더링
        questionListArea.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-folder-open"></i>
                <p>아직 등록된 질문이 없습니다.<br>첫 번째로 질문을 등록해 궁금증을 해결해 보세요!</p>
            </div>
        `;
        return;
    }

    sortedQuestions.forEach(q => {
        const card = document.createElement("div");
        card.className = "question-card";
        
        // 질문 내용의 일부만 보이기 위해 슬라이싱 처리
        const truncatedContent = q.content.length > 100 
            ? q.content.substring(0, 100) + "..." 
            : q.content;

        card.innerHTML = `
            <div class="question-card-header">
                <h3 class="question-card-title">${escapeHTML(q.title)}</h3>
                <span class="keyword-badge">${escapeHTML(q.keyword)}</span>
            </div>
            <p class="question-card-body">${escapeHTML(truncatedContent)}</p>
            <div class="question-card-footer">
                <div class="question-meta">
                    <span class="question-author"><i class="fa-regular fa-user"></i> ${escapeHTML(q.userName)}</span>
                    <span class="question-date"><i class="fa-regular fa-clock"></i> ${formatTime(q.createdAt)}</span>
                </div>
                <div class="question-comments-count">
                    <i class="fa-regular fa-comment-dots"></i> 답변 ${q.answers.length}
                </div>
            </div>
        `;

        // 카드 클릭 시 상세 보기 모달 창 띄우기
        card.addEventListener("click", () => {
            openDetailModal(q.id);
        });

        questionListArea.appendChild(card);
    });
}


// 5-4. HTML 인젝션(보안 취약점) 방지를 위한 텍스트 이스케이프 처리 함수
function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==========================================
// 6. 모달 제어 및 서브 기능 로직
// ==========================================

// 6-1. 질문하기 모달 열기/닫기
btnOpenAskModal.addEventListener("click", () => {
    askModal.classList.add("active");
});
function closeAskModal() {
    askModal.classList.remove("active");
    askForm.reset();
}
btnCloseAskModal.addEventListener("click", closeAskModal);
btnCancelAsk.addEventListener("click", closeAskModal);

// 6-2. 질문 등록 (폼 서브밋)
askForm.addEventListener("submit", (e) => {
    e.preventDefault(); // 기본 페이지 리로드(새로고침) 차단
    
    const newQuestion = {
        id: "q_" + Date.now(), // 고유한 ID 값 생성 (현재 밀리초 단위 시간 활용)
        userId: CURRENT_USER.id, // 테스트 유저의 ID 고정 저장
        userName: CURRENT_USER.name,
        title: askTitleInput.value.trim(),
        content: askContentInput.value.trim(),
        keyword: askKeywordSelect.value,
        createdAt: new Date().toISOString(),
        answers: []
    };

    questions.push(newQuestion);
    // 로컬 스토리지에 변경 사항 동기화(저장)
    localStorage.setItem("qa_questions", JSON.stringify(questions));

    closeAskModal();
    renderQuestions(); // 피드 갱신
});

// 6-3. 질문 상세 모달 열기
function openDetailModal(questionId) {
    const q = questions.find(item => item.id === questionId);
    if (!q) return;

    activeQuestion = q;
    detailKeywordBadge.textContent = q.keyword;
    detailTitleEl.textContent = q.title;
    detailAuthorEl.textContent = `작성자: ${q.userName}`;
    detailDateEl.textContent = `작성일: ${formatTime(q.createdAt)}`;
    detailContentEl.textContent = q.content;

    renderAnswers();
    detailModal.classList.add("active");
}

function closeDetailModal() {
    detailModal.classList.remove("active");
    activeQuestion = null;
    answerForm.reset();
}
btnCloseDetailModal.addEventListener("click", closeDetailModal);

// 6-4. 답변 렌더링 및 추가
function renderAnswers() {
    if (!activeQuestion) return;
    
    detailAnswersCountEl.textContent = activeQuestion.answers.length;
    detailAnswersList.innerHTML = "";

    if (activeQuestion.answers.length === 0) {
        detailAnswersList.innerHTML = `<p style="color: var(--text-muted); font-size: 13px; text-align: center; padding: 12px 0;">아직 달린 답변이 없습니다. 친절한 첫 답변을 달아보세요!</p>`;
        return;
    }

    activeQuestion.answers.forEach(ans => {
        const card = document.createElement("div");
        card.className = "answer-card";
        card.innerHTML = `
            <div class="answer-meta">
                <span class="answer-author"><i class="fa-regular fa-user"></i> ${escapeHTML(ans.userName)}</span>
                <span class="answer-date">${formatTime(ans.createdAt)}</span>
            </div>
            <div class="answer-content">${escapeHTML(ans.content)}</div>
        `;
        detailAnswersList.appendChild(card);
    });

    // 스크롤을 답변 목록 하단으로 자동 스크롤시킵니다.
    detailAnswersList.scrollTop = detailAnswersList.scrollHeight;
}

// 6-5. 답변 등록 (댓글 제출)
answerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!activeQuestion) return;

    const newAnswer = {
        id: "a_" + Date.now(),
        userId: CURRENT_USER.id, // 테스트 유저의 ID로 생성
        userName: CURRENT_USER.name,
        content: answerInput.value.trim(),
        createdAt: new Date().toISOString()
    };

    activeQuestion.answers.push(newAnswer);

    // 전체 질문 리스트 내의 객체 내용도 업데이트되므로 그대로 로컬스토리지에 저장합니다.
    localStorage.setItem("qa_questions", JSON.stringify(questions));

    // 리프레시 진행
    answerInput.value = "";
    renderAnswers();
    renderQuestions(); // 중앙 피드 카드 답변수 카운트 갱신을 위함
});

// 6-6. 키워드 추가 기능 (새로운 과목 생성)
btnAddKeyword.addEventListener("click", () => {
    const newKeywordName = prompt("새로운 과목 키워드를 입력해 주세요 (예: 역사, 윤리):");
    if (!newKeywordName) return;

    const cleanedName = newKeywordName.trim();
    if (cleanedName === "") return;

    if (keywords.includes(cleanedName)) {
        alert("이미 존재하는 과목 키워드입니다.");
        return;
    }

    keywords.push(cleanedName);
    localStorage.setItem("qa_keywords", JSON.stringify(keywords));
    
    renderKeywords();
});


// ==========================================
// 7. 앱 시작 (초기화 실행)
// ==========================================
renderKeywords();
renderQuestions();
