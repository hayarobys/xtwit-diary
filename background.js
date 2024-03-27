// 주소 변경 감지
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.url) {
        chrome.tabs.sendMessage(tabId, {
            action: 'URL_CHANGED',
            url: changeInfo.url
        });
    }
});