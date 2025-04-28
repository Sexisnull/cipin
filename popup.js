document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const tabFrequency = document.getElementById('tab-frequency');
  const tabKnown = document.getElementById('tab-known');
  const contentFrequency = document.getElementById('content-frequency');
  const contentKnown = document.getElementById('content-known');
  const wordList = document.getElementById('word-list');
  const knownWordList = document.getElementById('known-word-list');
  const statusMessage = document.getElementById('status-message');

  // 标签页切换逻辑
  function switchTab(activeTab, activeContent) {
    tabFrequency.classList.remove('active');
    tabKnown.classList.remove('active');
    contentFrequency.classList.remove('active');
    contentKnown.classList.remove('active');
    
    activeTab.classList.add('active');
    activeContent.classList.add('active');
  }

  tabFrequency.addEventListener('click', () => {
    switchTab(tabFrequency, contentFrequency);
  });

  tabKnown.addEventListener('click', () => {
    switchTab(tabKnown, contentKnown);
    loadKnownWords();
  });

  // 加载已知单词列表
  function loadKnownWords() {
    chrome.storage.local.get(['knownWords'], function(result) {
      const knownWords = result.knownWords || [];
      knownWordList.innerHTML = '';
      
      knownWords.forEach(word => {
        const wordItem = document.createElement('div');
        wordItem.className = 'known-word-item';
        wordItem.innerHTML = `
          <span class="word-text">${word}</span>
          <button class="remove-btn" data-word="${word}">移除</button>
        `;
        knownWordList.appendChild(wordItem);
      });

      // 为移除按钮添加事件监听
      document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const word = this.getAttribute('data-word');
          removeKnownWord(word);
        });
      });
    });
  }

  // 移除已知单词
  function removeKnownWord(word) {
    chrome.storage.local.get(['knownWords'], function(result) {
      let knownWords = result.knownWords || [];
      knownWords = knownWords.filter(w => w !== word);
      
      chrome.storage.local.set({ knownWords }, function() {
        loadKnownWords();
        // 如果在词频统计标签页，重新加载词频列表
        if (contentFrequency.classList.contains('active')) {
          requestWordFrequency();
        }
      });
    });
  }

  // 标记单词为已知
  function markWordAsKnown(word) {
    chrome.storage.local.get(['knownWords'], function(result) {
      const knownWords = result.knownWords || [];
      if (!knownWords.includes(word)) {
        knownWords.push(word);
        chrome.storage.local.set({ knownWords }, function() {
          requestWordFrequency();
        });
      }
    });
  }

  // 请求当前页面的词频统计
  function requestWordFrequency() {
    statusMessage.textContent = '正在统计当前页面单词...';
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getWordFrequency'}, function(response) {
        if (response && response.wordFrequency) {
          displayWordFrequency(response.wordFrequency);
        }
      });
    });
  }

  // 显示词频统计结果
  function displayWordFrequency(wordFrequency) {
    chrome.storage.local.get(['knownWords'], function(result) {
      const knownWords = result.knownWords || [];
      
      // 过滤掉已知单词，并按频率排序
      const filteredWords = Object.entries(wordFrequency)
        .filter(([word]) => !knownWords.includes(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      wordList.innerHTML = '';
      
      if (filteredWords.length === 0) {
        statusMessage.textContent = '没有找到新的高频单词';
        return;
      }

      statusMessage.textContent = '统计完成，显示前10个高频单词：';
      
      filteredWords.forEach(([word, count]) => {
        const wordItem = document.createElement('div');
        wordItem.className = 'word-item';
        wordItem.innerHTML = `
          <div>
            <span class="word-text">${word}</span>
            <span class="word-count">(${count}次)</span>
          </div>
          <button class="known-btn" data-word="${word}">我认识</button>
        `;
        wordList.appendChild(wordItem);
      });

      // 为"我认识"按钮添加事件监听
      document.querySelectorAll('.known-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const word = this.getAttribute('data-word');
          markWordAsKnown(word);
        });
      });
    });
  }

  // 初始加载时请求词频统计
  requestWordFrequency();
});