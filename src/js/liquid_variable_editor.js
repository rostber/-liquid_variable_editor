/*export default */class LiquidVarsEditor {
  constructor (el, options) {
    const defaultOptions = {
      classWrap: 'lve',
      classRow: 'lve__row',
      classValue: 'lve__value',
      classTools: 'lve__tools',
      classAdd: 'lve__add',
      classDrop: 'lve__drop',
      classDropVisible: 'lve__drop_state_visible',
      classDropAlignLeft: 'lve__drop_align_left',
      classDropItem: 'lve__drop-item',
      classText: 'lve__text',
      classLiquid: 'lve__liquid',
      classLiquidRemove: 'lve__liquid-remove',
      classDefaultWrap: 'lve__drop-default-wrap',
      classDefaultLabel: 'lve__drop-default-label',
      classDefaultInput: 'lve__drop-default-input',
      htmlAdd: '+',
      htmlLiquidRemove: 'x',
      htmlDefaultLabel: 'По умолчанию:',
      options: [],
      value: '',
      init (value) {},
      change (value) {},
      keydown (el) {},
      focus (el) {},
      blur (el) {}
    }
    this.options = Object.assign(defaultOptions, options)
    this.el = el
  }
  init () {
    this.render()

    this.parseContent()
    this.options.init(this.options.value)
  }
  render () {
    const tmpEl = document.createElement('div')
    tmpEl.innerHTML = this.getHtmlWrap()
    const el = tmpEl.firstChild
    this.el.parentNode.insertBefore(el, this.el)
    this.el.style.display = 'none'

    this.options.value = this.el.value

    this.elWrap = el
    this.elValue = el.querySelector('[lve-value]')
    this.elAdd = el.querySelector('[lve-add]')
    this.elAddDrop = el.querySelector('[lve-drop]')

    this.renderItems()

    this.bind()
  }
  renderItems () {
    let hasLastText = false
    const html = this.options.value.replace(new RegExp('(.*?)({{.*?}}|$)', 'gi'), (matched, text, liquid) => {
      let str = ''
      hasLastText = false
      if (text) {
        hasLastText = true
        str += this.getHtmlText(text)
      }
      if (liquid) {
        const liquidContent = liquid.replace(new RegExp('({{|}})', 'gi'), '').trim().split('|')
        const liquidVariable = liquidContent[0]
        let liquidDefault = null
        if (liquidContent[1]) {
          const res = new RegExp('default: !?("([^"]*)"|\'([^\']*)\')', 'gi').exec(liquidContent[1])
          liquidDefault = res[2] || res[3] || null
        }
        str += this.getHtmlLiquid(liquidVariable.trim(), liquidDefault)
      }
      if (!hasLastText) str += this.getHtmlText('')
      return str
    })
    this.elValue.innerHTML = html

    this.bindItems()
  }
  getHtmlWrap () {
    return `<div class="${this.options.classWrap}"><div class="${this.options.classRow}"><div lve-value class="${this.options.classValue}"></div><div class="${this.options.classTools}"><div lve-add class="${this.options.classAdd}">${this.options.htmlAdd}${this.getHtmlDropList()}</div></div></div></div>`
  }
  getHtmlDropList () {
    const defaultInput = `<input type="text" lve-drop-default class="${this.options.classDefaultInput}" />`
    const defaultWrap = `<div class="${this.options.classDefaultWrap}"><label class="${this.options.classDefaultLabel}">${this.options.htmlDefaultLabel}</label>${defaultInput}</div>`
    const list = this.options.options.map((option) => {
      return `<div lve-drop-item class="${this.options.classDropItem}" data-value="${option[0]}">${option[1]}</div>`
    }).join('')
    return `<div lve-drop class="${this.options.classDrop}">${defaultWrap}${list}</div>`
  }
  getHtmlText (value) {
    return `<span lve-text contenteditable="true" class="${this.options.classText}">${value}</span>`
  }
  getHtmlLiquid (value, defaultValue) {
    defaultValue = defaultValue || ''
    let label = value
    for (const option of this.options.options) {
      if (option[0] === value) {
        label = option[1]
        break
      }
    }
    return `<span lve-liquid data-variable="${value}" data-default="${defaultValue}" class="${this.options.classLiquid}">${label}<span lve-liquid-remove class="${this.options.classLiquidRemove}">${this.options.htmlLiquidRemove}</span>${this.getHtmlDropList()}</span>`
  }
  bind () {
    this.on('click', this.elAdd, (evt) => {
      evt.stopPropagation()
      this.showDrop(this.elAddDrop)
    })
    this.on('click', document, (evt) => {
      this.hideDrop(this.elsDrop)
    })
    // При клике внутри блока нужно ставить курсор на последний элемент
    this.on('click', this.elValue, (evt) => {
      evt.stopPropagation()
      evt.preventDefault()
      if (evt.target === this.elValue) {
        this.setCaretEnd(this.elsText[this.elsText.length - 1])
        this.selectionEl = null
      }
    })
    this.bindDropContent(this.elAddDrop)
  }
  bindItems () {
    this.elsText = this.elValue.querySelectorAll('[lve-text]')
    this.elsLiquid = this.elValue.querySelectorAll('[lve-liquid]')
    this.elsLiquidRemove = this.elValue.querySelectorAll('[lve-liquid-remove]')
    this.elsDrop = this.elWrap.querySelectorAll('[lve-drop]')

    this.on('keydown', this.elsText, (evt) => {
      this.options.keydown(evt)

      // Определяется нажатие backspace для удаление liquid элементов
      const key = evt.keyCode || evt.charCode
      if (key === 8 || key === 46) {
        if (this.getCaretPosition(evt.target) === 0) {
          const childIndex = this.getChildIndex(this.selectionEl)
          if (childIndex > 0) {
            const elsItems = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
            const prevChildIndex = childIndex - 1
            elsItems[prevChildIndex].parentNode.removeChild(elsItems[prevChildIndex])

            this.updateValue()
            this.renderItems()

            // Курсор устанавливается на элемент перед удаленным или на текущий
            const elsItemsNew = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
            const elFocus = prevChildIndex > 0 ? elsItemsNew[prevChildIndex - 1] : elsItemsNew[prevChildIndex]
            this.setCaretEnd(elFocus)
          }
        }
      }

      setTimeout(() => {
        this.updateValue()
      }, 0)
    })
    this.on('mousedown mouseup keydown keyup', this.elsText, (evt) => {
      this.selectionPoistion = this.getCaretPosition(evt.target)
    })
    this.on('focus', this.elsText, (evt) => {
      this.options.focus(evt)
      this.selectionEl = evt.target
    })
    this.on('blur', this.elsText, (evt) => {
      this.options.blur(evt)
    })

    this.on('click', this.elsLiquidRemove, (evt) => {
      evt.stopPropagation()
      const item = evt.target.parentNode
      item.parentNode.removeChild(item)
      this.updateValue()
      this.renderItems()
      this.selectionEl = null
    })

    this.on('click', this.elsLiquid, (evt) => {
      evt.stopPropagation()
      const elLiquidDrop = evt.target.querySelector('[lve-drop]')
      if (elLiquidDrop) this.showDrop(elLiquidDrop)
    })

    this.bindDropContent(this.elValue.querySelectorAll('[lve-drop]'))
  }
  bindDropContent (elDrops) {
    this.eachFn(elDrops, (elDrop) => {
      const elItems = elDrop.querySelectorAll('[lve-drop-item]')
      const elDefault = elDrop.querySelector('[lve-drop-default]')
      const elParent = elDrop.parentNode

      elDefault.value = elParent.dataset.default || ''

      this.on('click', elItems, (evt) => {
        if (elParent.hasAttribute('lve-liquid')) {
          elParent.setAttribute('data-variable', evt.target.dataset.value)
          this.updateValue()
          this.renderItems()
        } else this.insertValue(evt.target.dataset.value, elDefault.value)

        setTimeout(() => {
          this.hideDrop(elDrop)
        }, 0)
        this.selectionEl = null
      })

      this.on('change', elDefault, (evt) => {
        elParent.setAttribute('data-default', evt.target.value)
        this.updateValue()
        this.selectionEl = null
      })
    })
  }
  showDrop (elDrop) {
    this.hideDrop(this.elsDrop)
    this.addClass(elDrop, this.options.classDropVisible)
    if (elDrop.getBoundingClientRect().left < document.body.offsetWidth / 2) this.addClass(elDrop, this.options.classDropAlignLeft)
  }
  hideDrop (elDrop) {
    this.removeClass(elDrop, this.options.classDropVisible)
    this.removeClass(elDrop, this.options.classDropAlignLeft)
  }
  insertValue (value, defaultValue) {
    if (!this.selectionEl) {
      // Вставка в конец текста
      this.elValue.insertAdjacentHTML('beforeEnd', this.getHtmlLiquid(value, defaultValue))
    } else {
      // Вставка в середине текста
      const text = this.sanitize(this.selectionEl.innerHTML)
      const textLength = text.length
      const textFirst = text.slice(0, this.selectionPoistion)
      const textLast = text.slice(this.selectionPoistion, textLength)

      this.selectionEl.insertAdjacentHTML('beforebegin', this.getHtmlText(textFirst))
      this.selectionEl.insertAdjacentHTML('afterend', this.getHtmlText(textLast))
      this.selectionEl.insertAdjacentHTML('afterend', this.getHtmlLiquid(value, defaultValue))
      this.selectionEl.parentNode.removeChild(this.selectionEl)
    }
    this.updateValue()
    this.renderItems()
  }
  updateValue () {
    this.parseContent()
    this.options.change(this.options.value)
  }
  parseContent () {
    let value = ''
    const elsItems = this.elValue.querySelectorAll('[lve-text], [lve-liquid]')
    for (const elItem of elsItems) {
      const defaultPostfix = elItem.dataset.default ? ` | default: "${elItem.dataset.default}"` : ''
      value += elItem.hasAttribute('lve-text') ? elItem.innerHTML : `{{${elItem.dataset.variable}${defaultPostfix}}}`
    }
    this.options.value = value
  }
  on (eventNames, els, fn) {
    this.eachFn(els, (el) => {
      for (const eventName of eventNames.split(' ')) el.addEventListener(eventName, fn)
    })
  }
  addClass (els, className) {
    this.eachFn(els, (el) => {
      if (el.classList) el.classList.add(className)
      else el.className += ' ' + className
    })
  }
  removeClass (els, className) {
    this.eachFn(els, (el) => {
      if (el.classList) el.classList.remove(className)
      else el.className = el.className.replace(new RegExp('(^|\\b)' + className.split(' ').join('|') + '(\\b|$)', 'gi'), ' ')
    })
  }
  eachFn (els, fn) {
    if (!els) return false
    if (els.length > 0) {
      for (const el of els) {
        fn(el)
      }
    } else if (els.length !== 0) fn(els)
  }
  getCaretPosition (editableDiv) {
    let caretPos = 0
    let sel, range
    if (window.getSelection) {
      sel = window.getSelection()
      if (sel.rangeCount) {
        range = sel.getRangeAt(0)
        if (range.commonAncestorContainer.parentNode === editableDiv) {
          caretPos = range.endOffset
        }
      }
    } else if (document.selection && document.selection.createRange) {
      range = document.selection.createRange()
      if (range.parentElement() === editableDiv) {
        var tempEl = document.createElement('span')
        editableDiv.insertBefore(tempEl, editableDiv.firstChild)
        var tempRange = range.duplicate()
        tempRange.moveToElementText(tempEl)
        tempRange.setEndPoint('EndToEnd', range)
        caretPos = tempRange.text.length
      }
    }
    return caretPos
  }
  getChildIndex (childElement) {
    const parentElement = childElement.parentNode
    return Array.prototype.indexOf.call(parentElement.children, childElement)
  }
  setCaretEnd (el) {
    el.focus()
    if (typeof window.getSelection !== 'undefined' && typeof document.createRange !== 'undefined') {
      var range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      var sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(range)
    } else if (typeof document.body.createTextRange !== 'undefined') {
      var textRange = document.body.createTextRange()
      textRange.moveToElementText(el)
      textRange.collapse(false)
      textRange.select()
    }
  }
  sanitize (text) {
    return text.replace('&nbsp;', '')
  }
}
