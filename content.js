// 监听来自popup的消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getWordFrequency') {
    const wordFrequency = analyzePageContent();
    sendResponse({ wordFrequency });
  }
  return true;
});

// 分析页面内容，统计单词频率
function analyzePageContent() {
  // 获取页面文本内容
  const text = document.body.innerText;
  
  // 使用正则表达式匹配英文单词，忽略低于3个字母的单词
  const words = text.match(/\b[a-zA-Z]{3,}\b/g) || [];
  
  // 统计词频
  const frequency = {};
  words.forEach(word => {
    // 转换为小写以忽略大小写
    word = word.toLowerCase();
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return frequency;
}