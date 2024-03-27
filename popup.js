/***
 * 팝업 열릴때의 동작 정의
 */
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    var currentTab = tabs[0];
    if (currentTab && !currentTab.url.includes("twitter.com")) {
        alert("이 확장 프로그램은 𝕏(구 Twitter)에서만 사용할 수 있습니다.");
        // 기능 비활성화 또는 숨기기
    }else{
        
    }
});

let twitterHandleSpan = document.getElementById('twitterHandleSpan');
let $resetButton = document.getElementById('twitterHandleResetButton');
let $startButton = document.getElementById('startButton');
let $stopButton = document.getElementById('stopButton');
let $logDiv = document.getElementById('log');
let $resultTable = document.getElementById('resultTable');
let $resultTableTbody = document.getElementById('resultTableTbody');
let $saveCountDiv = document.getElementById('saveCountDiv');
let $pastSaveDateDiv = document.getElementById('pastSaveDateDiv');
let $middleArrow = document.getElementById('middleArrow');
let $saveDateDiv = document.getElementById('saveDateDiv');

document.addEventListener('DOMContentLoaded', function(){

    // 팝업 열렸을때 기존에 저장된 트위터 핸들값이 있으면 출력
    chrome.storage.local.get('twitterHandle', function(data){
        if(data.twitterHandle){
            document.getElementById('twitterHandleInput').value = data.twitterHandle;
            twitterHandleSpan.innerText = data.twitterHandle;
            showTwitterHandleInfoTable();
        }
    });

    // 트위터 핸들 저장 버튼
    var twitterHandleSaveButton = document.getElementById('twitterHandleSaveButton');
    twitterHandleSaveButton.addEventListener('click', function(){
        var twitterHandleValue = document.getElementById('twitterHandleInput').value;
        if(twitterHandleValue){
            chrome.storage.local.set({'twitterHandle': twitterHandleValue}, function(){
                document.getElementById('twitterHandleSpan').innerText = twitterHandleValue;
                showTwitterHandleInfoTable();
            });
        }
    });

    // 트위터 핸들 리셋 버튼
    $resetButton.addEventListener('click', function(){
        showTwitterHandleInfoTable(false);
        document.getElementById('twitterHandleSpan').innerText = '';
    });

    // 기록 시작 버튼 누르면 시작 버튼 숨기고 정지 버튼 활성화
    $startButton.addEventListener('click', function(){
        $resetButton.style.display = 'none';
        $startButton.style.display = 'none';
        $stopButton.style.display = 'block';
        $logDiv.innerHTML = '이 팝업창을 열어둔 상태로 모든 팔로잉/팔로워가 로딩되게끔 끝까지 스크롤하세요';
        $saveCountDiv.style.display = 'none';
        $pastSaveDateDiv.style.display = 'none';
        $middleArrow.style.display = 'none';
        $saveDateDiv.style.display = 'none';
        $resultTable.style.display = 'none';
        $resultTableTbody.innerHTML = '';
        document.getElementById('pastSaveDateDiv').innerText = '';
        document.getElementById('saveDateDiv').innerText = '';

        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            chrome.tabs.sendMessage(tabs[0].id, {
                    action: 'COUNT_START'
                } , (response) => {
                    console.log(response);
                }
            );
        });
    });

    // 기록 중단 버튼
    $stopButton.addEventListener('click', function(){
        stopFunc();
    });
});

function stopFunc(){
    $resetButton.style.display = 'block';
    $stopButton.style.display = 'none';
    $startButton.style.display = 'block';
    $saveCountDiv.style.display = 'block';
    $logDiv.innerHTML = '';
    $pastSaveDateDiv.style.display = 'block';
    $middleArrow.style.display = 'block';
    $saveDateDiv.style.display = 'block';
    $resultTable.style.display = 'block';
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {
                action: 'COUNT_STOP'
            } , (response) => {
                console.log(response);
            }
        );
    });
}

function deniedFunc(){
    $resetButton.style.display = 'block';
    $stopButton.style.display = 'none';
    $startButton.style.display = 'block';
    $logDiv.innerHTML = '내 팔로잉/팔로워 탭에서만 동작합니다.<br/>이미 위치한 경우 새로고침 후 시도해 주세요.';
    $saveCountDiv.style.display = 'none';
    $pastSaveDateDiv.style.display = 'none';
    $middleArrow.style.display = 'none';
    $saveDateDiv.style.display = 'none';
    $resultTable.style.display = 'none';
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const {data} = request;
    if (request.action === 'SEND_RESULT') {
        let sortedArr = request.result;
        let historyKey = request.tabName + '-' + twitterHandleSpan.innerText;
        chrome.storage.local.get(historyKey, function(data){

            let saveDate = new Date().toLocaleString();
            let currentHistory = {
                'saveDate' : saveDate
                , 'sortedArr' : sortedArr
            };
            let historyArr = data[historyKey];
            if(!historyArr){
                historyArr = [];
            }
            historyArr.push(currentHistory);
            chrome.storage.local.set({[historyKey]: historyArr}, function(){});

            let pastHistory = historyArr.length-2 < 0 
                    ? {'saveDate':'no data', 'sortedArr':[]} : historyArr[historyArr.length-2];

            document.getElementById('tabName').innerText = request.tabName;
            document.getElementById('saveCount').innerText = sortedArr.length;
            document.getElementById('pastSaveDateDiv').innerText = pastHistory.saveDate;
            document.getElementById('saveDateDiv').innerText = saveDate;
            let $resultTableTbody = document.getElementById('resultTableTbody');
            
            let classifyResult = classifyElements(pastHistory.sortedArr, sortedArr);
            let addedArr = classifyResult.added;
            let deletedArr = classifyResult.deleted;

            let maxLength = addedArr.length>deletedArr.length ? addedArr.length : deletedArr.length;
            for(let i=0; i < maxLength; i++){
                let $added = document.createElement('td');
                if(addedArr){
                    $added.innerText = addedArr.length>i ? addedArr[i] : '';
                    $added.className = 'green';
                }
                let $deleted = document.createElement('td');
                if(deletedArr){
                    $deleted.innerText = deletedArr.length>i ? deletedArr[i] : '';
                    $deleted.className = 'red';
                }

                let $tr = document.createElement('tr');
                $tr.appendChild($added);
                $tr.appendChild($deleted);
    
                $resultTableTbody.appendChild($tr);
            }
        });
    }else if(request.action === 'START_DENIED'){
        deniedFunc();
    }
    sendResponse({res: data})
    return true;
});

/***
 * b 배열에 추가된 요소와 a 배열에서 삭제된 요소를 찾는 함수
 */
function classifyElements(a, b) {
    const addedElements = b.filter(item => !a.includes(item));
    const deletedElements = a.filter(item => !b.includes(item));

    return {
        added: addedElements,
        deleted: deletedElements
    };
}

/***
 * 정보영역을 출력할 것인가?
 */
function showTwitterHandleInfoTable(isVisible){
    if(isVisible == undefined){
        isVisible = true;
    }

    document.getElementById('twitterHandleInputTable').style.display = !isVisible ? 'block' : 'none';
    //document.getElementById('twitterHandleInfoTable').style.display = isVisible ? 'block' : 'none';
    var elements = document.getElementsByName('info');
    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = isVisible ? 'block' : 'none';
    }
}