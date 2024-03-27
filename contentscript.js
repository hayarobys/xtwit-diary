// 탭별로 개별 동작
let tabName = '';
let tempSet = new Set();
let friendToSetScrollListener = throttle(function() {
    document.querySelectorAll('[data-testid="UserCell"] div.r-1iusvr4 a[tabindex="-1"]').forEach(p => {
        // 부모 노드 중에 'aside' 태그가 있는지 확인합니다.
        let isInsideAside = false;
        let parent = p.parentElement;
        while (parent) {
            if (parent.tagName === 'ASIDE') {
                isInsideAside = true;
                break;
            }
            parent = parent.parentElement;
        }
    
        // 'aside' 태그 내부에 있지 않은 요소만 tempSet에 추가합니다.
        if (!isInsideAside) {
            tempSet.add(p.getAttribute('href'));
        }
    });
}, 50); // ms

function throttle(func, limit){
    let inThrottle = false;
    return function(){
        const args = arguments;
        const context = this;
        if(!inThrottle){
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    const {data} = request;
    if (request.action === 'URL_CHANGED') {
        chrome.storage.local.get('twitterHandle', function(data){
            if(!data.twitterHandle){
                tabName = '';
            }else{
                if(request.url.includes('twitter.com/' + data.twitterHandle)){
                    if (request.url.includes("/verified_followers")) {
                        tabName = '';
                    }else if (request.url.includes("/followers")) {
                        tabName = 'followers';
                    }else if (request.url.includes("/following")){
                        tabName = 'following';
                    }else {
                        tabName = '';
                    }
                }else{
                    tabName = '';
                }
            }
        })
    }else if(request.action === 'COUNT_START'){
        if(tabName){
            window.addEventListener('scroll', friendToSetScrollListener);
        }else{
            chrome.runtime.sendMessage(
                {
                    action: 'START_DENIED'
                }
                , function(response) {
                    console.log("Response from popup:", response);
                }
            );
        }
    }else if(request.action === 'COUNT_STOP'){
        window.removeEventListener('scroll', friendToSetScrollListener);
        let sortedArr = Array.from(tempSet).sort();
        //sortedArr.forEach(p => console.log(p));

        chrome.runtime.sendMessage(
            {
                action: 'SEND_RESULT'
                , result: sortedArr
                , tabName: tabName
            }
            , function(response) {
                console.log("Response from popup:", response);
            }
        );

        tempSet.clear();
    }
    sendResponse({res: data})
    return true;
});