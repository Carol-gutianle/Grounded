import { createEntry } from '../storage/entries'

const CONTEXT_MENU_ID = 'add-to-grounded'

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Add to Grounded',
    contexts: ['page', 'selection', 'link']
  })
})

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return

  const title = tab?.title || info.linkUrl || info.pageUrl || '网页记录'
  const url = info.linkUrl || info.pageUrl || tab?.url
  const selectedText = info.selectionText?.trim()
  const content = selectedText ? `${selectedText}` : title

  void createEntry({
    content,
    source: {
      type: 'webpage',
      title,
      url
    }
  })
})

chrome.commands.onCommand.addListener((command) => {
  if (command !== 'quick-capture') return

  const url = chrome.runtime.getURL('popup.html')
  chrome.tabs.create({ url })
})
