'use strict'

class AutoCompleter {
  constructor() {
    this.tabPressCounter = null
    this.words = []
    this.matches = []
    this.onUpdated = null
  }

  onKeyDown(event, inputText, sourceWords) {
    if(event.which === 9) {
      event.preventDefault()

      if(this.tabPressCounter == null) {
        this.tabPressCounter = 0
        this.words = inputText.split(' ')
        let lastWord = this.words.pop().toLowerCase()
        this.matches = sourceWords.map((f) => lastWord !== '' && f.toLowerCase().startsWith(lastWord) ? f : null).filter((f) => f !== null)
      } else {
        this.tabPressCounter += 1
        this.tabPressCounter = this.tabPressCounter % this.matches.length
        this.words.pop()
      }

      if(this.matches.length > 0) {
        this.words.push(this.matches[this.tabPressCounter])
        if(this.onUpdated)
          this.onUpdated(this.words.join(' '))
      }
    } else {
      this.words = inputText.split(' ')
      this.tabPressCounter = null
      this.matches = []
    }
  }
}

export default AutoCompleter